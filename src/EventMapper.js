/**
 * Calendar API の Event リソースと、アプリ内で扱う「アプリイベント」オブジェクトとの
 * 相互変換だけを専任で担う。CalendarServiceはCalendar APIの呼び出し方法だけを知り、
 * Code.js/Validator.js/フォームはこのファイルが定義する形だけを知ればよいようにするための層。
 *
 * アプリイベント（appEvent）の形:
 * {
 *   id, title, description, memo, url, venue,
 *   category, group, casts: string[],
 *   isAllDay, start (ISO文字列), end (ISO文字列),
 *   recurringEventId, htmlLink
 * }
 *
 * Calendar Event側の責務分担:
 * - summary / location / start / end / recurrence: Calendar標準フィールド。
 *   iPhone標準カレンダー等、このアプリ以外からも人間が読めるようにするためのもの。
 * - description: casts/category/url/memo等を human-readable なテキストとして埋め込んだもの。
 *   あくまで「表示用」であり、このアプリがデータを読み書きする際の正とはしない
 *   （タイトルやdescriptionの文字列解析でカテゴリ・出演者を判定することはしない）。
 * - extendedProperties.private: category/group/casts/url/memo/rawTitle を構造化データとして保持する、
 *   このアプリにとっての正のメタデータ。編集フォームの再表示・フィルタリングはすべてここを読む。
 */

/**
 * 出演者配列からタイトルに表示する短縮ラベルを作る（表示用途のみ）。
 */
function buildCastLabel_(casts) {
  var joined = casts.join('・');
  if (joined.length <= Config.MAX_CAST_LABEL_LENGTH) {
    return joined;
  }
  return casts[0] + '他' + (casts.length - 1) + '名';
}

function findCategoryLabel_(value) {
  var found = Config.CATEGORY_LIST.filter(function (c) {
    return c.value === value;
  })[0];
  return found ? found.label : value;
}

function findGroupLabel_(value) {
  var found = Config.GROUP_LIST.filter(function (g) {
    return g.value === value;
  })[0];
  return found ? found.label : value;
}

/**
 * 人間が読むためのdescriptionテキストを組み立てる（iPhone標準カレンダー等で表示される）。
 */
function buildDisplayDescription_(data) {
  var lines = [
    '出演者：' + data.casts.join('、'),
    'カテゴリ：' + findCategoryLabel_(data.category),
    'グループ：' + findGroupLabel_(data.group)
  ];
  if (data.url) {
    lines.push('URL：' + data.url);
  }
  if (data.description) {
    lines.push('説明：' + data.description);
  }
  if (data.memo) {
    lines.push('備考：' + data.memo);
  }
  return lines.join('\n');
}

/**
 * "YYYY-MM-DD" と "HH:mm" を組み合わせて単一のDateにする。
 */
function combineDateAndTime_(dateString, timeString) {
  var dateParts = dateString.split('-').map(Number);
  var timeParts = timeString.split(':').map(Number);
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0);
}

function parseDateOnly_(dateString) {
  var dateParts = dateString.split('-').map(Number);
  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
}

function formatDateOnly_(date) {
  return Utilities.formatDate(date, Config.TIMEZONE, 'yyyy-MM-dd');
}

/**
 * 検証済みformData（登録・編集共通）から、Calendar API Events.insert/patch に渡す
 * イベントリソースを組み立てる。
 */
