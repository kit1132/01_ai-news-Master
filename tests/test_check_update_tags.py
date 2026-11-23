"""更新タグ検査（scripts/check-update-tags.py）の単体テスト。

実行: python3 -m unittest tests/test_check_update_tags.py
"""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from datetime import date
from io import StringIO
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "check_update_tags",
    ROOT / "scripts" / "check-update-tags.py",
)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def errors_of(text: str, kind: str) -> list[str]:
    return mod.check_text(text, kind)


class TagErrorTest(unittest.TestCase):
    def test_single_ordered_pair_and_allowed_inversion_pass(self):
        self.assertIsNone(mod.tag_error("新機能"))
        self.assertIsNone(mod.tag_error("廃止+観測"))
        self.assertIsNone(mod.tag_error("破壊的変更+料金"))
        self.assertIsNone(mod.tag_error("料金+破壊的変更"))

    def test_secondary_must_rank_below_primary(self):
        self.assertEqual(mod.tag_error("観測+新機能"), "副は主より優先順が下")
        self.assertEqual(mod.tag_error("仕様+新機能"), "副は主より優先順が下")
        self.assertEqual(mod.tag_error("観測+観測"), "副は主より優先順が下")

    def test_unknown_or_wrong_shape(self):
        self.assertEqual(mod.tag_error("速報"), "11語以外")
        self.assertEqual(mod.tag_error("新機能+"), "11語以外")
        self.assertEqual(mod.tag_error("+新機能"), "11語以外")
        self.assertEqual(mod.tag_error("新機能+仕様+料金"), "主は1語、副は1語まで")


class DigestTextTest(unittest.TestCase):
    def test_valid_digest_ignores_references_urls_and_excluded_sections(self):
        text = "\n".join(
            [
                "# AI News — 2026-11-23",
                "",
                "## 開発ツール",
                "",
                "- [新機能] 例の機能 — 本文",
                "- [料金+破壊的変更] 既定オンの従量 — 本文",
                "- [新機能] ハイライト機能 — 本文",
                "- [速報] 本文（ハイライト1参照）",
                "- [速報] 本文（ハイライト１参照）",
                "- [速報] 本文（ハイライト 12 参照）",
                "- [速報] 本文（ハイライト参照）",
                "- https://example.com/only",
                "- 直近の期限: 11/30 まで",
                "",
                "## 注目スケジュール（更新）",
                "",
                "- [速報] この節の壊れたタグは見ない",
                "- [仕様+新機能] 順番が逆でも見ない",
                "",
                "## 取得状況のメモ",
                "",
                "- タグが無くても見ない",
            ]
        )
        self.assertEqual(errors_of(text, "digest"), [])

    def test_reversed_pair_reports_the_source_line(self):
        text = "# t\n\n## 開発ツール\n\n- [観測+新機能] 逆順"
        self.assertEqual(
            errors_of(text, "digest"),
            ["5: [観測+新機能] 副は主より優先順が下"],
        )

    def test_missing_tag_url_with_text_and_missing_space(self):
        text = "\n".join(
            [
                "## 開発ツール",
                "- タグが無い",
                "- https://example.com 説明つき",
                "- [新機能]スペースが無い",
            ]
        )
        self.assertEqual(
            errors_of(text, "digest"),
            [
                "2: 項目の行頭に [タグ] が無い",
                "3: 項目の行頭に [タグ] が無い",
                "4: 項目の行頭に [タグ] が無い",
            ],
        )

    def test_highlight_mention_without_reference_is_still_checked(self):
        text = "## 開発ツール\n- [速報] ハイライト機能 — 本文"
        self.assertEqual(
            errors_of(text, "digest"),
            ["2: [速報] 11語以外"],
        )


