#!/usr/bin/env python3
"""更新タグ検査の判定を固定する。

2026-11 のダイジェストは [新機能] を [料金+新機能] へ直している。
複合タグの優先順、参照行の除外、ロールアウト前の無視が崩れると、
commit フックが通すべき日次を止めるか、止めるべき行を通す。
"""

from __future__ import annotations

import importlib.util
import io
import sys
import tempfile
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "check_update_tags",
    Path(__file__).resolve().parent / "check-update-tags.py",
)
mod = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(mod)


def fail(message: str) -> None:
    raise SystemExit(message)


def expect_ok(text: str, kind: str, label: str) -> None:
    errors = mod.check_text(text, kind)
    if errors:
        fail(f"{label}: 合格のはずが {errors}")


def expect_has(text: str, kind: str, label: str, needle: str) -> None:
    errors = mod.check_text(text, kind)
    if not any(needle in error for error in errors):
        fail(f"{label}: 「{needle}」が無い {errors}")


DAILY_OK = """# AI News Daily Summary — 2026-11-18

## 今日のハイライト

### 1. [料金+新機能] MAI Code 2 — 従量課金の新モデルが入る

**要点**: 主は料金、副は新機能。

## カテゴリ別まとめ

### GitHub Copilot / Microsoft

- （Local harness の削除はハイライト1参照）
- [料金+新機能] **MAI Code 2** — GitHub が Copilot に追加した。
  - https://github.blog/changelog/2026-11-17-mai-code-2
- [料金+破壊的変更] **既定オン** — 従量の既定オンは主を料金にする。
- [破壊的変更+料金] **ポリシー変更** — 破壊的変更が主、料金が副。

## 注目スケジュール

- 11/22 期限。タグは不要。
"""

DIGEST_OK = """# AI News Digest — 2026-11-18

## GitHub Copilot / Microsoft

- （ハイライト参照）
- [料金+新機能] MAI Code 2 — GitHub が Copilot に追加した。
- https://github.blog/changelog/2026-11-17-mai-code-2
"""

expect_ok(DAILY_OK, "daily", "日次の複合タグ")
expect_ok(DIGEST_OK, "digest", "ダイジェストの複合タグ")


def under(body: str) -> str:
    return f"## カテゴリ別まとめ\n\n{body}"


expect_has(
    under("- [新機能+料金] **逆順** — 副の方が優先順が上。\n"),
    "digest",
    "優先順の逆",
    "副は主より優先順が下",
)
expect_has(
    under("- [廃止+新機能+料金] 三つ — 副は1語まで。\n"),
    "digest",
    "3語",
    "主は1語、副は1語まで",
)
expect_has(
    under("- [不明] 語彙外 — 11語に無い。\n"),
    "digest",
    "語彙外",
    "11語以外",
)
expect_has(
    under("- [料金 + 新機能] 空白 — 検査側は空白を語の一部として落とす。\n"),
    "digest",
    "タグ内の空白",
    "11語以外",
)
expect_has(
    "## 今日のハイライト\n\n### 1. [新機能] 題だけ\n",
    "daily",
    "ハイライトの形",
    "ハイライトは",
)
# 日次のカテゴリ行は太字見出しとダッシュが要る。見出しを今日のハイライトにしない。
expect_has(
    "## カテゴリ別まとめ\n\n- [新機能] 太字が無い — 本文\n",
    "daily",
    "日次カテゴリの形",
    "カテゴリ行は",
)
expect_has(
    under("- タグが無い項目\n"),
    "digest",
    "タグ無し",
    "項目の行頭に [タグ] が無い",
)

# 参照行・URL・除外見出しはタグ無しでも合格。
expect_ok(
    "## カテゴリ別まとめ\n\n- （ハイライト参照・1）\n- 直近の期限は別欄。\n",
    "digest",
    "参照行と直近の期限",
)
expect_ok(
    "## 今後の期限\n\n- タグ無しの期限\n",
    "digest",
    "除外見出し",
)

# ロールアウト前日は見ない。翌日の不正タグは見る。
with tempfile.TemporaryDirectory() as tmp:
    old = Path(tmp) / "ai-news-2026-09-23.md"
    new = Path(tmp) / "ai-news-2026-09-24.md"
    bad = "## カテゴリ別まとめ\n\n- [不明] 語彙外\n"
    old.write_text(bad, encoding="utf-8")
    new.write_text(bad, encoding="utf-8")
    if mod.check_file(old):
        fail("ロールアウト前を検査した")
    errors = mod.check_file(new)
    if not errors:
        fail("ロールアウト当日の不正タグを通した")
    missing = Path(tmp) / "ai-news-daily-2026-11-18.md"
    miss = mod.check_file(missing)
    if not miss or "ファイルが無い" not in miss[0]:
        fail(f"欠落ファイルの報告が違う: {miss}")

if mod.tag_error("料金+新機能") is not None:
    fail("料金+新機能 を拒否した")
if mod.tag_error("料金+破壊的変更") is not None:
    fail("許された逆順 料金+破壊的変更 を拒否した")
if mod.published_date(Path("ai-news-2026-11-18.md")) != mod.date(2026, 11, 18):
    fail("ファイル名の日付を読めていない")
if mod.kind_of(Path("ai-news-daily-2026-11-18.md")) != "daily":
    fail("日次の種別が違う")
if mod.kind_of(Path("ai-news-2026-11-18.md")) != "digest":
    fail("ダイジェストの種別が違う")


# git に依存する対象選択はここでは見ない。コマンド判定だけ固定する。
def hook(raw: str) -> int:
    old = sys.stdin
    sys.stdin = io.StringIO(raw)
    try:
        return mod.run_hook()
    finally:
        sys.stdin = old


if hook("") != 0:
    fail("空のフック入力を止めた")
if hook("{") != 0:
    fail("壊れた JSON を止めた")
if hook('{"tool_input":{"command":"ls"}}') != 0:
    fail("git 以外のコマンドを止めた")

print("合格")
