# Agent Note: Workspace multi-select archive

Status: implemented

English | [中文](2026-08-28-workspace-multi-select-archive.zh.md)

## Problem

The workspace browser archives one session at a time through the row ellipsis menu's Archive action. Cleaning up many sessions means repeating the gesture per row, and the browser has no selection surface.

## Decision

Add a client-side multi-select mode over the existing per-session archive action, without widening the workspace wire protocol.

- A `Select` header action enters select mode: non-blank session rows become checkbox toggles (`aria-selected` reflects the check), the header swaps to a bulk bar (`Select all` / `Archive` / `Cancel`), and search, view options, add, row menus, and drag are suppressed while it is active. Blank New Session rows never join the selection (there is nothing to archive).
- `Select all` checks every non-blank, non-archived session id in the live session list.
- `Archive` commits the checked set sequentially — `await archiveSession(id)` per id, not `Promise.all` — because each archive is a registry read-modify-write; concurrent commits could each echo a set missing the others' memberships. The loop exits the mode first, then awaits each write; failures stay non-fatal console diagnostics like the single-row archive.

## Alternatives considered

- **Batch host endpoint (`workspace.archiveSessions`)** — an atomic single-RPC commit, but it widens the API remotes contract, the host workspaces service, and the runtime workspaces face for a low-frequency bulk gesture. The sequential client loop is already correct because the per-session action is idempotent and each response echoes the full set.
- **Concurrent `Promise.all` over the selected ids** — fewer round-trips, but the read-modify-write race can drop memberships from the last echo; sequential commits preserve the set.

## Consequences

Bulk archive is a viewing-state addition in `ui-workspace` only: no service, wire, or persistence change, so remote browsers and the object layer are unaffected. Selection is component-local and resets on exit; entering select mode clears the search query so the two surfaces never mix. Cost: archiving N sessions issues N sequential RPCs (fine for sidebar-scale counts), and the mode is wide-only — the collapsed rail keeps its two existing controls.
