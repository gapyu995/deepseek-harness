/** Host registration for the browser theme preference and pre-plugin palette. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { bootThemeInjection } from './boot-theme.ts'
import {
  DEFAULT_ACCENT, DEFAULT_PREFERENCE, THEME_SETTINGS_NAMESPACE, ThemeSettingsSchema,
  type ThemeAccent, type ThemePreference, type ThemeSettings,
} from './theme-settings.ts'

export {
  DEFAULT_ACCENT, DEFAULT_PREFERENCE, THEME_ACCENT_FIELD, THEME_ACCENTS,
  THEME_PREFERENCE_FIELD, THEME_PREFERENCES, THEME_SETTINGS_NAMESPACE,
  type ThemeAccent, type ThemePreference, type ThemeSettings,
} from './theme-settings.ts'

const THEME_NAMESPACE = settingsNamespace(THEME_SETTINGS_NAMESPACE)

/** Read the registered preference and accent, or schema defaults without a settings provider. */
function readSettings(ctx: Context): { preference: ThemePreference; accent: ThemeAccent } {
  const settings = ctx.get('settings')
  if (settings === undefined) return { preference: DEFAULT_PREFERENCE, accent: DEFAULT_ACCENT }
  const section = settings.get(THEME_NAMESPACE) as ThemeSettings | undefined
  if (section === undefined) return { preference: DEFAULT_PREFERENCE, accent: DEFAULT_ACCENT }
  return { preference: section.preference, accent: section.accent }
}

/**
 * Register the durable theme section when the optional settings service is
 * composed, and answer every index injection collection with the current
 * theme bootstrap row.
 * @param ctx - Host context that may acquire the settings service.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(THEME_NAMESPACE, ThemeSettingsSchema)
  })
  ctx.on('webserver/index-inject', (table) => {
    const { preference, accent } = readSettings(ctx)
    table.push(bootThemeInjection(preference, accent))
  })
}
