# Step 1 — Naming, exports, routes (mechanical, no behavior change)

## 1. Unify routes

- [x] 1.1 Add path-segment constants + a `path` builder namespace to `packages/web/shared/routes.ts` (`path.boards.index`, `.workspace(w)`, `.board(w,b)`, `.task(w,b,t)`), derived from the same segments as the `routes` patterns.
- [x] 1.2 Replace `BoardsPath.*` imports/calls with `path.boards.*` in `Layout/Header.tsx`, `Board/BoardView.tsx`, `Board/BoardDrawer.tsx`, `Index/WorkspaceDrawer.tsx`, `Index/BoardsIndex.tsx`, `Task/TaskDrawer.tsx`.
- [x] 1.3 Replace hardcoded route string literals in `Layout/Header.tsx` (`"/"`, `"/family"`, …) with `routes`/`path` references.
- [x] 1.4 Delete `packages/web/shared/BoardsPath.ts`.
- [x] 1.5 Typecheck passes; no remaining references to `BoardsPath`.

## 2. Dissolve category buckets (`Drag/`, `Shared/`)

- [x] 2.1 Move `Boards/Drag/usePointerDrag.ts` → `common/usePointerDrag.ts`; update 5 importers (`Phases/PhaseLane`, `Phases/TaskCard`, `List/ListView`, `List/TaskRow`, `Phases/PhasesView`).
- [x] 2.2 Move `Boards/Shared/DeletePopover.tsx` → `common/DeletePopover.tsx`; update 6 importers.
- [x] 2.3 Move `Boards/Shared/Scrollbars.module.css` → `common/Scrollbars.module.css`; update 3 importers.
- [x] 2.4 Move `Boards/Shared/NewTaskEntry.tsx` (+ `.module.css`) → `Boards/Task/NewTaskEntry.tsx`; update importers (`List/ListView`, `Phases/PhaseLane`).
- [x] 2.5 Remove the now-empty `Boards/Drag/` and `Boards/Shared/` folders.

## 3. Rename `Presentation/` → `Appearance/`

- [x] 3.1 Rename folder `Boards/Presentation/` → `Boards/Appearance/`.
- [x] 3.2 `PresentationSelector.tsx` → `Appearance.tsx` (component `Appearance`, `default` export); `PresentationSelector.module.css` → `Appearance.module.css`.
- [x] 3.3 `IconSelector.tsx` → `IconPicker.tsx`; `ColorSelector.tsx` → `ColorPicker.tsx`; update their internal imports + css import path.
- [x] 3.4 Add `Boards/Appearance/index.ts` → `export { default } from "./Appearance"`.
- [x] 3.5 Update 4 `PresentationSelector` importers (`Board/BoardDrawer`, `Phases/InlinePhaseEditor`, `Phases/PhaseComposer`, `Index/WorkspaceDrawer`) to import `Appearance` from the barrel.

## 4. Feature-folder conventions (suffix, default exports, barrels)

- [x] 4.1 `Board/BoardView.tsx` → `Board/Board.tsx` (`default` export `Board`, rename `namespace`); `BoardView.module.css` → `Board.module.css`; add `Board/index.ts`.
- [x] 4.2 `List/ListView.tsx` → `List/List.tsx` (`default` export `List`); `ListView.module.css` → `List.module.css`; add `List/index.ts`.
- [x] 4.3 `Phases/PhasesView.tsx` → `Phases/Phases.tsx` (`default` export `Phases`); `PhasesView.module.css` → `Phases.module.css`; add `Phases/index.ts`.
- [x] 4.4 Rename folder `Index/` → `Browse/`; `BoardsIndex.tsx` → `Browse.tsx` (`default` export `Browse`); `BoardsIndex.module.css` → `Browse.module.css`; add `Browse/index.ts`; keep `WorkspaceDrawer` colocated.
- [x] 4.5 Add `Task/index.ts` re-exporting the folder's primary if one applies (Task has no single page-level primary — barrel only if a natural default exists; otherwise leave named exports).
- [x] 4.6 Update all importers to use folder barrels for primaries (`import Board from "@/Boards/Board"`, `import Phases from "@/Boards/Phases"`, etc.); non-primary siblings keep explicit-path named imports.
- [x] 4.7 Confirm no barrel import cycles (siblings import each other by file path, not via the barrel).

