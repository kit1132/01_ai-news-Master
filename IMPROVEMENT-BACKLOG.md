# 改善バックログ

改善提案・取得障害の台帳（改善メモの単一情報源）。デイリーエージェントが毎日更新し、ルールへの反映可否は kit が判断する。

## 運用ルール（エージェント向け）

- ダイジェストの「改善メモ」を書く**前に**必ずこのファイルを読み、先に台帳を更新する
- **新しい改善案** → 「提案中」に新規ブロックを追記（ID は既存の最大番号 +1。アーカイブ含む）
- **既出の提案を本日も再確認した** → 該当ブロックの「最終確認」を当日に更新し「回数」を +1。内容の重複起票は禁止
- **新しい取得障害** → 「既知の取得障害」に1行追加。**既知の障害が今日も発生** → 最終確認日のみ更新
- **障害が復旧した** → 該当行の行末に `→ 復旧（YYYY-MM-DD）` を追記（行は削除しない）
- 「状態」の変更（採用済み・見送り）とアーカイブへの移動は **kit が行う。エージェントは行わない**
- このファイルにはルール改善の提案と取得障害のみを書く。ニュース内容の気づきは書かない

## 提案中

- **B-018: OpenAI 系ソースが全て到達不可である実態を `daily-sources.md` に明記し、料金変更の検知手段を補う**（起票 2026-07-31 / 最終確認 2026-07-31 / 回数 1）
  - 対象: `.claude/rules/sites/daily-sources.md`「最優先」の OpenAI 系4項目（OpenAI Blog / News・OpenAI Developer Community Announcements・OpenAI Platform Changelog・ChatGPT Release Notes）と「高優先」の OpenAI Developer Blog、計5項目の取得方法欄・備考欄
  - 変更内容: ① 5項目すべての取得方法を「WebSearch（一次は実行環境から到達不可）」に統一し、2026-07-08 の B-011 で「WebFetch 一次に昇格」と書いた `developers.openai.com` 配下2項目の記載を実態に戻す ② OpenAI Blog / News 項の検索キーワードに料金変更検知用の `OpenAI price cut API pricing 2026` を追加する ③ 各項目の備考に「ゲートウェイ拒否のため許可リスト追加まで WebFetch は不可（B-013）」と明記する
  - 根拠: 2026-07-31 に `curl` で5ホストすべてを実測したところ、`openai.com` / `help.openai.com` / `developers.openai.com` / `community.openai.com` の4ホストが exit 56 / `CONNECT tunnel failed, response 403` を返し、**登録済み OpenAI 系ソースは1つも到達できない**状態と確定した。とりわけ `developers.openai.com` は B-011（2026-07-08）で疎通確認のうえ「一次取得に昇格」と記載したまま 07-15 に 403 再発しており、現行の記載と実態が2週間以上乖離している。実害として、本日の最重要項目（GPT-5.6 Luna 80% / Terra 20% 値下げ）は一次発表 `openai.com/index/gpt-5-6/` を読めず、金額を CNBC / Axios / Yahoo Finance / unite.ai の二次報道の一致で採る形になった。値下げ幅・新旧単価・fast option の倍率という**数値そのものが二次情報依存**になっており、料金は誤りの影響が大きい項目であるため、検知手段と限界の明記が要る
  - 制約: 実効的な解決は B-013 の許可リスト追加に依存する。本提案は許可リスト追加が行われるまでの記載の実態合わせと、料金変更を取り逃さないための検索キーワード追加に限定する

