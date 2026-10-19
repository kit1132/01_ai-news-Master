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
> **2026-08-06更新（B-023採用）**: 2026-04-14 の「全ソース WebSearch プライマリ」一括変更を**一部撤回**する。08-04 にゲートウェイ拒否が8ホストで解消し（`cursor.com` / `forum.cursor.com` / `claude.com` / `support.claude.com` / `community.openai.com` / `github.blog` / `aws.amazon.com` / `devblogs.microsoft.com`）、08-05・08-06 も本文取得に成功して復旧が定着したため、**下記5ソースの取得方法欄を一次（WebFetch / RSS）へ戻した**: Claude Release Notes / OpenAI Developer Community Announcements / GitHub Copilot Changelog / Cursor Changelog / Cursor Forum Announcements。
> 未復旧ホスト（`www.testingcatalog.com` / `simonwillison.net` / `obsidian.md` / `blog.google` / `workspaceupdates.googleblog.com` / `deepmind.google` / `support.google.com` / `docs.devin.ai` / `x.ai` / `learn.chatgpt.com` / `techcrunch.com`）と**オリジン403**（`www.anthropic.com` / `openai.com` / `platform.openai.com` / `help.openai.com`）の記載は変更していない。オリジン403は許可リスト追加では解決しないため WebSearch 運用を継続する。
>
> **2026-08-07更新（B-022 / B-026採用）**: `developers.openai.com/codex/changelog` が **308 恒久リダイレクト**で `learn.chatgpt.com/docs/changelog` へ移設された。転送先は ChatGPT と Codex を1ページで扱う統合 changelog なので、**最優先に「ChatGPT & Codex Changelog」を新設**し、Codex CLI Releases 項の併用一次を新 URL に差し替えた。
> これに伴い下の **2026-07-08更新の「codex/changelog を一次取得に昇格」は撤回する**（URL 自体が存在しない）。`developers.openai.com/changelog`（Codex なしの本体側）は 08-07 時点でも WebFetch 200 で、こちらは変更しない。
> 恒久リダイレクトは取得障害ではなくソース定義の陳腐化として扱う（`fetch-flow.md`「恒久リダイレクト（301 / 308）を検出したときの扱い」を新設。02 / 03 にも移植済み）。
>
> **2026-07-08更新（B-011採用）**: OpenAI系ソースを拡充。`developers.openai.com` 配下（changelog / codex/changelog / blog）はWebFetch疎通を確認し一次取得に昇格。`community.openai.com/c/announcements/6.rss` はRSS取得可能な公式一次ソースとして新規追加。openai.com / help.openai.com / platform.openai.com の403は継続中。
>
> **2026-08-26更新（B-016採用）**: MCP 公式ブログを最優先に追加。RSS は `https://blog.modelcontextprotocol.io/index.xml`（同日実測 200 / `application/xml` / 442,024 bytes / RSS 2.0）。`/rss.xml` は 404 なので使わない。本体ホスト `modelcontextprotocol.io` はゲートウェイ拒否のまま。`blog.` サブドメインは一覧・RSSとも到達可。
>
> **2026-08-26更新（B-017採用）**: Claude 製品ブログ（`https://claude.com/blog`）を最優先に追加。取得方法は WebFetch 一次（同日実測: 一覧 200 / 個別記事 200、RSS なし）。一覧は日付降順ではないので「最上部から N 件」は使わず、前回チェック日以降を URL 付きで全件列挙する。
>
> **2026-08-26更新（B-015 / B-032採用）**: Hugging Face を高優先のオープンウェイト一次として追加。公開判定は org 一覧 API が一次で、製品名から ID を推測して 401 を「未公開」としない。同日実測: `author=Qwen` 一覧 200（`Qwen/Qwen3.8-2.4T-A95B` が公開済み）、`Qwen/Qwen3.8-Max` 直指定は 401。
>
> **2026-08-26更新（B-034採用）**: Gemini API changelog（`https://ai.google.dev/gemini-api/docs/changelog`）を最優先に追加。同日実測 200。登録済み Google 系5ソースはゲートウェイ拒否のままなので、これが到達できる Google 一次になる。既存5ソースの置き換えではない。
>
> **2026-10-14更新（kit 指示）**: 高優先に **Orca**（Stably AI のエージェント開発環境）と **TypeSafe AI**（System One モデル Jev）を追加した。どちらも自サイトに RSS が無い。Orca は GitHub releases の Atom、TypeSafe は `sitemap.xml` の slug 集合差分で新着を取る。クラウド環境の許可ドメインに `www.onorca.dev` / `typesafe.ai` / `docs.typesafe.ai` を足すよう同日 kit に依頼した（`github.com` は既定の許可一覧に入っている）。

