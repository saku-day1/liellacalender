現在の変更をコミットしてください。

## ルール（厳守）

- **mainへの直接pushは禁止**。現在のブランチが `main` の場合は作業を止めてユーザーに確認すること。
- コミットメッセージは**日本語**で記述する。
- `.clasp.json`（個人のscriptIdを含む）や `.claude/settings.local.json` はコミットに含めない。
- pushは明示的に依頼された場合のみ行う（このコマンドはコミットまでを基本とする）。

## 手順

### ① 現状確認
```bash
git status
git diff --stat
git branch --show-current
```

### ② ステージング
- 変更ファイルを確認し、コミット対象のファイルのみを `git add` で追加する。
- `.clasp.json` や `settings.local.json` が含まれていないか必ず確認する。

### ③ コミット
```bash
git commit -m "日本語のコミットメッセージ"
```
- 変更内容を端的に表す日本語メッセージを作成する。
- フッターに `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` を付ける。

完了後、コミットハッシュと変更概要をユーザーに報告してください。pushが必要な場合はユーザーに確認してから実行してください。