- **B-017: Claude 製品ブログ（`claude.com/blog`）を最優先ソースとして `daily-sources.md` に追加する**（起票 2026-07-30 / 最終確認 2026-07-30 / 回数 1）
  - 対象: `.claude/rules/sites/daily-sources.md`「最優先」セクション（新規項目の追加）、および本台帳「既知の取得障害」のゲートウェイ拒否行
  - 変更内容: 「Claude Blog（製品側発表）」を新規追加する。URL は `https://claude.com/blog`。取得方法は「WebSearch → WebFetch」（現時点でゲートウェイ拒否のため WebSearch のみが実効。許可リスト追加後に WebFetch を一次へ昇格）。頻度は毎日確認。注目点は Claude 本体（claude.ai / Desktop / Cowork）のプロダクト機能発表、コネクタ / MCP まわりの製品実装、Managed Agents の機能追加
  - 根拠: `daily-sources.md` に登録されている Anthropic 系ソースは ① `www.anthropic.com/news`（企業発表）② `platform.claude.com`（API release notes）③ `support.claude.com`（アプリ release notes）④ Claude Code changelog の4系統だが、**製品側の機能発表はこのいずれにも載らないことがある**。2026-07-30 の本ダイジェスト最重要項目（MCP 2026-07-28 の Claude 実装・インタラクティブコネクタ / MCP Apps・MCP tunnels research preview・コネクタ observability ダッシュボード）は `claude.com/blog` 配下の3記事が一次であり、①②③④のいずれにも該当エントリがなかった（②は 7/24 が最新のまま、③は 403、①は WebSearch で該当なし）。結果として WebSearch のスニペット経由でしか内容を取れず、公開日も断定できていない。なお `platform.claude.com/docs/en/agents-and-tools/mcp-tunnels/*` は WebFetch 200 で本文取得可のため、tunnels に限ればドキュメント側で代替できる
  - 制約: `claude.com` は 2026-07-30 に `curl` exit 56 / `CONNECT tunnel failed, response 403` を確認済みでゲートウェイ拒否。B-013 の許可リスト追加要請に `claude.com` を含めることが前提となる

- **B-016: MCP 公式ブログ（`blog.modelcontextprotocol.io`）を最優先ソースとして `daily-sources.md` に追加する**（起票 2026-07-29 / 最終確認 2026-07-30 / 回数 2）
  - 対象: `.claude/rules/sites/daily-sources.md`「最優先」セクション（新規項目の追加）
  - 変更内容: 「Model Context Protocol Blog」を新規追加する。URL（優先）は `https://blog.modelcontextprotocol.io/`、RSS URL は `https://blog.modelcontextprotocol.io/index.xml`。取得方法は「RSS → WebFetch → WebSearch」。頻度は毎日確認。注目点は仕様リビジョンの公開・破壊的変更・Extensions（Tasks / MCP Apps / EMA）・SDK 対応状況
  - 根拠: 2026-07-28 に MCP 仕様 `2026-07-28`（launch 以来最大の改訂・stateless 化という破壊的変更）が公開されたが、`daily-sources.md` に MCP の一次ソースが1つも登録されておらず、**汎用の WebSearch（`AI agent tool launch July 28 2026`）の副産物として偶然検出した**。MCP は Claude Code / Copilot CLI / Codex CLI のいずれもが依存する基盤仕様であり、`interests/ai-tools.md` の「AIエージェント全般」に直接該当する。curl 実測: `index.xml` → 200 / `application/xml` / 393,031 bytes、最新エントリ `The 2026-07-28 Specification`（Tue, 28 Jul 2026 09:00:00 +0000）。ブログ本体・記事個別URLとも WebFetch 200 で本文取得可（`modelcontextprotocol.io` 本体はゲートウェイ拒否だが、`blog.` サブドメインは到達可能）

- **B-015: Hugging Face（`huggingface.co`）をオープンウェイト系の一次ソースとして `daily-sources.md` に追加する**（起票 2026-07-28 / 最終確認 2026-07-28 / 回数 1）
  - 対象: `.claude/rules/sites/daily-sources.md`「高優先」セクション（新規項目の追加）、および `IMPROVEMENT-BACKLOG.md`「既知の取得障害」のゲートウェイ拒否行
  - 変更内容: 「Hugging Face モデルリリース」を高優先ソースとして新規追加する。URL は `https://huggingface.co/models?sort=trending` と個別モデルの API エンドポイント `https://huggingface.co/api/models/<org>/<model>`（JSON で `lastModified` / `siblings` のファイル一覧が取れるため公開判定に使える）。取得方法は「WebFetch → 失敗時 WebSearch」。ただし現時点では**ゲートウェイ拒否のため到達不可**であり、B-013 の許可リスト追加要請に `huggingface.co` を含めることが前提
  - 根拠: `interests/ai-tools.md` は「オープンソースのAIツール（ローカルLLM）」を対象と明記しているが、`daily-sources.md` にオープンウェイト系の一次ソースが1つも登録されていない。2026-07-27・07-28 の 2 日連続で Kimi K3 の公開可否判定が最重要項目になったにもかかわらず、一次情報（HF モデルカード・ファイル一覧・ライセンス）に到達できず、公開時刻・配布サイズ・アクティブパラメータ数のいずれも二次情報の間で食い違ったまま確定できなかった（07-27 は「594GB 説 と 1.4TB 説」、07-28 は「アクティブ 50B 説 と 104B 説」）。API エンドポイントは JSON を返すため、公開済みかどうかの機械的判定に最も適する