---

## 最優先

### Claude Code Changelog
- URL（優先）: https://code.claude.com/docs/en/changelog
- URL（フォールバック）: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- URL（版検出の補助）: https://registry.npmjs.org/@anthropic-ai/claude-code
- 取得方法: WebFetch。あわせて毎日、npm の `dist-tags` の `stable` / `latest` / `next` の3つを取得する（B-035採用、2026-10-19）
- 注目点: 新バージョンリリース、破壊的変更、新機能、**管理設定（`managed-settings.json` に置ける設定キー）とサインイン方式・コスト表示・モデル提示の組織ポリシー**（B-045採用、2026-10-19）
- 頻度: 毎日確認
- 備考: WebFetch安定。GitHub版は大きいため429になることがある。サードパーティ集約ページ `claudefa.st/blog/guide/changelog`・`claudeupdates.dev` は一次ソース不通時の補完として利用可（B-007採用、2026-06-10）
  `next` タグには changelog / GitHub releases に未掲載の版が先に出る。`stable` タグは `latest` と数版〜十数版ずれることがあり、**組織が stable チャンネルに固定している場合の実効バージョンは changelog からは分からない**（B-035）。管理設定の追加は機能追加として1行に埋もれやすいが、**組織で使えるかどうかを直接決めるので個別に拾う**（B-045）

### Claude モデルドキュメント
- URL（優先）: https://platform.claude.com/docs/en/models/overview
- URL（副）: 現行最新モデルの `whats-new` ページ（`https://platform.claude.com/docs/en/models/<モデル slug>/whats-new-<モデル slug>`。例: `models/haiku-5-5/whats-new-haiku-5-5`）
- 検索キーワード（WebSearch用）: `Claude new model specs whats new 2026`
- 取得方法: WebFetch → 失敗時 WebSearch
- 注目点: モデルの公式仕様（コンテキスト長・料金・能力・制限）の変更・追補。**新モデルの破壊的変更（既存コードが 400 になるパラメータ）と移行手順**
- 頻度: 毎日確認
- 備考: B-006採用（2026-06-10）。当初は Fable 5 / Mythos 5 の紹介ページを登録していた（現行仕様: 1M context / 128k output / $10・$50、Fable 5 は refusal 分類器あり・Mythos 5 は無し）。公式 system card の正式URLは判明次第追記
  **新モデルが GA すると URL のモデル slug ごと変わる**ので、一覧ページから現行モデルの slug を取得してから `whats-new` を読む（B-056採用、2026-10-19）

### Claude モデル退役一覧（Model deprecations）
- URL: https://platform.claude.com/docs/en/about-claude/model-deprecations
- 取得方法: WebFetch → 失敗時 WebSearch
- 注目点: **新規の退役告知（告知日・退役日・推奨移行先）**、現行モデルの `Tentative retirement date` の変動、**API パラメータの廃止**
- 頻度: 毎日確認
- 備考: B-047採用（B-077 を統合、2026-10-19）。次の3点を守る。
  ① `Tentative retirement date` は「Not sooner than」（この日より前には退役しない）であり**確定日ではない**。ダイジェストでは確定日と区別して書く
  ② Anthropic は公開モデルの退役を**最低60日前に通知する**と明記している（ページ本文で確認）。告知の検出が退役の60日以上前であることを前提にしてよい
  ③ **Model status 表の Active 行は、退役日ではなく行数で数えて全件列挙する。** 同じ暫定退役日を共有するモデル（Fable 系と Mythos 系など）を1件に畳まない。取得時は「Active のモデルを `API model name` と `Tentative retirement date` の対で全件列挙し、件数も書け」と問う

