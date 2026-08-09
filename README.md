# Liella! キャスト出演予定管理ツール（MVP）

Liella!キャストの出演予定をスプレッドシートで一元管理し、Google Apps Script (GAS) からGoogleカレンダーへ登録するための個人用ツールです。

カレンダーの閲覧・通知はGoogleカレンダー側の機能をそのまま利用します。このツール自体はカレンダーUIを持ちません。

## できること

- スプレッドシートの未登録予定をGoogleカレンダー（メインカレンダー）へ一括登録
- 同じ予定の二重登録防止（`calendarEventId` 列で管理）
- スプレッドシート側の変更を選択行単位でカレンダーへ反映（更新）
- 選択行のカレンダーイベントを削除
- 入力チェック（不正な行はスキップし、理由を表示。他の正常な行の処理は継続）

## ファイル構成

```
liellacalender/
├── README.md
├── .clasp.json.example   # clasp設定のテンプレート（実際のscriptIdは各自で設定）
├── .claspignore
└── src/
    ├── appsscript.json     # GASマニフェスト（タイムゾーン: Asia/Tokyo）
    ├── Menu.js             # カスタムメニューの登録
    ├── SheetRepository.js  # スプレッドシートの読み書き
    ├── EventValidator.js   # 入力値検証
    ├── EventMapper.js      # シート行 → Calendarイベントデータへの変換
    ├── CalendarService.js  # Googleカレンダーへの登録・更新・削除
    ├── SyncController.js   # メニューから呼ばれるユースケース（登録/更新/削除）
    └── Constants.js        # 列定義などの定数
```

---

## セットアップ手順

### 1. Googleスプレッドシートを作成する

1. 新しいGoogleスプレッドシートを作成する
2. シート名を **`events`** に変更する（`src/Constants.js` の `SHEET_NAME` と一致させる）
3. 1行目（ヘッダー行）に以下の列名をこの順で入力する

   | id | cast | title | category | date | startTime | endTime | url | source | memo | calendarEventId | registered |
   |----|------|-------|----------|------|-----------|---------|-----|--------|------|------------------|------------|

4. `date` 列は「日付」形式、`startTime`・`endTime` 列は「時刻」形式のセル書式を設定する
   - 列を選択 → 表示形式 → 数値 → 日付 / 時刻
5. `registered` 列は真偽値（チェックボックス）にしておくと分かりやすい（必須ではない）

### 2. clasp をセットアップする

```bash
npm install -g @google/clasp
clasp login
```

初回のみブラウザでGoogleアカウントの認証を行います。

### 3. GASプロジェクトとスプレッドシートを紐付ける

このリポジトリの `src/` フォルダを、作成したスプレッドシートに **コンテナバインド**（スプレッドシートに紐づくスクリプト）として関連付けます。

1. 作成したスプレッドシートを開く
2. 拡張機能 → Apps Script を開く
3. 開いたスクリプトエディタのURLから **スクリプトID** を控える（URL中の `.../projects/【ここ】/edit`）
4. リポジトリのルートで `.clasp.json.example` を `.clasp.json` としてコピーし、`scriptId` を控えたIDに書き換える

   ```bash
   cp .clasp.json.example .clasp.json
   ```

   ```json
   {
     "scriptId": "控えたスクリプトID",
     "rootDir": "src"
   }
   ```

   ※ `.clasp.json` は個人のIDを含むため `.gitignore` 済みです。

5. コードをGASへ反映する

   ```bash
   clasp push
   ```

   スクリプトエディタ内の既存コード（`コード.gs` など）を上書きするか聞かれた場合は上書きで問題ありません。

### 4. Googleカレンダーとの接続について

追加のAPI連携設定は不要です。GASの `CalendarApp`（既存のデフォルト/メインカレンダーを使用）を利用しているため、実行時にスクリプトの実行者アカウントが持つカレンダー権限がそのまま使われます。

### 5. 初回実行と権限承認

1. スプレッドシートを開き直す（ブラウザでリロード）と、メニューバーに **「Liella! Calendar」** が追加されます
2. `events` シートに動作確認用の1行を入力する（例）

   | cast | title | category | date | startTime | endTime | url |
   |------|-------|----------|------|-----------|---------|-----|
   | 薮島朱音 | ○○ラジオ出演 | ラジオ | 2026/08/15 | 20:00 | 21:00 | https://example.com |

3. メニュー「Liella! Calendar」→「未登録予定をカレンダーへ登録」を実行する
4. 初回実行時はGoogleの権限承認ダイアログが表示されます
   - 「権限を確認」→ 対象のGoogleアカウントを選択 →「詳細」→「(安全ではないページに移動)」→ 許可
   - これはスクリプトエディタ上で直接実行する場合も、スプレッドシートのメニューから実行する場合も初回のみ表示されます

## 動作確認方法

1. 上記の手順でサンプル行を登録し、Googleカレンダーに `【薮島朱音】○○ラジオ出演` というイベントが正しい日時で作成されることを確認する
2. スプレッドシート上の `calendarEventId` 列にIDが入り、`registered` が `TRUE` になっていることを確認する
3. 同じ「未登録予定をカレンダーへ登録」を再実行し、二重登録されないことを確認する（`calendarEventId` が既にある行はスキップされる）
4. スプレッドシート上でタイトルや時刻を変更し、その行を選択した状態で「選択行を更新」を実行 → Googleカレンダー側のイベントが更新されることを確認する
5. その行を選択した状態で「選択行を削除」を実行 → Googleカレンダーからイベントが削除され、`calendarEventId` が空・`registered` が `FALSE` に戻ることを確認する
6. `cast` を空にした行や、`endTime` を `startTime` より前にした行を混ぜて「未登録予定をカレンダーへ登録」を実行し、エラー内容が行番号付きでアラート表示され、他の正常な行は問題なく登録されることを確認する

## 今後の拡張予定（MVP後）

- Liella!公式サイト・キャスト公式サイトからの出演情報取得
- YouTube配信予定の取得
- RSS対応
- Xなどで見つけた情報の簡易登録
- AIを利用した「文章 → イベント情報」変換
- キャストごとのカレンダー色分け
- 定期実行による自動同期

これらは `SheetRepository` の書き込みAPIを使って新しい取得元モジュールを追加するだけで組み込める設計にしてあります（`EventValidator` / `EventMapper` / `CalendarService` / `SyncController` は変更不要）。
