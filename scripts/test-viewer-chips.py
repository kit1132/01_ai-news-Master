#!/usr/bin/env python3
"""見出し件数チップ検査の単体テスト。

折りたたみ見出しの件数を中黒の文字へ戻すと、スマホのビューアが文字の列に戻る。
index.html を触る commit / push だけを止める分岐も、手元の git 状態に依存せず固定する。
"""

from __future__ import annotations

import importlib.util
import io
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check-viewer-chips.py"

MISSING_TAG = ".tag の規則が無い"
TAG_WRAPS = ".tag が語の途中で折り返せる"
TAG_SHRINKS = ".tag が縮んで欠ける"
NO_CHIP_ROW = "見出しの件数をチップの行にしていない"
NO_CHIPS = "折りたたみ見出しの件数をチップにしていない"
NAKAGURO = "件数を中黒でつないだ文字に戻している"

PUSH_BASE = ["diff", "--name-only", "origin/main...HEAD"]
PUSH_FALLBACK = ["diff", "--name-only", "HEAD~1", "HEAD"]
STATUS = ["status", "--porcelain"]
CACHED = ["diff", "--cached", "--name-only"]


def load_checker():
    spec = importlib.util.spec_from_file_location("check_viewer_chips", SCRIPT)
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


def passing_document() -> str:
    return (
        ".tag {\n"
        "  white-space: nowrap;\n"
        "  flex: none;\n"
        "}\n"
        ".sub-tags {\n"
        "  display: inline-flex;\n"
        "}\n"
        "makeChip(name)\n"
        "makeChip(name)\n"
    )


def hook_output(raw: str) -> tuple[int, str, str]:
    stdout, stderr, stdin = sys.stdout, sys.stderr, sys.stdin
    out, err = io.StringIO(), io.StringIO()
    sys.stdout, sys.stderr = out, err
    sys.stdin = io.StringIO(raw)
    try:
        code = checker.run_hook()
    finally:
        sys.stdout, sys.stderr, sys.stdin = stdout, stderr, stdin
    return code, out.getvalue(), err.getvalue()


def main_output() -> tuple[int, str, str]:
    stdout, stderr, argv = sys.stdout, sys.stderr, sys.argv
    out, err = io.StringIO(), io.StringIO()
    sys.stdout, sys.stderr = out, err
    sys.argv = ["check-viewer-chips.py"]
    try:
        code = checker.main()
    finally:
        sys.stdout, sys.stderr, sys.argv = stdout, stderr, argv
    return code, out.getvalue(), err.getvalue()


def run_git(mapping: dict[tuple[str, ...], list[str]], command: str):
    calls: list[list[str]] = []
    original = checker.git_lines

    def fake(args):
        calls.append(list(args))
        key = tuple(args)
        if key not in mapping:
            return ["index.html"]
        return list(mapping[key])

    checker.git_lines = fake
    try:
        return checker.touches_viewer(command), calls
    finally:
        checker.git_lines = original


def payload(command=None, cmd=None) -> str:
    tool: dict = {}
    if command is not None:
        tool["command"] = command
    if cmd is not None:
        tool["cmd"] = cmd
    return json.dumps({"tool_input": tool})


def test_problems() -> None:
    check("passing snippet", checker.problems(passing_document()), [])

    no_tag = (
        ".sub-tags {\n"
        "  display: inline-flex;\n"
        "}\n"
        "makeChip(name)\n"
        "makeChip(name)\n"
    )
    check("missing .tag rule", checker.problems(no_tag), [MISSING_TAG])

    wraps = passing_document().replace("  white-space: nowrap;\n", "")
    check("tag can wrap mid-word", checker.problems(wraps), [TAG_WRAPS])

    shrinks = passing_document().replace("  flex: none;\n", "")
    check("tag can shrink away", checker.problems(shrinks), [TAG_SHRINKS])

    no_sub = (
        ".tag {\n"
        "  white-space: nowrap;\n"
        "  flex: none;\n"
        "}\n"
        "makeChip(name)\n"
        "makeChip(name)\n"
    )
    check("missing .sub-tags", checker.problems(no_sub), [NO_CHIP_ROW])

    sub_without = passing_document().replace("  display: inline-flex;\n", "  display: flex;\n")
    check(".sub-tags without inline-flex", checker.problems(sub_without), [NO_CHIP_ROW])

    one_chip = passing_document().replace("makeChip(name)\n", "", 1)
    check("only one makeChip(name)", checker.problems(one_chip), [NO_CHIPS])

    single = passing_document() + "names.join('・')\n"
    double = passing_document() + 'names.join("・")\n'
    check("join single-quoted nakaguro", checker.problems(single), [NAKAGURO])
    check("join double-quoted nakaguro", checker.problems(double), [NAKAGURO])

    later_rule = (
        ".tag {\n"
        "  color: red;\n"
        "}\n"
        ".tag {\n"
        "  white-space: nowrap;\n"
        "  flex: none;\n"
        "}\n"
        ".sub-tags {\n"
        "  display: inline-flex;\n"
        "}\n"
        "makeChip(name)\n"
        "makeChip(name)\n"
    )
    check(
        "properties outside the first .tag block",
        checker.problems(later_rule),
        [TAG_WRAPS, TAG_SHRINKS],
    )

    check(
        "empty document",
        checker.problems(""),
        [MISSING_TAG, NO_CHIP_ROW, NO_CHIPS],
    )

    found = checker.problems(checker.VIEWER.read_text(encoding="utf-8"))
    check("checked-in index.html", found, [])


