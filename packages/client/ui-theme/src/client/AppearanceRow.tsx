/**
 * Appearance + style preference rows registered into the General section item
 * slot (figma 501:30012 'Frame 2117131228'): one title + cube row for the
 * color scheme (light/dark/system), one for the style skin (native/ellen).
 * Registered by this package — the theme feature owns its own settings
 * surface. Selection follows the persisted values, never the resolved active
 * theme.
 */
import clsx from 'clsx'
import {
  IconDarkOutline16, IconFollowsystemOutline16, IconLightOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeAccent, ThemePreference } from '../theme-settings.ts'
import type { ThemeKey } from './locales.ts'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { createAppearanceRowStore } from './settings-store.ts'
import css from './AppearanceRow.module.css'

/** Injected business face: the preference write and the accent write (t rides the standard locale seat). */
export interface AppearanceRowInjected {
  /** Switch the theme preference. */
  setTheme: (id: ThemePreference) => void
  /** Switch the accent skin. */
  setAccent: (accent: ThemeAccent) => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type AppearanceRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createAppearanceRowStore>>
  & PropsLocale<'settings.theme'> & AppearanceRowInjected

/** Cube order and icons (figma 501:30015-30017: Light, Dark, System). */
const PREFERENCE_CUBES: readonly { id: ThemePreference; labelKey: ThemeKey; Icon: typeof IconLightOutline16 }[] = [
  { id: 'light', labelKey: 'appearance.light', Icon: IconLightOutline16 },
  { id: 'dark', labelKey: 'appearance.dark', Icon: IconDarkOutline16 },
  { id: 'system', labelKey: 'appearance.system', Icon: IconFollowsystemOutline16 },
]

/** Style cube order (text-only; the accent skin has no scheme icon). */
const STYLE_CUBES: readonly { id: ThemeAccent; labelKey: ThemeKey }[] = [
  { id: 'native', labelKey: 'style.native' },
  { id: 'ellen', labelKey: 'style.ellen' },
]

/**
 * Render the Appearance + Style rows.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function AppearanceRow({ t, setTheme, setAccent, useStore }: AppearanceRowComponentProps) {
  const preference = useStore(s => s.preference)
  const accent = useStore(s => s.accent)
  return (
    <>
      <div className={css.group}>
        <div className={css.title}>{t('appearance.title')}</div>
        <div className={css.cubeRow}>
          {PREFERENCE_CUBES.map(({ id, labelKey, Icon }) => (
            <button
              key={id}
              type="button"
              className={clsx(css.themeCube, preference === id && css.selected)}
              aria-pressed={preference === id}
              onClick={() => { setTheme(id) }}
            >
              <Icon />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div className={css.group}>
        <div className={css.title}>{t('style.title')}</div>
        <div className={css.cubeRow}>
          {STYLE_CUBES.map(({ id, labelKey }) => (
            <button
              key={id}
              type="button"
              className={clsx(css.themeCube, accent === id && css.selected)}
              aria-pressed={accent === id}
              onClick={() => { setAccent(id) }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
