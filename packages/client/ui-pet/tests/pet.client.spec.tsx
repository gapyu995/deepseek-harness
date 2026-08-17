// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Pet } from '../src/client/Pet.tsx'
import type { PetProps } from '../src/client/Pet.tsx'
import { zh, type PetKey } from '../src/client/locales.ts'

const t: PetProps['t'] = (key) => zh[key as PetKey]

afterEach(cleanup)

describe('Pet', () => {
  it('renders the Ellen image and dismisses to the restore pill via the close control', () => {
    const view = render(<Pet t={t} />)
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/ailian.png')
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    expect(view.container.querySelector('img')).toBeNull()
    expect(view.getByRole('button', { name: zh['pet.restore'] })).toBeTruthy()
  })

  it('restores the pet from the pill', () => {
    const view = render(<Pet t={t} />)
    fireEvent.click(view.getByRole('button', { name: zh['pet.close'] }))
    fireEvent.click(view.getByRole('button', { name: zh['pet.restore'] }))
    expect(view.container.querySelector('img')).not.toBeNull()
    expect(view.queryByRole('button', { name: zh['pet.close'] })).toBeTruthy()
  })
})
