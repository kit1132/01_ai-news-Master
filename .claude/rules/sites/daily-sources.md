# デイリーチェック対象サイト

## 最優先

### Claude Code Changelog
- URL（優先）: https://code.claude.com/docs/en/changelog
- URL（フォールバック）: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- 取得方法: WebFetch。GitHub版は大きいため429になることがある。公式ドキュメント版を優先
- 注目点: 新バージョンリリース、破壊的変更、新機能
- 頻度: 毎日確認

### Anthropic Blog / News
- URL: https://www.anthropic.com/news
- 代替URL: なし
- 検索キーワード（WebSearch用）: `Anthropic news announcement 2026`
- 取得方法: WebFetch → 403/429時はWebSearch（`site:anthropic.com/news 2026` → 0件なら `Anthropic news announcement 2026`）
- 注目点: 新モデル、新プロダクト、API変更、料金変更
- 頻度: 毎日確認

### Claude Release Notes（サポートサイト）
- URL: https://support.claude.com/en/articles/12138966-release-notes
- 代替URL: なし
- 検索キーワード（WebSearch用）: `Claude release notes update 2026`
- 取得方法: WebFetch → 403/429時はWebSearch（`site:support.claude.com release-notes 2026` → 0件なら `Claude release notes update 2026`）
- 注目点: Claudeプロダクト全体のリリースノート（Web/Desktop/Mobile/API含む）。Changelogとは別軸の情報源
- 頻度: 毎日確認

### OpenAI Platform Changelog
- URL: https://platform.openai.com/docs/changelog
- 取得方法: WebFetch
- 注目点: モデルリリース・廃止予定、API仕様変更、料金変更、新エンドポイント追加、SDK更新
- 頻度: 毎日確認

### ChatGPT Release Notes
- URL: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 取得方法: WebFetch
- 注目点: ChatGPTの新機能（Canvas、Deep Research、Memory、Voice Mode等）、UI変更、プラン別機能開放（Plus/Pro/Team/Enterprise）、モバイル対応
- 頻度: 毎日確認

### OpenAI Blog
- URL: https://openai.com/blog
- 代替URL: https://openai.com/news
- 検索キーワード: `OpenAI announcement release 2026`
- 取得方法: WebFetch（403の場合フォールバックフローに従う）
- 注目点: 新モデル発表（GPT-5等）、DevDay、ポリシー変更、大型機能発表、パートナーシップ
- 頻度: 毎日確認
- 備考: Bot対策により403を返すことがある

### Google Workspace Updates Blog
- URL: https://workspaceupdates.googleblog.com/
- 取得方法: WebFetch
- 注目点: Gemini for Workspaceの新機能、Docs/Sheets/Slides/Gmail/Meet統合、管理者向け変更
- 頻度: 毎日確認

### Google Gemini App Release Notes
- URL: https://support.google.com/gemini/answer/13594961
- 取得方法: WebFetch
- 注目点: Geminiアプリの機能追加・変更、モデル切替、プラン別機能差分
- 頻度: 毎日確認

### Google The Keyword（AI カテゴリ）
- URL: https://blog.google/technology/ai/
- 取得方法: WebFetch
- 注目点: Geminiモデルリリース、Google I/O発表、プロダクト統合の公式アナウンス
- 頻度: 毎日確認

## 高優先

### Google DeepMind Blog
- URL: https://deepmind.google/discover/blog/
- 取得方法: WebFetch
- 注目点: 新モデル（Gemini Ultra/Pro/Flash）の技術発表、ベンチマーク結果
- 頻度: 毎日確認

### Google Workspace Admin Release Calendar
- URL: https://support.google.com/a/table/7702199
- 取得方法: WebFetch
- 注目点: Workspace管理者向けリリース予定一覧。ロードマップに相当
- 頻度: 週1〜2回確認（更新頻度が低いため）

### Cursor Changelog
- URL: https://cursor.com/changelog
- 代替URL: なし
- 検索キーワード（WebSearch用）: `Cursor changelog new features 2026`
- 取得方法: WebFetch → 403/429時はWebSearch（`site:cursor.com changelog 2026` → 0件なら `Cursor changelog new features 2026`）
- 注目点: 新機能、エージェント改善、IDE統合、料金変更
- 頻度: 毎日確認

### Devin Release Notes
- URL: https://docs.devin.ai/release-notes/overview
- 代替URL: なし
- 検索キーワード（WebSearch用）: `Devin AI release notes update 2026`
- 取得方法: WebFetch → 403/429時はWebSearch（`site:docs.devin.ai release-notes 2026` → 0件なら `Devin AI release notes update 2026`）
- 注目点: 新機能、モデル更新、料金変更
- 頻度: 毎日確認

### X (トレンド検索)
- 取得方法: WebSearch（直接アクセス不可のため検索経由）
- 検索キーワード例:
  - "AI new tool release"
  - "LLM update announcement"
  - "Claude Code"
  - "AI agent launch"
  - "AIツール 新機能"
  - "coding agent release"
- 注目点: 話題のAIツール、バズっている技術トピック
- 頻度: 毎日確認

## 将来追加候補
