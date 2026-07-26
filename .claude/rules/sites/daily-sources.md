# デイリーチェック対象サイト

## 取得方法の凡例

- **RSS**: RSS/Atom フィードを取得し、XMLから新着エントリを抽出する
- **WebFetch**: HTMLページを直接取得する
- **WebSearch**: 検索エンジン経由で情報を取得する

各ソースの「取得方法」は優先順序を示す。フォールバック条件（403/429時の挙動、リトライ手順など）の詳細は `fetch-flow.md` を参照。

RSS URLの記載がないソースはRSS未提供。「休止中」と記載のRSS URLは403が7日以上継続しているため一時的にWebSearchへ切り替え済み。WebFetch/RSSが復旧した場合は取得方法を元に戻すこと。

> **2026-04-14更新**: Claude Code Changelog を除く全ソースでWebFetch/RSS 403が7日以上継続。取得方法をWebSearchプライマリに一括変更。
>
> **2026-06-04更新**: 上記の403は2ヶ月以上継続（Anthropic news は62日連続）。WebSearchプライマリ運用は恒久化として扱う。
>
> **2026-06-10更新（B-001採用）**: WebFetch/RSSの復旧チェックは**週1回（月曜）**に実施する。手順は `fetch-flow.md`「復旧チェック」を参照（06-04時点の「月1回程度」から変更）。
> WebFetch安定が確認されている一次ソース: Claude Code Changelog、GitHub Copilot CLI Releases、OpenAI Codex CLI Releases。これらは毎日WebFetchで一次取得する。
>
> **2026-07-08更新（B-011採用）**: OpenAI系ソースを拡充。`developers.openai.com` 配下（changelog / codex/changelog / blog）はWebFetch疎通を確認し一次取得に昇格。`community.openai.com/c/announcements/6.rss` はRSS取得可能な公式一次ソースとして新規追加。openai.com / help.openai.com / platform.openai.com の403は継続中。

---

## 最優先

### Claude Code Changelog
- URL（優先）: https://code.claude.com/docs/en/changelog
- URL（フォールバック）: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- 取得方法: WebFetch
- 注目点: 新バージョンリリース、破壊的変更、新機能
- 頻度: 毎日確認
- 備考: WebFetch安定。GitHub版は大きいため429になることがある。サードパーティ集約ページ `claudefa.st/blog/guide/changelog`・`claudeupdates.dev` は一次ソース不通時の補完として利用可（B-007採用、2026-06-10）

### Claude モデルドキュメント（Fable 5 / Mythos 5）
- URL: https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5
- 検索キーワード（WebSearch用）: `Claude Fable 5 Mythos 5 specs 2026`
- 取得方法: WebFetch（疎通確認済み・2026-07-06）→ 失敗時 WebSearch
- 注目点: Fable 5 / Mythos 5 の公式仕様（コンテキスト長・料金・能力・制限）の変更・追補
- 頻度: 毎日確認（GA直後のため。仕様が安定したら週次に下げ検討）
- 備考: B-006採用（2026-06-10）。2026-07-06 に WebFetch 疎通を確認しプライマリに確定（現行仕様: 1M context / 128k output / $10・$50、Fable 5 は refusal 分類器あり・Mythos 5 は無し）。公式 system card の正式URLは判明次第追記

### Anthropic Blog / News
- URL: https://www.anthropic.com/news
- URL（副・政策研究系）: https://www.anthropic.com/institute/
- 検索キーワード（WebSearch用）: `Anthropic news announcement 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: 新モデル、新プロダクト、API変更、料金変更。institute 配下の institutional position paper（B-004採用）
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
- 備考: RSS/WebFetch ともに403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更。RSS復旧時は取得方法を `RSS → WebSearch` に戻すこと。WebFetch可能な二次ソースとして `https://techcrunch.com/tag/openai/` を補完利用可（2026-07-08疎通確認・B-011）。theverge.com はWebFetch不可

### OpenAI Developer Community Announcements（公式フォーラム）
- URL: https://community.openai.com/c/announcements/6
- RSS URL: https://community.openai.com/c/announcements/6.rss
- 取得方法: RSS（疎通確認済み・2026-07-08）→ 失敗時 WebSearch
- フィード本文: 要約＋本文あり（Discourse標準RSS）
- 注目点: 新モデル（GPT-5.6シリーズ等）・API新機能（Realtime等）・DevDay告知の公式アナウンス。openai.com/news が403継続の中、**RSSで直接取得できる貴重なOpenAI一次ソース**
- 頻度: 毎日確認
- 備考: 2026-07-08追加（B-011）。openai.com/news と重複する内容も多いが、API寄りの発表はこちらが先行・詳細な場合がある

