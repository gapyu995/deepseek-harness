---
name: dsh-merging-upstream
description: Use when updating this local personalized DeepSeek Harness checkout from the official upstream repository while keeping every local customization — when the user asks to 从 GitHub 更新 harness, 合并官方上游, 同步 upstream, update to a newer official release, or "update my deepseek-harness". Preserves both histories by landing a dual-parent merge commit (official parent + local parent) on a dedicated update branch; never use `git pull` over the working tree, never overwrite the new tree with the old one.
---

# Merging official upstream into the personalized checkout

Update the personalized checkout by keeping the local history and merging the official upstream in — never by `git pull` over the working tree and never by replacing the new files with the old ones. The update lands as a real merge commit with two parents (official and local), so both histories survive and the result is a normal, pushable commit.

## Remote layout

- `origin` / `public` — the personal fork (e.g. `https://github.com/gapyu995/deepseek-harness.git`)
- `upstream` — the official repository (`https://github.com/deepseek-ai/deepseek-harness.git`)

Fetch the update from `upstream` (official) only; never treat the personal fork as the upstream source. Confirm the layout before starting with `git remote -v`.

## 1. Back up local state first

Pin a backup branch to the pre-update `master` so the original state can be restored completely if the merge goes wrong:

```sh
git branch backup/local-before-upstream master
```

Record the current `master` commit (e.g. `576ce68b9`). The backup branch must stay pinned there for the whole procedure.

## 2. Fetch the official upstream

```powershell
git fetch upstream master --tags
```

This only downloads Git objects and updates remote-tracking refs; it does not touch the working tree. Record the baseline: the fetched `upstream/master` commit (e.g. `b150a551b`) and the matching version tag (e.g. `dsh-v0.1.1-rc.2`).

GitHub connections can be unstable; prefer small requests and retry rather than one large fetch. If a scratch clone (e.g. `D:\deepseek-harness-upstream-tmp`) exists but is incomplete — invalid HEAD, or hung clone/fetch processes — do not use it as the upstream source; fetch through the configured `upstream` remote instead. Clean up only leftover lock/pack residue in the scratch clone; do not delete the temp directory.

## 3. Work on a dedicated update branch

Create `update/upstream-<version>` so `master` stays untouched until verification:

```sh
git checkout -b update/upstream-0.1.1-rc.2 upstream/master
```

## 4. Merge, preserving both histories

Land the local history into the update branch as a dual-parent merge commit (official parent + local parent):

```sh
git merge master
```

The merge base is the common baseline (e.g. `47f9438`) the local branch diverged from. Re-apply the local customizations' diff onto the official structure during conflict resolution — never overwrite the whole new tree with the old directory.

## 5. Reconcile architecture changes

The official release may rework structures the local customizations hang off. For `0.1.1-rc.2`:

- Old `web-react` / `AppRoot` structure became `ui-renderer` / `ui-slots`; new UI modules appeared (model configuration, workspace, attachments, references, tasks, permissions); old files were deleted or reorganized.
- Migrate each local customization item by item onto the new structure:
  - desktop pet `ui-pet`
  - Ellen / DeepSeek sprites and icons
  - Ellen theme — hook into the new dynamic theme-injection mechanism (`?inline` style imports) instead of the old static loading
  - desktop launch script (e.g. `scripts/dsh-web-desktop.ps1`)
  - PDF→Word skill — if `pnpm typecheck` reports TS6307, register the package in `tsconfig.host.json` `references`
  - DeepSeek reasoning metadata (e.g. `llm-deepseek` adapter reasoning-effort mapping)
  - local README / bundle / config edits
- Example: a boot-animation customization that no longer fits the old structure moves to `packages/client/web/src/boot-page.module.css`.
- After resolving, verify each user-owned file set is preserved (diff them against the backup branch; differences must be only the necessary adaptations).

## 6. Verify before landing

- `git diff --cached --check` — no whitespace errors.
- Run the targeted test files covering the touched surfaces (theme, web client styles, pet, LLM DeepSeek adapter, PDF→Word skill) — e.g. 7 files / 166 tests passing.
- Package build for the changed packages (e.g. `ui-pet`).
- Targeted `oxlint` on changed files.
- Full `pnpm run build` — `lib/` artifacts are build products and are not part of the Git source update; client bundles such as `packages/client/ui-renderer/lib/client.js` are generated only by the build. A fresh merge must build before the web app can run.
- Start the app: `pnpm dsh web` → expect `dsh web: http://127.0.0.1:3080`.

## 7. Land on master

Only after verification passes, fast-forward `master` to the verified update branch:

```sh
git checkout master
git merge --ff-only update/upstream-0.1.1-rc.2
```

Expected end state:

- `master` at the dual-parent merge commit, `master...origin/master [ahead N]` — contains the official update and the local modifications, but nothing is pushed.
- `backup/local-before-upstream` and `update/upstream-<version>` kept.
- No `git push` performed; the remote repository is not modified unless the user asks.

## Checklist

- [ ] Remotes confirmed: `upstream` points at `deepseek-ai/deepseek-harness`; fetch from it, not from the fork.
- [ ] `backup/local-before-upstream` pinned to the pre-update `master`.
- [ ] `git fetch upstream master --tags` succeeded; baseline `upstream/master` SHA and version tag recorded.
- [ ] `update/upstream-<version>` holds a dual-parent merge commit (official parent + local parent).
- [ ] Every local customization migrated onto the new structure and verified present (diff vs backup shows only necessary adaptations).
- [ ] Whitespace check clean; targeted tests pass; `pnpm run build` succeeds; `pnpm dsh web` serves.
- [ ] `master` fast-forwarded to the verified merge commit; backup and update branches kept.
- [ ] No push performed; remote untouched.
