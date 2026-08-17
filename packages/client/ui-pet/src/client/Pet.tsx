/**
 * Desktop pet: a draggable Ellen mascot floating over the app through the
 * `shell.overlay` seat. Purely decorative — position, drag gesture, and
 * hide/show live in component-local state (no store, no session read). The
 * overlay layer is click-through, so the pet root opts back into pointer
 * events while the image stays inert so a drag never selects or opens it.
 */
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './Pet.module.css'

/** Composed props: the standard locale seat only (the pet reads nothing else). */
export type PetProps = PropsLocale<'pet'>

/** Inset the resting spot keeps from the viewport edges, in px. */
const INSET = 24
/** Rendered pet size used to back the resting spot into the corner. */
const PET_WIDTH = 140
const PET_HEIGHT = 92
/** Keep at least this many px on screen while dragging. */
const DRAG_MIN = 8
const DRAG_KEEP = 56

/**
 * Clamp one pixel coordinate between an inset and the viewport's near edge.
 * @param value - raw coordinate.
 * @param max - upper bound (near the right/bottom edge).
 * @returns the clamped coordinate.
 */
function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, DRAG_MIN), Math.max(DRAG_MIN, max))
}

/**
 * Render the desktop pet (or its restore pill once hidden).
 * @param props - locale seat for the control copy.
 * @returns the floating mascot element.
 */
export function Pet({ t }: PetProps) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(INSET, window.innerWidth - PET_WIDTH - INSET),
    y: Math.max(INSET, window.innerHeight - PET_HEIGHT - INSET),
  }))
  const [hidden, setHidden] = useState(false)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ originX: 0, originY: 0, startX: 0, startY: 0 })

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { originX: pos.x, originY: pos.y, startX: event.clientX, startY: event.clientY }
    setDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    setPos({
      x: clamp(drag.current.originX + event.clientX - drag.current.startX, window.innerWidth - DRAG_KEEP),
      y: clamp(drag.current.originY + event.clientY - drag.current.startY, window.innerHeight - DRAG_KEEP),
    })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  if (hidden) {
    return (
      <button type="button" className={css.restore} onClick={() => { setHidden(false) }} aria-label={t('pet.restore')}>
        {t('pet.restoreLabel')}
      </button>
    )
  }

  return (
    <div
      className={css.pet}
      data-dragging={dragging || undefined}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <img className={css.img} src="/ailian.png" alt="" draggable={false} />
      <button type="button" className={css.close} onClick={() => { setHidden(true) }} aria-label={t('pet.close')}>
        ×
      </button>
    </div>
  )
}