### OpenAI Platform Changelog
- URL（一次）: https://developers.openai.com/changelog
- URL（旧・403継続）: https://platform.openai.com/docs/changelog
- 検索キーワード（WebSearch用）: `OpenAI platform changelog API update 2026`
- 取得方法: WebFetch（一次URL・疎通確認済み 2026-07-08）→ 失敗時 WebSearch
- 注目点: モデルリリース・廃止予定、API仕様変更、料金変更、新エンドポイント追加、SDK更新
- 頻度: 毎日確認
- 備考: `platform.openai.com` は403継続中だが、新ドメイン `developers.openai.com/changelog` はWebFetch成功（2026-07-08確認、最新7/6エントリまで取得可）。一次URLを新ドメインに変更（B-011）

### ChatGPT Release Notes
- URL: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- 検索キーワード（WebSearch用）: `ChatGPT release notes new features 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: ChatGPTの新機能（Canvas、Deep Research、Memory、Voice Mode等）、UI変更、プラン別機能開放（Plus/Pro/Team/Enterprise）、モバイル対応
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点、help.openai.com 配下は Sora release notes 含め全滅を2026-07-08に再確認）。WebSearch をプライマリに変更。ChatGPTアプリ更新は `developers.openai.com/codex/changelog` にも載ることがある（例: ChatGPT for iOS）ため併読すること

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

### GitHub Copilot Changelog（github.blog）
- URL: https://github.blog/changelog/
- URL（Copilot ラベル）: https://github.blog/changelog/label/copilot/
- 検索キーワード（WebSearch用）: `GitHub Copilot changelog update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: Copilot App / CLI / 対応モデル追加（Fable 5 GA 等）の大型アップデート。公式一次ソースの中で最速の傾向
- 頻度: 毎日確認
- 備考: 2026-06-05〜06-10 の改善メモで3回提案され採用（B-002、2026-06-10）。WebSearch で安定取得可

### OpenAI Codex CLI Releases
- URL（一次）: https://github.com/openai/codex/releases
- URL（併用一次）: https://developers.openai.com/codex/changelog
- 取得方法: WebFetch（毎日・両URL）→ 失敗時 WebSearch
- 注目点: Codex CLI の新バージョン、機能追加、モデル切替
- 頻度: 毎日確認
- 備考: WebFetch安定。`developers.openai.com/codex/changelog` は2026-04-02以降403だったが**2026-07-08に復旧確認**（最新7/8エントリまで取得可）→ B-003の宿題どおり併用一次に昇格。changelog側はリリースノートが整理済みで、ChatGPTアプリ更新も載るため、GitHub releases（pre-release検出用）と使い分ける

### OpenAI Developer Blog
- URL: https://developers.openai.com/blog
- 検索キーワード（WebSearch用）: `OpenAI developer blog Codex API 2026`
- 取得方法: WebFetch（疎通確認済み・2026-07-08）→ 失敗時 WebSearch
- 注目点: Codex・API・MCP・Realtime等の開発者向け機能解説・ベストプラクティス・活用事例
- 頻度: 週1〜2回確認（月数回更新のため）
- 備考: 2026-07-08追加（B-011）。ニュース速報性は低いが、Codex Remote等の新機能の詳細解説が出る場所。大型発表時は必ず確認

