# @deepseek-ai/dsh-skill-pdf-to-word

[English](README.md) | 中文

可选的内置 skill（技能）提供方，向 `ctx.skills` 贡献 `pdf-to-word`。该 skill 提供一套可复用的 PDF→Word 流程，并附两条随包分发的参考 Python 管线：`assets/pdf_to_word.py`（默认）重建可编辑的文字、表格与图像，同时保留标题层级、缩进、列表与条款编号、分页与字号；`assets/pdf_to_word_layout.py` 是可选的可选逐像素复刻回退，把每一页渲染成整页图片。

挂载该插件即可启用提供方。它没有配置。随附的 CLI（命令行界面）组合以 `disabled: true` 包含该插件；用户必须显式启用其 `skill-pdf-to-word` 配置行，该 skill 才会进入目录。

该提供方将随包分发的 `assets/` 目录作为 skill 资源基底公开：`pdf-to-word.md` 是 skill 正文，`pdf_to_word.py` / `requirements.txt` 是可运行的管线资产。

## 模型体验

通过 `@deepseek-ai/dsh-tool-skill` 间接影响模型；该包会渲染目录条目和所选 skill 的正文。

#### KV Cache 影响

该插件默认禁用，不会改变任何请求。启用后，其目录条目和任何已加载正文都会在各自插入点改变提供方的 KV 前缀。

## 已知限制与暂缓事项

- 该提供方只贡献一个固定 skill，不提供运行时自定义。
- 该 skill 的脚本是 Python 管线（`pdfplumber`/`python-docx`/`Pillow`）；harness 不内置 Python 运行时或这些依赖，运行前需先安装 `assets/requirements.txt`。
- 版式阈值（边距、缩进档位、居中判定）按 GB/T 文档测得，其他版式可能需要重新测量。
