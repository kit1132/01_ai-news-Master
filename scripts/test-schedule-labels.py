#!/usr/bin/env python3
"""industry の「N月N日」が日付列・今週トグルに載ることを固定する。

parseScheduleLabel が汎用の「N月…」で日を捨てると、今後の期限の本日・来週が
閉じた月トグルへ埋まり、data-near の自動オープンを外れる。
"""

from __future__ import annotations

import datetime as dt
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWER = ROOT / "index.html"

RANGE_RE = re.compile(
    r"^(\d{1,2})月(\d{1,2})\s*[〜~–—−-]\s*(\d{1,2})日(.*)$"
)
DAY_RE = re.compile(r"^(\d{1,2})月(\d{1,2})日(.*)$")
MONTH_RE = re.compile(r"^(\d{1,2})\s*月(.*)$")


def parse_jp(label: str) -> tuple[str, str]:
    """JS parseScheduleLabel の N月N日 分岐と同じ戻り（day, kind）。"""
    s = label.strip()
    m = RANGE_RE.match(s)
    if m:
        return f"{int(m.group(1))}/{int(m.group(2))}", "day"
    m = DAY_RE.match(s)
    if m:
        return f"{int(m.group(1))}/{int(m.group(2))}", "day"
    m = MONTH_RE.match(s)
    if m:
        return "", "month"
    return "", "period"


def monday_of(d: dt.date) -> dt.date:
    return d - dt.timedelta(days=d.weekday())


def week_key(day: str, digest: dt.date) -> str:
    month, dom = (int(x) for x in day.split("/"))
    parsed = dt.date(digest.year, month, dom)
    return monday_of(parsed).isoformat()


def problems() -> list[str]:
    text = VIEWER.read_text(encoding="utf-8")
    start = text.find("function parseScheduleLabel(raw)")
    if start < 0:
        return ["parseScheduleLabel が無い"]
    body = text[start : start + 4500]
    range_at = body.find(r"月(\d{1,2})\s*[〜~–—−-]\s*(\d{1,2})日")
    day_at = body.find(r"月(\d{1,2})日(.*)$")
    month_at = body.find(r"(\d{1,2})\s*月(.*)$")
    errors = []
    if range_at < 0:
        errors.append("N月N〜M日 の正規表現が無い")
    if day_at < 0:
        errors.append("N月N日 の正規表現が無い")
    if month_at < 0:
        errors.append("汎用の N月 正規表現が無い")
    if range_at >= 0 and month_at >= 0 and range_at > month_at:
        errors.append("N月N〜M日 が汎用の N月 より後にある")
    if day_at >= 0 and month_at >= 0 and day_at > month_at:
        errors.append("N月N日 が汎用の N月 より後にある")

    digest = dt.date(2026, 10, 9)
    this_mon = monday_of(digest).isoformat()
    next_mon = (monday_of(digest) + dt.timedelta(days=7)).isoformat()

    cases = [
        ("10月9日", "10/9", "day", this_mon),
        ("10月15日", "10/15", "day", next_mon),
        ("10月29〜30日", "10/29", "day", None),
        ("11月30日", "11/30", "day", None),
        ("10月", "", "month", None),
    ]
    for raw, want_day, want_kind, near in cases:
        day, kind = parse_jp(raw)
        if day != want_day or kind != want_kind:
            errors.append(f"{raw}: day={day!r} kind={kind!r} (want {want_day!r} {want_kind})")
            continue
        if near and week_key(day, digest) != near:
            errors.append(f"{raw}: 週キーが {week_key(day, digest)} (want {near})")
    return errors


def main() -> int:
    found = problems()
    if found:
        print("注目予定の日付パース検査が不合格", file=sys.stderr)
        for error in found:
            print(f"  {error}", file=sys.stderr)
        return 1
    print("合格")
    return 0


if __name__ == "__main__":
    sys.exit(main())
