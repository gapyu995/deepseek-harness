# Agent Note: Ellen accent skin — a persisted accent over a stylesheet attribute

Status: implemented

English | [中文](2026-08-28-ellen-style-skin.zh.md)

## Problem

The web client has one visual identity: the `--dsw-*` alias tokens ship a neutral palette with DeepSeek-blue business accents, and the only user-facing theme control is the light/dark/system color-scheme preference. There is no way to give the UI a different look without a third-party plugin registering a theme (an in-process, non-persisted extension) or hand-editing the token sheets. A requested "make it look like Ellen" (绝区零 艾莲) needs a shipped, persisted accent plus a settings switch to flip between it and the native palette.

## Decision

Model the accent as a second durable theme preference — `ui-theme.accent: 'native' | 'ellen'` — orthogonal to `ui-theme.preference` (light/dark/system), and mount it through a `body[data-ds-ellen-theme]` attribute over a dedicated `ellen.css` stylesheet.

- `theme-settings.ts` widens the `ui-theme` section with `accent` (schema default `native`). The default means existing documents migrate silently: the host resolves `accent` before it crosses the wire, so no on-disk format bump.
- `src/styles/ellen.css` replaces the `--dsw-static-deepseek-*` scale with Ellen's coral red (per `ellen-ui-design.md`: `#D94F63` light / `#EA808E` dark, the 50–900 steps down to `#3E2126`), and maps the brand primary to deepseek-500/400 by mode. Because every semantic alias resolves the deepseek scale through `var()`, business states, bubbles, and info buttons recolor automatically; the sheet must follow `design-platform.css` because both redefine that scale under equal-specificity attribute selectors and later source order wins the tie.
- `ThemeRuntime` gains `setAccent`, publishes `accent` on the snapshot, and never folds the accent into `active.tokens` — it is a stylesheet attribute, not an override layer. `setTheme`/`setAccent` write through the settings scope; `adopt` reads both back.
- `AppearanceRow` renders a second "风格" (Style) row of two cubes (原生/艾莲) under the existing 外观 row; the settings store mirrors both `preference` and `accent`.
- The presenter toggles `body[data-ds-ellen-theme]` from `snapshot.accent`, and the host bootstrap toggles it before the plugin tree mounts, so an accent selection never flashes the native palette.

## Testing

`theme.client.spec.ts` covers `setAccent`, that the accent never enters `active.tokens`, adoption, and that override layers compose independently; `boot-theme.client.spec.ts` covers the pre-plugin `data-ds-ellen-theme` toggle; `appearance-row.client.spec.tsx` covers the second row's selection and write routing; `settings-store`, `apply`, `host`, and `client-styles` specs cover the widened mirror, schema, and the added `ellen.css` sheet. `packages/client/ui-layout/tests/theme-presenter.client.spec.ts` covers the presenter's `data-ds-ellen-theme` projection and retraction.

## Alternatives considered

- **Fold the accent as an inline token layer (the first pass)** — a `ThemeTokenOverrides`-shaped palette applied as inline CSS variables on `body`. It works, but it duplicates the alias layer and reimplements what the existing `body[data-ds-dark-theme]` attribute mechanism already does; overriding the static scale once in `ellen.css` is fewer moving parts and keeps the accent inspectable as stylesheet source.
- **Register `ellen` as a third-party-style theme via `ThemeRuntime.register`** — a theme has a single `colorScheme` (light or dark) and its id is in-process and non-persisted, so this would force a dark-only skin or two registered ids with no durable preference. The accent path keeps light/dark/system intact underneath and persists through the schema.
- **Reuse `state-error`/`state-warn` for Ellen's red** — the red eyes/ribbon are iconic, but borrowing error or warning semantics for a decorative red would make real errors and warnings illegible. The brand accent (`--dsw-alias-brand-primary`) carries the red instead, and the state tokens stay untouched.

## Consequences

One `accent` field rides the existing `ui-theme` namespace (schema-defaulted, so no migration), and the accent is one stylesheet attribute rather than a registered theme — tuning it is an `ellen.css` edit plus a snapshot. The appearance row owns two sub-rows mirroring one store, and both the presenter and the host bootstrap toggle the attribute, so pre-plugin and post-activation paint match. Cost accepted: the accent recolors the whole deepseek scale (any component that consumes it turns coral red, which is the point), and `ThemeSnapshot` consumers (ui-layout, the appearance store) carry one more field.
