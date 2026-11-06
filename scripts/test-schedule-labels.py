#!/usr/bin/env python3
"""industry の「N月N日」「YYYY年N月N日」が日付列・今週トグルに載ることを固定する。

parseScheduleLabel が汎用の「N月…」や「YYYY年N月…」で日を捨てると、
今後の期限の本日・来週が閉じた月トグルへ埋まり、data-near の自動オープンを外れる。
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
YEAR_HEAD_RE = re.compile(r"^(\d{4})年\s*(\d{1,2})月(.*)$")
YEAR_RANGE_RE = re.compile(
    r"^(\d{1,2})\s*[〜~–—−-]\s*(\d{1,2})日(.*)$"
)
YEAR_DAY_RE = re.compile(r"^(\d{1,2})日(.*)$")


def parse_jp(label: str) -> tuple[str, str]:
    """JS parseScheduleLabel の N月N日 / YYYY年N月N日 分岐と同じ戻り（day, kind）。"""
    s = label.strip()
    m = YEAR_HEAD_RE.match(s)
    if m:
        month = int(m.group(2))
        rest = m.group(3).strip()
        dm = YEAR_RANGE_RE.match(rest)
        if dm:
            return f"{month}/{int(dm.group(1))}", "day"
        dm = YEAR_DAY_RE.match(rest)
        if dm:
            return f"{month}/{int(dm.group(1))}", "day"
        return "", "month"
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
    body = text[start : start + 7000]
    range_at = body.find(r"月(\d{1,2})\s*[〜~–—−-]\s*(\d{1,2})日")
    day_at = body.find(r"月(\d{1,2})日(.*)$")
    month_at = body.find(r"(\d{1,2})\s*月(.*)$")
    year_at = body.find(r"^(\d{4})年\s*(\d{1,2})月(.*)$")
    year_day_at = body.find(r"^(\d{1,2})日(.*)$")
    errors = []
    if range_at < 0:
        errors.append("N月N〜M日 の正規表現が無い")
    if day_at < 0:
        errors.append("N月N日 の正規表現が無い")
    if month_at < 0:
        errors.append("汎用の N月 正規表現が無い")
    if year_at < 0:
        errors.append("YYYY年N月 の正規表現が無い")
    if year_day_at < 0:
        errors.append("YYYY年N月 のあとに N日 を抜く正規表現が無い")
    if range_at >= 0 and month_at >= 0 and range_at > month_at:
        errors.append("N月N〜M日 が汎用の N月 より後にある")
    if day_at >= 0 and month_at >= 0 and day_at > month_at:
        errors.append("N月N日 が汎用の N月 より後にある")
    if year_at >= 0 and year_day_at >= 0 and year_day_at < year_at:
        errors.append("YYYY年N月 の N日 抜きが YYYY年N月 より前にある")

    digest = dt.date(2026, 10, 9)
    this_mon = monday_of(digest).isoformat()
    next_mon = (monday_of(digest) + dt.timedelta(days=7)).isoformat()

    cases = [
        ("10月9日", "10/9", "day", this_mon),
        ("10月15日", "10/15", "day", next_mon),
        ("10月29〜30日", "10/29", "day", None),
        ("11月30日", "11/30", "day", None),
        ("10月", "", "month", None),
        ("2027年1月14日", "1/14", "day", None),
        ("2027年1月30日", "1/30", "day", None),
        ("2027年2月1日", "2/1", "day", None),
        ("2027年1月14〜16日", "1/14", "day", None),
        ("2027年1月", "", "month", None),
        ("2027年1月中旬〜下旬", "", "month", None),
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
