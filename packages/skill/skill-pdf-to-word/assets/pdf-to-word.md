# PDF → Word extraction

Convert a PDF into an editable Word (.docx) document. **All text becomes selectable/editable text, tables become real tables, and images stay as images** (text annotations inside images are left in the image). This is guidance plus a reference script — adapt its thresholds when a document's layout differs.

## When to use

- The user asks to convert, extract, transcribe, or rebuild a PDF into Word.
- The source is a structured document: a Chinese standard (GB/T, GB, HJ, DB), a regulation, a specification, a paper, or a report.

## Default: editable text + real tables + images

Run the editable pipeline (`pdf_to_word.py`) by default. It preserves headings, paragraph indentation, list and clause numbering, page breaks, font sizes, the table of contents, tables, and images, with every text character selectable in Word.

If the user explicitly asks for a pixel-perfect copy and accepts that text will not be selectable, offer the layout-image fallback (`pdf_to_word_layout.py`), which renders every page as a full-page image. Otherwise do not use it — the default requirement is that all text converts to text.

## Assets

- `pdf_to_word.py` — editable pipeline (default): selectable text + real tables + images, preserving headings/indentation/numbering/page breaks/font sizes.
- `pdf_to_word_layout.py` — optional pixel-perfect fallback: full-page images (text not selectable).
- `requirements.txt` — `pdfplumber`, `python-docx`, `Pillow`, plus `pypdfium2` for the layout-image mode.

## Run it

```sh
python -m pip install -r requirements.txt              # once per environment
python pdf_to_word.py input.pdf out.docx               # default: editable text + tables + images
python pdf_to_word_layout.py input.pdf out.docx 200    # optional: pixel-perfect page images
```

If the destination environment cannot install packages globally, install into a local directory and set `PYTHONPATH`, or create a virtualenv.

## Pipeline (the 8 steps the script follows)

1. **Char-level line grouping.** Use `page.chars` (each char has `x0/top/size/fontname`), not `extract_text()`. Sort by `(top, x0)`, cluster lines by `top` within ~0.4× line height, and join chars by `x0`. This keeps mixed CJK/Latin such as “GB/T 1.1” intact.
2. **Measure the margin and indent offsets.** Per page, the body margin `M` is the minimum `x0` of chars in the body band; odd/even pages often differ, so precompute a per-parity median as a fallback for pages with no left-aligned text (e.g. a references page that is fully indented). Indent levels are offsets from `M`: `0` = flush, `+18` = “注/示例” label, `+21` = first-line/list/reference, `+34~42` = wrapped continuation.
3. **Classify each line by font + content + position.** Headings use the bold CJK face (SimHei/黑体) while body uses SimSun/宋体, so a line whose dominant `fontname` contains `Hei` is a heading; combine with content patterns for the level (chapter `1　范围`/`附录A` vs clause `4.1`/`A.3.2.1.2`). List items include both `a）` and `1)`. A line is a *title* only when it is narrow AND its horizontal center is near the page center AND it is large — right-aligned running headers and full-width body lines must not match. Centered body-size lines are formulas, emitted centered without the title size.
4. **Merge continuations.** A flush continuation joins the previous paragraph with no space (Chinese wraps mid-word); an indented continuation joins the previous list/note.
5. **Extract tables separately** (`page.find_tables()`), grouping cross-page continuations by their header row so a document with many distinct tables keeps each one separate (not one merged blob). Drop single-cell pseudo-tables such as a centered “附录 X” heading, and pull the table note out into its own paragraph. Exclude table-region lines from the text stream.
6. **Decode embedded images** through `stream.get_data()` (handles FlateDecode, DCTDecode/JPEG, JPXDecode), and insert them at bbox order. Skip inline glyph images (native height below ~60px) so formula fragments do not become images.
7. **Emit to Word.** Map each block to indentation in points: body = first-line indent 21pt, list = hanging `(left 42, hang 21)`, note = hanging `(left 34, hang 16)`, reference/source = left indent 21pt, clause/chapter = none. Use `firstLineChars` for character-based indents when the body size may change.
8. **Verify by the numbers.** Paragraph count < line count (merging worked); table count = distinct headers; image count excludes glyphs; and the indent class counts match the block categories.

## Tuning points

- Line-cluster tolerance, the `+18/+21/+42` indent buckets, and the `A4`-specific margin/center thresholds are measured from a GB/T document; re-measure on a different layout.
- Heading detection keys on the CJK bold face name (`Hei`); if a source uses a different face, adjust the `is_heading_font` test.
- The running header is filtered as “top band + right-aligned” (`top < 90` and `x0 > 0.6×page width`); adjust when a document left-aligns or moves its header.
- The `\u3000` full-width space and `　` are significant separators in Chinese numbering; keep them in the regexes.
- The cover (page 1) is handled separately because it has no uniform margin.

## Verification

Run the script on a known PDF and confirm: the `.docx` opens, the table row/column counts match, images are embedded, and headings/indents survive. Compare against the source page count.
