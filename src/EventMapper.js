/**
 * 検証済みのシート行データを、Google Calendarイベント用のデータへ変換する専任モジュール。
 * SheetやCalendarには一切触れない（純粋な変換ロジックのみ）。
 */

/**
 * date（日付部分のみ使用）と time（時刻部分のみ使用）を組み合わせて
 * Asia/Tokyo基準の単一のDateにする。
 */
function combineDateAndTime_(date, time) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0
  );
}

/**
 * 検証済みのrowから、Calendarイベント作成/更新に使うオブジェクトを組み立てる。
 * { title, start, end, description }
 */
function toCalendarEventData(row) {
  var title = '【' + row.cast + '】' + row.title;
  var start = combineDateAndTime_(row.date, row.startTime);
  var end = combineDateAndTime_(row.date, row.endTime);

  var descriptionLines = [
    'キャスト: ' + row.cast,
    'カテゴリ: ' + (row.category || ''),
    '情報元: ' + (row.source || ''),
    'URL: ' + (row.url || ''),
    'メモ: ' + (row.memo || '')
  ];

  return {
    title: title,
    start: start,
    end: end,
    description: descriptionLines.join('\n')
  };
}
