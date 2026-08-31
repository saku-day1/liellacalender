# Liella! キャスト出演予定管理ツール

Liella!キャストの出演情報を、スマートフォンから専用フォームで入力し、**Googleカレンダーをデータの正本（Single Source of Truth）**として登録・閲覧・フィルター・編集・削除するためのツールです。「Googleカレンダーの代替」ではなく、**Googleカレンダーと双方向連携しながらLiella!の出演予定を独自に分類・フィルタリングできる専用フロントエンド**を目指しています。

独自のイベント用データベース（Sheets等）は持ちません。予定そのものはすべてGoogle Calendar Eventとして保存し、Liella!用の分類情報（カテゴリ・グループ・出演者）もそのEvent自体の`extendedProperties.private`に構造化データとして保存します。タイトル文字列の解析でカテゴリや出演者を判定することはしません。推しキャスト設定等のユーザー単位の情報も、DBを使わずGAS標準の`PropertiesService`（実行ユーザーごとに自動分離されるサーバー側ストレージ）に保存するため、ブラウザのキャッシュ削除や端末変更でも失われません。

```
専用入力フォーム
      ↓  google.script.run（サーバー関数呼び出し）
Code.js → Validator → EventMapper → CalendarService
      ↓  Calendar API (Advanced Service)
Googleカレンダー（正本）
      ↑  Calendar API (Advanced Service)
Code.js → CalendarService → EventMapper
      ↓
自作Liella!専用カレンダーUI（月表示・一覧・フィルター・詳細・編集・削除）
```

Googleカレンダー側に登録された予定は、Googleアカウント経由でiPhone標準カレンダー等からもそのまま確認できます（タイトル・場所・説明は人間が読める形で入っています）。

## できること

- スマートフォン（主にiPhone）から開けるWebアプリで出演情報を入力し、その場でGoogleカレンダーへ登録
- 出演者の複数選択、時間指定/終日イベントの切り替え、毎週・隔週・毎月の繰り返し登録
- 会場（任意）はGoogleカレンダーの「場所」欄に登録
- サーバー側での入力チェック（不正な入力はフィールドごとにエラー表示、登録は行わない）
- 「カレンダー」タブ（初期表示）でGoogleカレンダーから予定を取得し、月表示・当日の予定・予定一覧・詳細表示
- **このアプリを使う前からGoogleカレンダーに登録していた予定もそのまま表示**され、詳細画面から出演者・カテゴリ等を追加するだけで「Liella!関連予定」として分類できる（タイトル・日時は変更しない）
- カテゴリ・グループ・出演者・**推しキャストだけ**によるフィルター（「ラジオを非表示」「未分類の予定を表示」ワンタップ対応）
- カレンダー上から予定の編集・削除（削除は確認ダイアログを挟む）
- 「設定」タブで連携中のGoogleカレンダーの確認・推しキャスト設定・再読み込み/再同期

## ファイル構成

```
liellacalender/
├── README.md
├── .clasp.json.example
├── .claspignore
└── src/
    ├── appsscript.json     # GASマニフェスト（webapp設定・Calendar Advanced Service・Asia/Tokyo）
    ├── Config.js           # キャスト一覧・カテゴリ・グループ・Calendar ID等の設定値
    ├── Validator.js        # フォームデータ・イベントID・取得期間・分類データ・ユーザー設定のサーバー側検証
    ├── EventMapper.js      # アプリの内部データ形 ⇔ Calendar Event(extendedProperties含む) の変換
    ├── CalendarService.js  # Calendar API (Advanced Service) の呼び出し（取得/作成/更新/削除）を一箇所に集約
    ├── UserSettings.js     # ユーザー単位の設定（推しキャスト等）の永続化（PropertiesService）
    ├── Code.js             # doGet + google.script.runから呼ばれるサーバー関数（唯一の入口）
    └── index.html          # フォーム + カレンダーUI + 設定UI（HTML/CSS/JS、タブ切り替え）
```

### 各ファイルの役割

