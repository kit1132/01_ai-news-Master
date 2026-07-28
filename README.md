# AI News Digest

AIエージェント・開発ツールのニュースを毎朝自動収集し、日本語ダイジェストとして配信するシステム。

## 仕組み

- Claude Code on the web のスケジュールタスクで毎朝 4:00 (JST) に実行
- 対象サイトから WebFetch / WebSearch で情報を収集し、前回との差分を抽出
- Markdown形式のダイジェストを生成し、GitHub Pagesで公開

## ビューア

**https://kit1132.github.io/01_ai-news-Master/**

5リポジトリのダイジェストを1画面で切り替えて読む統合ビューア。実体は本リポジトリの
`index.html` の1ファイルで、02〜05 の `index.html` はここへのリダイレクト。
**ビューアの修正はこのファイルだけで完結する。**

初めて見る人向けの概要は [about.html](https://kit1132.github.io/01_ai-news-Master/about.html)
（5つのタブの読み分け・更新時刻・情報源・自動生成である旨）。

各ソースのデータは相対パス `../<リポジトリ名>/files.json` で取得する（5リポとも同一オリジンのため CORS 不要）。

## リポジトリ構成

収集する3リポと、それを集約する2リポに分かれる。**集約側は収集側へ書き込まない。**

| リポジトリ | 役割 | 生成物 | 実行（JST） |
|---|---|---|---|
| `01_ai-news-Master` | AI開発ツール（Claude / OpenAI / Google / Cursor 等・26ソース） | `digests/YYYY/MM/` | 毎朝 4:10 |
| `03_ai-news-industry` | AI業界動向・市場データ（18ソース） | `digests/YYYY/MM/` | 毎朝 5:10 |
| `02_ai-news-Copilot` | Microsoft エコシステム（M365 Copilot / Power Platform 等・24ソース） | `digests/YYYY/MM/` | 毎朝 6:10 |
| `05_ai-news-daily` | 上3つを統合した日次サマリー | `daily/YYYY/` | 毎朝 7:00 |
| `04_ai-news-weekly` | 直近1週間の週次サマリー | `weekly/YYYY/` | 毎週月曜 3:00 |

各リポの収集対象・フィルタリング基準・出力スタイルは `.claude/rules/`（01〜03）
または `.claude/commands/`（04・05）にある。

## Forkして使う場合

### Public vs Private リポジトリ

| 項目 | Public | Private |
|---|---|---|
| GitHub Pages | 無料で利用可能 | GitHub Pro以上が必要 |
| スケジュールタスク | 動作する | 動作する |
| ダイジェスト内容 | 誰でも閲覧可能 | リポジトリメンバーのみ |

### セットアップ手順

1. このリポジトリをFork
2. GitHub Pages を有効化（Settings > Pages > Source: main, / (root)）
3. Claude Code on the web でスケジュールタスクを作成（`CLAUDE.md` の手順に従う）
4. `files.json` を `[]` に、`.last-check-state.md` を初期状態にリセット

### セキュリティ上の注意

- **GitHub Pages は常にPublic公開**: Private リポジトリでも Pages は外部からアクセス可能。ダイジェスト内容に社内情報や個人情報を含めたい場合は Pages を無効化すること
- **スケジュールタスクの権限**: Claude Code のスケジュールタスクはリポジトリへの push 権限を持つ。信頼できるアカウントでのみ設定すること
- **`.claude/rules/` の内容**: 監視対象サイトやフィルタリング基準が含まれる。組織固有の関心領域を追加する場合、Private リポジトリの利用を推奨