### Anthropic Blog / News
- URL: https://www.anthropic.com/news
- URL（副・政策研究系）: https://www.anthropic.com/institute/
- URL（副・研究）: https://www.anthropic.com/research
- 検索キーワード（WebSearch用）: 以下5本をすべて実行する（B-019採用、2026-08-02）
  - `Anthropic news announcement 2026`（新モデル・新プロダクト系）
  - `Anthropic safety incident report 2026`（安全性インシデント公表）
  - `Anthropic model evaluation incident 2026`（モデル評価に伴うインシデント）
  - `Claude Code usage limits change 2026`（利用上限・プラン枠の変更）
  - `Anthropic grant program application 2026`（研究助成等のプログラム開始・応募期限）
- 取得方法: WebFetch（一次）→ 失敗時 WebSearch（B-067採用、2026-10-19）
- 注目点: 新モデル、新プロダクト、API変更、料金変更。institute 配下の institutional position paper（B-004採用）。モデル評価・安全性に関するインシデント公表（`anthropic.com/news` 配下の incident / evaluation 系ポスト）。利用上限・プラン枠の変更、研究助成等のプログラム開始と応募期限（B-019採用、2026-08-02）。**`/research` の Publications 欄に載る評価・危険能力測定の公表**（モデル別の能力測定、オープンウェイトを含む横断評価）（B-068採用、2026-10-19）
- 頻度: 毎日確認
- 備考: 2026-04-02〜09-10 は到達できず WebSearch をプライマリにしていたが、**2026-09-11 に WebFetch 一次へ復帰した**（一覧・個別記事とも本文取得を確認。B-067採用、2026-10-19）。
  **`/news` と `/research` は別の一覧で、`/research` の記事は `/news` に出ないことがある。** `/news` だけを見ると research 系の公表が丸ごと落ちるので、両方を毎日 WebFetch で読む（B-068採用、2026-10-19）。
  上の検索キーワード5本はフォールバックとして維持する。到達できなかった期間は検索語彙の網羅性がそのまま検出可否を決めており、product announcement 寄りの語彙だけでは取りこぼす実例が2件あった: ① 7/30 公開の `/news/investigating-incidents-cybersecurity-evals`（サイバー評価中の Claude 3 が実在3組織へ侵入・141,006 セッション精査）を 7/31 に検出できず 8/1 に一般報道経由で初検出 ② Claude Code の週次上限50%増の 8/19 までの延長（7/19 期限から延長）と AI for Science 希少疾患グラント（7/20 開始）が約2週間未追跡だった。**キーワードを減らさないこと**（B-019採用、2026-08-02）

### Model Context Protocol Blog
- URL（優先）: https://blog.modelcontextprotocol.io/
- RSS URL: https://blog.modelcontextprotocol.io/index.xml
- 検索キーワード（WebSearch用）: `MCP specification revision 2026` / `Model Context Protocol breaking change 2026`
- 取得方法: RSS → WebFetch → WebSearch
- フィード本文: 要検証（RSS 2.0。詳細が必要な項目は記事 URL を WebFetch）
- 注目点: 仕様リビジョンの公開、破壊的変更、Extensions（Tasks / MCP Apps / EMA）、SDK 対応状況
- 頻度: 毎日確認
- 備考: 2026-08-26追加（B-016採用）。Claude Code / Copilot CLI / Codex CLI が依存する基盤仕様の一次。登録ソースが無かったため 2026-07-28 仕様（stateless 化）は汎用 WebSearch の副産物でしか検出できなかった。
  ⚠️ **RSS パスは `index.xml`。`rss.xml` は 404**（2026-08-26 実測）。Industry 側の `/rss.xml` 記載と混同しないこと。
  ⚠️ **本体 `modelcontextprotocol.io` はゲートウェイ拒否。** `blog.` サブドメインは一覧・RSSとも到達可（同日実測: `index.xml` 200 / `application/xml` / 442,024 bytes）。
  WebFetch フォールバック時は日付つきエントリを漏れなく列挙する（件数固定にしない）。

