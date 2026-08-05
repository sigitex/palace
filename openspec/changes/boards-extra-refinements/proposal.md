## Why

Board views have rough edges that hurt daily use: scrollers look out of place, inline editing wastes space, the new-task flow is inconsistent between views, drag-and-drop in Phases feels sluggish, and List view tasks blow up on narrow windows.

## What Changes

- **Custom scrollbar styling**: Replace browser-default scrollbars with Mantine-themed ones across board views
- **Inline editor cleanup**: Remove Phase selector from List view inline task editor
- **F2 in Phases view**: Activate inline rename for phases; make in-column new-task form compact (icon-only cancel/add on same row as input)
- **New-task entry at list bottoms**: Add a selectable, auto-focusing new-task row at the bottom of List view and each Phases lane, navigable via keyboard arrows even in empty lanes
- **Phases drag auto-scroll**: Improved horizontal auto-scroll during drag-over near lane edges
- **Keyboard column snap**: Selecting a column via keyboard snaps scroll position so the selected column is fully visible
- **Optimistic drops in Phases**: Reduce drag-drop delay by applying moves optimistically with rollback on failure
- **List view responsiveness**: Tasks render as a single compact row on narrow windows

## Capabilities

### New Capabilities
_(none — all changes modify existing interface behavior)_

### Modified Capabilities
- `boards-interface`: scrollbar styling, inline editor (drop Phase picker from list, compact phase composer buttons), new-task entries at list bottoms, F2 for phases, drag-scroll hook, keyboard column snap, optimistic drop, list view responsive sizing

## Impact

- `packages/web/app/Boards/` — List and Phases components, new-task composer, drag hook, inline editors
- `packages/web/app/Boards/Board/BoardsState.ts` — may need additional state for bottom new-task entry and optimistic moves
- `packages/web/app/Boards/Drag/usePointerDrag.ts` — horizontal auto-scroll improvements
- CSS modules for list, phases, task rows, inline editors