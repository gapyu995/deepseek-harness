/** Appearance row store: snapshot-mirror actions and the revision guard. */
import { describe, expect, it } from 'vitest'
import { createAppearanceRowStore } from '../src/client/settings-store.ts'

describe('createAppearanceRowStore', () => {
  it('init shape: system preference, native accent, revision at -1', () => {
    const store = createAppearanceRowStore().create()
    expect(store.getSnapshot()).toEqual({ preference: 'system', accent: 'native', revision: -1 })
  })

  it('sync mirrors the preference and advances the revision', () => {
    const store = createAppearanceRowStore().create()
    store.actions.sync('dark', 0)
    expect(store.getSnapshot()).toMatchObject({ preference: 'dark', revision: 0 })
    store.actions.sync('light', 2)
    expect(store.getSnapshot().preference).toBe('light')
    expect(store.getSnapshot().revision).toBe(2)
  })

  it('syncAccent mirrors the accent without touching the revision', () => {
    const store = createAppearanceRowStore().create()
    store.actions.syncAccent('ellen')
    expect(store.getSnapshot().accent).toBe('ellen')
    expect(store.getSnapshot().revision).toBe(-1)
  })

  it('revision guard drops stale and duplicate writes', () => {
    const store = createAppearanceRowStore().create()
    store.actions.sync('dark', 3)
    store.actions.sync('system', 2)
    store.actions.sync('system', 3)
    expect(store.getSnapshot().preference).toBe('dark')
    expect(store.getSnapshot().revision).toBe(3)
  })
})
