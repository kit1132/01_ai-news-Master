#!/usr/bin/env python3
"""更新タグ検査の回帰を固定する。

2026-10-19 の修正は本番スクリプトだけで、「（ハイライトN参照）」を
部分一致「ハイライト参照」に戻すと規約どおりの行が不合格になる。
料金+破壊的変更の例外や、日次とダイジェストで行の形が違うことも
commit フック（終了コード 2）が止める対象なので、ここで固定する。
"""

from __future__ import annotations

import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check-update-tags.py"

import importlib.util

spec = importlib.util.spec_from_file_location("check_update_tags", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


FAILURES: list[str] = []


def expect(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"ok   {name}")
        return
    FAILURES.append(name)
    print(f"FAIL {name}" + (f": {detail}" if detail else ""), file=sys.stderr)


def run_hook(raw: str) -> int:
    old = sys.stdin
    sys.stdin = io.StringIO(raw)
    try:
        return mod.run_hook()
    finally:
        sys.stdin = old


def quiet(fn):
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return fn()


def git(repo: Path, *args: str) -> None:
    subprocess.check_call(["git", *args], cwd=repo, stdout=subprocess.DEVNULL)


def init_repo(repo: Path) -> None:
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "test@example.com")
    git(repo, "config", "user.name", "test")


def hook_in(repo: Path, command: str) -> int:
    old = os.getcwd()
    os.chdir(repo)
    try:
        payload = json.dumps({"tool_input": {"command": command}})
        return run_hook(payload)
    finally:
        os.chdir(old)


def test_tag_order() -> None:
    expect("単一タグは合格", mod.tag_error("料金") is None)
    expect("優先順どおりの副タグは合格", mod.tag_error("新機能+仕様") is None)
    expect(
        "破壊的変更より下の料金を主にした例外は合格",
        mod.tag_error("料金+破壊的変更") is None,
    )
    expect(
        "例外でない逆順は副タグの優先順で不合格",
        mod.tag_error("新機能+料金") == "副は主より優先順が下",
        repr(mod.tag_error("新機能+料金")),
    )
    expect(
        "3語は主1語・副1語で不合格",
        mod.tag_error("料金+新機能+動向") == "主は1語、副は1語まで",
        repr(mod.tag_error("料金+新機能+動向")),
    )
    expect(
        "11語以外は不合格",
        mod.tag_error("不明") == "11語以外",
        repr(mod.tag_error("不明")),
    )


def test_highlight_reference_lines() -> None:
    text = "\n".join(
        [
            "## 開発ツール",
            "- [不明] （ハイライト1参照）",
            "- [不明] （ハイライト１参照）",
            "- [不明] ハイライト参照",
            "- [不明] （ハイライト 12 参照）",
            "- [不明] ハイライトの話",
        ]
    )
    errors = mod.check_text(text, "digest")
    expect(
        "番号付き・全角・空白入りのハイライト参照行は検査しない",
        errors == ["6: [不明] 11語以外"],
        repr(errors),
    )


def test_daily_and_digest_shapes() -> None:
    highlight = "\n".join(
        [
            "## 今日のハイライト",
            "### 1. [料金+破壊的変更] タイトル — 含意",
            "### 2. タグなし — 含意",
            "### 3. [新機能+料金] タイトル — 含意",
        ]
    )
    errors = mod.check_text(highlight, "digest")
    expect(
        "ハイライトの形と逆順タグだけを不合格にする",
        errors
        == [
            "3: ハイライトは「### N. [タグ] タイトル — 含意」",
            "4: [新機能+料金] 副は主より優先順が下",
        ],
        repr(errors),
    )

    category = "\n".join(
        [
            "## カテゴリ別まとめ",
            "- [新機能] 見出し — 本文",
        ]
    )
    expect(
        "ダイジェストは [タグ] の行を認める",
        mod.check_text(category, "digest") == [],
        repr(mod.check_text(category, "digest")),
    )
    daily_errors = mod.check_text(category, "daily")
    expect(
        "日次のカテゴリ行は太字見出しが要る",
        daily_errors == ["2: カテゴリ行は「- [タグ] **見出し** — 本文」"],
        repr(daily_errors),
    )

    other = "\n".join(["## 開発ツール", "- タグなし"])
    expect("日次はハイライトとカテゴリ以外を見ない", mod.check_text(other, "daily") == [])
    expect("ダイジェストはそれ以外の節も見る", mod.check_text(other, "digest") != [])

    skipped = "\n".join(
        [
            "## 今後の期限（記録済み）",
            "- タグなし",
            "## 採録を見送った案件",
            "- タグなし",
            "## 改善メモ",
            "- タグなし",
            "## 開発ツール",
            "- https://example.com/a",
            "- 直近の期限: 11月16日",
            "- [観測] 見出し — 本文",
        ]
    )
    expect(
        "期限・見送り・改善メモと URL・直近の期限は不合格にしない",
        mod.check_text(skipped, "digest") == [],
        repr(mod.check_text(skipped, "digest")),
    )


