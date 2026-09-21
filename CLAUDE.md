# AI News Digest

## 基本方針

- 出力は日本語
- 簡潔で実用的な情報を好む。冗長な説明は不要
- 定量的な根拠を重視
- AIエージェント・開発ツールのニュースに特化

## プロジェクト構成

- `digests/YYYY/MM/ai-news-YYYY-MM-DD.md` — デイリーダイジェスト本体
- `.last-check-state.md` — 各ソースの前回チェック状態（差分判定用）
- `IMPROVEMENT-BACKLOG.md` — 改善提案・取得障害の台帳（改善メモの単一情報源。運用ルールはファイル冒頭参照）
- `index.html` — **5ソース統合ビューア**（marked.js使用、GitHub Pagesで公開）。02_ai-news-Copilot / 03_ai-news-industry / 04_ai-news-weekly / 05_ai-news-daily のビューアはこのファイルへのリダイレクトなので、ビューアの修正はこの1ファイルだけで完結する。各ソースのデータは相対パス `../<リポジトリ名>/files.json` で取得する（5リポとも同一オリジンのため CORS 不要）
- `files.json` — ビューアが参照するダイジェストファイル一覧（新しい順、パスはルートからの相対）。**手動編集しない**。`scripts/generate_files_json.py` で `digests/**/*.md` から自動生成する
- `scripts/generate_files_json.py` — `files.json` の生成・検証スクリプト（`--check` で CI 検証、`--report-gaps` で日付欠落の可視化）

## 実行環境

- Claude Code on the web（クラウド実行）
- スケジュールタスクとして毎朝自動実行
- ネットワーク: Full internet（外部サイトへのWebFetch/WebSearchが必要）
- **日付: JST（Asia/Tokyo, UTC+9）で判定する。`TZ=Asia/Tokyo date +%Y-%m-%d` で当日日付を取得すること**

## ⚠️ ブランチ運用（最重要・絶対ルール）

**過去に 2 回、スケジュールタスクが feature branch（`claude/upbeat-ramanujan-*` / `claude/brave-franklin-*`）に digest を push して main にマージされず、GitHub Pages に最新ダイジェストが反映されない事故を起こしている。同じ事故を二度と起こさないため、以下を絶対ルールとする。**

### 開始時（毎セッション必ず）

```bash
TZ=Asia/Tokyo date +%Y-%m-%d        # 当日日付を取得
git fetch origin main --depth=1
git checkout main
git pull --ff-only origin main
git rev-parse --abbrev-ref HEAD     # → 必ず `main` であることを確認
```

`.claude/settings.json` の SessionStart hook が自動で `main` への checkout を試みるが、**ハードコードに頼らず自分でも上記コマンドを必ず実行して確認すること**。

### コミット・push（毎回必ず）

digest 生成・`.last-check-state.md`・`IMPROVEMENT-BACKLOG.md`・`files.json` の更新が終わったら:

```bash
git add digests/ .last-check-state.md IMPROVEMENT-BACKLOG.md files.json
git commit -m "Add AI news digest for YYYY-MM-DD"
git push origin HEAD:main           # ← 必ず main に直接 push する
```

**`git push` 単体（リモート追跡ブランチへの push）は禁止**。必ず `HEAD:main` 形式を使う。これにより、たとえ作業が feature branch 上であっても結果は main に反映される。

### 禁止事項

- `git checkout -b <new-branch>` — 新規ブランチを切らない
- `git push origin <feature-branch>` — feature branch にだけ push しない
- PR 作成して放置 — 自動マージしないので main に反映されない
- main 以外のブランチで作業終了 — どんな状況でも最後は main に push する

## ダイジェスト生成後の手順

1. `digests/YYYY/MM/ai-news-YYYY-MM-DD.md` を生成（ディレクトリがなければ作成）
2. `.last-check-state.md` を更新
3. `IMPROVEMENT-BACKLOG.md` を更新（新規提案の起票・既出提案の回数更新・障害の最終確認日更新。`output-style.md` の改善メモ規定参照）
4. `python3 scripts/generate_files_json.py` を実行して `files.json` を再生成する（`digests/**/*.md` を走査し日付降順で自動生成。手動追記は不要・追記漏れ防止）
5. **`git push origin HEAD:main` で main に直接 push する**（上の絶対ルール参照）

## ルール参照

詳細なフィルタリング基準・対象サイトは `.claude/rules/` 以下を参照すること。
各タスクは該当するrulesファイルを読み込んでから実行する。

- `.claude/rules/sites/daily-sources.md` — 対象サイト一覧・各ソースの取得方法・代替URL・検索キーワード
- `.claude/rules/sites/fetch-flow.md` — WebFetch失敗時のフォールバックフロー・エラー記録ルール
- `.claude/rules/interests/ai-tools.md` — 関心領域・除外基準
- `.claude/rules/preferences/output-style.md` — 出力フォーマット・ファイル形式
