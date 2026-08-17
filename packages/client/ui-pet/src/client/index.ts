/**
 * Desktop-pet surface plugin, browser half: one entry (`id: 'pet'`) into
 * ui-layout's generic frame-wide `shell.overlay` list. The seat is additive
 * and click-through, exactly the home for a floating mascot that must never
 * block the app underneath. The entry owns no store and no business data —
 * everything is component-local, so this plugin contributes nothing
 * model-visible and survives as a pure presentation layer.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-layout SlotMap merge (the shell.overlay seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { Pet } from './Pet.tsx'
import { en, NS, zh, type PetKey } from './locales.ts'

export { Pet } from './Pet.tsx'
export type { PetProps } from './Pet.tsx'
export type { PetKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The desktop pet's control copy. */
    pet: PetKey
  }
}

/** Required services: the slot registry and the locale dictionary seat. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: register the `pet` dictionaries, then the overlay entry.
 * `slots.inject` waits on ui-layout's declaration, so the contribution installs
 * beside the shipped overlay entries instead of racing them.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-pet: dictionaries')

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'pet',
    order: 900,
    locale: NS,
  }, Pet))
}
