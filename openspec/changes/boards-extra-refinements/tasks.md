## 1. Custom scrollbar styling

- [ ] 1.1 Add shared CSS class with `::-webkit-scrollbar` pseudo-elements using Mantine CSS variables (`--mantine-color-*`, `--mantine-radius-*`)
- [ ] 1.2 Add Firefox fallback (`scrollbar-width: thin`, `scrollbar-color` with Mantine tokens)
- [ ] 1.3 Apply scrollbar class to Phases view horizontal scroller and List view container
- [ ] 1.4 Verify scrollbars render correctly in Chromium and Firefox

## 2. Inline editor improvements

- [ ] 2.1 Add `showPhase` prop to `TaskComposer` (default `true`); when `false`, omit Phase selector from inline editor
- [ ] 2.2 Pass `showPhase={false}` to `TaskComposer` rendered in List view; pass `showPhase={true}` in Phases view
- [ ] 2.3 Refactor `PhaseComposer` cancel/add buttons to `ActionIcon` (X / Check icons) on the same row as the title input using flex layout
- [ ] 2.4 Update `PhaseComposer` CSS module for compact single-row layout

## 3. F2 keyboard shortcut for Phases

- [ ] 3.1 Wire F2 key in Phases view `useKeyboardShortcuts` to activate inline rename on selected phase
- [ ] 3.2 Ensure F2 focuses the phase title input with existing title selected
- [ ] 3.3 Test F2 does not conflict with List view F2 behavior

## 4. New-task entry at collection bottoms

- [ ] 4.1 Create `NewTaskEntry` component: selectable row/card with dimmed "+ Add task" placeholder, click/Enter activates inline `TaskComposer`, keyboard navigation integration
- [ ] 4.2 Add `BoardsState` fields for bottom-entry selection state (distinct from task selection)
- [ ] 4.3 Integrate `NewTaskEntry` in `ListView` as last row, wired into keyboard arrow navigation (arrow-down from last task selects entry, arrow-up from entry selects last task)
- [ ] 4.4 Integrate `NewTaskEntry` in each `PhaseLane` as last element, wired into keyboard arrow navigation
- [ ] 4.5 Ensure empty Phases lanes render only the `NewTaskEntry` to remain keyboard-accessible via left/right arrow
- [ ] 4.6 Conditionally render `NewTaskEntry` only for Workspace Writers
- [ ] 4.7 Add CSS styling for `NewTaskEntry`: dimmed text, hover highlight, selected state

## 5. Horizontal drag auto-scroll

- [ ] 5.1 Add `autoScroll` config option to `usePointerDrag`: zone size (px from edge), speed, axis ('x' | 'y' | 'both')
- [ ] 5.2 Implement animation-frame-based auto-scroll loop when pointer is within zone on a scrollable container
- [ ] 5.3 Wire horizontal auto-scroll in Phases view with sensible zone size and speed defaults
- [ ] 5.4 Test auto-scroll: drag near left/right edge of phases scroller, confirm smooth scrolling without overshoot

## 6. Keyboard column scroll snap

- [ ] 6.1 When arrow keys change selected phase lane in Phases view, call `scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })` on the lane element
- [ ] 6.2 Ensure the horizontal scroller adjusts so the selected lane is fully visible (not clipped by Incomplete/Complete fixed lanes)

## 7. Optimistic drops in Phases view

- [ ] 7.1 Refactor Phases drop handler to use `BoardsQuery.useMoveTask` optimistic pattern (same as List): `onMutate` applies `TaskMovement.apply()` to query cache, `onError` rolls back
- [ ] 7.2 Add subtle visual indicator (shimmer/ghost) on moved card until server confirms
- [ ] 7.3 Test: drag task between lanes, confirm immediate visual move, confirm rollback on simulated server error

## 8. List view responsiveness

- [ ] 8.1 Add CSS grid layout to `TaskRow`: `grid-template-columns: auto 1fr auto` with `min-width: 0` on text cells
- [ ] 8.2 Add `white-space: nowrap` and `text-overflow: ellipsis` on title at narrow viewports via media query
- [ ] 8.3 Test at various viewport widths: tasks render as single compact row without overflow