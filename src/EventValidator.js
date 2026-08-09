/**
 * シート1行分のデータに対する入力検証を専任で担う。
 * ここではシートやCalendarには一切触れない（純粋な検証ロジックのみ）。
 */

/**
 * 値がDateオブジェクトとして有効かどうか。
 */
function isValidDate_(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * row を検証し、{ valid: boolean, errors: string[] } を返す。
 */
function validateEventRow(row) {
  var errors = [];

  if (!row.cast || String(row.cast).trim() === '') {
    errors.push('castが空です');
  }

  if (!row.title || String(row.title).trim() === '') {
    errors.push('titleが空です');
  }

  if (!isValidDate_(row.date)) {
    errors.push('dateが不正です');
  }

  var startOk = isValidDate_(row.startTime);
  if (!startOk) {
    errors.push('startTimeが不正です');
  }

  var endOk = isValidDate_(row.endTime);
  if (!endOk) {
    errors.push('endTimeが不正です');
  }

  if (startOk && endOk) {
    var startMinutes = row.startTime.getHours() * 60 + row.startTime.getMinutes();
    var endMinutes = row.endTime.getHours() * 60 + row.endTime.getMinutes();
    if (endMinutes <= startMinutes) {
      errors.push('endTimeがstartTime以前になっています');
    }
  }

  // url は空でもエラーにしない（意図的にチェックなし）

  return { valid: errors.length === 0, errors: errors };
}
