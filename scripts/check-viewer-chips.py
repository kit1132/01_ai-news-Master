#!/usr/bin/env python3
"""折りたたみ見出しの件数をチップのまま保つ。文字の列に戻したら不合格。

公開ページ（GitHub Pages）が同じ契約を欠くときも不合格にする。
スマホはそのページを読む。手元の index.html だけ直しても、そこへ届かない。
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

PAGES = "https://kit1132.github.io/01_ai-news-Master/index.html"
ROOT = Path(__file__).resolve().parents[1]
VIEWER = ROOT / "index.html"


def problems(text: str) -> list[str]:
    errors = []
    tag = re.search(r"\.tag\s*\{([^}]+)\}", text)
    if tag is None:
        errors.append(".tag の規則が無い")
    else:
        body = tag.group(1)
        if "white-space: nowrap" not in body:
            errors.append(".tag が語の途中で折り返せる")
        if "flex: none" not in body:
            errors.append(".tag が縮んで欠ける")
    sub = re.search(r"\.sub-tags\s*\{([^}]+)\}", text)
    if sub is None or "inline-flex" not in sub.group(1):
        errors.append("見出しの件数をチップの行にしていない")
    if text.count("makeChip(name)") < 2:
        errors.append("折りたたみ見出しの件数をチップにしていない")
    if "join('・')" in text or 'join("・")' in text:
        errors.append("件数を中黒でつないだ文字に戻している")
    return errors


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"Cache-Control": "no-cache"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def git_lines(args: list[str]) -> list[str]:
    try:
        out = subprocess.check_output(["git", *args], text=True, stderr=subprocess.DEVNULL)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    return [line for line in out.splitlines() if line.strip()]


def touches_viewer(command: str) -> bool:
    if re.search(r"\bgit\s+push\b", command):
        names = git_lines(["diff", "--name-only", "origin/main...HEAD"])
        if not names:
            names = git_lines(["diff", "--name-only", "HEAD~1", "HEAD"])
    elif re.search(r"(^|\s)(-a|--all)(\s|$)", command):
        names = []
        for line in git_lines(["status", "--porcelain"]):
            path = line[3:].strip()
            if " -> " in path:
                path = path.split(" -> ", 1)[1]
            names.append(path)
    else:
        names = git_lines(["diff", "--cached", "--name-only"])
    return any(Path(name).name == "index.html" or name.endswith("/index.html") for name in names)


def run_hook() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return 0
    tool_input = payload.get("tool_input") or {}
    command = tool_input.get("command") or tool_input.get("cmd") or ""
    if not isinstance(command, str) or not re.search(r"\bgit\s+(commit|push)\b", command):
        return 0
    if not touches_viewer(command):
        return 0
    return report(VIEWER.read_text(encoding="utf-8"), "手元のビューア")


def report(text: str, label: str) -> int:
    found = problems(text)
    if found:
        print(f"{label}: チップの検査が不合格", file=sys.stderr)
        for error in found:
            print(f"  {error}", file=sys.stderr)
        return 1
    print(f"{label}: 合格")
    return 0


def main() -> int:
    published = "--published" in sys.argv
    if "--hook" in sys.argv:
        return run_hook()
    if not VIEWER.is_file():
        print(f"ファイルが無い: {VIEWER}", file=sys.stderr)
        return 1
    code = report(VIEWER.read_text(encoding="utf-8"), str(VIEWER))
    if not published:
        return code
    url = PAGES
    if "--published" in sys.argv:
        index = sys.argv.index("--published")
        if index + 1 < len(sys.argv) and not sys.argv[index + 1].startswith("--"):
            url = sys.argv[index + 1]
    try:
        remote = fetch(url)
    except Exception as error:  # noqa: BLE001 — 公開面の取得失敗は不合格として通知する
        print(f"公開ページを読めない: {url}: {error}", file=sys.stderr)
        return 1
    return code or report(remote, url)


if __name__ == "__main__":
    sys.exit(main())