class DailyTextTest(unittest.TestCase):
    def test_valid_daily_skips_other_sections(self):
        text = "\n".join(
            [
                "# AI News Daily Summary — 2026-11-23",
                "",
                "## 今日のハイライト（11/23）",
                "",
                "### 1. [廃止+観測] タイトル — 含意",
                "",
                "本文は見ない",
                "",
                "### 2. [料金+破壊的変更] タイトル — 含意",
                "",
                "## カテゴリ別まとめ",
                "",
                "### Google",
                "",
                "- [新機能] **見出し** — 本文",
                "- https://example.com/x",
                "- **見出し**（ハイライト1参照）",
                "- **見出し**（ハイライト参照）",
                "- 直近の期限: 11/30",
                "",
                "## 開発ツール",
                "",
                "- [速報] **この節は日次では見ない** — 本文",
                "- タグ無し",
            ]
        )
        self.assertEqual(errors_of(text, "daily"), [])

    def test_highlight_shape_and_bad_tag(self):
        text = "\n".join(
            [
                "## 今日のハイライト",
                "### 1. タグ無し — 含意",
                "### 2. [新機能] タイトル - 含意",
                "### 3. [新機能] タイトル —",
                "### 4. [速報] タイトル — 含意",
                "### 5. [観測+新機能] タイトル — 含意",
                "### 6. [新機能+仕様+料金] タイトル — 含意",
            ]
        )
        self.assertEqual(
            errors_of(text, "daily"),
            [
                "2: ハイライトは「### N. [タグ] タイトル — 含意」",
                "3: ハイライトは「### N. [タグ] タイトル — 含意」",
                "4: ハイライトは「### N. [タグ] タイトル — 含意」",
                "5: [速報] 11語以外",
                "6: [観測+新機能] 副は主より優先順が下",
                "7: [新機能+仕様+料金] 主は1語、副は1語まで",
            ],
        )

    def test_category_line_must_use_bold_heading(self):
        text = "## カテゴリ別まとめ\n- [新機能] 見出しが太字でない — 本文"
        self.assertEqual(
            errors_of(text, "daily"),
            ["2: カテゴリ行は「- [タグ] **見出し** — 本文」"],
        )


class FileAndReportTest(unittest.TestCase):
    def test_rollout_and_names(self):
        self.assertEqual(
            mod.published_date(Path("ai-news-2026-11-23.md")),
            date(2026, 11, 23),
        )
        self.assertIsNone(mod.published_date(Path("ai-news-weekly-2026.md")))
        self.assertTrue(mod.is_news_file(Path("ai-news-daily-2026-11-23.md")))
        self.assertTrue(mod.is_news_file(Path("digests/ai-news-2026-11-23.md")))
        self.assertFalse(mod.is_news_file(Path("README.md")))
        self.assertEqual(mod.kind_of(Path("ai-news-daily-2026-11-23.md")), "daily")
        self.assertEqual(mod.kind_of(Path("ai-news-2026-11-23.md")), "digest")

    def test_before_rollout_and_undated_names_are_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            old = Path(tmp) / "ai-news-2026-09-23.md"
            old.write_text("## 開発ツール\n- タグが無い\n", encoding="utf-8")
            undated = Path(tmp) / "notes.md"
            undated.write_text("## 開発ツール\n- タグが無い\n", encoding="utf-8")
            self.assertEqual(mod.check_file(old), [])
            self.assertEqual(mod.report([old, undated]), 0)

    def test_missing_file_on_or_after_rollout(self):
        missing = Path("/tmp/does-not-exist-ai-news-2026-11-23.md")
        errors = mod.check_file(missing)
        self.assertEqual(len(errors), 1)
        self.assertIn("ファイルが無い", errors[0])
        self.assertIn(str(missing), errors[0])

    def test_report_fails_if_any_checked_file_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            good = Path(tmp) / "ai-news-2026-11-22.md"
            bad = Path(tmp) / "ai-news-2026-11-23.md"
            good.write_text(
                "## 開発ツール\n- [新機能] 合格 — 本文\n",
                encoding="utf-8",
            )
            bad.write_text(
                "## 開発ツール\n- [速報] 不合格\n",
                encoding="utf-8",
            )
            self.assertEqual(mod.report([good, bad]), 1)
            self.assertEqual(mod.report([good]), 0)

    def test_main_requires_a_file_and_checks_it(self):
        err = StringIO()
        with patch.object(mod.sys, "stderr", err):
            self.assertEqual(mod.main([]), 1)
        self.assertIn("ファイルを指定する", err.getvalue())

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ai-news-2026-11-23.md"
            path.write_text(
                "## 開発ツール\n- [新機能] 合格 — 本文\n",
                encoding="utf-8",
            )
            self.assertEqual(mod.main([str(path)]), 0)
            self.assertEqual(mod.main([str(path), "--ai-news-2026-12-01.md"]), 0)
            path.write_text("## 開発ツール\n- タグが無い\n", encoding="utf-8")
            self.assertEqual(mod.main([str(path)]), 1)
            self.assertEqual(mod.main([str(path), "--ignored"]), 1)


