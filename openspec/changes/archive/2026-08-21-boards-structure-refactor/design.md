## Context

`Layout` and `Home` establish the module conventions for this app: one feature folder per area, a primary component exported as `default` whose filename matches it, an `index.ts` barrel re-exporting that default (`export { default } from "./X"`), and supporting files colocated in the same folder. Generic, cross-cutting helpers live in lowercase `@/common` with filenames matching their export (`Icon.tsx`, `useKeyboardShortcuts.ts`, `call.ts`).

`Boards` predates consistent application of these rules. It mixes feature folders with category buckets, uses named exports without barrels, duplicates route definitions, and concentrates too many concerns in a few large components. `usePointerDrag` and `TaskMovement.ts` show the intended direction (behavior and pure domain already extracted) — this change applies that direction uniformly.

Patterns to preserve:
- Valtio store `useBoardsView` / `useBoards` for board state and mutations.
- `usePointerDrag` hook for pointer-based drag-and-drop.
- `TaskMovement` anchor helpers for move math.
- CSS Modules for component styles.
- The `export default function X` + `export namespace X { Props }` shape (already used by `Boards.tsx`).
- Mantine theme tokens.

## Goals / Non-Goals

**Goals:**
- One source of truth for board URLs; no hardcoded route literals.
- Every `Boards` folder is a feature folder (domain-named), never a layer bucket.
- Each feature folder: primary `default` export, matching filename, `index.ts` barrel.
- No file carries `oxlint-disable eslint/complexity`.
- Presentation, composition, and behavior separated into their own units.

**Non-Goals:**
- No behavior change, visible or keyboard. This is a refactor.
- No backend, API, model, or schema change.
- No spec/capability changes.
- No new dependencies.
- No change to the styling system (`.module.css` stays; the `.css.ts` vs `.module.css` split in the app is out of scope).
- Selection/focus state stays where it is — the imperative `document.querySelector`/`sessionStorage` focus coordination is a known deeper issue tracked for a later change, not touched here.

## Decisions

1. **Routes: builders derive from segments, colocated in `routes.ts`.**
   Keep `routes` (the wouter `:param` patterns) for `<Route path>`. Add a `path` builder namespace in the same file, both computed from shared segment constants so a pattern and its builder cannot diverge. Delete `shared/BoardsPath.ts`. Call-site mapping: `BoardsPath.index` → `path.boards.index`, `BoardsPath.workspace(w)` → `path.boards.workspace(w)`, `BoardsPath.board(w,b)` → `path.boards.board(w,b)`, `BoardsPath.task(w,b,t)` → `path.boards.task(w,b,t)`. `Header.tsx` string literals (`"/"`, `"/family"`, …) become `routes`/`path` references.

2. **Category buckets dissolve by destination, not by rename.**
   - `Drag/usePointerDrag.ts` → `@/common/usePointerDrag.ts` (generic, 5 importers).
   - `Shared/DeletePopover.tsx` → `@/common/DeletePopover.tsx` (generic, 6 importers).
   - `Shared/Scrollbars.module.css` → `@/common/Scrollbars.module.css` (generic, 3 importers).
   - `Shared/NewTaskEntry.tsx` (+ `.module.css`) → `Task/NewTaskEntry.tsx` (task creation control, used by List and Phases).
   The `Shared/` and `Drag/` folders are removed.

3. **`Presentation/` → `Appearance/`.**
   The folder edits a resource's icon + color = its appearance; the old name also collides with the presentation-vs-container vocabulary. `PresentationSelector` (the public combined picker, 4 importers) → `Appearance`; `IconSelector` → `IconPicker`; `ColorSelector` → `ColorPicker` (both internal-only). CSS module renamed to `Appearance.module.css`. Barrel exports `Appearance`.

4. **Drop the `View` suffix; folder name is the component name.**
   `Board/BoardView.tsx` → `Board/Board.tsx`, `List/ListView.tsx` → `List/List.tsx`, `Phases/PhasesView.tsx` → `Phases/Phases.tsx`. Each `.module.css` renamed to match. The `export namespace` renames with the component.