- **Config.js**: キャスト一覧・カテゴリ・グループ・登録先カレンダー・各種上限値を1箇所に集約。運用ルールの変更をここだけの修正で完結させるため。
- **Validator.js**: クライアントから届いたデータの検証だけを持つ。クライアント側のチェックは操作性のための補助であり、サーバー側の検証だけを信用する。
- **EventMapper.js**: 「アプリが扱いやすい予定オブジェクト」と「Calendar API Eventリソース（`extendedProperties.private`含む）」の相互変換だけを担当。タイトル文字列の解析はしない（出演者・カテゴリは常に構造化データとして読み書きする）。既存予定への分類専用に、summary/start/end等を変更しない `buildClassificationResource` も持つ。
- **CalendarService.js**: Calendar API (Advanced Service) の呼び出し（取得/作成/更新/削除、リトライ、実行ユーザー識別）だけを担当。他のファイルはCalendar APIを直接叩かない。
- **UserSettings.js**: `PropertiesService.getUserProperties()`（実行ユーザーごとに自動分離される、GAS標準のサーバー側キー・バリューストア）を使い、推しキャスト等のユーザー単位設定を読み書きする。DBを新設せず、ブラウザに依存しない永続化を実現するための層。
- **Code.js**: `doGet`で画面（アプリ本体/プライバシーポリシー/利用規約）を表示し、`submitEvent`/`fetchEvents`/`classifyEvent`/`updateEvent`/`deleteEvent`/`fetchUserSettings`/`submitUserSettings`をクライアントに公開する。Validator→EventMapper→CalendarServiceの順に呼び出す。

---

## セットアップ手順

### 1. clasp をセットアップする

```bash
npm install -g @google/clasp
clasp login
```

### 2. 新規GASプロジェクトを作成する

```bash
clasp create --type webapp --title "Liella! キャスト出演予定管理" --rootDir src
```

`.clasp.json`が生成されない場合は`.clasp.json.example`をコピーして`scriptId`を設定してください。

### 3. コードをGASへ反映する

```bash
clasp push
```

### 4. Calendar Advanced Service を有効化する

`appsscript.json`に`enabledAdvancedServices`（Calendar API v3）を追加済みですが、GASエディタ側でも有効化が必要です。

1. `clasp open` でGASエディタを開く
2. 左メニュー「サービス」の「+」→「Calendar API」を選択して追加
3. （Google Cloud Platformプロジェクトを紐付けている場合は）GCP側のAPIライブラリで「Google Calendar API」も有効化する

### 5. Config.js を自分用に調整する

- `CAST_LIST` / `CATEGORY_LIST` / `GROUP_LIST`: 出演者・カテゴリ・グループの追加・変更
- `CALENDAR_ID`: 特定のカレンダーに登録したい場合はそのCalendar ID（既定は`'primary'`＝自分のメインカレンダー）
- `ALLOWED_EMAIL`: 任意。実行ユーザーのメールアドレスをサーバー側でも検証したい場合に設定（デプロイの「アクセスできるユーザー: 自分のみ」と合わせた二重チェック）

編集後は`clasp push`に加えて、既存デプロイの`redeploy`を忘れずに実行してください。

### 6. Webアプリとしてデプロイする

```bash
clasp deploy
```

初回デプロイ時、GASエディタ側で以下を確認してください。

- 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
- **実行するユーザー**: 「アクセスしているユーザー」（`USER_ACCESSING`）
- **アクセスできるユーザー**: 「自分のみ」（`MYSELF`）

### 7. コード変更をデプロイ済みURLへ反映する

```bash
clasp push
clasp deployments
clasp redeploy <デプロイID> --description "変更内容のメモ"
```

---

## セキュリティについて（GASという構成における考え方）

このアプリはNext.js等の自前OAuthサーバーを持つ構成ではなく、Google Apps Scriptのマネージド実行環境上で動きます。そのため一般的なWebアプリのセキュリティ要件の多くは、GASのプラットフォームが代わりに担っています。

- **OAuthトークンの管理**: Client Secret・アクセストークン・リフレッシュトークンはこのアプリのコードが一切扱いません。Googleが認証・トークン管理を行い、スクリプトはGoogleの実行基盤の中でのみ、許可されたスコープ（`https://www.googleapis.com/auth/calendar.events`、予定＝イベントの読み書きのみに絞ったスコープ）でCalendar APIを呼び出せます。ブラウザにトークンが渡ることもありません。
- **アクセス制御**: `appsscript.json`の`webapp.access: "MYSELF"`により、デプロイしたGoogleアカウント本人以外はWebアプリ自体を開けません。加えて`Config.ALLOWED_EMAIL`を設定すると、`Session.getActiveUser().getEmail()`（クライアントの申告ではなくGASの実行コンテキストから取得）によるサーバー側の二重チェックが有効になります。
- **入力検証**: `Validator.js`でtitle/URL/日時/category/casts/description/memoすべてを型・長さ・許可値でサーバー側検証。クライアント側の制御を経由しない直接呼び出しでも不正なデータは登録されません。
- **XSS対策**: カレンダーから取得したタイトル・説明等は`escapeHtml()`でエスケープしてから描画。`dangerouslySetInnerHTML`相当の危険な埋め込みは使用していません。URLは`http(s)://`で始まる場合のみリンク化します。
- **ログ**: エラーメッセージはCalendar APIのHTTPステータス相当の文言のみで、トークンやシークレットを含みません（そもそも扱っていないため）。