class HookAndCiTest(unittest.TestCase):
    def test_hook_ignores_empty_invalid_and_non_git(self):
        cases = [
            "",
            "   \n",
            "{",
            "{}",
            json.dumps({"tool_input": {"command": "ls"}}),
            json.dumps({"tool_input": {"command": 1}}),
            json.dumps({"tool_input": {"cmd": "git status"}}),
        ]
        for raw in cases:
            with patch.object(mod.sys, "stdin", StringIO(raw)):
                self.assertEqual(mod.run_hook(), 0, raw)

    def test_hook_blocks_a_bad_commit_and_passes_a_good_one(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ai-news-2026-11-23.md"
            path.write_text("## 開発ツール\n- [速報] 不合格\n", encoding="utf-8")
            payload = json.dumps({"tool_input": {"command": "git commit -m x"}})
            err = StringIO()
            with (
                patch.object(mod, "git_lines", return_value=[str(path)]),
                patch.object(mod.sys, "stdin", StringIO(payload)),
                patch.object(mod.sys, "stderr", err),
            ):
                self.assertEqual(mod.run_hook(), 2)
            self.assertIn("不一致のままコミット・push しない", err.getvalue())

            path.write_text(
                "## 開発ツール\n- [新機能] 合格 — 本文\n",
                encoding="utf-8",
            )
            with (
                patch.object(mod, "git_lines", return_value=[str(path)]),
                patch.object(mod.sys, "stdin", StringIO(payload)),
            ):
                self.assertEqual(mod.run_hook(), 0)

    def test_push_falls_back_to_head_when_origin_diff_is_empty(self):
        def fake(args):
            if args == ["diff", "--name-only", "origin/main...HEAD"]:
                return []
            if args == ["diff", "--name-only", "HEAD~1", "HEAD"]:
                return ["ai-news-daily-2026-11-23.md", "index.html"]
            raise AssertionError(args)

        with patch.object(mod, "git_lines", side_effect=fake):
            paths = mod.hook_targets("git push origin main")
        self.assertEqual(paths, [Path("ai-news-daily-2026-11-23.md")])

    def test_commit_all_uses_rename_destination_and_amend_uses_cached(self):
        line = "R  digests/old.md -> digests/2026/11/ai-news-2026-11-23.md"

        def fake(args):
            self.assertEqual(args[:2], ["status", "--porcelain"])
            return [line, "M  index.html"]

        with patch.object(mod, "git_lines", side_effect=fake):
            paths = mod.hook_targets("git commit -a -m x")
        self.assertEqual(paths, [Path("digests/2026/11/ai-news-2026-11-23.md")])

        with patch.object(
            mod,
            "git_lines",
            return_value=["ai-news-2026-11-23.md"],
        ) as cached:
            paths = mod.hook_targets("git commit -amend -m x")
        cached.assert_called_with(["diff", "--cached", "--name-only"])
        self.assertEqual(paths, [Path("ai-news-2026-11-23.md")])

    def test_ci_since_zero_uses_previous_commit(self):
        def fake(args):
            seen.append(list(args))
            return ["README.md", "ai-news-daily-2026-11-23.md"]

        for since in ("", "0000"):
            seen = []
            with patch.object(mod, "git_lines", side_effect=fake):
                paths = mod.ci_targets(since)
            self.assertEqual(seen, [["diff", "--name-only", "HEAD~1", "HEAD"]])
            self.assertEqual(paths, [Path("ai-news-daily-2026-11-23.md")])

        seen = []
        with patch.object(mod, "git_lines", side_effect=fake):
            mod.ci_targets("abc123")
        self.assertEqual(seen, [["diff", "--name-only", "abc123", "HEAD"]])

    def test_main_since_checks_only_news_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ai-news-2026-11-23.md"
            path.write_text("## 開発ツール\n- [速報] 不合格\n", encoding="utf-8")
            seen = []

            def fake(args):
                seen.append(list(args))
                return [str(path), "README.md"]

            err = StringIO()
            with (
                patch.object(mod, "git_lines", side_effect=fake),
                patch.object(mod.sys, "stderr", err),
            ):
                self.assertEqual(mod.main(["--since", "abc123"]), 1)
            self.assertEqual(seen, [["diff", "--name-only", "abc123", "HEAD"]])
            self.assertIn(str(path), err.getvalue())
            self.assertNotIn("README.md", err.getvalue())

            path.write_text(
                "## 開発ツール\n- [新機能] 合格 — 本文\n",
                encoding="utf-8",
            )
            seen = []
            out = StringIO()

            def fake_good(args):
                seen.append(list(args))
                return [str(path)]

            with (
                patch.object(mod, "git_lines", side_effect=fake_good),
                patch.object(mod.sys, "stdout", out),
            ):
                self.assertEqual(mod.main(["--since"]), 0)
            self.assertEqual(seen, [["diff", "--name-only", "HEAD~1", "HEAD"]])
            self.assertIn(str(path), out.getvalue())


if __name__ == "__main__":
    unittest.main()