### Claude Release Notes（サポートサイト）
- URL: https://support.claude.com/en/articles/12138966-release-notes
- 検索キーワード（WebSearch用）: `Claude release notes update 2026`
- 取得方法: WebFetch → 失敗時 WebSearch
- 注目点: Claudeプロダクト全体のリリースノート（Web/Desktop/Mobile/API含む）。Changelogとは別軸の情報源
- 頻度: 毎日確認
- 備考: 2026-04-02〜08-03 は取得不可で WebSearch プライマリ運用だったが、**2026-08-04 のゲートウェイ拒否解消により WebFetch 一次へ復帰**（B-023採用、2026-08-06）。08-06 に本文取得を再確認（最上位は 7/24 の Claude Opus 5 launch）。日付降順ページなので `fetch-flow.md`「WebFetch の要約取りこぼし対策」の列挙形式で問うこと

### Claude Blog（製品側発表）
- URL: https://claude.com/blog
- 検索キーワード（WebSearch用）: `site:claude.com/blog 2026` / `Claude blog announcement <月> 2026`
- 取得方法: WebFetch（一次・疎通確認 2026-08-08、2026-08-26 再確認）→ 失敗時 WebSearch
- 注目点: Claude 本体（claude.ai / Desktop / Cowork）のプロダクト機能発表、コネクタ / MCP まわりの製品実装、Managed Agents の機能追加、Claude Code の既定変更・提供形態
- 頻度: 毎日確認
- 備考: 2026-08-26追加（B-017採用）。企業発表（`anthropic.com/news`）・API release notes・アプリ release notes・Claude Code changelog のどれにも載らない製品発表の一次。未登録のため 08-06 の self-hosted environments と 08-07 の auto mode 既定化を当日検出できなかった。
  ⚠️ **一覧は日付降順ではない**（特集・ピン留め順）。2026-08-26 実測で一覧 HTML の日付サンプルは June 18 / June 8 / May 19 が先に出る一方、href 25件には 8/21 の Mythos 5 記事が含まれる。**「最上部から N 件」は使わない。** WebFetch では「`<前回チェック日>` 以降の記事を、日付と URL を対にして全て挙げよ」と問う。同一日に複数本が出るので件数固定も禁止。
  ⚠️ **記事 URL は一覧の href を使う。** タイトルから slug を組み立てない（2026-08-22 に推測 URL が4連続 404）。
  RSS は無い（`/blog/rss.xml`・`/feed.xml` とも 404、2026-08-26 実測）。当初のゲートウェイ拒否（2026-07-30）は 2026-08-04 に解消済みで、許可リスト待ちではない。

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
- 取得方法: RSS（疎通確認済み・2026-08-06）→ 失敗時 WebSearch
- フィード本文: 要約＋本文あり（Discourse標準RSS）
- 注目点: 新モデル（GPT-5.6シリーズ等）・API新機能（Realtime等）・DevDay告知の公式アナウンス。openai.com/news がオリジン403継続の中、**RSSで直接取得できる貴重なOpenAI一次ソース**
- 頻度: 毎日確認
- 備考: 2026-07-08追加（B-011）。openai.com/news と重複する内容も多いが、API寄りの発表はこちらが先行・詳細な場合がある。2026-07-27〜08-03 はゲートウェイ拒否で到達不可だったが **08-04 に復旧し RSS 一次で確定**（B-023採用、2026-08-06。08-06 に item 取得を再確認・最上位は 7/30 の GPT-5.6 値下げ告知）。**登録済み OpenAI 系ソースで唯一到達できる一次**なので、ここが落ちると OpenAI は全て二次情報依存になる

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
- 備考: WebFetch 403が2026-04-02以降継続中（2026-04-14時点、help.openai.com 配下は Sora release notes 含め全滅を2026-07-08に再確認）。WebSearch をプライマリに変更。ChatGPTアプリ更新は下の **ChatGPT & Codex Changelog**（`learn.chatgpt.com/docs/changelog`）にも載ることがある（例: ChatGPT for iOS）ため併読すること