### xAI / Grok Release Notes
- URL（候補1）: https://x.ai/news
- URL（候補2）: https://docs.x.ai/developers/release-notes
- URL（候補3・一次ページ確認済み）: https://x.ai/build/changelog
- 検索キーワード（WebSearch用）: `xAI Grok release update 2026` / `Grok new features 2026`
- 取得方法: WebFetch（疎通確認後に確定）→ 失敗時 WebSearch
- 注目点: Grok新バージョン、Custom Skills等の機能追加、API変更、料金変更
- 頻度: 毎日確認
- 備考: **疎通未確認の宿題ソース**（2026-05-28〜06-03で複数回改善メモに記録）。次回ダイジェスト生成時にWebFetch疎通を試行し、結果に応じて取得方法欄を更新すること。`x.ai/build/changelog` は 2026-06-07 のメモで一次ページと確認済み（B-005採用）。WebFetch失敗時はWebSearch運用（Musk の X 投稿で予告 → 公式ドキュメントで詳細確認のパターンが多い）

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
- URL（優先）: https://cursor.com/changelog
- URL（フォールバック）: https://cursor.com/blog
- RSS URL: https://cursor.com/changelog/rss.xml
- 検索キーワード（WebSearch用）: `Cursor changelog new features 2026`
- 取得方法: RSS（changelog/rss.xml）→ WebFetch（changelog）→ WebSearch
- 注目点: 新機能、エージェント改善（Subagents / Cloud Agents / Router）、IDE統合、料金変更、Team/Enterprise 管理機能
- 頻度: 毎日確認
- 備考: **公式RSS を 2026-07-26 に発見**（B-012採用）。curl 実測 200 / `application/rss+xml` / 138,344 bytes / item 50件 / `content:encoded` に本文全文（＝RSS 1回で要約まで完結し追加 WebFetch は不要）。HTML 側に `<link rel="alternate" type="application/rss+xml">` 宣言がないため自動検出では見つからない。
  **403 は未復旧扱いとする**: 2026-07-26 にローカルからは WebFetch 200 で取得できたが、同日のクラウドルーチンは 403 を記録している（`.last-check-state.md`）。ローカル200とクラウド403が併存するため復旧とはしない。復旧判定は月曜の復旧チェック（`fetch-flow.md`）でルーチン自身が成功したときに行う。それまでは WebSearch が実質の一次。
  `cursor-changelog.com/feed`（旧・代替候補）は**削除した**。応答なし（curl exit 92 / HTTPコード 000）で、DNS がドメインパーキング系への CNAME になっており内容を信頼できない。

### Cursor Forum Announcements
- URL（優先）: https://forum.cursor.com/c/announcements/11.rss
- URL（フォールバック）: https://forum.cursor.com/c/announcements/11.json
- RSS URL: https://forum.cursor.com/c/announcements/11.rss
- 検索キーワード（WebSearch用）: `Cursor forum announcements model now available 2026`
- 取得方法: RSS → JSON → WebSearch
- 注目点: **新モデルの Cursor 提供開始告知**とその価格・CursorBench スコア・Zero Data Retention 対応可否。changelog と重複する記事（Cursor Router 等）は片方に統合する
- 頻度: 毎日確認
- 備考: 2026-07-26 追加（B-012採用）。curl 実測 200 / `application/rss+xml` / 81,504 bytes / item 25件。投稿者は Cursor スタッフのみで一次情報。
  **changelog との役割が違う**: changelog RSS 全50件を全文検索して `Opus 5` 0件 / `GPT-5.6` 0件 / `Sonnet 5` 0件 / `Zero Data Retention` 0件。**モデル提供開始告知はフォーラム側にしか出ない**（例: `Claude Opus 5 now available!` 2026-07-24）。changelog だけでは「Cursor で Opus 5 が使えるようになった」を取り逃す。
  ⚠️ カテゴリIDは **11**。`/c/announcements/8.rss` は 301 で `/c/support/help/8.rss` に転送され Help カテゴリが 200 で返るため、バイト数だけ見ると成功に見える。IDは https://forum.cursor.com/categories.json で確認できる。

### Obsidian Changelog（AI連携に限定）
- URL（優先）: https://obsidian.md/changelog/
- URL（フォールバック）: https://obsidian.md/feed.xml （公式ブログ）
- RSS URL: https://obsidian.md/changelog.xml
- 検索キーワード（WebSearch用）: `Obsidian MCP AI plugin API 2026`
- 取得方法: RSS（changelog.xml）→ WebFetch（changelog/）→ WebSearch
- 注目点: **AI連携に限定する。** MCP 対応、AIプラグイン向け API、プラグイン API の破壊的変更、Web Clipper、AI関連の商用・チームライセンス条件。
  エディタ挙動・テーマ・同期の細目・個別コミュニティプラグインの更新は**取り上げない**。
  タイトル末尾の `(Early access)` / `(Public)` でインサイダー限定か一般公開かを必ず区別する
