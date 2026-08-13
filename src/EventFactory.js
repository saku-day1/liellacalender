/**
 * 検証済みのフォームデータを、Google Calendarへの登録に使える
 * イベントデータへ変換する専任モジュール。
 * Calendar APIやHTMLには一切触れない（純粋な変換ロジックのみ）。
 */

/**
 * 出演者配列からタイトルの【】に入れるラベルを作る。
 * 連結した文字数がしきい値を超える場合は「先頭1名+他N名」に短縮する。
 * しきい値・短縮ルールをここに閉じ込めておくことで、後から調整しやすくする。
 */
function buildCastLabel_(casts) {
  var joined = casts.join('・');
  if (joined.length <= Config.MAX_CAST_LABEL_LENGTH) {
    return joined;
  }
  return casts[0] + '他' + (casts.length - 1) + '名';
}

function buildEventTitle_(formData) {
  return '【' + buildCastLabel_(formData.casts) + '】' + formData.title.trim();
}

function buildEventDescription_(formData) {
  var lines = [
    '出演者：' + formData.casts.join('、'),
    'カテゴリ：' + formData.category,
    '情報元：' + (formData.url || ''),
    'メモ：' + (formData.memo || '')
  ];
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

/**
 * formData.recurrence（'none'または Config.RECURRENCE_OPTIONS のvalue）から、
 * CalendarServiceが繰り返しルールを組み立てるための情報を作る。
 * 繰り返しなしの場合はnullを返す。
 */
function buildRecurrenceData_(formData) {
  var value = formData.recurrence || 'none';
  if (value === 'none') {
    return null;
  }

  var option = Config.RECURRENCE_OPTIONS.filter(function (o) {
    return o.value === value;
  })[0];

  return {
    ruleType: option.ruleType,
    interval: option.interval,
    count: Number(formData.occurrenceCount)
  };
}

/**
 * 検証済みformDataから、CalendarServiceに渡すイベントデータを組み立てる。
 * { title, description, location, isAllDay, start, end, recurrence }
 */
function buildEventData(formData) {
  var title = buildEventTitle_(formData);
  var description = buildEventDescription_(formData);
  var location = formData.venue || '';
  var recurrence = buildRecurrenceData_(formData);

  if (formData.eventType === 'allday') {
    return {
      title: title,
      description: description,
      location: location,
      isAllDay: true,
      date: parseDateOnly_(formData.date),
      recurrence: recurrence
    };
  }

  var start = combineDateAndTime_(formData.date, formData.startTime);
  var endTimeString = formData.endTime;
  var end;
  if (endTimeString) {
    end = combineDateAndTime_(formData.date, endTimeString);
  } else {
    end = new Date(start.getTime() + Config.DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000);
  }

  return {
    title: title,
    description: description,
    location: location,
    isAllDay: false,
    start: start,
    end: end,
    recurrence: recurrence
  };
}
