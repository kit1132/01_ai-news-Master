#!/usr/bin/env python3
"""digests/**/*.md を走査して files.json を生成・検証する。

ビューア(index.html)は files.json だけを見てダイジェスト一覧を組み立てるため、
新しい digest を追加したら files.json を必ず同期させる必要がある。手動追記に頼ると
「ファイルは push したが files.json に足し忘れて Web に出ない」取り残しが起きる
(CLAUDE.md「⚠️ ブランチ運用」の事故と同種)。このスクリプトで機械生成することで
その取り残しを構造的に防ぐ。

使い方:
  python3 scripts/generate_files_json.py            # files.json を再生成する
  python3 scripts/generate_files_json.py --check     # ディスクと一致するか検証(CI用・不一致なら exit 1)
  python3 scripts/generate_files_json.py --report-gaps  # 日付の欠落を警告として一覧する(常に exit 0)
"""
from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIGESTS_DIR = ROOT / "digests"
FILES_JSON = ROOT / "files.json"

# index.html の RE_DATE と同じ判定(ファイル名末尾の YYYY-MM-DD.md)
RE_DATE = re.compile(r"(\d{4})-(\d{2})-(\d{2})\.md$")


def collect_entries() -> list[str]:
    """digests 配下の *.md をルート相対 POSIX パスで集め、日付降順で返す。"""
    entries: list[str] = []
    undated: list[str] = []
    for path in DIGESTS_DIR.rglob("*.md"):
        rel = path.relative_to(ROOT).as_posix()
        if RE_DATE.search(rel):
            entries.append(rel)
        else:
            undated.append(rel)

    if undated:
        # 捨てずに末尾へ回す。捨てると気づかないまま一覧から消えるため。
        for rel in undated:
            print(f"warning: 日付を判定できないファイル(末尾に配置): {rel}", file=sys.stderr)

    def sort_key(rel: str) -> str:
        m = RE_DATE.search(rel)
        return m.group(0) if m else ""

    entries.sort(key=sort_key, reverse=True)
    undated.sort()
    return entries + undated


def render(entries: list[str]) -> str:
    """既存 files.json と同一のフォーマット(2スペースインデント + 末尾改行)で描画する。"""
    return json.dumps(entries, ensure_ascii=False, indent=2) + "\n"


def dated(entries: list[str]) -> list[datetime.date]:
    out: list[datetime.date] = []
    for rel in entries:
        m = RE_DATE.search(rel)
        if m:
            out.append(datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3))))
    return sorted(out)


def report_gaps(entries: list[str], recent_days: int = 14) -> None:
    """日付の連続性を確認し、欠落を警告として表示する(fail はしない)。

    欠落の根本原因(スケジュール実行が動いていない等)はリポジトリ外の設定なので
    コードでは直せないが、可視化して気づけるようにするのがこのレポートの目的。
    """
    dates = dated(entries)
    if not dates:
        print("digest が1件も無いため欠落チェックをスキップします。")
        return

    first, last = dates[0], dates[-1]
    have = set(dates)
    gaps = []
    d = first
    while d <= last:
        if d not in have:
            gaps.append(d)
        d += datetime.timedelta(days=1)

    print(f"digest 期間: {first.isoformat()} 〜 {last.isoformat()} / 実在 {len(dates)}日 / 欠落 {len(gaps)}日")
    if not gaps:
        print("欠落はありません。")
        return

    print("欠落日(曜日): " + ", ".join(f"{g.isoformat()}({'月火水木金土日'[g.weekday()]})" for g in gaps))

    today = datetime.date.today()
    recent = [g for g in gaps if (today - g).days <= recent_days]
    if recent:
        joined = ", ".join(g.isoformat() for g in recent)
        # GitHub Actions のアノテーションとしても拾えるよう ::warning:: を付ける
        print(f"::warning::直近 {recent_days} 日以内に欠落があります: {joined}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="ディスクと一致するか検証する(不一致なら exit 1)")
    ap.add_argument("--report-gaps", action="store_true", help="日付の欠落を警告として一覧する(exit 0)")
    args = ap.parse_args()

    if not DIGESTS_DIR.is_dir():
        print(f"error: digests ディレクトリが見つかりません: {DIGESTS_DIR}", file=sys.stderr)
        return 1

    entries = collect_entries()

    if args.report_gaps:
        report_gaps(entries)
        return 0

    content = render(entries)

    if args.check:
        current = FILES_JSON.read_text(encoding="utf-8") if FILES_JSON.exists() else ""
        if current == content:
            print(f"files.json は最新です({len(entries)} 件)。")
            return 0
        print(
            "error: files.json がディスク上の digest と一致しません。\n"
            "       `python3 scripts/generate_files_json.py` で再生成してコミットしてください。",
            file=sys.stderr,
        )
        cur_set = set(json.loads(current)) if current.strip() else set()
        new_set = set(entries)
        for rel in sorted(new_set - cur_set):
            print(f"  + 未記載(追加が必要): {rel}", file=sys.stderr)
        for rel in sorted(cur_set - new_set):
            print(f"  - 実在しない(削除が必要): {rel}", file=sys.stderr)
        if cur_set == new_set:
            print("  (件数は同じですが並び順が異なります)", file=sys.stderr)
        return 1

    FILES_JSON.write_text(content, encoding="utf-8")
    print(f"files.json を再生成しました({len(entries)} 件)。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
