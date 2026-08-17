# @deepseek-ai/dsh-client-ui-pet

English | [中文](README.zh.md)

Web desktop-pet feature owner: contributes one entry (`id: 'pet'`) to the frame-wide `shell.overlay` seat that [`dsh-client-ui-layout`](../ui-layout/README.md) declares — a draggable Ellen mascot that floats above every column and outside their scroll containers. The overlay layer is click-through and re-enables pointer events on its own entries, so the pet is draggable and its controls are clickable without ever blocking the app underneath.

The character is purely decorative. Position, the drag gesture, and hide/show live in component-local state: nothing is written to a store, nothing survives a reload, and no session, message, or tool state is read. The mascot image is a static shell asset served at `/ailian.png`; a hover-revealed close control hides it for the session, and a small restore pill in the corner brings it back. Idle animation rides the shared `--ds-*` motion tokens and respects `prefers-reduced-motion`. Styling uses tokens only; copy goes through the package's own `pet` locale namespace.

## Model Experience

None, as the desktop pet is a decorative browser-side overlay that reads no session, message, or tool state and registers nothing model-facing.

#### KV Cache effect

None; the package never assembles or sends provider requests.

## Known Limitations and Deferred Work

- **State is session-local** — position and hide/show are component-local, so both reset on reload; no setting persists them yet.
- **The image is a fixed shell asset** — the character ships from `apps/web/public/ailian.png` rather than a package-owned asset, so the overlay references it by URL and any other shell must serve its own copy.