### ChatGPT & Codex Changelog
- URL: https://learn.chatgpt.com/docs/changelog
- RSS URL: https://learn.chatgpt.com/docs/changelog/rss.xml
- URL（プラグイン別）: https://learn.chatgpt.com/docs/security/plugin/changelog
- URL（日付指定形式）: https://learn.chatgpt.com/docs/changelog?date=YYYY-MM-DD
- 検索キーワード（WebSearch用）: `site:learn.chatgpt.com changelog 2026` / `ChatGPT Codex changelog <月> 2026` / `Codex model deprecation retirement 2026`（退役期限の検知用）
- 取得方法: RSS（`https://learn.chatgpt.com/docs/changelog/rss.xml`）→ WebFetch → WebSearch（B-070採用、2026-10-19）
- 注目点: ChatGPT 本体の機能追加とプラン別開放、Codex アプリ / プラグイン / クラウドの更新、**Codex で使えるモデルの追加・除外（退役期限）**
- 頻度: 毎日確認
- 備考: 2026-08-07 追加（B-022 / B-026 を統合して採用）。`developers.openai.com/codex/changelog` の **308 転送先**であり、登録済みソースの後継にあたる。
  ⚠️ **`github.com/openai/codex/releases` では代替できない。** あちらは CLI リポジトリのリリースのみで、アプリ / プラグイン / クラウド / モデル提供の変更は載らない。
  **ゲートウェイ拒否でも WebSearch なら本文相当が取れる**（`learn.chatgpt.com` は 2026-08-03〜09-13 に拒否が続いた。08-06 の許可ドメイン追加13件は 08-07 に無効と確定＝B-013）。実例として 8/31 の GPT-5.4 / 5.4 mini の Codex 除外・DigitalOcean Droplet プラグイン・Codex の ChatGPT Voice はいずれも WebSearch で検出できている。**RSS が取れない日は、許可リストを待たず WebSearch で確認すること。**
  2026-09-14 に到達が回復し、以後は RSS で毎日本文を取得できているので RSS を一次にした（`fetch-flow.md`「復旧チェック」手順2の扱い。B-070採用、2026-10-19）。

### Gemini API Changelog
- URL: https://ai.google.dev/gemini-api/docs/changelog
- URL（本文・軽い）: https://ai.google.dev/gemini-api/docs/changelog.md.txt
- 検索キーワード（WebSearch用）: `Gemini API changelog GA preview 2026`
- 取得方法: WebFetch（疎通確認 2026-08-03、2026-08-26 再確認）→ 失敗時 WebSearch
- 注目点: Gemini モデルの GA / preview 昇格、モデル ID、導入価格とその終了日、エンドポイント廃止日
- 頻度: 毎日確認
- 備考: 2026-08-26追加（B-034採用）。**登録済み Google 系5ソース（Workspace Updates / Gemini App Release Notes / The Keyword / DeepMind Blog / Workspace Admin Release Calendar）はゲートウェイ拒否が継続しており、`ai.google.dev` が唯一到達できる Google 一次である。** 7月以降の Gemini API 更新（3.6 Flash / 3.5 Flash-Lite GA、Robotics ER 2 preview、3.7 Flash GA と導入価格の 12/31 終了）はこのページ経由でしか一次確定できていなかった。
  本ソースは **Gemini API（開発者向け）の changelog に限る。** Gemini アプリ・Workspace 統合・DeepMind の研究発表は覆えない。既存5ソースの置き換えではなく追加。5ソースは復旧チェック対象から外さない。
  一覧は日付降順（2026-08-26 実測の見出し: August 13 / July 30 / July 21 / July 6）。WebFetch では「最上部から日付つきエントリを最低3件、日付とともに列挙せよ」と「前回記録した最上位エントリ（日付と見出し）より上にあるエントリを全件挙げよ」の両方を毎回問う。
  ⚠️ **掲載日と記載日付が一致しないことがある。** 差分は日付ではなく掲載位置で取る（`fetch-flow.md`「日付降順ページの差分判定」。B-082採用、2026-10-19）。
  `.md.txt` は同日実測 200 / `text/markdown` / 50,430 bytes。HTML が重いときの本文取得に使える。
  `ai.google.dev` は 2026-08-02 にゲートウェイ拒否、08-03 に復旧したホスト。復旧済みという位置づけは台帳に残す。

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

