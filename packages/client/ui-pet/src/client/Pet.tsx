/**
 * Desktop pet: a draggable Ellen mascot floating over the app through the
 * `shell.overlay` seat. The character is a frame animation over one sprite
 * sheet — the Ellen or DeepSeek sheet, picked by the theme accent — and every
 * behavior — position, drag gesture,
 * hide/show, action, frame, and the quote bubble — lives in component-local
 * state (no store, no session read). Actions: idle (row 0), walk while
 * dragged (row 1), a one-shot happy bounce on click (row 2), and sleep after
 * inactivity (row 3). A direct click also speaks a random line from the quote
 * pool. The overlay layer is click-through, so the pet root opts back into
 * pointer events while the sprite stays inert so a drag never selects it.
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PropsLocale, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createPetStore } from './settings-store.ts'
import css from './Pet.module.css'

/** Composed props: the locale seat plus the accent store (to pick the sprite sheet). */
export type PetProps = PropsLocale<'pet'> & PropsStore<ReturnType<typeof createPetStore>>

/** Sprite sheet geometry: a uniform 8×4 grid of square frames (1774×887). */
const COLS = 8
const ROWS = 4
const FRAME_RATIO = 1

/** Inset the resting spot keeps from the viewport edges, in px. */
const INSET = 24
/** Rendered sprite width; height follows {@link FRAME_RATIO}. */
const PET_WIDTH = 128
/** Keep at least this many px on screen while dragging. */
const DRAG_MIN = 8
const DRAG_KEEP = 56
/** Pointer travel beyond which a gesture counts as a drag, not a click. */
const CLICK_SLOP = 4
/** How long the quote bubble and the sleep idle last, in ms. */
const BUBBLE_MS = 3500
const BUBBLE_OUT_MS = 150
const SLEEP_MS = 30000
/** How long a press must hold before it counts as a long-press to sleep, in ms. */
const LONG_PRESS_MS = 500

/** One selectable action: which row it plays plus frame count and rate. */
type ActionName = 'idle' | 'walk' | 'happy' | 'sleep'

/** One animation frame: the column it starts at and how many columns it spans. */
interface FrameSpec {
  col: number
  span: number
}

/** Build a uniform row of `count` single-column frames starting at column 0. */
function strip(count: number): readonly FrameSpec[] {
  return Array.from({ length: count }, (_, index) => ({ col: index, span: 1 }))
}

const ACTIONS: Record<ActionName, { row: number; frames: readonly FrameSpec[]; fps: number }> = {
  idle: { row: 0, frames: strip(8), fps: 6 },
  walk: { row: 1, frames: strip(8), fps: 10 },
  happy: { row: 2, frames: strip(8), fps: 10 },
  sleep: { row: 3, frames: strip(8), fps: 1 },
}

/** Sleep-row horizontal display offsets (px), keyed by accent then frame index.
 * The DeepSeek sheet's frames 5-7 and the Ellen sheet's frames 6-7 are drawn
 * off-grid to the left. */
const SLEEP_OFFSETS: Readonly<Record<string, Readonly<Record<number, number>>>> = {
  ellen: { 5: -15, 6: -7 },
  native: { 4: -5, 5: -15, 6: -5 },
}

/** Vertical display offset (px) applied to every frame, keyed by accent: the
 * Ellen sheet's frames sit 10px low, so shift them up; DeepSeek stays put. */
const SHEET_OFFSET_Y: Readonly<Record<string, number>> = {
  ellen: -10,
  native: 0,
}

/** Extra vertical offset (px) per row, keyed by accent then row index: the
 * Ellen happy (row 2) and sleep (row 3) rows sit another 5px low; DeepSeek
 * stays put. */
const ROW_OFFSET_Y: Readonly<Record<string, Readonly<Record<number, number>>>> = {
  ellen: { 2: -15, 3: -15 },
  native: {},
}

/** Quote keys the pet speaks on a direct click. */
const QUOTE_KEYS = [
  'pet.quote.1', 'pet.quote.2', 'pet.quote.3', 'pet.quote.4', 'pet.quote.5', 'pet.quote.6',
] as const

