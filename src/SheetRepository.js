/**
 * スプレッドシートの読み書きを専任で担う。
 * 列の並び順や参照方法をここに閉じ込め、他のモジュールは列名ベースのオブジェクトのみを扱う。
 */

function getEventsSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');
  }
  return sheet;
}

/**
 * ヘッダー行（1行目）から列名 -> 列インデックス(1始まり) のマップを作る。
 */
function getColumnIndexMap_(sheet) {
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headerRow.forEach(function (name, i) {
    if (name) {
      map[name] = i + 1;
    }
  });
  return map;
}

/**
 * 全データ行を { rowIndex, cast, title, ... } の配列として取得する。
 * rowIndex はシート上の実際の行番号（1始まり、ヘッダー込み）。
 */
function getAllRows() {
  var sheet = getEventsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  var columnMap = getColumnIndexMap_(sheet);
  var numRows = lastRow - 1;
  var values = sheet.getRange(2, 1, numRows, sheet.getLastColumn()).getValues();

  return values.map(function (rowValues, i) {
    var row = { rowIndex: i + 2 };
    COLUMNS.forEach(function (col) {
      var colIndex = columnMap[col];
      row[col] = colIndex ? rowValues[colIndex - 1] : '';
    });
    return row;
  });
}

/**
 * 指定行(1始まり)のデータを取得する。
 */
function getRow(rowIndex) {
  var sheet = getEventsSheet_();
  var columnMap = getColumnIndexMap_(sheet);
  var rowValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  var row = { rowIndex: rowIndex };
  COLUMNS.forEach(function (col) {
    var colIndex = columnMap[col];
    row[col] = colIndex ? rowValues[colIndex - 1] : '';
  });
  return row;
}

/**
 * 指定行の一部の列だけを更新する。
 * fields は { calendarEventId: 'xxx', registered: true } のような部分オブジェクト。
 */
function updateRow(rowIndex, fields) {
  var sheet = getEventsSheet_();
  var columnMap = getColumnIndexMap_(sheet);

  Object.keys(fields).forEach(function (col) {
    var colIndex = columnMap[col];
    if (colIndex) {
      sheet.getRange(rowIndex, colIndex).setValue(fields[col]);
    }
  });
}

/**
 * 現在アクティブになっているセルが属するデータ行番号(1始まり)を返す。
 * ヘッダー行が選択されている場合は null を返す。
 */
function getActiveRowIndex() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) {
    return null;
  }
  var rowIndex = sheet.getActiveCell().getRow();
  return rowIndex >= 2 ? rowIndex : null;
}
