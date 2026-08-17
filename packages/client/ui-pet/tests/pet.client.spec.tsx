// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Pet } from '../src/client/Pet.tsx'
import type { PetProps } from '../src/client/Pet.tsx'
import { zh, type PetKey } from '../src/client/locales.ts'

const t: PetProps['t'] = (key) => zh[key as PetKey]

afterEach(cleanup)

describe('Pet', () => {
  it('renders the sprite and dismisses to the restore pill via the close control', () => {
    const view = render(<Pet t={t} />)
    expect(view.container.querySelector('[class*="sprite"]')).not.toBeNull()
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    expect(view.container.querySelector('[class*="sprite"]')).toBeNull()
    expect(view.getByRole('button', { name: zh['pet.restore'] })).toBeTruthy()
  })

  it('restores the pet from the pill', () => {
    const view = render(<Pet t={t} />)
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    fireEvent.click(view.getByRole('button', { name: zh['pet.restore'] }))
    expect(view.container.querySelector('[class*="sprite"]')).not.toBeNull()
    expect(view.queryByRole('button', { name: zh['pet.close'] })).toBeTruthy()
  })

  it('pokes on a direct click: happy action and a quote bubble', () => {
    const view = render(<Pet t={t} />)
    const pet = view.container.querySelector('[data-action]')!
    fireEvent.click(pet)
    expect(pet.getAttribute('data-action')).toBe('happy')
    expect(view.container.querySelector('[class*="bubble"]')).not.toBeNull()
  })
})
