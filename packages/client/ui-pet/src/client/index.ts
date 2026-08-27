/**
 * Desktop-pet surface plugin, browser half: one entry (`id: 'pet'`) into
 * ui-layout's generic frame-wide `shell.overlay` list. The seat is additive
 * and click-through, exactly the home for a floating mascot that must never
 * block the app underneath. The entry mirrors the theme accent from the
 * `ui-theme` settings namespace into its own store so the pet swaps between
 * the DeepSeek and Ellen sprite sheets; everything else stays component-local.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-layout SlotMap merge (the shell.overlay seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings plugin's Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { Pet } from './Pet.tsx'
import { createPetStore } from './settings-store.ts'
import { en, NS, zh, type PetKey } from './locales.ts'

export { Pet } from './Pet.tsx'
export type { PetProps } from './Pet.tsx'
export type { PetStoreState } from './settings-store.ts'
export type { PetKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The desktop pet's control copy. */
    pet: PetKey
  }
}

/** The theme settings namespace owning the accent (owned by ui-theme). */
const THEME_NAMESPACE = 'ui-theme'

/** Required services: the slot registry, the locale seat, and the theme settings scope. */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Client plugin body: register the `pet` dictionaries, mirror the theme accent
 * into the pet store, then register the overlay entry. `slots.inject` waits on
 * ui-layout's declaration, so the contribution installs beside the shipped
 * overlay entries instead of racing them.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-pet: dictionaries')

  const host = ctx.settingsScope.bind<{ accent: string }>({ namespace: THEME_NAMESPACE })
  const store = createPetStore()
  let bound: BoundActions<typeof store> | undefined
  const syncAccent = (): void => {
    bound?.setAccent(host.getSnapshot().value?.accent ?? 'native')
  }
  ctx.effect(() => host.subscribe(() => { syncAccent() }), 'ui-pet: accent scope adoption')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'pet',
    order: 900,
    locale: NS,
    store,
    inject: (actions: BoundActions<typeof store>) => {
      bound = actions
      syncAccent()
      return {}
    },
  }, Pet))
}
