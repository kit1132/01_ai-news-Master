# 読み方プレビュー — 本番反映済み（参考）

> **本番のルールと 2026-09-21 ダイジェストへ反映済み。** このページは案の見本として残している。  
> 以降の生成は各リポの `output-style` / `daily-summary`（要約／詳細）に従う。

## このプレビューで試していること

1. **ハイライトは二段だけ** — 上段を要約、下段を詳細とする。旧「いま起きていること／関係ある人／薄い人／まずやること／一次」の多段ラベルには戻さない
2. **上段（要約）** — 事実の核。該当者向けの一手があれば末尾に溶かす（「まずやること」欄は置かない）
3. **下段（詳細）** — 「関係ある人」等の見出し行は使わない。対象の有無は地の文で書く。一次URLを続ける
4. **カテゴリ** — 同じ読み順を地の文で。色箱なし（本番ビューアもカテゴリ本文を `.lbl` で包まない）
5. **選定基準は現行のまま** — 不可逆な期限／前提が壊れた／今日から手が動く（最大2〜3件）

## 今日のハイライト

### 1. プラグインの定期更新だけでコード実行が成立しうる、と公表された — Copilot だけ、二次上は未修正のまま出た

**要約:**  
AIR が 9/17〜18 に、Claude Code / Codex / GitHub Copilot / Gemini CLI について、マーケットプレイスの定期更新だけで遠隔コード実行が成立しうると公表した（Plugin4Shell）。二次の一致では、Claude Code は `2.1.179`、Codex は `0.146.0` で公表前に修正、Copilot は未修正、Gemini CLI は退役済みとして修正なし。一次と主要詳報は本環境で到達できず、CVE も未確認。プラグインを使っているなら、信頼できないソースからのものを外す。Copilot は公式修正が出るまで更新を止めるか、プラグインを使わない。

**詳細:**  
対象はプラグイン／マーケットプレイスを使っている開発者と管理者で、とくに Copilot（二次上は未修正）。プラグインを使っていない人、報告上は各エージェント既定の GitHub マーケットだけを使っている場合は、今は触らなくてよい（ブランチ名を使う変種の影響を受けないとされている）。

- https://www.air.security/blog-posts/plugin4shell （本環境では到達不可）
- https://www.helpnetsecurity.com/2026/09/18/plugin4shell-ai-coding-agents-vulnerability/
- https://code.claude.com/docs/en/changelog （`2.1.179` まで遡れず、修正内容は一次未確認）

### 2. Grok が Microsoft の契約枠でも選べるようになった — ただし旧設定の割り当ては、新しい画面へ自動では移らない

**要約:**  
SpaceXAI が **9/18** から Microsoft のサブプロセッサとして使える（リスト追加は 9/10）。Frontier 加入テナントで、当面は Word / Excel / PowerPoint のモデル選択だけ。この経路には Product Terms・DPA・著作権補償が乗る。既定は無効。旧画面（`AI providers for other large language models`）とは**別設定**で、以前の割り当ては引き継がれない。旧設定で配っていた管理者は、管理センターの **AI providers operating as Microsoft subprocessors** で SpaceXAI を有効化し、ユーザー／グループを割り当て直す。使わないなら既定オフのままでよい。

**詳細:**  
対象は Frontier 加入で Grok を契約枠内で使いたい／すでに旧設定で配っていた管理者（AI Admin または Global Admin）。EU・EFTA・英国、政府クラウド、Frontier 未加入は対象外。Copilot Studio の Grok は従来どおり独立プロセッサのまま。

- https://learn.microsoft.com/en-us/microsoft-365/copilot/spacexai-subprocessor
- https://learn.microsoft.com/en-us/microsoft-365/copilot/connect-to-ai-subprocessor

### 3. ChatGPT に「広告主が動かす会話」の試験が入った — 無料プランでは、画面上の会話がすべて ChatGPT 本体とは限らない

**要約:**  
広告をクリックしたあと、ラベル付きで**広告主側のエージェント**と別会話できる試験（Sponsored Agents）が始まった。OpenAI は、この会話を ChatGPT の通常回答とも、もともとのチャットとも別枠だと説明している。対象は選定広告主・米国の限定試験。早期アクセス申請は受け付けていない。専用ヘルプ記事は本環境で HTTP 403。今すぐ設定を変える義務はない。Free で広告を避けたいなら、Ads-Free（制限が増える）か Plus / Pro への切替を Ads FAQ の案内どおり検討する。

**詳細:**  
広告が出る Free / Go の地域・アカウント向けの話である。Plus / Pro / Business / Enterprise / Edu は Ads FAQ 上、広告そのものが出ない。

- https://openai.com/index/reimagining-advertising-with-ai/
- https://help.openai.com/en/articles/20001047-ads-in-chatgpt
- https://help.openai.com/en/articles/20001524-sponsored-agents-in-chatgpt-ads （本環境 403）

## カテゴリ別まとめ（同じ読み順・箱なし）

### Claude / Anthropic

- Claude Code が TaskOutput ツールを削除し、`taskOutputMaxChars` と `TASK_MAX_OUTPUT_LENGTH` を無効化した（9/18・`2.1.277`）。対象は、その設定や TaskOutput 前提の自動化を入れている人（入れていない人は今は触らなくてよい）。設定ファイルに残っていてもエラーにはならず、バックグラウンド出力は Read で出力ファイルから読む形に変わった。9/6 に本サマリーが紹介した「上限引き上げ設定」は、12日で no-op になっている
  - https://code.claude.com/docs/en/changelog
- ゲートウェイ経由の auto モードでは、サーバー側チェックが届かなくなると自前の classifier に戻り、該当操作の前で一度止まって通知が出る。対象は Enterprise・Claude API、および Bedrock / Google Agent Platform / Foundry など（Pro / Max / Team にはこの通知は出ない）。通知にゲートウェイ名が出たら、管理者にリクエスト／応答を改変せず通すよう確認を依頼する。状態は `/status` の Auto mode server 行
  - https://code.claude.com/docs/en/auto-mode-classifier-billing

### Microsoft（その他）

- SpaceXAI（Grok）が Microsoft サブプロセッサ経路に入った。対象は Frontier 加入テナントの管理者。旧「other LLM」画面の割り当ては新画面へ自動移行しない。EU・EFTA・英国・政府クラウド・Frontier 未加入は対象外
  - https://learn.microsoft.com/en-us/microsoft-365/copilot/spacexai-subprocessor
