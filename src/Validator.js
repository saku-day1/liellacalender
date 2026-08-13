/**
 * フォームから送られてきたデータのサーバー側検証を専任で担う。
 * クライアント側のチェックは操作性のための補助でしかないため、
 * ここでの検証だけを信用する。
 */

var TIME_PATTERN_ = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

/**
 * formData を検証する。
 * 戻り値: { valid: boolean, errors: { フィールド名: メッセージ } }
 */
function validateFormData(formData) {
  var errors = {};
  formData = formData || {};

  if (!Array.isArray(formData.casts) || formData.casts.length === 0) {
    errors.casts = '出演者を1人以上選択してください';
  }

  if (!isNonEmptyString_(formData.title)) {
    errors.title = 'タイトルを入力してください';
  }

  if (Config.CATEGORY_LIST.indexOf(formData.category) === -1) {
    errors.category = 'カテゴリを選択してください';
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

  // url / memo / venue は空でもエラーにしない（意図的にチェックなし）

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
