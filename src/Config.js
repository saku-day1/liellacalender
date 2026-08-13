/**
 * このツールの設定値を一箇所に集約する。
 * キャスト一覧・カテゴリ・カレンダー等を変更したい場合はここだけを直せばよい。
 */
var Config = {
  // Liella!キャスト一覧。増減・改名があればここを直すだけでフォームに反映される。
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

  CATEGORY_LIST: [
    'ライブ',
    'イベント',
    'ファンミーティング',
    'ラジオ',
    '生配信',
    'テレビ',
    '舞台',
    '朗読劇',
    '雑誌',
    'CD・Blu-ray',
    'その他'
  ],

  TIMEZONE: 'Asia/Tokyo',

  // 繰り返し登録の選択肢。ruleType/intervalはCalendarService側でCalendarApp.newRecurrence()の
  // ルールに変換するための情報。'none'は「繰り返しなし」を表す特別な値で、ruleTypeを持たない。
  // 隔週・毎月を追加したい場合は { value: 'biweekly', label: '隔週', ruleType: 'weekly', interval: 2 }
  // { value: 'monthly', label: '毎月', ruleType: 'monthly', interval: 1 } のように追加するだけでよい。
  RECURRENCE_OPTIONS: [
    { value: 'none', label: '繰り返しなし' },
    { value: 'weekly', label: '毎週', ruleType: 'weekly', interval: 1 },
    { value: 'biweekly', label: '隔週', ruleType: 'weekly', interval: 2 },
    { value: 'monthly', label: '毎月', ruleType: 'monthly', interval: 1 }
  ],

  // 繰り返し登録時に指定できる回数の上限（誤操作で大量登録するのを防ぐための上限）。
  MAX_RECURRENCE_COUNT: 200,

  // 空文字ならCalendarApp.getDefaultCalendar()を使う。
  // 特定のカレンダーに登録したい場合はそのCalendar IDを設定する。
  CALENDAR_ID: '',

  // 終了時刻が未入力の時間指定イベントに適用する仮の所要時間（分）。
  DEFAULT_EVENT_DURATION_MINUTES: 60,

  // タイトルの出演者ラベル（【】の中身）がこの文字数を超えたら「○○他N名」に短縮する。
  MAX_CAST_LABEL_LENGTH: 20
};
