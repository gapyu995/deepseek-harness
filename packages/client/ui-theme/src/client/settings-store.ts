/**
 * Appearance row slot store: a mirror of the theme service snapshot plus the
 * color accent. The plugin's apply-world change listeners are the only
 * writers; the row component reads via props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeAccent, ThemePreference } from '../theme-settings.ts'

/** Store state mirrored from the theme snapshot and the accent scope. */
export interface AppearanceRowState {
  /** Persisted preference (selection state reads this, never the resolved active theme). */
  preference: ThemePreference
  /** Persisted color accent. */
  accent: ThemeAccent
  /** Service revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type AppearanceRowActions = {
  sync: (draft: AppearanceRowState, preference: ThemePreference, revision: number) => void
  syncAccent: (draft: AppearanceRowState, accent: ThemeAccent) => void
}

/**
 * Declares the Appearance row state and write surface.
 * @returns the store handle.
 */
export function createAppearanceRowStore(): EngineStoreHandle<AppearanceRowState, AppearanceRowActions> {
  return defineStore({
    init: (): AppearanceRowState => ({ preference: 'system', accent: 'native', revision: -1 }),
    actions: {
      sync: (d, preference: ThemePreference, revision: number) => {
        if (revision <= d.revision) return
        d.preference = preference
        d.revision = revision
      },
      syncAccent: (d, accent: ThemeAccent) => {
        d.accent = accent
      },
    },
  })
}
