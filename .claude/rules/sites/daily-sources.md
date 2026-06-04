# デイリーチェック対象サイト

## 取得方法の凡例

- **RSS**: RSS/Atom フィードを取得し、XMLから新着エントリを抽出する
- **WebFetch**: HTMLページを直接取得する
- **WebSearch**: 検索エンジン経由で情報を取得する

各ソースの「取得方法」は優先順序を示す。フォールバック条件（403/429時の挙動、リトライ手順など）の詳細は `fetch-flow.md` を参照。

RSS URLの記載がないソースはRSS未提供。「休止中」と記載のRSS URLは403が7日以上継続しているため一時的にWebSearchへ切り替え済み。WebFetch/RSSが復旧した場合は取得方法を元に戻すこと。

> **2026-04-14更新**: Claude Code Changelog を除く全ソースでWebFetch/RSS 403が7日以上継続。取得方法をWebSearchプライマリに一括変更。
>
> **2026-06-04更新**: 上記の403は2ヶ月以上継続（Anthropic news は62日連続）。WebSearchプライマリ運用は恒久化として扱う。WebFetch/RSSの復旧チェックは月1回程度の頻度に下げてよい。
> WebFetch安定が確認されている一次ソース: Claude Code Changelog、GitHub Copilot CLI Releases、OpenAI Codex CLI Releases。これらは毎日WebFetchで一次取得する。

---

## 最優先

### Claude Code Changelog
- URL（優先）: https://code.claude.com/docs/en/changelog
- URL（フォールバック）: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- 取得方法: WebFetch
- 注目点: 新バージョンリリース、破壊的変更、新機能
- 頻度: 毎日確認
- 備考: WebFetch安定。GitHub版は大きいため429になることがある

### Anthropic Blog / News
- URL: https://www.anthropic.com/news
- 検索キーワード（WebSearch用）: `Anthropic news announcement 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: 新モデル、新プロダクト、API変更、料金変更
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### Claude Release Notes（サポートサイト）
- URL: https://support.claude.com/en/articles/12138966-release-notes
- 検索キーワード（WebSearch用）: `Claude release notes update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: Claudeプロダクト全体のリリースノート（Web/Desktop/Mobile/API含む）。Changelogとは別軸の情報源
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### OpenAI Blog / News
- URL: https://openai.com/news
- RSS URL（休止中）: https://openai.com/news/rss.xml
- 検索キーワード（WebSearch用）: `OpenAI announcement release 2026`
- 取得方法: WebSearch
- フィード本文: 要約のみ（タイトル・説明・URL）。詳細が必要な場合は記事URLをWebFetchで追加取得
- 注目点: 新モデル発表（GPT-5等）、DevDay、ポリシー変更、大型機能発表、パートナーシップ
- 頻度: 毎日確認
- 備考: RSS/WebFetch ともに403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更。RSS復旧時は取得方法を `RSS → WebSearch` に戻すこと

### OpenAI Platform Changelog
- URL: https://platform.openai.com/docs/changelog
- 検索キーワード（WebSearch用）: `OpenAI platform changelog API update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: モデルリリース・廃止予定、API仕様変更、料金変更、新エンドポイント追加、SDK更新
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### ChatGPT Release Notes
- URL: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 検索キーワード（WebSearch用）: `ChatGPT release notes new features 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: ChatGPTの新機能（Canvas、Deep Research、Memory、Voice Mode等）、UI変更、プラン別機能開放（Plus/Pro/Team/Enterprise）、モバイル対応
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### Google Workspace Updates Blog
- URL: https://workspaceupdates.googleblog.com/
- RSS URL（休止中）: https://feeds.feedburner.com/GoogleAppsUpdates
- 取得方法: WebSearch → WebFetch
- フィード本文: 全文あり（Blogger/FeedBurner経由のAtomフィード）
- 注目点: Gemini for Workspaceの新機能、Docs/Sheets/Slides/Gmail/Meet統合、管理者向け変更
- 頻度: 毎日確認
- 備考: FeedBurner RSS/WebFetch ともに403が2026-04-03以降継続中（2026-04-14時点）。WebSearch をプライマリに変更。RSS復旧時は取得方法を `RSS → WebFetch → WebSearch` に戻すこと

