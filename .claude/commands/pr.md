現在のブランチのプルリクエストを作成してください。

## ルール（厳守）

- 個人利用リポジトリのため、イシュー番号との紐付けは必須ではない（イシューがあれば紐付ける）。
- PRタイトルは日本語で、変更内容が分かる簡潔な説明にする。
- ベースブランチは `main`。
- **現在のブランチが `main` の場合は作業を止めてユーザーに確認すること。**

## 手順

### ① 現状確認
```bash
git branch --show-current
git log main..HEAD --oneline
git diff main...HEAD --stat
```

### ② PR作成
```bash
gh pr create \
  --title "日本語タイトル" \
  --body "..."
```

本文に含めること:
- **概要**: 何を実装・修正したか（1〜3行）
- **変更内容**: 箇条書きで変更ファイルと内容
- **動作確認項目**: チェックリスト形式（例: GASへclasp pushして未登録予定を登録できるか、等）
- `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

完了後、PRのURLをユーザーに報告してください。