## 5. Verify Step 1

- [x] 5.1 `bun run` typecheck / build passes.
- [x] 5.2 Existing tests pass.
- [ ] 5.3 Manual smoke: navigate index → workspace → board → task; List and Phases views render; drawers open. No behavior change.

# Step 2 — Extractions (separate presentation / composition / behavior)

## 6. Split `Phases` (was `PhasesView`, 659 lines)

- [x] 6.1 Extract `Phases/lanes.ts` — pure `makeLanes`, `laneDestination`, `Lane` type (no React import).
- [x] 6.2 Extract `Phases/usePhaseKeyboard.ts` — selection/nav behavior (`selectVertical/Horizontal`, `focusTask`, `focusNewTask`, `moveSelected`, `selectedPosition`, `visibleLanes`, `scrollLaneIntoView`) + `useKeyboardShortcuts` wiring.
- [x] 6.3 Extract `Phases/phaseCommands.ts` — the `PhaseLaneCommands` builder.
- [x] 6.4 Extract `Phases/usePhaseDrag.ts` — `usePointerDrag` config (`resolveTarget`, `onDrop`) + handle maps.
- [x] 6.5 Extract `Phases/LaneControls.tsx` — the show/hide/add-phase toolbar (presentation).
- [x] 6.6 Extract `Phases/PhaseStrip.tsx` — the scroller + lane map (presentation).
- [x] 6.7 Reduce `Phases/Phases.tsx` to composition; remove its `oxlint-disable eslint/complexity`.

## 7. Split `Browse` (was `BoardsIndex`, 442 lines)

- [x] 7.1 Extract `Browse/ResourceButton.tsx` and `Browse/InlineName.tsx` (presentation).
- [x] 7.2 Extract `Browse/useBrowseKeyboard.ts` — `workspaceKeys` / `boardKeys`.
- [x] 7.3 Move pure helpers `slugify`, `typing` to `common/` (verify no existing duplicate first).
- [x] 7.4 Reduce `Browse/Browse.tsx` to composition; remove its `oxlint-disable eslint/complexity`.

## 8. Split `List` (was `ListView`, 382 lines)

- [x] 8.1 Extract pure helpers and any keyboard/behavior into `List/*` hooks.
- [x] 8.2 Pull large presentational subtrees into their own files; keep `TaskRow` as-is or split further if it carries behavior.
- [x] 8.3 Reduce `List/List.tsx` to composition; remove its `oxlint-disable eslint/complexity`.

## 9. Split `Phases/PhaseLane.tsx` (253 lines)

- [x] 9.1 Separate the lane's presentation from its behavior/handlers.
- [x] 9.2 Remove its `oxlint-disable eslint/complexity`.

## 10. Extract `Boards.tsx` data hook

- [x] 10.1 Add `Boards/useBoardData.ts` — the three load effects + derived guard state as a discriminated result (loading / error / workspace-not-found / invalid-task / ready).
- [x] 10.2 Reduce `Boards.tsx` to guard rendering + routing between `Board` and `Browse`; remove its `oxlint-disable eslint/complexity`.

## 11. Verify Step 2

- [x] 11.1 No file contains `oxlint-disable eslint/complexity`.
- [x] 11.2 Lint / typecheck / build pass with the suppressions removed.
- [x] 11.3 Existing tests pass.
- [ ] 11.4 Manual smoke across List and Phases: keyboard nav (arrows, Enter, F2, Delete, Ctrl+arrows), drag-and-drop, task/phase create, drawers. No behavior change.