### Google Gemini App Release Notes
- URL: https://support.google.com/gemini/answer/13594961
- 検索キーワード（WebSearch用）: `Gemini app release notes update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: Geminiアプリの機能追加・変更、モデル切替、プラン別機能差分
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-03以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### Google The Keyword（AI カテゴリ）
- URL: https://blog.google/technology/ai/
- RSS URL（休止中）: https://blog.google/technology/ai/rss
- 検索キーワード（WebSearch用）: `Google AI announcement Gemini 2026`
- 取得方法: WebSearch
- フィード本文: 要検証（XML応答確認済み、本文の有無は初回実行時に確認すること）
- 注目点: Geminiモデルリリース、Google I/O発表、プロダクト統合の公式アナウンス
- 頻度: 毎日確認
- 備考: RSS 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更。リダイレクト先は `blog.google/innovation-and-ai/technology/ai/rss`。RSS復旧時は取得方法を `RSS → WebSearch` に戻すこと

## 高優先

### GitHub Copilot CLI Releases
- URL（一次）: https://github.com/github/copilot-cli/releases
- URL（参考）: https://github.com/github/copilot-cli/blob/main/changelog.md
- 取得方法: WebFetch（毎日）→ 失敗時 WebSearch
- 注目点: 安定版（`vX.Y.Z`）と pre-release（`-0` / `-1` サフィックス）の両方。pre-release は日次で刻まれる
- 頻度: 毎日確認
- 備考: WebFetch安定継続。**pre-releaseはWebSearchでは拾いにくいため必ずWebFetchで取得すること**。`changelog.md` よりreleasesページの方が新しい情報が載る場合があるため、releasesページを一次ソースとする。pre-releaseはダイジェスト上では安定版と1項目に集約してよい

### OpenAI Codex CLI Releases
- URL（一次）: https://github.com/openai/codex/releases
- URL（参考）: https://developers.openai.com/codex/changelog
- 取得方法: WebFetch（毎日）→ 失敗時 WebSearch
- 注目点: Codex CLI の新バージョン、機能追加、モデル切替
- 頻度: 毎日確認
- 備考: `developers.openai.com/codex/changelog` は2026-04-02以降403継続のため、GitHub releasesを一次ソースに切替済み。WebFetch安定

### xAI / Grok Release Notes
- URL（候補1）: https://x.ai/news
- URL（候補2）: https://docs.x.ai/developers/release-notes
- 検索キーワード（WebSearch用）: `xAI Grok release update 2026` / `Grok new features 2026`
- 取得方法: WebFetch（疎通確認後に確定）→ 失敗時 WebSearch
- 注目点: Grok新バージョン、Custom Skills等の機能追加、API変更、料金変更
- 頻度: 毎日確認
- 備考: **疎通未確認の宿題ソース**（2026-05-28〜06-03で複数回改善メモに記録）。次回ダイジェスト生成時にWebFetch疎通を試行し、結果に応じて取得方法欄を更新すること。WebFetch失敗時はWebSearch運用（Musk の X 投稿で予告 → 公式ドキュメントで詳細確認のパターンが多い）

### Google DeepMind Blog / Google Research
- URL: https://deepmind.google/discover/blog/
- RSS URL（休止中）: https://research.google/blog/rss
- 検索キーワード（WebSearch用）: `Google DeepMind Gemini research 2026`
- 取得方法: WebSearch
- フィード本文: 要検証（XML応答確認済み、本文の有無は初回実行時に確認すること）
- 注目点: 新モデル（Gemini Ultra/Pro/Flash）の技術発表、ベンチマーク結果
- 頻度: 毎日確認
- 備考: RSS 403が2026-04-03以降継続中（2026-04-14時点）。WebSearch をプライマリに変更。RSS復旧時は取得方法を `RSS → WebSearch` に戻すこと。DeepMind固有の記事がフィードに含まれない場合は `deepmind.google/blog/rss.xml` の疎通を再調査すること

### Google Workspace Admin Release Calendar
- URL: https://support.google.com/a/table/7702199
- 取得方法: WebFetch → WebSearch
- 注目点: Workspace管理者向けリリース予定一覧。ロードマップに相当
- 頻度: 週1〜2回確認（更新頻度が低いため）

### Cursor Changelog
- URL: https://cursor.com/changelog
- 検索キーワード（WebSearch用）: `Cursor changelog new features 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: 新機能、エージェント改善、IDE統合、料金変更
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-03以降再発・継続中（2026-04-14時点）。WebSearch をプライマリに変更。`cursor-changelog.com/feed`（サードパーティRSS）も代替候補

### Devin Release Notes
- URL: https://docs.devin.ai/release-notes/overview
- 検索キーワード（WebSearch用）: `Devin AI release notes update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: 新機能、モデル更新、料金変更
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### X (トレンド検索)
- 取得方法: WebSearch
- 検索キーワード例:
  - `AI new tool release`
  - `LLM update announcement`
  - `Claude Code`
  - `AI agent launch`
  - `AIツール 新機能`
  - `coding agent release`
- 注目点: 話題のAIツール、バズっている技術トピック
- 頻度: 毎日確認

---

## 大型イベント期間中の追加運用

Microsoft Build / Google I/O / OpenAI DevDay / Anthropic イベント等の大型カンファレンス期間中は、公式アジェンダ・プレビュー記事・リアルタイムレポートが並列で発生するため、通常の日次取得では取りこぼしが多い。**イベント当日と翌日は以下の追加検索を必須手順とする**。

### 追加WebSearchクエリ（テンプレート）

イベント名を `<event>` に置き換えて以下を順に実行：

- `<event> <YYYY-MM-DD> day <N> announcement`
- `<event> <YYYY-MM-DD> recap`
- `<event> <YYYY-MM-DD> live blog`
- `<event> keynote announcement <YYYY>`
- `site:techcrunch.com <event> <YYYY>` / `site:theverge.com <event> <YYYY>`

### 主要イベントの想定タイミング

- **Microsoft Build**: 例年5月中下旬
- **Google I/O**: 例年5月中旬
- **OpenAI DevDay**: 例年10月前後（不定期に追加開催あり）
- **Anthropic イベント**: 不定期（モデルリリースに合わせて開催）

### クラウドパートナー発表の検出

AWS / Azure / GCP がAnthropic・OpenAI等のモデル提供を開始する発表は、**公式 news ページの WebSearch では拾えないことがある**（例: 2026-06 の AWS Bedrock × OpenAI モデル提供開始は `openai.com/index/` 経由で初検出）。期間中は以下も併用：

- `site:aws.amazon.com/blogs <Anthropic|OpenAI> <YYYY>`
- `site:openai.com/index <partnership|integration> <YYYY>`
- `site:anthropic.com <AWS|Azure|GCP> <YYYY>`