- 頻度: 週1〜2回確認
- 備考: 2026-07-26 追加（B-012採用）。curl 実測: `changelog.xml` → 200 / `application/xml` / 940,832 bytes / Atom entry 469件。`obsidian.md/feed.xml` → 200 / entry 42件。403なし。
  ⚠️ **AI関連の産出量は極小**: 2026年の41エントリを全文走査して AI / LLM / MCP / Claude / ChatGPT / Copilot / agent の言及は **0件**（2026-07-26 実測）。公式ブログ側も42件中2件のみ（`The future of Obsidian plugins`・`2024 Gems of the year winners`）。**該当がない週は掲載しないのが正常**であり、無理に載せないこと。
  ⚠️ リリース間隔は月1.7件相当（2026-04 は0件、03-23→05-28 に66日の空白）。毎日確認する根拠はない。
  ⚠️ `obsidian.md/changelog/rss.xml` と `obsidian.md/blog/feed.xml` は 404。正しいパスは `changelog.xml` と `feed.xml`。フォーラム（forum.obsidian.md）に **announcements カテゴリは存在しない**（Help / Bug reports / Feature requests / Developers: Plugin & API 等のみ）ので公式アナウンス経路は changelog とブログだけ。

### TestingCatalog
- URL（優先）: https://www.testingcatalog.com/
- URL（フォールバック）: https://www.testingcatalog.com/feed/
- RSS URL: https://www.testingcatalog.com/rss/
- 検索キーワード（WebSearch用）: `TestingCatalog new feature launch 2026`
- 取得方法: RSS → WebFetch（個別記事URLで詳細取得）→ WebSearch
- 注目点: AIツールの機能追加・段階的ロールアウトを追う専門メディア。403 で WebSearch 運用中の一次ソースに対する**クロスチェック**として使う
- 頻度: 毎日確認
- 備考: 2026-07-26 追加（B-012採用）。curl 実測 200 / `text/xml` / 83,831 bytes / entry 100件。前面は openresty + Fastly（Cloudflare ではない）。直近7日18件 / 直近30日71件＝**1日 2.4件**。`description` は平均138字なので詳細が必要な項目のみ記事URLを WebFetch する。
  ★**除外フィルタ必須**: タイトルに `tests` / `develops` / `preparing` / `set to` / `previews` / `to get` / `working on` を含む記事は**未発表・社内限定・リリース日なし**。実測で直近7日18件のうち10件（56%）がこれに該当した。「今日から使えるもの」として扱わず、載せるなら「近日」枠に明示する。
  ★画像・動画・音声生成（FLUX / MAI-Image / Seedream 等）は `interests/ai-tools.md` の除外基準に該当するので落とす。
  `ICYMI:` プレフィックスは既報の再掲なので重複判定に使える（公式発表の2〜3日遅れで出ることがある）。

### Simon Willison's Weblog
- URL（優先）: https://simonwillison.net/tags/ai.atom
- URL（フォールバック）: https://simonwillison.net/atom/everything/
- RSS URL: https://simonwillison.net/tags/ai.atom
- 検索キーワード（WebSearch用）: `Simon Willison Claude Code 2026`
- 注目点: **新機能を実際に動かした検証結果とコード例**、公式リリースノートに載らない実装上の落とし穴。既存ダイジェストで繰り返し引用している実績あり
- 頻度: 週1〜2回確認
- 備考: 2026-07-26 追加（B-012採用）。curl 実測 200 / `application/xml` / 184,282 bytes。
  `Quoting ...` 形式（中の人の発言引用のみ）と非AIの個人投稿は落とす。

### Devin Release Notes
- URL: https://docs.devin.ai/release-notes/overview
- 検索キーワード（WebSearch用）: `Devin AI release notes update 2026`
- 取得方法: WebSearch → WebFetch
- 注目点: 新機能、モデル更新、料金変更
- 頻度: 毎日確認
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点）。WebSearch をプライマリに変更

### Apple Developer News / iOS 27 Release Notes
- URL: https://developer.apple.com/news/
- URL（release notes）: https://developer.apple.com/documentation/ios-ipados-release-notes
- 検索キーワード（WebSearch用）: `Apple Intelligence Extensions developer 2026` / `iOS 27 release notes AI`
- 取得方法: WebSearch → WebFetch
- 注目点: Apple Intelligence Extensions の API 仕様・Claude 統合の続報、iOS 27 / macOS 27 の AI 機能
- 頻度: 毎日確認（秋の iOS 27 GA まで。GA 後に頻度見直し）
- 備考: WWDC 2026 を機に追加（B-009採用、2026-06-10）。`apple.com/newsroom` は 403 のため WebSearch プライマリ

### X (トレンド検索)
- 取得方法: WebSearch
- 検索キーワード例:
  - `AI new tool release`
  - `LLM update announcement`
  - `Claude Code`
  - `AI agent launch`
  - `AIツール 新機能`
  - `coding agent release`
  - `Elon Musk Grok update`
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