### Hugging Face モデルリリース
- URL（一覧）: https://huggingface.co/models?sort=trending
- URL（org 一覧 API）: https://huggingface.co/api/models?author=<org>&sort=createdAt&direction=-1&limit=<N>
- URL（個別）: https://huggingface.co/api/models/<org>/<repo>
- 取得方法: WebFetch（API JSON・疎通確認 2026-08-03、2026-08-26 再確認）→ 失敗時 WebSearch
- 注目点: オープンウェイトの重み公開（`private` / `gated` / safetensors 規模 / ライセンス）、新規チェックポイント
- 頻度: 毎日確認
- 備考: 2026-08-26追加（B-015 / B-032採用）。`interests/ai-tools.md` のオープンソース／ローカルLLMの一次。判定手順の本文は `fetch-flow.md`「オープンウェイトの公開判定は org 一覧から入る」。
  ① org の作成日降順一覧を取り、対象期間のリポジトリを**名前を問わず全て見る** ② 候補の個別 API で `private` / `gated` / safetensors / license を確定する ③ ①に該当が無いときに限り「未公開」。
  ⚠️ **製品名から ID を推測して 401 / 404 を「未公開」の根拠にしない。** HF の 401（`Invalid username or password.`）は「非公開」ではなく「その ID が存在しない」場合にも返る。2026-08-26 再実測: `Qwen/Qwen3.8-Max` は 401、org 一覧には公開済みの `Qwen/Qwen3.8-2.4T-A95B` がある。
  対象 org（登録ベンダーから機械的に導く。ベンダー登録が増えたらこの列を更新する）: `Qwen` / `moonshotai` / `deepseek-ai` / `meta-models` / `mistralai` / `zai-org` / `openai` / `google`
  第三者量子化（`-GGUF` / `-AWQ` / `-MLX` 等）の存在を公開の根拠にしない。当初のゲートウェイ拒否は 2026-08-03 に解消済みで、許可リスト待ちではない。

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
- 取得方法: WebFetch（Copilot ラベル URL）→ 失敗時 WebSearch
- 注目点: Copilot App / CLI / 対応モデル追加（Fable 5 GA 等）の大型アップデート、**および `GitHub Copilot weekly releases — <月日>` のまとめエントリ**（B-052採用、2026-10-19）。公式一次ソースの中で最速の傾向
- 頻度: 毎日確認
- 備考: 2026-06-05〜06-10 の改善メモで3回提案され採用（B-002、2026-06-10）。2026-07-29〜08-03 はゲートウェイ拒否だったが **08-04 に復旧し WebFetch 一次へ復帰**（B-023採用、2026-08-06）。08-04 の復旧直後に Copilot からの Gemini 2.5 Pro / Gemini 3 Flash 廃止と Enterprise teams model policy targeting を検出しており、**WebSearch 運用では取りこぼしていた項目が一次取得で拾えている**。08-06 に本文取得を再確認（最上位は 8/4 の Billing Preview app 退役）。ラベル URL のほうが Copilot 項目に絞れるので一次はそちらを使う
  **weekly releases のまとめエントリは、VS Code / Visual Studio / JetBrains / Copilot CLI の各リリース内容を集約しており、個別の changelog エントリにも各リポジトリの releases にも載らない項目を含む。** IDE 側の変更を拾う唯一の経路なので、まとめエントリは必ず本文まで開く（B-052）

### OpenAI Codex CLI Releases
- URL（一次）: https://github.com/openai/codex/releases
- URL（併用一次）: https://learn.chatgpt.com/docs/changelog （→ 上の「ChatGPT & Codex Changelog」項を参照）
- 取得方法: WebFetch（GitHub releases・毎日）→ 失敗時 WebSearch。併用一次は「ChatGPT & Codex Changelog」項の手順（WebSearch）に従う
- 注目点: Codex CLI の新バージョン、機能追加、モデル切替
  - ⚠️ **このページは CLI リポジトリのリリースのみ。** Codex アプリ / プラグイン / クラウド / モデル提供の変更は載らないので、併用一次と必ず両方見る