/**
 * Clamp one pixel coordinate between the drag inset and the viewport's near edge.
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
export function Pet({ t, useStore }: PetProps) {
  const accent = useStore(s => s.accent)
  const [pos, setPos] = useState(() => ({
    x: Math.max(INSET, window.innerWidth - PET_WIDTH - INSET),
    y: Math.max(INSET, window.innerHeight - Math.round(PET_WIDTH / FRAME_RATIO) - INSET),
  }))
  const [hidden, setHidden] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [action, setAction] = useState<ActionName>('idle')
  const [frame, setFrame] = useState(0)
  const [bubble, setBubble] = useState<{ text: string; seq: number } | null>(null)
  const [bubbleClosing, setBubbleClosing] = useState(false)
  const drag = useRef({ originX: 0, originY: 0, startX: 0, startY: 0, moved: false })
  const bubbleTimer = useRef<number | null>(null)
  const bubbleCloseTimer = useRef<number | null>(null)
  const bubbleSeq = useRef(0)
  const sleepTimer = useRef<number | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const longPressed = useRef(false)

  // Advance the frame for the active action; reduced motion freezes frame 0.
  useEffect(() => {
    const spec = ACTIONS[action]
    setFrame(0)
    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => { setFrame(current => (current + 1) % spec.frames.length) }, 1000 / spec.fps)
    return () => { window.clearInterval(id) }
  }, [action])

  // Happy is a one-shot: revert to idle once its frames have played.
  useEffect(() => {
    if (action !== 'happy') return
    const spec = ACTIONS.happy
    const id = window.setTimeout(() => { setAction('idle') }, (spec.frames.length / spec.fps) * 1000)
    return () => { window.clearTimeout(id) }
  }, [action])

  // Arm the initial sleep timer and release every timer on unmount.
  useEffect(() => {
    sleepTimer.current = window.setTimeout(() => { setAction('sleep'); sleepTimer.current = null }, SLEEP_MS)
    return () => {
      if (bubbleTimer.current !== null) window.clearTimeout(bubbleTimer.current)
      if (bubbleCloseTimer.current !== null) window.clearTimeout(bubbleCloseTimer.current)
      if (sleepTimer.current !== null) window.clearTimeout(sleepTimer.current)
      if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
    }
  }, [])

  const armSleep = (): void => {
    if (sleepTimer.current !== null) window.clearTimeout(sleepTimer.current)
    sleepTimer.current = window.setTimeout(() => { setAction('sleep'); sleepTimer.current = null }, SLEEP_MS)
  }

  const clearSleep = (): void => {
    if (sleepTimer.current !== null) {
      window.clearTimeout(sleepTimer.current)
      sleepTimer.current = null
    }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      originX: pos.x, originY: pos.y, startX: event.clientX, startY: event.clientY, moved: false,
    }
    setDragging(true)
    clearSleep()
    setAction('walk')
    longPressed.current = false
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      setAction('sleep')
      longPressed.current = true
      longPressTimer.current = null
    }, LONG_PRESS_MS)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    if (Math.abs(event.clientX - drag.current.startX) + Math.abs(event.clientY - drag.current.startY) > CLICK_SLOP) {
      drag.current.moved = true
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
    setPos({
      x: clamp(drag.current.originX + event.clientX - drag.current.startX, window.innerWidth - DRAG_KEEP),
      y: clamp(drag.current.originY + event.clientY - drag.current.startY, window.innerHeight - DRAG_KEEP),
    })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setDragging(false)
    if (!longPressed.current) {
      setAction('idle')
      armSleep()
    }
  }

  const poke = (): void => {
    setAction('happy')
    armSleep()
    const quote = QUOTE_KEYS[Math.floor(Math.random() * QUOTE_KEYS.length)] ?? 'pet.quote.1'
    bubbleSeq.current += 1
    setBubble({ text: t(quote), seq: bubbleSeq.current })
    setBubbleClosing(false)
    if (bubbleTimer.current !== null) window.clearTimeout(bubbleTimer.current)
    if (bubbleCloseTimer.current !== null) window.clearTimeout(bubbleCloseTimer.current)
    bubbleTimer.current = window.setTimeout(() => {
      setBubbleClosing(true)
      bubbleCloseTimer.current = window.setTimeout(() => {
        setBubble(null)
        setBubbleClosing(false)
        bubbleCloseTimer.current = null
      }, BUBBLE_OUT_MS)
      bubbleTimer.current = null
    }, BUBBLE_MS)
  }

  if (hidden) {
    return (
      <button
        type="button"
        className={css.restore}
        onClick={() => {
          setHidden(false)
          setAction('idle')
          armSleep()
        }}
        aria-label={t('pet.restore')}
      >
        {t('pet.restoreLabel')}
      </button>
    )
  }

  const spec = ACTIONS[action]
  const frameSpec = spec.frames[frame] ?? spec.frames[0] ?? { col: 0, span: 1 }
  // The sheet is always scaled to one fixed 2:1 box (COLS×ROWS square cells at
  // PET_WIDTH), so a wide frame spans two columns without distorting the sheet.
  const backgroundSize = `${COLS * PET_WIDTH}px ${ROWS * PET_WIDTH}px`
  const offsetX = action === 'sleep' ? SLEEP_OFFSETS[accent]?.[frame] ?? 0 : 0
  const offsetY = (SHEET_OFFSET_Y[accent] ?? 0) + (ROW_OFFSET_Y[accent]?.[spec.row] ?? 0)
  const backgroundPosition = `${-frameSpec.col * PET_WIDTH + offsetX}px ${-spec.row * PET_WIDTH + offsetY}px`
  const width = PET_WIDTH * frameSpec.span
  const height = PET_WIDTH
  const spriteUrl = accent === 'ellen' ? '/Sprite_ailian.png' : '/Sprite_deepseek.png'

  return (
    <div
      className={css.pet}
      data-dragging={dragging || undefined}
      data-action={action}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(event) => {
        // A click lands only when the gesture stayed put (target === the root:
        // the inert sprite never reports itself as the target, and the close
        // control is skipped because it is not the root). A long-press that
        // already sent the pet to sleep is not a click either.
        const clicked = event.target === event.currentTarget && !drag.current.moved && !longPressed.current
        longPressed.current = false
        if (clicked) poke()
      }}
    >
      {bubble !== null && (
        <div key={bubble.seq} className={css.bubble} data-closing={bubbleClosing || undefined}>
          {bubble.text}
        </div>
      )}
      <div className={css.sprite} style={{ width, height, backgroundSize, backgroundPosition, backgroundImage: `url(${spriteUrl})` }} />
      <button type="button" className={css.close} onClick={() => { setHidden(true) }} aria-label={t('pet.close')}>
        ×
      </button>
    </div>
  )
}
