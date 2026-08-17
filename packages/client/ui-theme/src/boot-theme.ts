/**
 * Host-rendered theme bootstrap for the browser's pre-plugin interval. Each
 * index response embeds the current durable built-in preference; the browser
 * resolves only `system`, then writes the same DOM fields ui-layout's
 * ThemePresenter owns after the client plugin tree activates.
 */

import { DEFAULT_ACCENT, DEFAULT_PREFERENCE, type ThemeAccent, type ThemePreference } from './theme-settings.ts'

/** Build the inline script for one schema-validated built-in preference and accent. */
function bootThemeScript(preference: ThemePreference, accent: ThemeAccent): string {
  return `<script>(() => {
  const preference = ${JSON.stringify(preference)}
  const accent = ${JSON.stringify(accent)}
  const systemDark = preference === 'system'
    && typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-color-scheme: dark)').matches
  const dark = preference === 'dark' || systemDark
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.body.toggleAttribute('data-ds-dark-theme', dark)
  document.body.toggleAttribute('data-ds-ellen-theme', accent === 'ellen')
})()</script>`
}

/**
 * Insert the theme bootstrap immediately after the opening body tag, before
 * the shell mount and module script. Body-less fragments receive it at the
 * end, where the HTML parser has already synthesized a body.
 * @param html - Raw application index HTML.
 * @param preference - Current Host-backed built-in preference.
 * @param accent - Current Host-backed color accent.
 * @returns HTML containing the theme bootstrap.
 */
export function injectBootTheme(
  html: string,
  preference: ThemePreference = DEFAULT_PREFERENCE,
  accent: ThemeAccent = DEFAULT_ACCENT,
): string {
  const script = bootThemeScript(preference, accent)
  const body = /<body(?:\s[^>]*)?>/i.exec(html)
  if (body === null) return `${html}${script}`
  const at = body.index + body[0].length
  return `${html.slice(0, at)}${script}${html.slice(at)}`
}
