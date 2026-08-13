/**
 * Webアプリのエントリポイント。
 * doGet: フォーム画面の表示
 * submitEvent: クライアントから呼ばれる唯一の登録処理入口
 */

function doGet() {
  var template = HtmlService.createTemplateFromFile('index');
  template.castList = Config.CAST_LIST;
  template.categoryList = Config.CATEGORY_LIST;
  template.recurrenceOptions = Config.RECURRENCE_OPTIONS;
  return template
    .evaluate()
    .setTitle('Liella! キャスト出演予定登録')
    .setFaviconUrl('https://www.google.com/favicon.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/**
 * クライアントの google.script.run から呼ばれる。
 * 検証 → 変換 → Calendar登録 の順に処理し、結果をクライアントへ返す。
 * クライアント側の入力値は信用せず、必ずここでサーバー側検証を通す。
 */
function submitEvent(formData) {
  var validation = validateFormData(formData);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    var eventData = buildEventData(formData);
    createEvent(eventData);
    return { success: true };
  } catch (e) {
    return { success: false, errors: { general: 'カレンダーへの登録に失敗しました: ' + e.message } };
  }
}
