/** Theme preferences stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'

/** Built-in preferences accepted at the registry and settings boundaries. */
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const

/** Settings namespace owned by the theme plugin. */
export const THEME_SETTINGS_NAMESPACE = 'ui-theme'

/** Field carrying the selected built-in theme preference. */
export const THEME_PREFERENCE_FIELD = 'preference'

/** Theme preference persisted by the product Appearance row. */
export type ThemePreference = typeof THEME_PREFERENCES[number]

/** Default preference when the user-settings document has no override. */
export const DEFAULT_PREFERENCE: ThemePreference = 'system'

/** Built-in color accents accepted at the registry and settings boundaries. */
export const THEME_ACCENTS = ['native', 'ellen'] as const

/** Field carrying the selected color accent (native DeepSeek blue vs Ellen). */
export const THEME_ACCENT_FIELD = 'accent'

/** Color accent persisted by the product Appearance row. */
export type ThemeAccent = typeof THEME_ACCENTS[number]

/** Default accent when the user-settings document has no override. */
export const DEFAULT_ACCENT: ThemeAccent = 'native'

/** Durable theme section shared by the Host schema and the browser scope. */
export interface ThemeSettings {
  /** Selected built-in preference. */
  preference: ThemePreference
  /** Selected color accent. */
  accent: ThemeAccent
}

/** Durable theme schema; also the wire envelope the browser scope validates against. */
export const ThemeSettingsSchema: z<ThemeSettings> = z.object({
  [THEME_PREFERENCE_FIELD]: z.union([...THEME_PREFERENCES]).default(DEFAULT_PREFERENCE),
  [THEME_ACCENT_FIELD]: z.union([...THEME_ACCENTS]).default(DEFAULT_ACCENT),
})

/**
 * Narrow one wire or registry value to a persistable preference.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in preference.
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some(preference => preference === value)
}

/**
 * Narrow one wire or registry value to a persistable accent.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in accent.
 */
export function isThemeAccent(value: unknown): value is ThemeAccent {
  return THEME_ACCENTS.some(accent => accent === value)
}
