## Why

The `Boards` module has drifted from the file/folder conventions used by `Layout` and `Home`. Folders are split between real feature folders (`Board`, `List`, `Phases`, `Task`) and category buckets that group by layer instead of domain (`Presentation`, `Shared`, `Drag`). Sub-components use named exports with no per-folder `index.ts` barrel, so callers import deep file paths instead of a folder. Routes are defined twice — `shared/routes.ts` holds wouter patterns while `shared/BoardsPath.ts` re-declares the same segments as URL builders, and `Header.tsx` hardcodes a third set as string literals.

On top of that, several components are oversized and weld presentation, composition, and behavior together. Five files carry `// oxlint-disable eslint/complexity` as a standing admission: `Boards.tsx`, `Phases/PhasesView.tsx` (659 lines), `Index/BoardsIndex.tsx` (442), `List/ListView.tsx` (382), and `Phases/PhaseLane.tsx` (253). The suppression hides the problem instead of fixing it.

This is an internal restructuring. It preserves all shipped behavior — no user-facing change — so no capability specs change.

## What Changes

Two steps, no behavior change:

**Step 1 — mechanical (naming, exports, routes):**
- Unify routes: delete `shared/BoardsPath.ts`; add URL builders to `shared/routes.ts` derived from the same path segments as the wouter patterns, so pattern and builder can't drift. Update the ~6 import sites and the hardcoded literals in `Header.tsx`.
- Dissolve category buckets: hoist generics (`usePointerDrag`, `DeletePopover`, `Scrollbars.module.css`) to `@/common`; move `NewTaskEntry` to `Task/`; rename `Presentation/` to `Appearance/` with `Appearance`/`IconPicker`/`ColorPicker`.
- Adopt feature-folder conventions: drop the redundant `View` suffix (`BoardView`→`Board`, `ListView`→`List`, `PhasesView`→`Phases`), make each folder's primary component a `default` export whose filename matches it, and add an `index.ts` barrel (`export { default } from "./X"`) per feature folder. Rename the `Index/` bucket to `Browse/`.

**Step 2 — extractions (separate presentation / composition / behavior):**
- Split `PhasesView` into pure domain (`lanes.ts`), behavior hooks (`usePhaseKeyboard`, `phaseCommands`, drag config), presentation (`LaneControls`, `PhaseStrip`), and a thin composition root.
- Split `BoardsIndex`/`Browse` into presentation (`ResourceButton`, `InlineName`), behavior (`useBrowseKeyboard`), and pure helpers (`slugify`, `typing`).
- Apply the same treatment to `ListView` and `PhaseLane`.
- Extract a `useBoardData` hook from `Boards.tsx` for load orchestration + guard state.
- Remove all five `oxlint-disable eslint/complexity` suppressions once each file is under threshold.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
_(none — pure refactor; all board behavior preserved, no spec deltas)_

## Impact

- `packages/web/shared/routes.ts` — add URL builders.
- `packages/web/shared/BoardsPath.ts` — deleted.
- `packages/web/app/Boards/**` — folder renames, file renames, export style, barrels, and component splits.
- `packages/web/app/common/` — gains `usePointerDrag`, `DeletePopover`, `Scrollbars.module.css`, and small helpers (`slugify`, `typing`).
- `packages/web/app/Layout/Header.tsx` — route literals replaced with builders.
- All Boards import sites updated to barrels / new locations.
- No changes to `openspec/specs/**` (behavior preserved). No README task (conventions are developer-facing, not documented in README).