- 頻度: 毎日確認
- 備考: GitHub releases は WebFetch 安定。併用一次は 2026-07-08 に `developers.openai.com/codex/changelog` を昇格させたが（B-003 / B-011）、**2026-08-07 に同 URL が `learn.chatgpt.com/docs/changelog` へ 308 恒久リダイレクトしたため差し替えた**（B-022 / B-026）。
  ⚠️ **台帳が 2026-07-15 以降書いていた「Codex CLI 情報は GitHub releases で完全代替可・情報欠落なし」は成り立たない。** それは changelog が併用一次として生きている間の話で、8/31 の GPT-5.4 除外・DigitalOcean Droplet プラグイン・Codex の ChatGPT Voice はいずれも CLI releases に載っていない。
  `raw.githubusercontent.com/openai/codex/main/CHANGELOG.md` も代替にならない（releases へのリンクだけで中身がない・2026-08-07 実測）。
  GitHub releases 側は pre-release（`-alpha` 系）の検出に使う。

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
  **2026-08-04 に復旧し RSS 一次で確定**（B-023採用、2026-08-06）。07-26〜08-03 は「ローカル200・クラウド403」の併存で未復旧扱いとしていたが、08-04 にスケジュールタスク側の環境で 200 を確認し、以降 08-05 / 08-06 も本文取得に成功している（08-06 実測 131,910 bytes・最上位は 8/3 の Google Workspace Plugins）。
  ⚠️ この 8/3 エントリは 08-04 のセッションで取りこぼし 08-05 に1日遅れで検出した。降順ページなので `fetch-flow.md`「WebFetch の要約取りこぼし対策」を必ず適用する。
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
  2026-07-27〜08-03 はゲートウェイ拒否で到達不可だったが、**08-04 に復旧し RSS 一次で確定**（B-023採用、2026-08-06。08-06 に Announcements カテゴリの item 取得を再確認）。
  **changelog との役割が違う**: changelog RSS 全50件を全文検索して `Opus 5` 0件 / `GPT-5.6` 0件 / `Sonnet 5` 0件 / `Zero Data Retention` 0件。**モデル提供開始告知はフォーラム側にしか出ない**（例: `Claude Opus 5 now available!` 2026-07-24）。changelog だけでは「Cursor で Opus 5 が使えるようになった」を取り逃す。
  ⚠️ カテゴリIDは **11**。`/c/announcements/8.rss` は 301 で `/c/support/help/8.rss` に転送され Help カテゴリが 200 で返るため、バイト数だけ見ると成功に見える。IDは https://forum.cursor.com/categories.json で確認できる。

### Orca（Stably AI・エージェント開発環境）
- URL（一次）: https://github.com/stablyai/orca/releases
- RSS URL: https://github.com/stablyai/orca/releases.atom
- URL（見出しつきの要約）: https://www.onorca.dev/changelog
- 検索キーワード（WebSearch用）: `Orca ADE Stably AI release 2026`
- 取得方法: RSS（releases.atom）→ WebFetch（GitHub releases）→ WebFetch（onorca.dev/changelog）→ WebSearch
- 注目点: デスクトップ版 `vX.Y.Z` の新機能、対応エージェントの追加（Claude Code / Codex / Cursor CLI など）、エージェント連携の破壊的変更、`orca` CLI、SSH リモート実行
- 頻度: 毎日確認
- 備考: 2026-10-14 追加（kit 指示）。複数のコーディングエージェントを git worktree ごとに並列実行するデスクトップアプリで、kit が作業環境として使っている。GitHub `stablyai/orca`（MIT）。
  2026-10-14 ローカル実測: `releases.atom` 200 / `application/atom+xml` / 1,790,902 bytes / entry 10件 / `content` にリリース本文の全文。GitHub releases の HTML も WebFetch で本文が展開される。
  ⚠️ **クラウドからの到達は未検証。** `github.com` は既定の許可一覧に入っているので通る見込み。`www.onorca.dev` は許可ドメインの追加を 10-14 に依頼した。拒否されたら `fetch-flow.md` どおり切り分けて台帳に記録する。
  ⚠️ **同じ一覧にモバイル版（`mobile-android-vX.Y.Z`・pre-release）が混ざる。** デスクトップ版の新着判定から外し、別系統として扱う。
  ⚠️ **Atom の `<updated>` は公開時刻ではなく最終編集時刻である**（例: `v1.4.223` は公開 10/8 22:09Z、`<updated>` は 10/9 01:15Z）。新着は日付ではなく、前回記録した版番号より上にある版で判定する（B-082 と同じ軸）。
  ⚠️ **1版の本文が最大約18万字と重い**（`v1.4.224` は 181,876 字）。WebFetch では先頭しか読めないので、版番号は Atom から取り、要約は `onorca.dev/changelog` の見出しと箇条書きを使う。
  ⚠️ **`onorca.dev/changelog` は間引きされた要約である。** 2026-10-14 時点で `1.4.222`（10/7）が載っていない。版の有無は GitHub で判定し、changelog は見出しを取る用途に限る。個別ページは `/changelog/1-4-224` 形式。
  リリース間隔は1〜2日に1版（10/2〜10/10 で6版）。`onorca.dev` に RSS は無い（`/rss.xml`・`/feed.xml`・`/changelog/rss.xml` とも 404）。`api.github.com` はクラウドでは対象外リポジトリを 403 にするので使わない。
  掲載節: `## Cursor / xAI / Devin / その他エージェント`（ビューアのカテゴリでは「Cursor / xAI」に入る）。

