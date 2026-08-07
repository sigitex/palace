# Roadmap

---

## Now

### `boards-detail-edit-save-consistency`

Make detail/edit interactions consistent across views.

- Workspace and board detail views should match the task detail view's styling and its
  edit/save interaction pattern.
- Task title editor: disallow multiline — Enter focuses the next element instead of
  inserting a newline.

### `boards-interaction-ergonomics`

Keyboard and pointer ergonomics for lists and items.

- Replace the custom `useKeyboardShortcuts` with Mantine's hook.
- Home/End/PgUp/PgDn should work in all lists.
- List mode: spacebar toggles `complete`.
- Maximize the drag-handle hit area on items (too small now); cursor should be default,
  not pointer.
- Apply `user-select: none` broadly — dragging (or attempting to) currently creates
  unwanted text selections.

### `boards-per-board-view-state`

Persist per-board view settings (interim, localStorage-based; superseded later by
`boards-persistent-preferences`).

- Audit current `sessionStorage` usage — clarify what is stored and why, migrate as needed.
- Phase filter setting persisted per-board.
- Phases mode: show/hide incomplete/complete persisted per-board.

### `boards-list-phase-behavior`

Task and phase behavior fixes across list and phases modes.

- Adding a task while a phase filter is selected auto-applies that phase/complete status
  to the new task.
- Blurring the "Add task" form with an empty title removes it (same as pressing Esc).
- Phases mode: moving a task lands at the closest matching index in the target phase,
  not appended to the bottom.
- Phases mode: moving a task should trigger the "move column into view" behavior that
  ordinary navigation already does.
- Empty-phase handling: list mode hides the phase selector when 0 phases exist; phases
  mode defaults to showing the "complete" panel when 0 phases exist.

---

## Later

### `boards-selection-focus-model`

- Focus should follow selection; today they interact poorly.
- Add a "mass select mode" that distinguishes focus from selection.

### `boards-reordering`

- Allow reordering boards on the index (persisted in db).
- Allow reordering workspaces on the index (persisted in localStorage).

### `boards-loading-sync-ux`

- Fix screen flicker + ugly spinner when switching workspace in `/boards`; better empty
  states.
- Background refresh + tangible update (cheap sync).

### `boards-visual-polish`

- Redesign the icon picker (currently ugly).
- Task styling: more 3D, distinct borders between elements; move delete into a menu.

### `boards-nav-breadcrumb-refinement`

Follow-up to the top-header layout.

- Combine header + tabs into the same row; kill the top-level "Add task" button.
- Shrink the header into a smart, reusable breadcrumb.
- Breadcrumb has dropdowns to cross boards/workspaces without navigating back to the index.
- Kill the slideouts — configuration can be menus and menu-like overlays.

### `boards-code-cleanup`

- Convert all CSS modules to `@emotion/styled`.
- Flesh out guidelines and do more React cleanup.

---

## Big design

### `boards-persistent-preferences`

Persistent preferences system: user-defaults, board-defaults, and per-board-per-user,
etc. — what to show where, and so on. This generalizes the interim work in
`boards-per-board-view-state`; design the model before splitting into changes.

---

## Backlog

Larger features to flesh out before planning:

- Assignees
- Target dates
- Time tracking
- Tags
