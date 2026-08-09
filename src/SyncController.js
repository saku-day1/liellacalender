/**
 * SheetRepository / EventValidator / EventMapper / CalendarService を束ね、
 * メニューから呼ばれるユースケース単位の処理を実行する。
 */

/**
 * calendarEventId が空の行だけを対象に、検証・Calendar登録・シート更新を行う。
 * エラー行があっても他の行の処理は継続する。
 */
function registerUnregistered() {
  var rows = getAllRows().filter(function (row) {
    return !row.calendarEventId;
  });

  var successCount = 0;
  var errorRows = [];

  rows.forEach(function (row) {
    var result = validateEventRow(row);
    if (!result.valid) {
      errorRows.push({ rowIndex: row.rowIndex, errors: result.errors });
      return;
    }

    try {
      var eventData = toCalendarEventData(row);
      var eventId = createCalendarEvent(eventData);
      updateRow(row.rowIndex, { calendarEventId: eventId, registered: true });
      successCount++;
    } catch (e) {
      errorRows.push({ rowIndex: row.rowIndex, errors: [e.message] });
    }
  });

  showSyncResult_('未登録予定の登録', successCount, errorRows);
}

/**
 * 現在アクティブな行を検証し、Googleカレンダー上の既存イベントを更新する。
 * calendarEventId が無い行は「未登録なので先に登録してください」と案内する。
 */
function updateSelectedRow() {
  var rowIndex = getActiveRowIndex();
  if (!rowIndex) {
    SpreadsheetApp.getUi().alert('データ行を選択してから実行してください。');
    return;
  }

  var row = getRow(rowIndex);

  if (!row.calendarEventId) {
    SpreadsheetApp.getUi().alert(
      '行' + rowIndex + 'は未登録です。先に「未登録予定をカレンダーへ登録」を実行してください。'
    );
    return;
  }

  var result = validateEventRow(row);
  if (!result.valid) {
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'の入力エラー:\n' + result.errors.join('\n'));
    return;
  }

  try {
    var eventData = toCalendarEventData(row);
    updateCalendarEvent(row.calendarEventId, eventData);
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'を更新しました。');
  } catch (e) {
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'の更新に失敗しました:\n' + e.message);
  }
}

/**
 * 現在アクティブな行のGoogleカレンダーイベントを削除し、
 * シート側の calendarEventId / registered をクリアして再登録可能な状態に戻す。
 */
function deleteSelectedRow() {
  var rowIndex = getActiveRowIndex();
  if (!rowIndex) {
    SpreadsheetApp.getUi().alert('データ行を選択してから実行してください。');
    return;
  }

  var row = getRow(rowIndex);

  if (!row.calendarEventId) {
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'は未登録のため削除対象がありません。');
    return;
  }

  try {
    deleteCalendarEvent(row.calendarEventId);
    updateRow(rowIndex, { calendarEventId: '', registered: false });
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'をカレンダーから削除しました。');
  } catch (e) {
    SpreadsheetApp.getUi().alert('行' + rowIndex + 'の削除に失敗しました:\n' + e.message);
  }
}

/**
 * 一括処理の結果をまとめてアラート表示する。
 */
function showSyncResult_(operationName, successCount, errorRows) {
  var message = operationName + ' 完了\n成功: ' + successCount + '件\n';

  if (errorRows.length === 0) {
    message += 'エラーはありませんでした。';
  } else {
    message += 'エラー: ' + errorRows.length + '件\n';
    errorRows.forEach(function (e) {
      message += '- 行' + e.rowIndex + ': ' + e.errors.join(' / ') + '\n';
    });
  }

  SpreadsheetApp.getUi().alert(message);
}