### TypeSafe AI（System One モデル Jev）
- URL（一次・新着検出）: https://typesafe.ai/sitemap.xml
- URL（ブログ一覧）: https://typesafe.ai/blog
- URL（モデル仕様・料金）: https://docs.typesafe.ai/models
- URL（docs 目次）: https://docs.typesafe.ai/llms.txt
- 検索キーワード（WebSearch用）: `TypeSafe AI Jev announcement 2026` / `TypeSafe "System One" model update 2026`
- 取得方法: WebFetch（sitemap.xml で新しい `/blog/<slug>` を検出 → 個別記事）→ WebFetch（docs/models）→ WebSearch
- 注目点: Jev の新版（`jev-1.x`）とエイリアス（`jev-latest` / `jev-preview`）の移動、料金、コンテキスト長、レート制限、早期アクセスから一般提供への移行、資金調達・提携（ブログの Company News）
- 頻度: 毎日確認（2026-10-14 時点で記事は sitemap 全体で7本。差分が無い日は記録だけにする）
- 備考: 2026-10-14 追加（kit 指示）。文章を生成せず、型付きの質問（Choice / Score / Noul）に確率と confidence つきの答えを返す「System One」モデルの API。2026-10-14 時点の `docs/models` は `jev-1.13.0`（`jev-latest`・`jev-preview` とも同じ版）、入力 $0.042 / 100万トークン・出力無料、リクエスト全体 64k トークン、レート制限 100K トークン/秒・80 リクエスト/秒。
  2026-10-14 ローカル実測: `sitemap.xml` 200 / `text/xml`、`llms.txt` 200 / `text/plain` / 16,655 bytes。
  ⚠️ **クラウドでは許可ドメイン（`typesafe.ai` / `docs.typesafe.ai`）が要る。** 10-14 に kit へ追加を依頼した。拒否されたら `fetch-flow.md` どおり WebSearch に倒し、台帳に記録する。
  ⚠️ **RSS は無い**（`/rss.xml`・`/feed.xml`・`/blog/rss.xml`・`/blog/feed.xml` とも 404）。
  ⚠️ **一覧にも個別記事にも公開日が無い。** ページ下部の「Oct 13, 2026, 11:26 PM UTC」はサイトのビルド時刻で、確認した4記事とも同じ値だった。これを公開日として書かない。新着は sitemap の `/blog/<slug>` 集合を `.last-check-state.md` に残し、前回との集合差分で判定する（B-079 と同じ軸）。出来事の日付は記事本文か二次で確定する。
  ⚠️ **一覧に出ない記事がある。** `/blog/jack-jill-jev-case-study` は sitemap にだけ載っていた。sitemap を正とする。
  `docs.typesafe.ai` は Mintlify。`/changelog`・`/release-notes`・`/pricing` は 404 なので、仕様の変化は `docs/models` と `llms.txt` の内容で見る。`GET https://api.typesafe.ai/v1/models` は API キーが要るので使わない。
  掲載節: `## Cursor / xAI / Devin / その他エージェント`（ビューアのカテゴリでは「Cursor / xAI」に入る）。

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