5. **`Index/` → `Browse/`.**
   `Index` is the one bucket whose name is both weak and clashes with the `index.ts` barrel it would contain. The area browses workspaces and boards → `Browse/`, primary `Browse.tsx` (from `BoardsIndex`), with `WorkspaceDrawer` colocated. This is the one naming judgment call; if `Browse` is not preferred, `Landing` or keeping `BoardsIndex` as the component name inside a differently-named folder are alternatives.

6. **Per-folder barrels + default exports.**
   Each feature folder (`Board`, `List`, `Phases`, `Task`, `Browse`, `Appearance`) gets `index.ts` = `export { default } from "./<Primary>"`. Primary components switch from named to `default` export; memoized primaries use `const X = memo(...); export default X`. Callers import the folder (`import Board from "@/Boards/Board"`) rather than a deep file path. Non-primary siblings (drawers, rows, cards, selectors) keep named exports and are imported by explicit path.

7. **`PhasesView` split (659 → ~60 line composition root).**
   - `Phases/lanes.ts` — pure: `makeLanes`, `laneDestination`, `Lane` type. No React.
   - `Phases/usePhaseKeyboard.ts` — behavior: arrow/selection nav (`selectVertical/Horizontal`, `focusTask`, `focusNewTask`, `moveSelected`, `selectedPosition`, `visibleLanes`) and the `useKeyboardShortcuts` wiring.
   - `Phases/phaseCommands.ts` — the `PhaseLaneCommands` builder.
   - `Phases/usePhaseDrag.ts` — the `usePointerDrag` config (`resolveTarget`, `onDrop`, handle maps).
   - `Phases/LaneControls.tsx` — presentation: the show/hide/add-phase toolbar.
   - `Phases/PhaseStrip.tsx` — presentation: the scroller + lane map.
   - `Phases/Phases.tsx` — composition: wire store + hooks, render the three above.

8. **`BoardsIndex` split.**
   - `Browse/ResourceButton.tsx`, `Browse/InlineName.tsx` — presentation (already pure, currently inlined at file bottom).
   - `Browse/useBrowseKeyboard.ts` — behavior: `workspaceKeys` / `boardKeys`.
   - `@/common` helpers — `slugify`, `typing` (pure, generic; verify no existing duplicate before adding).
   - `Browse/Browse.tsx` — composition: the two panes + drawer.

9. **`ListView` and `PhaseLane` splits.**
   Same three-layer treatment: extract pure helpers and any keyboard/behavior into hooks, pull large presentational subtrees into their own files, leave a thin composition root. Exact seams determined during implementation; the acceptance bar is the removed complexity suppression.

10. **`Boards.tsx` → `useBoardData`.**
    Extract the three load `useEffect`s plus the derived guard state (loading / error / workspace-not-found / invalid-task / ready) into `useBoardData(workspace, board)` returning a discriminated result. `Boards.tsx` renders guards off that result and routes between `Board` and `Browse`.

11. **Remove suppressions last.**
    Delete each `// oxlint-disable eslint/complexity` only after its file is split and passes the lint clean, so the lint stays a live signal rather than being disabled preemptively.

## Risks / Trade-offs

- **Wide import churn** → Barrels plus renames touch many import sites. Mitigation: land Step 1 as its own reviewable unit (pure moves, zero behavior change), verified by typecheck + build + existing tests before Step 2 begins.
- **Behavior drift during extraction** → Splitting keyboard/drag logic risks subtle regressions. Mitigation: move code verbatim into the new units first, wire it back unchanged, then simplify only if trivially safe; keep each component's split as a small behavior-preserving reshape, not a rewrite.
- **`Index`→`Browse` naming** → A judgment call others may dislike. Mitigation: flagged for confirmation (Decision 5); trivially swappable before Step 1 lands.
- **Barrel import cycles** → Folder barrels can introduce cycles if a sibling imports the folder. Mitigation: siblings import each other by explicit file path, not via the barrel; the barrel is for external callers only.
