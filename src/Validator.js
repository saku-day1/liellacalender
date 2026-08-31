/**
 * クライアントから送られてきたデータのサーバー側検証を専任で担う。
 * クライアント側のチェックは操作性のための補助でしかないため、
 * ここでの検証だけを信用する（google.script.run 経由の直接呼び出しでも
 * 不正なデータでGoogle Calendarへ書き込みが行われないようにするため）。
 */

var TIME_PATTERN_ = /^([01]\d|2[0-3]):([0-5]\d)$/;
var EVENT_ID_PATTERN_ = /^[a-v0-9]{5,1024}(_[0-9TZ]+)?$/i;

function isNonEmptyString_(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidDateString_(value) {
  if (!isNonEmptyString_(value)) {
    return false;
  }
  var date = new Date(value + 'T00:00:00');
  return !isNaN(date.getTime());
}

function isValidTimeString_(value) {
  return isNonEmptyString_(value) && TIME_PATTERN_.test(value);
}

function timeStringToMinutes_(value) {
  var parts = value.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function findRecurrenceOption_(value) {
  return Config.RECURRENCE_OPTIONS.filter(function (option) {
    return option.value === value;
  })[0];
}

function isValidUrl_(value) {
  if (!isNonEmptyString_(value)) {
    return true; // 任意項目
  }
  if (value.length > Config.MAX_URL_LENGTH) {
    return false;
  }
  return /^https?:\/\/\S+$/i.test(value);
}

function isWithinLength_(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * イベント登録・編集フォームのデータを検証する。
 * 戻り値: { valid: boolean, errors: { フィールド名: メッセージ } }
 */
function validateFormData(formData) {
  var errors = {};
  formData = formData || {};

  if (!Array.isArray(formData.casts) || formData.casts.length === 0) {
    errors.casts = '出演者を1人以上選択してください';
  } else {
    var invalidCast = formData.casts.some(function (cast) {
      return Config.CAST_LIST.indexOf(cast) === -1;
    });
    if (invalidCast) {
      errors.casts = '出演者の指定が不正です';
    }
  }

  if (!isNonEmptyString_(formData.title)) {
    errors.title = 'タイトルを入力してください';
  } else if (!isWithinLength_(formData.title, Config.MAX_TITLE_LENGTH)) {
    errors.title = 'タイトルは' + Config.MAX_TITLE_LENGTH + '文字以内で入力してください';
  }

  var categoryValues = Config.CATEGORY_LIST.map(function (c) { return c.value; });
  if (categoryValues.indexOf(formData.category) === -1) {
    errors.category = 'カテゴリを選択してください';
  }

  var groupValues = Config.GROUP_LIST.map(function (g) { return g.value; });
  if (formData.group && groupValues.indexOf(formData.group) === -1) {
    errors.group = 'グループの指定が不正です';
  }

  if (!isValidDateString_(formData.date)) {
    errors.date = '日付が正しくありません';
  }

  var isTimed = formData.eventType === 'timed';
  if (formData.eventType !== 'timed' && formData.eventType !== 'allday') {
    errors.eventType = 'イベント種別を選択してください';
  }

  if (isTimed) {
    if (!isValidTimeString_(formData.startTime)) {
      errors.startTime = '開始時刻が正しくありません';
    }

    if (isNonEmptyString_(formData.endTime)) {
      if (!isValidTimeString_(formData.endTime)) {
        errors.endTime = '終了時刻が正しくありません';
      } else if (
        isValidTimeString_(formData.startTime) &&
        timeStringToMinutes_(formData.endTime) <= timeStringToMinutes_(formData.startTime)
      ) {
        errors.endTime = '終了時刻は開始時刻より後にしてください';
      }
    }
  }

  if (formData.venue && !isWithinLength_(formData.venue, Config.MAX_VENUE_LENGTH)) {
    errors.venue = '会場は' + Config.MAX_VENUE_LENGTH + '文字以内で入力してください';
  }

  if (!isValidUrl_(formData.url)) {
    errors.url = 'URLはhttp(s)://で始まる' + Config.MAX_URL_LENGTH + '文字以内の値を入力してください';
  }

  if (formData.description && !isWithinLength_(formData.description, Config.MAX_DESCRIPTION_LENGTH)) {
    errors.description = '説明は' + Config.MAX_DESCRIPTION_LENGTH + '文字以内で入力してください';
  }

  if (formData.memo && !isWithinLength_(formData.memo, Config.MAX_MEMO_LENGTH)) {
    errors.memo = '備考は' + Config.MAX_MEMO_LENGTH + '文字以内で入力してください';
  }

  var recurrenceValue = formData.recurrence || 'none';
  var recurrenceOption = findRecurrenceOption_(recurrenceValue);
  if (!recurrenceOption) {
    errors.recurrence = '繰り返し種別が不正です';
  } else if (recurrenceValue !== 'none') {
    var occurrenceCount = Number(formData.occurrenceCount);
    if (
      !isNonEmptyString_(String(formData.occurrenceCount || '')) ||
      !Number.isInteger(occurrenceCount) ||
      occurrenceCount < 1 ||
      occurrenceCount > Config.MAX_RECURRENCE_COUNT
    ) {
      errors.occurrenceCount =
        '繰り返し回数は1〜' + Config.MAX_RECURRENCE_COUNT + 'の範囲で入力してください';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors: errors };
}

/**
 * 既定値の補完（グループ未指定時は'liella'扱いにする等）。
 * 検証後、EventMapperへ渡す前に呼ぶ。
 */
function normalizeFormData_(formData) {
  var normalized = {};
  Object.keys(formData || {}).forEach(function (key) {
    normalized[key] = formData[key];
  });
  normalized.group = normalized.group || 'liella';
  return normalized;
}

function isValidEventId_(value) {
  return isNonEmptyString_(value) && value.length <= 1024 && EVENT_ID_PATTERN_.test(value);
}

/**
 * ユーザー設定（推しキャスト等）の検証。
 * クライアントからの直接呼び出しでも、Config.CAST_LIST に存在しない
 * 値が保存されないようにする。
 */
function validateUserSettings(settings) {
  var errors = {};
  settings = settings || {};

  if (!Array.isArray(settings.favoriteCasts)) {
    errors.favoriteCasts = '推しキャストの指定が不正です';
  } else {
    var invalidCast = settings.favoriteCasts.some(function (cast) {
      return Config.CAST_LIST.indexOf(cast) === -1;
    });
    if (invalidCast) {
      errors.favoriteCasts = '推しキャストの指定が不正です';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors: errors };
}

/**
 * カレンダー表示用の取得期間（ISO日時文字列）を検証する。
 * 一度に取得できる期間の上限を設け、不用意に広い範囲を何度も取得させないようにする。
 */
var MAX_FETCH_RANGE_DAYS_ = 370;

function validateDateRange_(rangeStartIso, rangeEndIso) {
  if (!isNonEmptyString_(rangeStartIso) || !isNonEmptyString_(rangeEndIso)) {
    return false;
  }
  var start = new Date(rangeStartIso);
  var end = new Date(rangeEndIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  if (end <= start) {
    return false;
  }
  var days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  return days <= MAX_FETCH_RANGE_DAYS_;
}
