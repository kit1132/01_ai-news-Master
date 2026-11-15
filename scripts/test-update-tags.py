#!/usr/bin/env python3
"""更新タグ検査の単体テスト。

2026-10-19 の修正は、規約の「（ハイライトN参照）」を参照行として除外する。
数字が入ると従来の部分一致「ハイライト参照」に当たらず、正しい行が不合格になっていた。
タグの優先順と、従量の既定オンで許す「料金+破壊的変更」も毎日の検査が止めるので固定する。
"""

from __future__ import annotations

import importlib.util
import io
import sys
import tempfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check-update-tags.py"


def load_checker():
    spec = importlib.util.spec_from_file_location("check_update_tags", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"読み込めない: {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


checker = load_checker()

failures: list[str] = []


def check(name: str, got, want) -> None:
    if got != want:
        failures.append(f"{name}: got={got!r} want={want!r}")
        print(f"FAIL {name}")
    else:
        print(f"ok   {name}")


def main_code(argv: list[str]) -> int:
    stdout, stderr = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = io.StringIO(), io.StringIO()
    try:
        return checker.main(argv)
    finally:
        sys.stdout, sys.stderr = stdout, stderr


def hook_code(raw: str) -> int:
    stdin = sys.stdin
    sys.stdin = io.StringIO(raw)
    try:
        return checker.run_hook()
    finally:
        sys.stdin = stdin


def test_skip_bullet() -> None:
    skipped = [
        "- https://github.blog/changelog/2026-11-13-example",
        "- http://example.com/a",
        "- （ハイライト参照）",
        "- （ハイライト1参照）",
        "- （ハイライト12参照）",
        "- （ハイライト１２参照）",
        "- （ハイライト 3 参照）",
        "- **無料枠の限定**（ハイライト参照・1）",
        "- 直近の期限: 12/14",
    ]
    for line in skipped:
        check(f"skip {line}", checker.skip_bullet(line), True)

    kept = [
        "- [新機能] ハイライトを公開した",
        "- [新機能] **見出し** — ハイライトを増やした",
        "- 直近の予定: 12/14",
        "- https://example.com の説明",
    ]
    for line in kept:
        check(f"keep {line}", checker.skip_bullet(line), False)


def test_tag_error() -> None:
    cases = {
        "新機能": None,
        "廃止+新機能": None,
        "料金+破壊的変更": None,
        "料金+新機能": None,
        "新機能+廃止": "副は主より優先順が下",
        "新機能+料金": "副は主より優先順が下",
        "新機能+新機能": "副は主より優先順が下",
        "存在しない": "11語以外",
        "新機能 + 料金": "11語以外",
        "新機能+": "11語以外",
        "新機能+料金+仕様": "主は1語、副は1語まで",
    }
    for token, want in cases.items():
        check(f"tag {token}", checker.tag_error(token), want)


def test_digest_sections() -> None:
    ok = """## GitHub Copilot / Microsoft

- [新機能] GitHub が Gemini 4 Hydrogen を Copilot で GA にした
- [料金+破壊的変更] 従量の既定オンは料金を主にする
- [廃止+新機能] 古いモデルを廃止し、新しい入口を足した
- （ハイライト1参照）
- （ハイライト参照）
- （ハイライト１２参照）
- https://github.blog/changelog/2026-11-13-example
- [新機能] ハイライトを公開した
"""
    check("digest ok", checker.check_text(ok, "digest"), [])

    excluded_then_bad = """## 注目スケジュール

- タグが無くてもこの節は見ない
- [存在しない] ここも見ない

## 採録を見送った候補

- これも見ない

## OpenAI

- タグが無い行
"""
    check(
        "digest skips excluded sections",
        checker.check_text(excluded_then_bad, "digest"),
        ["12: 項目の行頭に [タグ] が無い"],
    )

    bad_order = """## OpenAI

- [新機能+廃止] 優先順が逆
- [新機能+料金+仕様] 副が二つ
"""
    check(
        "digest tag order",
        checker.check_text(bad_order, "digest"),
        [
            "3: [新機能+廃止] 副は主より優先順が下",
            "4: [新機能+料金+仕様] 主は1語、副は1語まで",
        ],
    )


def test_daily_sections() -> None:
    ok = """## 今日のハイライト

### 1. [新機能] GitHub が GA にした — 選べるようになる
### 2. [料金+破壊的変更] 従量の既定オン — 料金を主にする

**要点**: 本文はハイライト行ではない。

## カテゴリ別まとめ

### GitHub

- [新機能] **Gemini 4 Hydrogen** — Copilot で GA
- **無料枠の限定**（ハイライト1参照）
- **別の参照**（ハイライト参照・1）
- https://example.com/a

## 取得状況

- タグが無くてもこの節は見ない
"""
    check("daily ok", checker.check_text(ok, "daily"), [])

    bad = """## 今日のハイライト

### 1. [新機能] ハイフン区切り - 含意
### 2. [新機能+廃止] 逆順 — 含意

## カテゴリ別まとめ

- [新機能] 太字が無い — 本文
- タグが無い行
"""
    check(
        "daily format and order",
        checker.check_text(bad, "daily"),
        [
            "3: ハイライトは「### N. [タグ] タイトル — 含意」",
            "4: [新機能+廃止] 副は主より優先順が下",
            "8: カテゴリ行は「- [タグ] **見出し** — 本文」",
            "9: カテゴリ行は「- [タグ] **見出し** — 本文」",
        ],
    )


def test_files_and_cli() -> None:
    check("date in name", checker.published_date(Path("ai-news-2026-11-15.md")), date(2026, 11, 15))
    check("no date", checker.published_date(Path("readme.md")), None)
    check("daily kind", checker.kind_of(Path("ai-news-daily-2026-11-15.md")), "daily")
    check("digest kind", checker.kind_of(Path("ai-news-2026-11-15.md")), "digest")

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        old = root / "ai-news-2026-09-23.md"
        old.write_text("- タグが無い\n", encoding="utf-8")
        check("before rollout", checker.check_file(old), [])

        current = root / "ai-news-2026-09-24.md"
        current.write_text("## OpenAI\n\n- タグが無い行\n", encoding="utf-8")
        check(
            "rollout day",
            checker.check_file(current),
            ["3: 項目の行頭に [タグ] が無い"],
        )
        good = root / "ai-news-2026-11-15.md"
        good.write_text("## OpenAI\n\n- [新機能] 追加した\n- （ハイライト1参照）\n", encoding="utf-8")
        check("cli good file", main_code([str(good)]), 0)
        check("cli bad file", main_code([str(current)]), 1)
        missing = root / "ai-news-2026-11-16.md"
        check("cli missing file", main_code([str(missing)]), 1)

    check("cli needs a file", main_code([]), 1)


def test_hook_ignores_non_commits() -> None:
    check("hook empty", hook_code(""), 0)
    check("hook not json", hook_code("not-json"), 0)
    check("hook other command", hook_code('{"tool_input":{"command":"ls"}}'), 0)
    check("hook git status", hook_code('{"tool_input":{"command":"git status"}}'), 0)
    check("hook command not string", hook_code('{"tool_input":{"command":["git","commit"]}}'), 0)


def main() -> int:
    test_skip_bullet()
    test_tag_error()
    test_digest_sections()
    test_daily_sections()
    test_files_and_cli()
    test_hook_ignores_non_commits()
    if failures:
        print(f"{len(failures)} 件失敗", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 1
    print("合格")
    return 0


if __name__ == "__main__":
    sys.exit(main())
