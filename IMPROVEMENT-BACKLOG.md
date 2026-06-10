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

### B-001: 403継続ソースの復旧チェック手順を明文化
- 状態: 提案中
- 初出: 2026-06-08 / 最終確認: 2026-06-10 / 回数: 3
- 対象: `.claude/rules/sites/fetch-flow.md`
- 変更内容: 復旧チェックの実行手順（頻度・対象ソース・確認方法・復旧時の取得方法の戻し方）を明文化する。daily-sources.md の 2026-06-04 更新で「月1回程度」と決定済みのため、メモが推奨する週次とどちらにするかは kit が判断
- 根拠: 復旧チェックの方針（06-04）はあるが実行手順が未定義のため実施されていない。メモでは週次疎通テスト推奨が3回継続

### B-002: GitHub Copilot Changelog をソース追加
- 状態: 提案中
- 初出: 2026-06-05 / 最終確認: 2026-06-10 / 回数: 3
- 対象: `.claude/rules/sites/daily-sources.md` Microsoft / GitHub 系セクション
- 変更内容: `github.blog/changelog/`（Copilot ラベル: `github.blog/changelog/label/copilot/`）を WebSearch 取得で追加
- 根拠: Copilot 大型アップデートの最速一次ソース。Fable 5 GA を同日公開。WebSearch で安定取得可

### B-003: Codex CLI changelog の疎通回復を検証し記載を実態に合わせる
- 状態: 提案中
- 初出: 2026-06-05 / 最終確認: 2026-06-05 / 回数: 1
- 対象: `.claude/rules/sites/daily-sources.md`「OpenAI Codex CLI Releases」備考
- 変更内容: `developers.openai.com/codex/changelog` の疎通を再検証し、回復していれば参考URLから併用一次ソースへ戻す
- 根拠: daily-sources.md には「403継続（04-02以降）」とあるが、2026-06-05 のメモで安定提供を確認しており記載と実態が乖離

### B-004: Anthropic Institute をソース追加
- 状態: 提案中
- 初出: 2026-06-06 / 最終確認: 2026-06-06 / 回数: 1
- 対象: `.claude/rules/sites/daily-sources.md` Anthropic Blog 項
- 変更内容: `anthropic.com/institute/` を Anthropic Blog の副ラインとして追加
- 根拠: 政策・研究系の一次ソース。`anthropic.com/news` だけでは institutional position paper を取りこぼす

### B-005: xAI Grok の一次ソース強化
- 状態: 提案中
- 初出: 2026-05-28 / 最終確認: 2026-06-07 / 回数: 5
- 対象: `.claude/rules/sites/daily-sources.md` xAI 項・X トレンド検索キーワード
- 変更内容: `x.ai/build/changelog` を明示追記（一次ページと確認済み）。検索キーワードに `Elon Musk Grok update` を追加
- 根拠: 05/28〜06/03 に複数回記録（daily-sources.md の xAI 備考に宿題として記載済み）。Musk の X 投稿が速報の一次ソース化

### B-006: Fable 5 / Mythos 5 公式ドキュメント URL をソース追加
- 状態: 提案中
- 初出: 2026-06-10 / 最終確認: 2026-06-10 / 回数: 1
- 対象: `.claude/rules/sites/daily-sources.md` 最優先層
- 変更内容: `platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5`（仕様の決定版）を追加。公式 system card URL は判明次第追記。WebFetch 疎通成功が追加条件
- 根拠: Fable 5 GA に伴い仕様参照の需要が継続する

### B-007: Claude Code 更新の補完ソース追加
- 状態: 提案中
- 初出: 2026-06-07 / 最終確認: 2026-06-07 / 回数: 1
- 対象: `.claude/rules/sites/daily-sources.md` Anthropic / Claude Code 項
- 変更内容: `claudefa.st/blog/guide/changelog`・`claudeupdates.dev` をサードパーティ集約ページとして補助記載
- 根拠: 一次ソース（code.claude.com）の補完として有用と確認

### B-008: 「企業構造 / GTM 動向」セクションの独立化
- 状態: 提案中
- 初出: 2026-06-04 / 最終確認: 2026-06-04 / 回数: 1
- 対象: `.claude/rules/preferences/output-style.md` フォーマット節
- 変更内容: rebrand・組織再編・GTM 動向を扱う独立セクションをダイジェストに追加
- 根拠: rebrand / 階層化イベントが同週に連続するなど増加傾向

### B-009: Apple 関連ソースの追加
- 状態: 提案中
- 初出: 2026-06-08 / 最終確認: 2026-06-10 / 回数: 3
- 対象: `.claude/rules/sites/daily-sources.md` 高優先層
- 変更内容: Apple Developer newsroom・iOS 27 Developer Release Notes を追加（Apple Intelligence Extensions 追跡。秋 GA まで）
- 根拠: WWDC 2026 で Apple Intelligence Extensions が発表され、継続追跡の必要性が高い

### B-010: Anthropic ↔ Harvey 提携の月次トラッキング
- 状態: 提案中
- 初出: 2026-06-10 / 最終確認: 2026-06-10 / 回数: 1
- 対象: `.claude/rules/interests/ai-tools.md` 注目案件
- 変更内容: 法務 SaaS への frontier モデル展開事例として月次トラッキング対象に追記
- 根拠: Fable 5 採用のエンタープライズ展開事例として注目

## 既知の取得障害

- 主要ソース一括 WebFetch 403（Anthropic news / OpenAI / Google / Cursor / Devin 等）: 403（初出 2026-04-14 / 最終確認 2026-06-10）→ 回避策: WebSearch プライマリ運用（daily-sources.md は 2026-04-14 に更新済み）。例外: `code.claude.com/docs/en/changelog` は WebFetch 成功する日が多い
- apple.com/newsroom: 403（初出 2026-06-09 / 最終確認 2026-06-09）→ 回避策: WebSearch

## アーカイブ（採用済み・見送り）

（まだなし。kit が「提案中」から状態を変更してここへ移動する）
