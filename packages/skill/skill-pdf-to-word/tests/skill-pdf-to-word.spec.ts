import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as SkillPdfToWord from '@deepseek-ai/dsh-skill-pdf-to-word'

describe('dsh-skill-pdf-to-word', () => {
  it('registers and disposes the bundled pdf-to-word skill', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)
    const fiber = await ctx.plugin(SkillPdfToWord)
    const resourcePath = fileURLToPath(new URL('../assets/', import.meta.url))

    expect(await ctx.skills.list()).toEqual([{
      name: 'pdf-to-word',
      description: 'Convert a PDF into a Word (.docx) document with all text preserved as selectable/editable text, tables as real tables, and images as images (text annotations inside images are left in the image). Preserves headings, paragraph indentation, list and clause numbering, page breaks, and font sizes. Use when the user asks to convert, extract, or rebuild a PDF into Word — especially Chinese standards (GB/T), regulations, or other structured documents.',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: 'pdf-to-word',
      source: 'bundled',
      resourceBase: { kind: 'directory', path: resourcePath },
    }])
    const loaded = await ctx.skills.get('pdf-to-word')
    expect(loaded?.content).toContain('Char-level line grouping')
    expect(loaded?.resourceBase).toEqual({ kind: 'directory', path: resourcePath })

    await fiber.dispose()
    expect(await ctx.skills.list()).toEqual([])
  })

  it('ships the extraction script and its requirements', async () => {
    const script = await readFile(new URL('../assets/pdf_to_word.py', import.meta.url), 'utf8')
    expect(script).toContain('def classify(')
    expect(script).toContain('page.find_tables()')
    const layout = await readFile(new URL('../assets/pdf_to_word_layout.py', import.meta.url), 'utf8')
    expect(layout).toContain('pdfium.PdfDocument')
    expect(layout).toContain('add_picture')
    const reqs = await readFile(new URL('../assets/requirements.txt', import.meta.url), 'utf8')
    expect(reqs).toContain('pdfplumber')
    expect(reqs).toContain('python-docx')
    expect(reqs).toContain('Pillow')
    expect(reqs).toContain('pypdfium2')
    const scriptHash = createHash('sha256')
      .update(await readFile(new URL('../assets/pdf_to_word.py', import.meta.url)))
      .digest('hex')
    expect(scriptHash.length).toBe(64)
  })
})
