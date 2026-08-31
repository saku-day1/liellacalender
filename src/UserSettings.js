/**
 * ユーザー単位で永続化したい設定（推しキャスト等）の読み書きを専任で担う。
 * PropertiesService.getUserProperties() は「このスクリプト × 実行ユーザー」で
 * 自動的にスコープされるサーバー側ストレージのため、
 * - ブラウザのキャッシュ/localStorageに依存しない（端末変更・キャッシュ削除でも残る）
 * - ユーザーごとに自動分離される（他ユーザーの設定を読み書きできない）
 * という性質を、DBを新設せずに満たせる。
 */

var USER_SETTINGS_KEY_ = 'liellaUserSettings';

function defaultUserSettings_() {
  return { favoriteCasts: [] };
}

/**
 * 現在の実行ユーザー（executeAs: USER_ACCESSING の当人）の設定を返す。
 * 未保存・壊れたデータの場合は既定値にフォールバックする。
 */
function getUserSettings() {
  var raw = PropertiesService.getUserProperties().getProperty(USER_SETTINGS_KEY_);
  if (!raw) {
    return defaultUserSettings_();
  }
  try {
    var parsed = JSON.parse(raw);
    return {
      favoriteCasts: Array.isArray(parsed.favoriteCasts) ? parsed.favoriteCasts : []
    };
  } catch (e) {
    return defaultUserSettings_();
  }
}

function saveUserSettings_(settings) {
  PropertiesService.getUserProperties().setProperty(USER_SETTINGS_KEY_, JSON.stringify(settings));
}