- **B-013: 403 を「ゲートウェイ拒否」と「オリジン 403」に分類して記録する**（起票 2026-07-27 / 最終確認 2026-07-31 / 回数 5）
  - 対象: `.claude/rules/sites/fetch-flow.md`「フォールバック発生時の記録ルール」および「復旧チェック（週1回・月曜）」、本台帳「既知の取得障害」の記載形式
  - 変更内容: 障害記録時に 2 種類を区別する。① **ゲートウェイ拒否**（実行環境のネットワーク許可リスト外。`curl` が exit 56 / `CONNECT tunnel failed, response 403` を返す）② **オリジン 403**（サイト側のブロック。HTTP レスポンスとして 403 が返る）。判定手順は `curl -sS -o /dev/null -w "%{http_code}" --max-time 25 <URL>` と `curl -sS "$HTTPS_PROXY/__agentproxy/status"` の `recentRelayFailures` の確認。①は週次復旧チェックの対象から外し、代わりに「実行環境のネットワークポリシーへの許可リスト追加を kit に要請する」項目として台帳に置く
  - 根拠: 2026-07-26 に curl 実測 200 を確認して追加した B-012 の 4 ソース（`cursor.com`・`forum.cursor.com`・`www.testingcatalog.com`・`simonwillison.net`）が、2026-07-27 のクラウド定期実行では**全て CONNECT 403**。プロキシの `recentRelayFailures` に `gateway answered 403 to CONNECT (policy denial or upstream failure)` として 5 ホスト分が記録されており、オリジンではなくゲートウェイ段での遮断と確定した。①はサイト側が復旧しても解消しないため、現行の「復旧チェックで毎週叩き直す」運用は永久に空振りする
  - 追記（2026-07-31）: 既存の障害行の再判定を実施し、**4ホストが誤分類だった**ことを確認した。`openai.com` / `help.openai.com`（ともに台帳1行目の「主要ソース一括 WebFetch 403」に含めて 2026-04-14 以降記録）・`developers.openai.com`（台帳2行目・2026-07-15 以降「403 再発」と記録）・`x.ai/*`（台帳5行目・2026-07-09 以降「403」と記録）のいずれも、`curl` で exit 56 / `CONNECT tunnel failed, response 403` を返しゲートウェイ拒否だった。一方 `www.anthropic.com/news` は HTTP 403 が返りオリジン 403 のままで、**2分類が実際に異なる結果を返すこと**を同一セッション内で確認できた。07-30 の追記で提案内容に加えた「既存の障害行も再判定して2分類に振り直す」は、この実測により有効性が裏付けられた。なお `developers.openai.com` は B-011（07-08）で「WebFetch 一次に昇格」と `daily-sources.md` に記載したまま実態と乖離しているため、記載の実態合わせを B-018 として別途起票した
  - 追記（2026-07-30）: 拡大がさらに続き、`claude.com`（Claude 製品ブログ・本日の最重要項目の一次）・`aws.amazon.com`（AWS What's New）・`support.claude.com`（Claude Release Notes・`daily-sources.md` 最優先の登録ソース）の3ホストを `curl` exit 56 で新規判定した。特に `support.claude.com` は**2026-04-02 以降「オリジン 403」として台帳の1行目にまとめて記録してきたが、実体はゲートウェイ拒否だった**。これは「WebSearch プライマリへ切り替えれば足りる」とした 2026-04-14 の一括判断が、少なくとも一部ソースについて誤った分類に基づいていたことを意味する。提案内容に「既存の障害行も再判定して 2 分類に振り直す」を追加する
  - 追記（2026-07-29）: ゲートウェイ拒否が**これまで正常取得できていたホストにも拡大**した。`github.blog`（Copilot Changelog の一次）・`workspaceupdates.googleblog.com`（Google Workspace Updates の一次）・`techcrunch.com`（B-011 で 2026-07-08 に疎通確認済みの補完二次ソース）・`releasebot.io`・`modelcontextprotocol.io` の 5 ホストが `curl` exit 56 / `CONNECT tunnel failed, response 403`。**サイト側の 403 ではないため `daily-sources.md` の取得方法欄を書き換えても解決しない**点を、提案内容の「①は復旧チェック対象から外す」に加えて明記する
  - 追記（2026-07-28）: 分類手順が有効に機能することを再確認。WebFetch が一律「HTTP 403 Forbidden」と表示する 5 ホスト（`huggingface.co`・`www.kimi.com`・`docs.devin.ai`／`devin.ai`・`www.tomshardware.com`）に対し `curl` を実行したところ、いずれも exit 56 / `CONNECT tunnel failed, response 403` でゲートウェイ拒否と判明した。**WebFetch のエラー文面だけでは 2 種類を区別できない**ため、403 を台帳に記録する前に `curl` で判定する手順を必須とすることを提案内容に含める

