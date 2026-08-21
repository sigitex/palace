## Context

The boards interface ships with functional List and Phases views but several presentation and interaction details fall short of polished. Browser-default scrollbars clash with Mantine's appearance. Inline editing is verbose (Phase picker in list view, bulky cancel/add buttons in phase composer). New-task creation requires tabbing to the toolbar; there is no selectable new-task entry at list bottoms. Phases view drag-and-drop has poor horizontal auto-scroll, no scroll snap on keyboard column selection, and a perceptible delay between drop and move. List view tasks grow to multi-row bloat on narrow windows.

Existing patterns to preserve:
- `usePointerDrag` hook for drag-and-drop (native Pointer Events)
- `BoardsQuery.useMoveTask` for optimistic task moves (already works for List view)
- Valtio `BoardsState` for transient UI state
- CSS Modules for component styles
- Mantine theme tokens for colors, spacing, radii

## Goals / Non-Goals

**Goals:**
- Custom scrollbar styling matching Mantine's theme in board views
- Remove Phase selector from List view inline editor
- F2 activates inline rename for phases in Phases view
- Compact in-column new-task form (icon-only buttons, same row as input)
- Selectable new-task entry at bottom of List view and each Phases lane
- Improved horizontal auto-scroll during drag-over in Phases view
- Keyboard column selection snaps scroll position
- Optimistic drop + rollback for Phases view task moves
- List view tasks render as a single row on narrow windows

**Non-Goals:**
- No changes to backend API or database schema
- No changes to task drawer or board settings drawer
- No changes to touch interaction model
- No new external dependencies
- No changes to the Board index or workspace pages

## Decisions

1. **Scrollbar: CSS-only via Mantine tokens**
   Use `::-webkit-scrollbar` pseudo-elements with Mantine CSS variables (`--mantine-color-*`, `--mantine-radius-*`) rather than a JS-based scrollbar library. Keeps zero dependencies and follows existing CSS Module pattern. Apply globally to board views via a shared class.

2. **Inline editor Phase removal: conditional render**
   Pass a `showPhase` prop (default `true`) to `TaskComposer`. List view sets it `false`, Phases view sets it `true`. Avoids duplicating the composer component.

3. **Phase composer compact buttons: icon-only toolbar row**
   Change `PhaseComposer` cancel/add from separate buttons to `ActionIcon` siblings on the same row as the title input. Mantine `ActionIcon` with Phosphor icons (X, Check). This reduces vertical space to a single row.

4. **Bottom new-task entry: new `NewTaskEntry` component**
   A selectable row/card rendered last in List/phase collections. Shows a dimmed "+ Add task" placeholder. On click or Enter, focuses a `TaskComposer` inline. On arrow-down from last real task, selection moves to this entry. On arrow-up from this entry, selection moves to last real task. In Phases, empty lanes show only this entry, making them keyboard-navigable.

5. **Drag auto-scroll: edge detection in `usePointerDrag`**
   Add a configurable auto-scroll zone (px from edge) and speed to the drag hook. During `onDragMove`, if pointer is within the zone on a scrollable axis, start an animation frame loop that scrolls the container incrementally until the pointer leaves the zone or drop occurs. Only enable for horizontal scroll in Phases view.

6. **Keyboard column snap: `scrollIntoView` + `element.scrollLeft`**
   When arrow keys change the selected column (phase lane), call `laneRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })` and adjust the horizontal scroller position so the selected lane is fully in view.

7. **Optimistic drops: extend `useMoveTask` pattern to Phases**
   `PhasesView` already has access to the move mutation via `BoardsQuery.useMoveTask`. Wrap the drop handler with the same optimistic pattern used in List: `onMutate` applies `TaskMovement.apply()` to the query cache, `onError` rolls back. Add a brief visual indicator (shimmer/ghost) until server confirms.

8. **List view responsiveness: CSS clamp/flex**
   Use `display: grid` on the task row with `grid-template-columns: auto 1fr auto` and `min-width: 0` on text cells to allow truncation. Set `white-space: nowrap` and `text-overflow: ellipsis` on the title at narrow widths. No JS breakpoint needed.

## Risks / Trade-offs

- **Auto-scroll during drag** → Mitigation: only enable on the horizontal axis in Phases view; test with pointer at rest near edge to confirm it doesn't overshoot.
- **Optimistic Phases drops** → Mitigation: reuse the same rollback pattern from List view (`TaskMovement.apply()` + `onError`). Risk is low since the API call is idempotent (anchor-based move).
- **Bottom new-task entry in empty lanes** → Mitigation: only render when the user has writer access. Avoids empty-state confusion for readers.
- **CSS scrollbar styling** → Works in Chromium/WebKit but not Firefox. Mitigation: Firefox uses `scrollbar-width: thin` / `scrollbar-color` for reasonable fallback.