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

（現在なし）

## 既知の取得障害

- 主要ソース一括 WebFetch 403（Anthropic news / OpenAI / Google / Cursor / Devin 等）: 403（初出 2026-04-14 / 最終確認 2026-07-20）→ 回避策: WebSearch プライマリ運用（daily-sources.md は 2026-04-14 に更新済み）。例外: `code.claude.com/docs/en/changelog`・`github.com/*/releases`（Copilot/Codex CLI、2026-07-07 疎通確認）・`platform.claude.com`（Fable 5 ドキュメント、2026-07-06 疎通確認）・`developers.openai.com` 配下（changelog / codex/changelog / blog、2026-07-08 復旧確認）は WebFetch 成功。help.openai.com（ChatGPT/Sora release notes）は 403 継続を 2026-07-08 に再確認
- `developers.openai.com` 配下（codex/changelog・changelog）＋ `community.openai.com/c/announcements/6.rss`: 403 再発（初出 2026-07-15［codex/changelog］→ 2026-07-18 に changelog・community RSS へ拡大 / 最終確認 2026-07-20（月曜復旧チェックで 403 継続を確認・未復旧）。2026-07-08 に復旧確認済みだった exception ソース群の再障害）→ 回避策: Codex CLI 情報は `github.com/openai/codex/releases`（WebFetch 安定）で完全代替可、OpenAI news/API 発表は WebSearch フォールバックで代替可・いずれも情報欠落なし。次回月曜（07-27）復旧チェック対象
- xAI/SpaceXAI Grok changelog / https://x.ai/*（build/changelog・news 配下）: 403（初出 2026-07-09 / 最終確認 2026-07-10）→ 回避策: WebSearch（daily-sources.md は既に「WebFetch→失敗時 WebSearch」運用のため取得方法欄の変更は不要）
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