---

## 動作確認方法

1. 出演者・タイトル・カテゴリ・日付・時間を入力して登録し、Googleカレンダーに正しいタイトル・日時で反映されることを確認する
2. 「カレンダー」タブを開き、登録した予定が月表示・当日の予定・予定一覧に表示されることを確認する
3. 「ラジオを非表示」をタップし、ラジオカテゴリの予定が一覧から消えることを確認する
4. 出演者フィルターで1人だけ選び、その人が出演する予定だけが表示されることを確認する
5. 予定をタップして詳細を開き、「編集する」からタイトル・日時・出演者・カテゴリを変更して更新し、Googleカレンダー側にも反映されることを確認する
6. 「削除する」をタップし、確認ダイアログが出ること、OKを押すとGoogleカレンダーから削除されることを確認する
7. 事前にGoogleカレンダー側で（このアプリを使わずに）予定を1件作成しておき、「未分類の予定を表示」をタップして一覧に表示されることを確認する。タップして出演者・カテゴリを設定し保存すると、タイトル・日時が変わらないまま分類済みとして扱われることを確認する
8. 「設定」タブで推しキャストを選び保存し、「カレンダー」タブへ戻って「推しだけ」をタップすると、推しキャストの予定だけに絞り込まれることを確認する

## よくあるエラーと対処方法

| 症状 | 原因・対処 |
|---|---|
| `Calendar is not defined` のようなエラーが出る | Calendar Advanced Serviceが有効化されていない。「セットアップ手順 4」を確認する |
| Webアプリを開くと「このアプリにアクセスできません」等が表示される | デプロイ設定の「アクセスできるユーザー」が自分のGoogleアカウントになっているか確認する |
| フォームを直しても反映されない | `clasp push`はしたが`clasp redeploy <デプロイID>`を実行していない可能性が高い |
| 予定が一覧に出てこない | `Config.CALENDAR_ID`が正しいか、対象カレンダーにこのアプリで作成した予定があるか確認する（このアプリが作成した予定のみを`extendedProperties`で絞り込んで表示している） |

## 一般公開する場合（任意・実行は慎重に）

現在の`appsscript.json`は`webapp.access: "MYSELF"`（デプロイした本人のみアクセス可）のままです。将来、他のユーザーにも公開したくなった場合は、以下の変更だけで実現できます。**独自のOAuthサーバーやログイン画面の実装は不要です。**

1. `appsscript.json`の`webapp.access`を`"MYSELF"`から`"ANYONE"`に変更し、`clasp push` → `clasp redeploy`する
2. GASエディタの「デプロイ」設定でも「アクセスできるユーザー」を「全員」に変更する

これだけで、以下がすべて自動的に成立します（`executeAs: "USER_ACCESSING"`により、Calendar APIが常にアクセスしてきた本人の権限で実行されるため）。

- 各ユーザーは自分自身のGoogleアカウントでアプリを開き、初回アクセス時にGoogleの標準同意画面でCalendarへのアクセスを許可する（＝実質的なGoogleログイン）
- 予定は各ユーザー自身のGoogleカレンダー（`primary`）に保存され、他ユーザーのカレンダーと混ざらない
- 推しキャスト設定等も`PropertiesService.getUserProperties()`によりユーザーごとに自動分離される
- 開発者（デプロイした本人）も他ユーザーのカレンダー内容やユーザー設定を参照できない

公開前に確認しておきたいこと:

- `Config.ALLOWED_EMAIL`が空であること（設定されていると本人以外が弾かれる）
- 想定外の大量アクセスやAPIクォータ超過（Calendar APIには1日あたりのクォータがある）を許容できるか
- 設定タブの非公式ツールである旨の注記が表示されていること

## 今後の拡張予定

- URLや文章を貼り付けるとAIが出演者・タイトル・日時等を抽出し、フォームへ自動入力（最終登録は必ず人間が確認してから行う設計を維持する）
- 繰り返し予定の編集（現在は個別インスタンスの編集・削除のみ対応。シリーズ全体の繰り返しルール変更は未対応）
- Liella!公式サイト・キャスト公式サイト・YouTube・RSS等からの情報収集
- 一般公開を見据えたマルチユーザー対応（その場合は本格的なOAuthサーバー構成への移行を検討）
