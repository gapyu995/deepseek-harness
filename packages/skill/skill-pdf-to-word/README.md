# @deepseek-ai/dsh-skill-pdf-to-word

English | [中文](README.zh.md)

Optional bundled skill provider that contributes `pdf-to-word` to `ctx.skills`. The skill supplies a reusable PDF→Word workflow with two reference Python pipelines: `assets/pdf_to_word.py` (default) reconstructs editable text, tables, and images while preserving headings, indentation, list and clause numbering, page breaks, and font sizes; `assets/pdf_to_word_layout.py` is an optional pixel-perfect fallback that renders each page as a full-page image.

Mount the plugin to enable the provider. It has no configuration. The shipped CLI composition includes the plugin as `disabled: true`; users must explicitly enable its `skill-pdf-to-word` row before the skill enters a catalog.

The provider exposes its packaged `assets/` directory as the skill resource base: `pdf-to-word.md` is the skill body, and `pdf_to_word.py` / `requirements.txt` are the runnable pipeline assets.

## Model Experience

Indirectly, through `@deepseek-ai/dsh-tool-skill`, which renders the catalog entry and selected skill body.

#### KV Cache effect

Disabled by default, the plugin changes no request. When enabled, its catalog entry and any loaded body change the provider KV prefix at their insertion points.

## Known Limitations and Deferred Work

- The provider contributes one fixed skill and has no runtime customization.
- The skill's script is a Python pipeline (`pdfplumber`/`python-docx`/`Pillow`); the harness does not bundle a Python runtime or these dependencies, so an environment must install `assets/requirements.txt` before running it.
- Layout thresholds (margins, indent buckets, center detection) are tuned from a GB/T document and may need re-measuring for other layouts.