- **B-014: Claude Code Changelog のフォールバック URL を raw に変更**（起票 2026-07-27 / 最終確認 2026-07-27 / 回数 1）
  - 対象: `daily-sources.md`「Claude Code Changelog」項の `URL（フォールバック）`
  - 変更内容: `https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md` → `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
  - 根拠: 2026-07-27 に一次 URL `code.claude.com/docs/en/changelog` が 503 を返しフォールバックへ移行したところ、blob URL は GitHub の UI シェル（ファイルサイズ 466KB・5248行というメタ情報）のみが返り**本文が取得できなかった**。同一セッションで raw URL は本文取得に成功し v2.1.220 を確認できた。現行の備考にある「GitHub 版は大きいため 429 になることがある」への対策としても raw のほうが軽い

## 既知の取得障害

- 主要ソース一括 WebFetch 403（Anthropic news / OpenAI / Google / Cursor / Devin 等）: 403（初出 2026-04-14 / 最終確認 2026-07-31）※ **本行に含めていた `openai.com` / `help.openai.com` は 2026-07-31 にゲートウェイ拒否と再判定済み**（上のゲートウェイ拒否行を参照。`www.anthropic.com` はオリジン 403 のまま）→ 回避策: WebSearch プライマリ運用（daily-sources.md は 2026-04-14 に更新済み）。例外: `code.claude.com/docs/en/changelog`・`github.com/*/releases`（Copilot/Codex CLI、2026-07-07 疎通確認）・`platform.claude.com`（Fable 5 ドキュメント・release-notes、2026-07-27 疎通再確認）・`raw.githubusercontent.com`（2026-07-27 疎通確認）は WebFetch 成功。help.openai.com（ChatGPT/Sora release notes）は 403 継続を 2026-07-08 に再確認
- `developers.openai.com` 配下（codex/changelog・changelog）: 403 再発（初出 2026-07-15［codex/changelog］→ 2026-07-18 に changelog へ拡大 / 最終確認 2026-07-31）→ **2026-07-31 に実体はゲートウェイ拒否と再判定**（上のゲートウェイ拒否行へ移動。サイト側の復旧待ちでは解消しない）→ 回避策: Codex CLI 情報は `github.com/openai/codex/releases`（WebFetch 安定）で完全代替可、OpenAI news/API 発表は WebSearch フォールバックで代替可・いずれも情報欠落なし
- **ゲートウェイ拒否（CONNECT 403・実行環境のネットワーク許可リスト外）**: `cursor.com` / `forum.cursor.com` / `www.testingcatalog.com` / `simonwillison.net` / `community.openai.com`（初出 2026-07-27 / 最終確認 2026-07-28）＋ **`huggingface.co` / `www.kimi.com` / `docs.devin.ai` / `devin.ai` / `www.tomshardware.com`（初出 2026-07-28）** ＋ **`github.blog` / `workspaceupdates.googleblog.com` / `techcrunch.com` / `releasebot.io` / `modelcontextprotocol.io`（初出 2026-07-29。ただし `blog.modelcontextprotocol.io` は 200 で到達可）** ＋ **`claude.com` / `support.claude.com` / `aws.amazon.com`（初出 2026-07-30。`support.claude.com` は 04-02 以降オリジン 403 と誤分類していた分の再判定。`platform.claude.com` は引き続き 200）** ＋ **`openai.com` / `help.openai.com` / `developers.openai.com` / `x.ai`（初出 2026-07-31。いずれも 04-14〜07-15 以降「403」として下記の各行に記録してきた分の再判定＝誤分類の訂正。これで登録済み OpenAI 系5ソースが全て到達不可と確定 → B-018）** ＋ 二次ソース `9to5mac.com` / `www.unite.ai` / `windowsreport.com`（初出 2026-07-31）（最終確認 2026-07-31）→ 回避策: WebSearch のみ。**サイト側の復旧待ちでは解消しない**（`curl` exit 56・プロキシの `recentRelayFailures` に policy denial として記録）。前4者は 2026-07-26 に B-012 でローカル curl 200 を根拠に追加したソースだが、クラウド定期実行からは到達不可。`community.openai.com` は 07-18 以降「403 継続」と記録してきたが、実体はオリジン 403 ではなくゲートウェイ拒否だったと 07-27 に判明。後半 5 ホストは 07-28 に curl で新規判定（`huggingface.co` はオープンウェイト系の実質的な一次ソースであり影響が大きい → B-015）。**要対応: 実行環境のネットワークポリシーへの許可リスト追加（kit 判断）**。詳細は B-013
- `www.anthropic.com/news`: オリジン 403（ゲートウェイは通過・HTTP 403 が返る）（初出 2026-04-02 / 最終確認 2026-07-27）→ 回避策: WebSearch
- xAI/SpaceXAI Grok changelog / https://x.ai/*（build/changelog・news 配下）: 403（初出 2026-07-09 / 最終確認 2026-07-31）→ **2026-07-31 に実体はゲートウェイ拒否と再判定**（上のゲートウェイ拒否行へ移動）→ 回避策: WebSearch（daily-sources.md は既に「WebFetch→失敗時 WebSearch」運用のため取得方法欄の変更は不要）
- apple.com/newsroom: 403（初出 2026-06-09 / 最終確認 2026-06-09）→ 回避策: WebSearch

## アーカイブ（採用済み・見送り）

- B-001: 403継続ソースの復旧チェック手順を明文化 — **採用済み（2026-06-10）**。`fetch-flow.md`「復旧チェック（週1回・月曜）」として反映。kit 判断で週1回を選択（06-04 の「月1回」記載も更新済み）
- B-002: GitHub Copilot Changelog をソース追加 — **採用済み（2026-06-10）**。`daily-sources.md` 高優先に追加
- B-003: Codex CLI changelog の疎通回復を検証し記載を実態に合わせる — **採用済み（2026-06-10）**。`daily-sources.md` 備考に疎通試行の宿題として反映
- B-004: Anthropic Institute をソース追加 — **採用済み（2026-06-10）**。`daily-sources.md` Anthropic Blog 項に副ラインとして反映
- B-005: xAI Grok の一次ソース強化 — **採用済み（2026-06-10）**。`daily-sources.md` xAI 項に候補3 URL 追加、X 検索キーワードに `Elon Musk Grok update` 追加
- B-006: Fable 5 / Mythos 5 公式ドキュメント URL をソース追加 — **採用済み（2026-06-10）**。`daily-sources.md` 最優先に宿題ソースとして追加（疎通確認は次回生成時）
- B-007: Claude Code 更新の補完ソース追加 — **採用済み（2026-06-10）**。`daily-sources.md` Claude Code Changelog 項の備考に一次ソース不通時の補完として反映
- B-008: 「企業構造 / GTM 動向」セクションの独立化 — **採用済み（2026-06-10）**。`output-style.md` フォーマット節に反映（該当ニュースがある日のみ）
- B-009: Apple 関連ソースの追加 — **採用済み（2026-06-10）**。`daily-sources.md` 高優先に追加（秋 GA 後に頻度見直し）
- B-010: Anthropic ↔ Harvey 提携の月次トラッキング — **採用済み（2026-06-10）**。`interests/ai-tools.md` に反映
- B-011: OpenAI 系ソースの拡充 — **採用済み（2026-07-08・kit の直接指示によりセッション内で反映）**。疎通確認の上で `daily-sources.md` に反映: ① OpenAI Developer Community Announcements（`community.openai.com/c/announcements/6.rss`、RSS可）を最優先に新規追加 ② OpenAI Platform Changelog の一次URLを `developers.openai.com/changelog`（WebFetch可）に変更 ③ OpenAI Developer Blog（`developers.openai.com/blog`）を高優先に新規追加 ④ Codex changelog 復旧に伴い併用一次に昇格（B-003 の宿題完了） ⑤ OpenAI Blog 項に TechCrunch OpenAI タグを補完二次ソースとして追記。help.openai.com（Sora release notes 含む）と theverge.com は取得不可のため見送り
