// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { Pet } from '../src/client/Pet.tsx'
import type { PetProps } from '../src/client/Pet.tsx'
import { createPetStore } from '../src/client/settings-store.ts'
import { zh, type PetKey } from '../src/client/locales.ts'

const t: PetProps['t'] = key => zh[key as PetKey]

afterEach(cleanup)

function mount(accent = 'native') {
  const store = createPetStore().create()
  store.actions.setAccent(accent)
  const props: PetProps = {
    t,
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
  }
  const view = render(<Pet {...props} />)
  return { view, store }
}

describe('Pet', () => {
  it('renders the sprite and dismisses to the restore pill via the close control', () => {
    const { view } = mount()
    expect(view.container.querySelector('[class*="sprite"]')).not.toBeNull()
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    expect(view.container.querySelector('[class*="sprite"]')).toBeNull()
    expect(view.getByRole('button', { name: zh['pet.restore'] })).toBeTruthy()
  })

  it('restores the pet from the pill', () => {
    const { view } = mount()
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    fireEvent.click(view.getByRole('button', { name: zh['pet.restore'] }))
    expect(view.container.querySelector('[class*="sprite"]')).not.toBeNull()
    expect(view.queryByRole('button', { name: zh['pet.close'] })).toBeTruthy()
  })

  it('pokes on a direct click: happy action and a quote bubble', () => {
    const { view } = mount()
    const pet = view.container.querySelector('[data-action]')!
    fireEvent.click(pet)
    expect(pet.getAttribute('data-action')).toBe('happy')
    expect(view.container.querySelector('[class*="bubble"]')).not.toBeNull()
  })

  it('picks the DeepSeek sprite for native and the Ellen sprite for ellen', () => {
    const native = mount('native')
    expect(native.view.container.querySelector('[class*="sprite"]')?.getAttribute('style')).toContain('Sprite_deepseek.png')
    cleanup()
    const ellen = mount('ellen')
    expect(ellen.view.container.querySelector('[class*="sprite"]')?.getAttribute('style')).toContain('Sprite_ailian.png')
  })
})