def test_touches_viewer() -> None:
    for name, want in (("index.html", True), ("viewer/index.html", True), ("README.md", False)):
        got, calls = run_git({tuple(PUSH_BASE): [name]}, "git push")
        check(f"push {name}", got, want)
        check(f"push {name} reads base diff", calls, [PUSH_BASE])

    got, calls = run_git(
        {tuple(PUSH_BASE): [], tuple(PUSH_FALLBACK): ["index.html"]},
        "git push",
    )
    check("push falls back to HEAD~1", got, True)
    check("push falls back to HEAD~1 calls", calls, [PUSH_BASE, PUSH_FALLBACK])

    got, calls = run_git(
        {tuple(PUSH_BASE): [], tuple(PUSH_FALLBACK): ["README.md"]},
        "git push",
    )
    check("push fallback miss", got, False)
    check("push fallback miss calls", calls, [PUSH_BASE, PUSH_FALLBACK])

    got, calls = run_git(
        {tuple(PUSH_BASE): ["README.md"], tuple(PUSH_FALLBACK): ["index.html"]},
        "git push",
    )
    check("push does not fall back", got, False)
    check("push does not fall back calls", calls, [PUSH_BASE])

    porcelain = (
        ("R  old.html -> index.html", True, "rename onto index.html"),
        ("R  index.html -> viewer.html", False, "rename away from index.html"),
        (" M docs/index.html", True, "docs/index.html"),
    )
    for command in ("git commit -a", "git commit --all"):
        for line, want, label in porcelain:
            cached = ["README.md"] if want else ["index.html"]
            got, calls = run_git({tuple(STATUS): [line], tuple(CACHED): cached}, command)
            check(f"{command} {label}", got, want)
            check(f"{command} {label} reads status", calls, [STATUS])

    for name, want in (("index.html", True), ("viewer/index.html", True), ("README.md", False)):
        status = ["README.md"] if want else [" M index.html"]
        got, calls = run_git({tuple(CACHED): [name], tuple(STATUS): status}, "git commit -m msg")
        check(f"commit -m {name}", got, want)
        check(f"commit -m {name} reads cached", calls, [CACHED])


def test_hook() -> None:
    calls: list[list[str]] = []
    original_git = checker.git_lines

    def fake_git(args):
        calls.append(list(args))
        return ["index.html"]

    checker.git_lines = fake_git
    try:
        samples = [
            ("hook empty", ""),
            ("hook invalid json", "{"),
            ("hook command not string", payload(command=["git", "commit"])),
            ("hook ls", payload(command="ls")),
            ("hook git status", payload(command="git status")),
        ]
        for name, raw in samples:
            code, out, err = hook_output(raw)
            check(name, code, 0)
            check(f"{name} silent", (out, err), ("", ""))
        check("hook ignored commands do not call git", calls, [])
    finally:
        checker.git_lines = original_git

    original_touches = checker.touches_viewer
    original_viewer = checker.VIEWER
    seen: list[str] = []

    def untouched(command: str) -> bool:
        seen.append(command)
        return False

    try:
        with tempfile.TemporaryDirectory() as tmp:
            broken = Path(tmp) / "index.html"
            broken.write_text("", encoding="utf-8")
            checker.VIEWER = broken
            checker.touches_viewer = untouched
            for name, raw in (
                ("hook commit when viewer untouched", payload(command="git commit -m msg")),
                ("hook push when viewer untouched", payload(command="git push")),
                ("hook cmd commit", payload(cmd="git commit -m msg")),
                ("hook cmd push", payload(cmd="git push")),
            ):
                code, out, err = hook_output(raw)
                check(name, code, 0)
                check(f"{name} silent", (out, err), ("", ""))
        check(
            "hook cmd is accepted like command",
            seen,
            ["git commit -m msg", "git push", "git commit -m msg", "git push"],
        )
    finally:
        checker.touches_viewer = original_touches
        checker.VIEWER = original_viewer

    checker.touches_viewer = lambda command: True
    try:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "index.html"
            path.write_text(passing_document().replace("  white-space: nowrap;\n", ""), encoding="utf-8")
            checker.VIEWER = path
            code, out, err = hook_output(payload(command="git commit -m msg"))
            check("hook broken viewer", code, 1)
            check("hook broken viewer error", TAG_WRAPS in err, True)
            code, out, err = hook_output(payload(cmd="git push"))
            check("hook cmd broken viewer", code, 1)
            check("hook cmd broken viewer error", TAG_WRAPS in err, True)

            path.write_text(passing_document(), encoding="utf-8")
            code, out, err = hook_output(payload(command="git push"))
            check("hook passing viewer", code, 0)
            check("hook passing viewer says ok", out.endswith(": 合格\n") and err == "", True)
            code, out, err = hook_output(payload(cmd="git commit -m msg"))
            check("hook cmd passing viewer", code, 0)
            check("hook cmd passing viewer says ok", out.endswith(": 合格\n") and err == "", True)
    finally:
        checker.touches_viewer = original_touches
        checker.VIEWER = original_viewer


def test_main() -> None:
    code, out, err = main_output()
    check("main local viewer", code, 0)
    check("main local viewer says ok", out.endswith(": 合格\n") and err == "", True)


def main() -> int:
    test_problems()
    test_touches_viewer()
    test_hook()
    test_main()
    if failures:
        print(f"{len(failures)} 件失敗", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 1
    print("合格")
    return 0


if __name__ == "__main__":
    sys.exit(main())