def test_file_and_report(tmp: Path) -> None:
    old = tmp / "ai-news-2026-09-23.md"
    old.write_text("## 開発ツール\n- タグなし\n", encoding="utf-8")
    expect("ロールアウト前は検査しない", mod.check_file(old) == [])

    missing = tmp / "ai-news-2026-11-13.md"
    missing_errors = mod.check_file(missing)
    expect(
        "日付以降でファイルが無いときは不合格",
        missing_errors == [f"ファイルが無い: {missing}"],
        repr(missing_errors),
    )

    good = tmp / "ai-news-daily-2026-11-13.md"
    good.write_text(
        "\n".join(
            [
                "## 今日のハイライト",
                "### 1. [新機能] タイトル — 含意",
                "## カテゴリ別まとめ",
                "- [新機能] **見出し** — 本文",
                "- （ハイライト1参照）",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    expect("合格ファイルの report は 0", mod.report([good]) == 0)
    expect("引数なしは 1", quiet(lambda: mod.main([])) == 1)
    expect("ファイル指定の main は 0", mod.main([str(good)]) == 0)

    bad = tmp / "ai-news-2026-11-13.md"
    bad.write_text("## 開発ツール\n- タグなし\n", encoding="utf-8")
    expect("不合格ファイルの report は 1", quiet(lambda: mod.report([bad])) == 1)
    expect(
        "対象日が無い report は 0",
        mod.report([tmp / "notes.md"]) == 0,
    )


def test_hook_early_exit() -> None:
    expect("空の標準入力は通す", run_hook("") == 0)
    expect("JSON でない標準入力は通す", run_hook("not-json") == 0)
    expect(
        "commit でも push でもないコマンドは通す",
        run_hook('{"tool_input":{"command":"git status"}}') == 0,
    )
    expect(
        "コマンドが文字列でないときは通す",
        run_hook('{"tool_input":{"command":1}}') == 0,
    )


def test_hook_blocks_commit() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        init_repo(repo)
        digest = repo / "digests" / "ai-news-2026-11-13.md"
        digest.parent.mkdir()
        digest.write_text(
            "## 開発ツール\n- （ハイライト1参照）\n- [新機能] 見出し — 本文\n",
            encoding="utf-8",
        )
        git(repo, "add", "digests/ai-news-2026-11-13.md")
        expect(
            "参照行を含む合格ダイジェストは commit を止めない",
            hook_in(repo, "git commit -m x") == 0,
        )

        digest.write_text("## 開発ツール\n- タグなし\n", encoding="utf-8")
        git(repo, "add", "digests/ai-news-2026-11-13.md")
        expect(
            "タグなしのステージ済みダイジェストは commit を止める",
            quiet(lambda: hook_in(repo, "git commit -m x")) == 2,
        )

        digest.write_text("## 開発ツール\n- [新機能] 見出し — 本文\n", encoding="utf-8")
        git(repo, "add", "digests/ai-news-2026-11-13.md")
        git(repo, "commit", "-q", "-m", "good")
        digest.write_text("## 開発ツール\n- タグなし\n", encoding="utf-8")
        expect(
            "git commit -a は未ステージの不合格も止める",
            quiet(lambda: hook_in(repo, "git commit -a -m x")) == 2,
        )
        readme = repo / "README.md"
        readme.write_text("base\n", encoding="utf-8")
        git(repo, "add", "README.md")
        git(repo, "commit", "-q", "-m", "readme")
        digest.write_text("## 開発ツール\n- タグなし\n", encoding="utf-8")
        git(repo, "add", "digests/ai-news-2026-11-13.md")
        git(repo, "commit", "-q", "-m", "bad")
        expect(
            "push は直前コミットの不合格ダイジェストを止める",
            quiet(lambda: hook_in(repo, "git push origin main")) == 2,
        )


def main() -> int:
    test_tag_order()
    test_highlight_reference_lines()
    test_daily_and_digest_shapes()
    with tempfile.TemporaryDirectory() as tmp:
        test_file_and_report(Path(tmp))
    test_hook_early_exit()
    test_hook_blocks_commit()
    if FAILURES:
        print(f"{len(FAILURES)} 件失敗", file=sys.stderr)
        return 1
    print("合格")
    return 0


if __name__ == "__main__":
    sys.exit(main())
