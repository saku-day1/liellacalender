/**
 * スプレッドシートを開いたときにカスタムメニューを追加する。
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Liella! Calendar')
    .addItem('未登録予定をカレンダーへ登録', 'registerUnregistered')
    .addItem('選択行を更新', 'updateSelectedRow')
    .addItem('選択行を削除', 'deleteSelectedRow')
    .addToUi();
}
