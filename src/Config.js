/**
 * このツールの設定値を一箇所に集約する。
 * キャスト一覧・カテゴリ・カレンダー等を変更したい場合はここだけを直せばよい。
 */
var Config = {
  // Liella!キャスト一覧。増減・改名があればここを直すだけでフォーム・フィルターに反映される。
  // グループ全体のライブ・イベントも登録できるよう「Liella!」自体も選択肢に含める。
  CAST_LIST: [
    'Liella!',
    '伊達さゆり',
    'Liyuu',
    '岬なこ',
    'ペイトン尚未',
    '青山なぎさ',
    '鈴原希実',
    '薮島朱音',
    '大熊和奏',
    '絵森彩',
    '結那',
    '坂倉花'
  ],

  // カテゴリ。valueはCalendar Eventのextendedプロパティに保存する内部値（変更しない）、
  // labelはUI表示用。追加する場合はvalueの重複がないようにする。
  CATEGORY_LIST: [
    { value: 'radio', label: 'ラジオ' },
    { value: 'event', label: 'イベント' },
    { value: 'live', label: 'ライブ' },
    { value: 'stream', label: '配信' },
    { value: 'tv', label: 'TV' },
    { value: 'magazine', label: '雑誌' },
    { value: 'release', label: '発売' },
    { value: 'other', label: 'その他' }
  ],

  // グループ。将来ソロ・ユニット単位の絞り込みを増やせるよう拡張可能な構造にしてある。
  GROUP_LIST: [
    { value: 'liella', label: 'Liella!' },
    { value: 'solo', label: 'ソロ活動' },
    { value: 'unit', label: 'ユニット' },
    { value: 'other', label: 'その他' }
  ],

  TIMEZONE: 'Asia/Tokyo',

  // 繰り返し登録の選択肢。ruleType/intervalはEventFactory側でRRULE文字列に変換するための情報。
  // 'none'は「繰り返しなし」を表す特別な値で、ruleTypeを持たない。
  RECURRENCE_OPTIONS: [
    { value: 'none', label: '繰り返しなし' },
    { value: 'weekly', label: '毎週', ruleType: 'WEEKLY', interval: 1 },
    { value: 'biweekly', label: '隔週', ruleType: 'WEEKLY', interval: 2 },
    { value: 'monthly', label: '毎月', ruleType: 'MONTHLY', interval: 1 }
  ],

  // 繰り返し登録時に指定できる回数の上限（誤操作で大量登録するのを防ぐための上限）。
  MAX_RECURRENCE_COUNT: 200,

  // 'primary' なら自分のGoogleアカウントのメインカレンダーに登録する。
  // 特定のカレンダーに登録したい場合はそのCalendar IDを設定する。
  CALENDAR_ID: 'primary',

  // 終了時刻が未入力の時間指定イベントに適用する仮の所要時間（分）。
  DEFAULT_EVENT_DURATION_MINUTES: 60,

  // タイトルの出演者ラベル（【】の中身）がこの文字数を超えたら「○○他N名」に短縮する。
  MAX_CAST_LABEL_LENGTH: 20,

  // 各テキスト項目の最大文字数（サーバー側検証で使用）。
  MAX_TITLE_LENGTH: 200,
  MAX_VENUE_LENGTH: 200,
  MAX_URL_LENGTH: 2000,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_MEMO_LENGTH: 2000,

  // このアプリが作成したCalendar Eventを識別するための目印。
  // Calendar Events.list を privateExtendedProperty で絞り込み、
  // 無関係な予定（他アプリ・素のGoogleカレンダー入力分）を誤って一覧・編集対象にしないためのもの。
  APP_SOURCE_KEY: 'liellaApp',
  APP_SOURCE_VALUE: '1',

  // 追加のアクセス制限（任意）。空文字なら無効。
  // Webアプリのデプロイ設定（access: MYSELF）がそもそもGoogleアカウント単位でアクセスを絞っているが、
  // 実行ユーザーのメールアドレスをサーバー側でも二重に検証したい場合に自分のメールアドレスを設定する。
  ALLOWED_EMAIL: ''
};
