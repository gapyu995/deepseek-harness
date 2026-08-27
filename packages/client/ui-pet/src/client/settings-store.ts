/**
 * Desktop-pet slot store: the active color accent mirrored from the theme
 * settings scope. The apply-world subscription is the only writer; the Pet
 * component reads via props.useStore to pick its sprite sheet.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'

/** Store state mirrored from the theme accent. */
export interface PetStoreState {
  /** Active color accent: 'ellen' picks the Ellen sprite, anything else the DeepSeek one. */
  accent: string
}

/** Declared action shape giving the exported factory a stable return type. */
type PetStoreActions = {
  setAccent: (draft: PetStoreState, accent: string) => void
}

/**
 * Declares the pet store state and write surface.
 * @returns the store handle.
 */
export function createPetStore(): EngineStoreHandle<PetStoreState, PetStoreActions> {
  return defineStore({
    init: (): PetStoreState => ({ accent: 'native' }),
    actions: {
      setAccent: (d, accent: string) => { d.accent = accent },
    },
  })
}
