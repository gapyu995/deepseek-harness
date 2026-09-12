# Agent Note：PDF→Word 提取以内置 skill 形式发布，而非编程式工具

Status: implemented

[English](2026-08-19-pdf-to-word-skill.md) | 中文

## 问题

harness 需要一种可复用的方式，把结构化 PDF 提取为 Word，保留文字、表格、图像、标题层级、缩进、列表编号与条款编号——这套流程最初在 GB/T 44721-2024 上得到验证。

## 决策

以内置 skill 形式发布 `@deepseek-ai/dsh-skill-pdf-to-word`，沿用 `dsh-skill-badge` 的模式：一个 `SkillProvider` 注册单个 `pdf-to-word` skill，其 `assets/` 目录携带流程正文（`pdf-to-word.md`）以及两条可运行的 Python 管线。默认是「可编辑」模式（`pdf_to_word.py` + `requirements.txt`），保证每个文字都可选中、表格是真表格、图像仍是图像；「排版一模一样」模式（`pdf_to_word_layout.py`）是可选的逐像素复刻回退，把每一页渲染成整页图片。该 skill 在基础 bundle 中以 `disabled: true` 出现，与 `skill-badge` 一致，并通过 `dsh-tool-skill` 进入模型可见目录。

可编辑管线是 8 步提取：字符级行分组；带奇偶页兜底的边距/缩进测量；字体加内容加位置三重分类（SimHei 标记标题；章/条/术语/正文/列表/注/引用）；续行合并；用 `page.find_tables()` 按表头跨页分组表格并剔除表格区文字；内嵌图像原生解码（FlateDecode/DCTDecode/JPXDecode）并过滤行内字形碎片；以及按点值输出 Word 的首行缩进、悬挂缩进、左缩进，外加逐页分页与原始字号。

## 考虑过的替代方案

- **用 TypeScript `defineTool` 包装子进程**——一等模型工具，但必须打包或定位 Python 运行时及依赖，而且该流程主要是版式知识，并非固定的请求/响应约定。
- **harness 之外的独立脚本**——没有模型可见的目录条目；每次都要由 agent 重新推导调用方式。
- **只提供可编辑提取**——最初的选择；后来加入整页图模式并一度设为默认，但“所有文字都要转成文字”的要求又把可编辑模式恢复为默认，整页图模式降为显式可选的回退。

## 后果

- 该 skill 只有在组合显式启用其配置行后才进入目录；默认关闭。
- 默认模式保证每个文字都可选中；整页图回退产出不可选中的页面图片，仅在用户明确要求逐像素复刻时使用。
- Python 脚本是参考实现而非内置运行时：运行前需安装 `requirements.txt`（`pdfplumber`、`python-docx`、`Pillow`、`pypdfium2`）。
- 版式阈值（边距档位、`+18/+21/+42` 缩进档位、窄而居中的标题判定）按 GB/T 文档测得，并作为可重新测量的调优点记录在文档中。