function buildEventResource(formData) {
  var casts = formData.casts;
  var title = '【' + buildCastLabel_(casts) + '】' + formData.title.trim();

  var resource = {
    summary: title,
    location: formData.venue || '',
    description: buildDisplayDescription_(formData),
    extendedProperties: {
      private: {}
    }
  };
  resource.extendedProperties.private[Config.APP_SOURCE_KEY] = Config.APP_SOURCE_VALUE;
  resource.extendedProperties.private.category = formData.category;
  resource.extendedProperties.private.group = formData.group;
  resource.extendedProperties.private.casts = JSON.stringify(casts);
  resource.extendedProperties.private.rawTitle = formData.title.trim();
  resource.extendedProperties.private.url = formData.url || '';
  resource.extendedProperties.private.memo = formData.memo || '';
  resource.extendedProperties.private.description = formData.description || '';

  if (formData.eventType === 'allday') {
    var date = parseDateOnly_(formData.date);
    var dateStr = formatDateOnly_(date);
    resource.start = { date: dateStr };
    // Google Calendar の終日イベントは end.date が「翌日」を指す仕様。
    var nextDay = new Date(date.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    resource.end = { date: formatDateOnly_(nextDay) };
  } else {
    var start = combineDateAndTime_(formData.date, formData.startTime);
    var end;
    if (formData.endTime) {
      end = combineDateAndTime_(formData.date, formData.endTime);
    } else {
      end = new Date(start.getTime() + Config.DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000);
    }
    resource.start = { dateTime: start.toISOString(), timeZone: Config.TIMEZONE };
    resource.end = { dateTime: end.toISOString(), timeZone: Config.TIMEZONE };
  }

  var recurrence = buildRecurrenceRule_(formData);
  if (recurrence) {
    resource.recurrence = [recurrence];
  }

  return resource;
}

/**
 * Googleカレンダーに元々あった予定（このアプリ未分類）に、
 * Liella!専用メタデータだけを追記するためのリソースを組み立てる。
 * buildEventResource() と異なり summary/location/start/end/description は
 * 一切変更しない（ユーザーが既存カレンダーに登録していた予定の見た目を壊さないため）。
 */
function buildClassificationResource(metadata) {
  var resource = { extendedProperties: { private: {} } };
  resource.extendedProperties.private[Config.APP_SOURCE_KEY] = Config.APP_SOURCE_VALUE;
  resource.extendedProperties.private.category = metadata.category;
  resource.extendedProperties.private.group = metadata.group;
  resource.extendedProperties.private.casts = JSON.stringify(metadata.casts);
  resource.extendedProperties.private.url = metadata.url || '';
  resource.extendedProperties.private.memo = metadata.memo || '';
  return resource;
}

function buildRecurrenceRule_(formData) {
  var value = formData.recurrence || 'none';
  if (value === 'none') {
    return null;
  }
  var option = Config.RECURRENCE_OPTIONS.filter(function (o) {
    return o.value === value;
  })[0];
  if (!option) {
    return null;
  }
  var count = Number(formData.occurrenceCount);
  return 'RRULE:FREQ=' + option.ruleType + ';INTERVAL=' + option.interval + ';COUNT=' + count;
}

/**
 * Calendar API の Event リソース（Events.list/insert/patch の戻り値）を
 * アプリイベントへ変換する。extendedProperties.private が欠けている場合
 * （手動でGoogleカレンダーに直接作られた等）にも壊れず表示できるようにする。
 */
function toAppEvent(event) {
  var props = (event.extendedProperties && event.extendedProperties.private) || {};
  var casts = [];
  if (props.casts) {
    try {
      casts = JSON.parse(props.casts);
    } catch (e) {
      casts = [];
    }
  }

  var isAllDay = !!(event.start && event.start.date);
  var isClassified = props[Config.APP_SOURCE_KEY] === Config.APP_SOURCE_VALUE;

  return {
    id: event.id,
    recurringEventId: event.recurringEventId || null,
    title: props.rawTitle || event.summary || '',
    description: props.description || '',
    memo: props.memo || '',
    url: props.url || '',
    venue: event.location || '',
    category: props.category || 'other',
    group: props.group || 'other',
    casts: casts,
    isAllDay: isAllDay,
    isClassified: isClassified,
    start: isAllDay ? event.start.date : event.start.dateTime,
    end: isAllDay ? event.end.date : event.end.dateTime,
    htmlLink: event.htmlLink || ''
  };
}
