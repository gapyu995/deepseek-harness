/**
 * Bundled `pdf-to-word` skill provider.
 *
 * @module @deepseek-ai/dsh-skill-pdf-to-word
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import {
  BUNDLED_SKILL_RANK,
  type SkillCandidate,
  type SkillDefinition,
  type SkillProvider,
} from '@deepseek-ai/dsh-skill'

const PROVIDER_NAME = 'pdf-to-word'
const SKILL_BODY_URL = new URL('../assets/pdf-to-word.md', import.meta.url)
const RESOURCE_BASE = {
  kind: 'directory',
  path: fileURLToPath(new URL('../assets/', import.meta.url)),
} as const
const INVOCATION = { modelInvocable: true, userInvocable: true } as const
const DESCRIPTION = 'Convert a PDF into a Word (.docx) document with all text preserved as selectable/editable text, tables as real tables, and images as images (text annotations inside images are left in the image). Preserves headings, paragraph indentation, list and clause numbering, page breaks, and font sizes. Use when the user asks to convert, extract, or rebuild a PDF into Word — especially Chinese standards (GB/T), regulations, or other structured documents.'
const CANDIDATE: SkillCandidate = {
  name: 'pdf-to-word',
  description: DESCRIPTION,
  invocation: INVOCATION,
  provider: PROVIDER_NAME,
  source: 'bundled',
  resourceBase: RESOURCE_BASE,
  rank: BUNDLED_SKILL_RANK,
  locator: SKILL_BODY_URL,
}

const provider: SkillProvider = {
  name: PROVIDER_NAME,
  list: () => Promise.resolve([CANDIDATE]),
  async get(_candidate): Promise<SkillDefinition> {
    return {
      name: CANDIDATE.name,
      description: CANDIDATE.description,
      invocation: CANDIDATE.invocation,
      provider: CANDIDATE.provider,
      source: CANDIDATE.source,
      resourceBase: RESOURCE_BASE,
      content: await readFile(SKILL_BODY_URL, 'utf8'),
    }
  },
}

/** Cordis plugin name. */
export const name = 'skill-pdf-to-word'
/** Service required by the bundled provider. */
export const inject = ['skills']

/** Register the bundled `pdf-to-word` provider on `ctx.skills`. */
export function apply(ctx: Context): void {
  ctx.skills.registerProvider(() => provider)
}
