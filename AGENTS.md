# AGENTS.md

このリポジトリの運用ルール・ブランチ運用・ダイジェスト生成手順は `CLAUDE.md` を正典とする（特に「⚠️ ブランチ運用」は絶対ルール）。ここでは重複させない。

## Cursor Cloud specific instructions

### このリポジトリの正体

- これは静的サイト `01_ai-news-Master`。「アプリ」の実体は単一ファイル `index.html`（marked.js を CDN 読み込みするクライアントサイド SPA）で、GitHub Pages 配信。ビルド・サーバ・パッケージマネージャは無い（`package.json` / lint 設定 / テストフレームワークは存在しない）。`about.html` は概要ページ。
- lint / test / build コマンドは存在しない。「テスト」はビューアを実際にブラウザで開いて描画を確認すること。

### ローカルで動かすときの必須の落とし穴

- `index.html` はデータを **相対パス `../<リポジトリ名>/files.json`**（例 `../01_ai-news-Master/`, `../05_ai-news-daily/`）で取得する。5リポが同一オリジンの兄弟ディレクトリに並ぶ本番前提のため、**リポジトリ直下を単純にサーブすると全ソースが 404 になる**。必ず「このリポを `01_ai-news-Master` という名前で置いた親ディレクトリ」をルートにしてサーブする。

  ```bash
  mkdir -p /tmp/ai-news-preview
  ln -sfn "$PWD" /tmp/ai-news-preview/01_ai-news-Master
  (cd /tmp/ai-news-preview && python3 -m http.server 8000 --bind 127.0.0.1)
  # → http://127.0.0.1:8000/01_ai-news-Master/index.html#master
  ```

- 兄弟リポ（`02_ai-news-Copilot` / `03_ai-news-industry` / `04_ai-news-weekly` / `05_ai-news-daily`）はこのチェックアウトには**存在しない**。既定ソースは `daily` なので、ハッシュ無しで開くと `../05_ai-news-daily/` が 404 になり赤いエラーバナーが出る。**ローカルで正常動作を確認できるのは `#master`（開発ツール）ソースだけ**で、これは想定内。全ソースを見たい場合は 5 リポを兄弟ディレクトリに並べてから同じ親をサーブする。

- ビューアの修正はこの `index.html` 1ファイルで完結する（02〜05 の `index.html` はここへのリダイレクト）。
