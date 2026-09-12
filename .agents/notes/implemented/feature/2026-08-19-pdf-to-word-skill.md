# Agent Note: PDF→Word extraction ships as a bundled skill, not a programmatic tool

Status: implemented

English | [中文](2026-08-19-pdf-to-word-skill.zh.md)

## Problem

The harness needs a reusable way to extract a structured PDF into Word, preserving text, tables, images, headings, indentation, list numbering, and clause numbering — a workflow first proven against GB/T 44721-2024.

## Decision

Ship it as a bundled skill, `@deepseek-ai/dsh-skill-pdf-to-word`, following the `dsh-skill-badge` pattern: a `SkillProvider` registers one `pdf-to-word` skill whose `assets/` directory carries the workflow body (`pdf-to-word.md`) plus two runnable Python pipelines. The default is the editable mode (`pdf_to_word.py` + `requirements.txt`), which keeps every text character selectable, tables real, and images as images; the identical-layout mode (`pdf_to_word_layout.py`) is an optional fallback that renders each page as a full-page image. The skill is `disabled: true` in the base bundle, matching `skill-badge`, and becomes visible through `dsh-tool-skill`.

The editable pipeline is an 8-step extraction: char-level line grouping; margin/indent measurement with an odd/even fallback; font-plus-content-plus-position classification (SimHei marks headings; chapter/clause/term/body/list/note/reference); continuation merging; cross-page table grouping by header row via `page.find_tables()` with table-region text exclusion; native decode of embedded images (FlateDecode/DCTDecode/JPXDecode) with inline-glyph filtering; and Word emission with point-based first-line, hanging, and left indents plus per-page breaks and source font sizes.

## Alternatives considered

- **A TypeScript `defineTool` wrapping a subprocess** — a first-class model-facing tool, but it would have to bundle or locate a Python runtime and the dependencies, and the workflow is mostly layout knowledge, not a fixed request/response contract.
- **A standalone script outside the harness** — no model-facing catalog entry; agents would have to re-derive the invocation every time.
- **Editable extraction as the only mode** — was the initial choice; the layout-image mode was later added and briefly made the default, but the requirement that all text converts to text restored the editable mode as the default, with the layout-image mode demoted to an explicit opt-in fallback.

## Consequences

- The skill enters the catalog only when a composition enables its row; it defaults off.
- The default mode keeps every text character selectable; the layout-image fallback produces non-selectable page images and is only for explicit pixel-perfect requests.
- The Python scripts are a reference, not a bundled runtime: an environment must install `requirements.txt` (`pdfplumber`, `python-docx`, `Pillow`, `pypdfium2`) before running them.
- Layout thresholds (margin bands, `+18/+21/+42` indent buckets, narrow-centered title detection) are measured from a GB/T document and are documented as re-measurable tuning points.
