/** Host registration for the browser theme preference and pre-plugin palette. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { injectBootTheme } from './boot-theme.ts'
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

/** Read the registered preference and accent, or their schema defaults without a settings provider. */
function readSettings(ctx: Context): { preference: ThemePreference; accent: ThemeAccent } {
  const settings = ctx.get('settings')
  if (settings === undefined) return { preference: DEFAULT_PREFERENCE, accent: DEFAULT_ACCENT }
  const section = settings.get(THEME_NAMESPACE) as ThemeSettings | undefined
  if (section === undefined) return { preference: DEFAULT_PREFERENCE, accent: DEFAULT_ACCENT }
  return { preference: section.preference, accent: section.accent }
}

/**
 * Register the durable theme section and initial-theme index transform when
 * their optional Host services are composed.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(THEME_NAMESPACE, ThemeSettingsSchema)
  })
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(
      () => httpCtx.webServer.tapIndex((html) => {
        const { preference, accent } = readSettings(ctx)
        return injectBootTheme(html, preference, accent)
      }),
      'client-ui-theme: initial theme bootstrap',
    )
  })
}
