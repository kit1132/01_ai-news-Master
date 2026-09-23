#!/usr/bin/env python3
"""更新タグの機械検査。2026-09-24 以降の日次・分野ダイジェストだけを見る。

終了コード 0: 合格、または検査対象が無い。
終了コード 1: 不合格。
終了コード 2: --hook で git commit / git push を止めるとき。
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROLLOUT = date(2026, 9, 24)
ORDER = [
    "廃止",
    "破壊的変更",
    "セキュリティ",
    "料金",
    "新機能",
    "仕様",
    "予定",
    "動向",
    "版更新",
    "据え置き",
    "観測",
]
# 従量の既定オンは、優先順では破壊的変更が上でも主を料金にする。
ALLOWED_INVERSION = {("料金", "破壊的変更")}
EXCLUDE_H2 = (
    "注目スケジュール",
    "今後の期限",
    "次の節目",
    "直近の注目予定",
    "改善メモ",
    "採録を見送った",
    "取得状況",
)
HL_RE = re.compile(r"^### (\d+)\. \[([^\]]+)\] .+ — .+")
DAILY_CAT_RE = re.compile(r"^- \[([^\]]+)\] \*\*[^*]+\*\* — ")
DIGEST_CAT_RE = re.compile(r"^- \[([^\]]+)\] ")
URL_ONLY_RE = re.compile(r"^- https?://\S+\s*$")


def published_date(path: Path) -> date | None:
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", path.name)
    if not match:
        return None
    return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))


def is_news_file(path: Path) -> bool:
    name = path.name
    if not name.endswith(".md"):
        return False
    return name.startswith("ai-news-daily-") or name.startswith("ai-news-")


def kind_of(path: Path) -> str:
    return "daily" if path.name.startswith("ai-news-daily-") else "digest"


def tag_error(token: str) -> str | None:
    parts = token.split("+")
    if len(parts) not in (1, 2):
        return "主は1語、副は1語まで"
    if any(part not in ORDER for part in parts):
        return "11語以外"
    if len(parts) == 2:
        primary, secondary = parts
        if (primary, secondary) in ALLOWED_INVERSION:
            return None
        if ORDER.index(primary) >= ORDER.index(secondary):
            return "副は主より優先順が下"
    return None


def excluded_h2(title: str) -> bool:
    head = title.strip()
    return any(head.startswith(prefix) for prefix in EXCLUDE_H2)


def section_spans(lines: list[str]) -> list[tuple[str, int, int]]:
    heads = [i for i, line in enumerate(lines) if line.startswith("## ")]
    spans = []
    for n, start in enumerate(heads):
        end = heads[n + 1] if n + 1 < len(heads) else len(lines)
        title = lines[start][3:].strip()
        spans.append((title, start + 1, end))
    return spans


def skip_bullet(line: str) -> bool:
    if URL_ONLY_RE.match(line):
        return True
    if "ハイライト参照" in line:
        return True
    if line.startswith("- 直近の期限"):
        return True
    return False


def check_text(text: str, kind: str) -> list[str]:
    lines = text.splitlines()
    errors = []
    for title, start, end in section_spans(lines):
        if excluded_h2(title):
            continue
        highlight = title.startswith("今日のハイライト")
        category = title.startswith("カテゴリ別まとめ")
        if kind == "daily" and not highlight and not category:
            continue
        for index in range(start, end):
            line = lines[index]
            number = index + 1
            if highlight:
                if not line.startswith("### "):
                    continue
                match = HL_RE.match(line)
                if not match:
                    errors.append(f"{number}: ハイライトは「### N. [タグ] タイトル — 含意」")
                    continue
                reason = tag_error(match.group(2))
                if reason:
                    errors.append(f"{number}: [{match.group(2)}] {reason}")
                continue
            if not line.startswith("- "):
                continue
            if skip_bullet(line):
                continue
            if kind == "daily":
                match = DAILY_CAT_RE.match(line)
                if not match:
                    errors.append(f"{number}: カテゴリ行は「- [タグ] **見出し** — 本文」")
                    continue
                token = match.group(1)
            else:
                match = DIGEST_CAT_RE.match(line)
                if not match:
                    errors.append(f"{number}: 項目の行頭に [タグ] が無い")
                    continue
                token = match.group(1)
            reason = tag_error(token)
            if reason:
                errors.append(f"{number}: [{token}] {reason}")
    return errors


def check_file(path: Path) -> list[str]:
    published = published_date(path)
    if published is None or published < ROLLOUT:
        return []
    if not path.is_file():
        return [f"ファイルが無い: {path}"]
    return check_text(path.read_text(encoding="utf-8"), kind_of(path))


def git_lines(args: list[str]) -> list[str]:
    try:
        out = subprocess.check_output(["git", *args], text=True, stderr=subprocess.DEVNULL)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    return [line for line in out.splitlines() if line.strip()]


def news_paths(names: list[str]) -> list[Path]:
    paths = []
    for name in names:
        path = Path(name)
        if is_news_file(path):
            paths.append(path)
    return paths


def hook_targets(command: str) -> list[Path]:
    if re.search(r"\bgit\s+push\b", command):
        names = git_lines(["diff", "--name-only", "origin/main...HEAD"])
        if not names:
            names = git_lines(["diff", "--name-only", "HEAD~1", "HEAD"])
        return news_paths(names)
    if re.search(r"(^|\s)(-a|--all)(\s|$)", command):
        names = []
        for line in git_lines(["status", "--porcelain"]):
            path = line[3:].strip()
            if " -> " in path:
                path = path.split(" -> ", 1)[1]
            names.append(path)
        return news_paths(names)
    return news_paths(git_lines(["diff", "--cached", "--name-only"]))


def report(paths: list[Path]) -> int:
    failed = False
    checked = 0
    for path in paths:
        published = published_date(path)
        if published is None or published < ROLLOUT:
            continue
        checked += 1
        errors = check_file(path)
        if errors:
            failed = True
            print(f"{path}: 更新タグの検査が不合格", file=sys.stderr)
            for error in errors:
                print(f"  {error}", file=sys.stderr)
        else:
            print(f"{path}: 合格")
    if checked == 0:
        print("検査対象の日次・ダイジェストは無い")
    return 1 if failed else 0


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
    if not isinstance(command, str):
        return 0
    if not re.search(r"\bgit\s+(commit|push)\b", command):
        return 0
    code = report(hook_targets(command))
    if code != 0:
        print("不一致のままコミット・push しない。対象行を直してからやり直す。", file=sys.stderr)
        return 2
    return 0


def ci_targets(since: str) -> list[Path]:
    if since and set(since) != {"0"}:
        names = git_lines(["diff", "--name-only", since, "HEAD"])
    else:
        names = git_lines(["diff", "--name-only", "HEAD~1", "HEAD"])
    return news_paths(names)


def main(argv: list[str]) -> int:
    if "--hook" in argv:
        return run_hook()
    if "--since" in argv:
        index = argv.index("--since")
        since = argv[index + 1] if index + 1 < len(argv) else ""
        return report(ci_targets(since))
    args = [arg for arg in argv if not arg.startswith("--")]
    if not args:
        print("ファイルを指定する", file=sys.stderr)
        return 1
    return report([Path(arg) for arg in args])


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
