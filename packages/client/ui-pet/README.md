# @deepseek-ai/dsh-client-ui-pet

English | [中文](README.zh.md)

Web desktop-pet feature owner: contributes one entry (`id: 'pet'`) to the frame-wide `shell.overlay` seat that [`dsh-client-ui-layout`](../ui-layout/README.md) declares — a draggable Ellen mascot that floats above every column and outside their scroll containers. The overlay layer is click-through and re-enables pointer events on its own entries, so the pet is draggable and its controls are clickable without ever blocking the app underneath.

The character is purely decorative. Position, the drag gesture, the active action, the frame index, hide/show, and the quote bubble live in component-local state: nothing is written to a store, nothing survives a reload, and no session, message, or tool state is read. The character is a frame animation over one sprite sheet served at `/Sprite_ailian.png` (an 8×4 grid of square frames: idle, walk, happy, sleep). A direct click plays the happy action and speaks a random line; a drag plays the walk action; after inactivity the pet falls asleep. Styling uses tokens only; copy goes through the package's own `pet` locale namespace.

## Model Experience

None, as the desktop pet is a decorative browser-side overlay that reads no session, message, or tool state and registers nothing model-facing.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **State is session-local** — position and hide/show are component-local, so both reset on reload; no setting persists them yet.
- **The sprite is a fixed shell asset** — the character ships from `apps/web/public/Sprite_ailian.png` rather than a package-owned asset, so the overlay references it by URL and any other shell must serve its own copy. The frame geometry is fixed in `Pet.tsx` (square frames, 8×4); a different sheet needs the constants updated alongside the asset.
