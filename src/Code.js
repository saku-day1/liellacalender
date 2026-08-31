/**
 * Webアプリのエントリポイント。
 * doGet: 画面表示（登録フォーム + Liella!専用カレンダー）
 * それ以外は google.script.run から呼ばれるサーバー関数の入口。
 * クライアントは常にここを経由し、Calendar APIやCalendarServiceを直接呼ばない
 * （＝ブラウザにGoogleのOAuthトークンが渡ることはない。GASのWebアプリ基盤が
 * 認証・トークン管理を行い、このスクリプトはトークンそのものを一切扱わない）。
 */

function doGet() {
  var template = HtmlService.createTemplateFromFile('index');
  template.castList = Config.CAST_LIST;
  template.categoryList = Config.CATEGORY_LIST;
  template.groupList = Config.GROUP_LIST;
  template.recurrenceOptions = Config.RECURRENCE_OPTIONS;
  return template
    .evaluate()
    .setTitle('Liella! キャスト出演予定管理')
    .setFaviconUrl('https://www.google.com/favicon.ico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/**
 * デプロイ設定（access: MYSELF）に加えた二重チェック。
 * Config.ALLOWED_EMAIL が設定されている場合のみ有効。
 * メールアドレスはクライアントから受け取らず、必ずGASの実行コンテキストから取得する
 * （フロント側の申告を認可根拠にしないため）。
 */
function assertAuthorized_() {
  if (!Config.ALLOWED_EMAIL) {
    return;
  }
  var email = Session.getActiveUser().getEmail();
  if (email !== Config.ALLOWED_EMAIL) {
    throw new Error('このアプリを利用する権限がありません');
  }
}

function buildGeneralErrorResult_(e) {
  // Calendar APIのエラーメッセージはHTTPステータス説明程度で、
  // トークンやシークレットを含まない（このアプリはそれらを扱っていないため）。
  return { success: false, errors: { general: '処理に失敗しました: ' + e.message } };
}

/**
 * 現在アプリを利用しているユーザーの識別情報（連携中のカレンダーID）を返す。
 * 設定画面の「連携状態」表示や、将来のユーザー単位機能の土台として使う。
 */
function fetchConnectionInfo() {
  assertAuthorized_();
  try {
    return { success: true, userId: getCurrentUserId_() };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * ユーザー設定（推しキャスト等）の取得。
 */
function fetchUserSettings() {
  assertAuthorized_();
  try {
    return { success: true, settings: getUserSettings() };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * ユーザー設定（推しキャスト等）の保存。
 */
function submitUserSettings(settings) {
  assertAuthorized_();

  var validation = validateUserSettings(settings);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    saveUserSettings_({ favoriteCasts: settings.favoriteCasts });
    return { success: true, settings: getUserSettings() };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * 新規イベント登録。クライアントから呼ばれる唯一の作成用エントリ。
 */
function submitEvent(formData) {
  assertAuthorized_();

  var validation = validateFormData(formData);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    var normalized = normalizeFormData_(formData);
    var resource = buildEventResource(normalized);
    var created = insertCalendarEvent_(resource);
    return { success: true, event: toAppEvent(created) };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * 指定期間（ISO日時文字列）のイベント一覧を取得する。
 * カレンダー画面の月表示・一覧表示は、表示中の期間分だけをこの関数経由で取得する
 * （不要な全期間取得を避けるため）。
 *
 * このアプリ作成/分類済みの予定だけでなく、Googleカレンダーに元々あった
 * 未分類の予定も含めて返す（isClassified で判別）。これにより、このアプリを
 * 使う前から登録していた予定を登録し直す必要なく、アプリ側で分類・閲覧できる。
 */
function fetchEvents(rangeStartIso, rangeEndIso) {
  assertAuthorized_();

  if (!validateDateRange_(rangeStartIso, rangeEndIso)) {
    return { success: false, errors: { general: '取得期間の指定が不正です' } };
  }

  try {
    var events = listAllCalendarEvents_(rangeStartIso, rangeEndIso);
    return { success: true, events: events.map(toAppEvent) };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * Googleカレンダーに元々あった未分類の予定を「Liella!関連予定」として分類する。
 * タイトル・日時・場所・説明は一切変更せず、Liella!専用メタデータ
 * （出演者・カテゴリ・グループ・URL・備考）のみを追記する。
 */
function classifyEvent(eventId, metadata) {
  assertAuthorized_();

  if (!isValidEventId_(eventId)) {
    return { success: false, errors: { general: 'イベントの指定が不正です' } };
  }

  var validation = validateClassificationData(metadata);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    var normalized = normalizeFormData_(metadata);
    var resource = buildClassificationResource(normalized);
    var updated = patchCalendarEvent_(eventId, resource);
    return { success: true, event: toAppEvent(updated) };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * 既存イベントの更新。
 */
function updateEvent(eventId, formData) {
  assertAuthorized_();

  if (!isValidEventId_(eventId)) {
    return { success: false, errors: { general: 'イベントの指定が不正です' } };
  }

  var validation = validateFormData(formData);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    var normalized = normalizeFormData_(formData);
    var resource = buildEventResource(normalized);
    var updated = patchCalendarEvent_(eventId, resource);
    return { success: true, event: toAppEvent(updated) };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}

/**
 * イベントの削除。確認ダイアログはクライアント側で必ず表示させ、
 * ここでは渡されたeventIdの形式検証のみ行う。
 */
function deleteEvent(eventId) {
  assertAuthorized_();

  if (!isValidEventId_(eventId)) {
    return { success: false, errors: { general: 'イベントの指定が不正です' } };
  }

  try {
    removeCalendarEvent_(eventId);
    return { success: true };
  } catch (e) {
    return buildGeneralErrorResult_(e);
  }
}
