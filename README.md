# AI News Digest

AIエージェント・開発ツールのニュースを毎朝自動収集し、日本語ダイジェストとして配信するシステム。

## 仕組み

- Claude Code on the web のスケジュールタスクで毎朝 7:00 (JST) に実行
- 対象サイトから WebFetch / WebSearch で情報を収集し、前回との差分を抽出
- Markdown形式のダイジェストを生成し、GitHub Pagesで公開

## ビューア

https://rfdnxbro.github.io/ai-news/
