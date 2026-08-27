/**
 * Theme bootstrap row for the browser's pre-plugin interval. Each index
 * render embeds the current durable built-in preference; the browser resolves
 * only `system`, then writes the same DOM fields ui-layout's ThemePresenter
 * owns after the client plugin tree activates.
 */

import type { IndexInjection } from '@deepseek-ai/dsh-host-webserver'
import {
  DEFAULT_ACCENT, DEFAULT_PREFERENCE, type ThemeAccent, type ThemePreference,
} from './theme-settings.ts'

/** Build the inline script body for one schema-validated built-in preference and accent. */
function bootThemeScript(preference: ThemePreference, accent: ThemeAccent): string {
  return `(() => {
  const preference = ${JSON.stringify(preference)}
  const accent = ${JSON.stringify(accent)}
  const systemDark = preference === 'system'
    && typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-color-scheme: dark)').matches
  const dark = preference === 'dark' || systemDark
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  document.body.toggleAttribute('data-ds-dark-theme', dark)
  document.body.toggleAttribute('data-ds-ellen-theme', accent === 'ellen')
})()`
}

/**
 * The theme bootstrap as an injection row: an inline script immediately after
 * the opening body tag, before the shell mount and module script.
 * @param preference - Current Host-backed built-in preference.
 * @param accent - Current Host-backed color accent.
 * @returns the body script row.
 */
export function bootThemeInjection(
  preference: ThemePreference = DEFAULT_PREFERENCE,
  accent: ThemeAccent = DEFAULT_ACCENT,
): IndexInjection {
  return { kind: 'script', placement: 'body', text: bootThemeScript(preference, accent) }
}
