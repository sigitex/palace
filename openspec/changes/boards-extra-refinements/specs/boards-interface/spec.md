# Boards Interface — Delta Spec

## ADDED Requirements

### Requirement: Custom scrollbar presentation

Board scroll containers SHALL render custom scrollbars using Mantine theme tokens instead of browser defaults. Applies to Phases mode horizontal scroller and any board list with overflow.

#### Scenario: User views Phases mode with custom scrollbar

- **WHEN** a board in Phases mode has enough phases to overflow horizontally
- **THEN** the scrollbar uses Mantine-themed colors and border-radius via `::-webkit-scrollbar` pseudo-elements

### Requirement: New-task entry at collection bottoms

Every task collection — List view rows and each Phases lane — SHALL render a selectable new-task entry as its last element. The entry SHALL show a dimmed "+ Add task" placeholder. Activating it (click, Enter, or keyboard navigation into it) SHALL focus a `TaskComposer` inline. In Phases view, empty lanes SHALL still render this entry to remain keyboard-accessible via left/right arrow navigation.

#### Scenario: User focuses new-task entry with keyboard

- **WHEN** a user presses ArrowDown on the last real task in a list or lane
- **THEN** the new-task entry becomes selected

#### Scenario: User activates new-task entry

- **WHEN** a user presses Enter on the selected new-task entry or clicks it
- **THEN** an inline `TaskComposer` opens with the title input focused

#### Scenario: Empty lane has new-task entry

- **WHEN** a phase lane has no tasks
- **THEN** the lane shows only the new-task entry, making it navigable via keyboard left/right arrows

### Requirement: Optimistic task move in Phases view

Task moves in Phases view (drag-and-drop or keyboard Ctrl+Arrow) SHALL apply optimistically to the local cache using the same `TaskMovement.apply()` pattern as List view. On server error, the move SHALL roll back to authoritative order. A subtle visual indicator (shimmer) SHALL appear on the moved card until the server confirms.

#### Scenario: Writer drops task in another lane

- **WHEN** a writer drops a task into another phase lane
- **THEN** the task appears in the destination lane immediately, and the server confirms or rolls back

#### Scenario: Server rejects move

- **WHEN** the server rejects a Phases view move
- **THEN** the task returns to its original position and the failure is announced

### Requirement: Horizontal auto-scroll during drag

The Phases view horizontal scroller SHALL auto-scroll when the pointer is dragged near its left or right edge. The auto-scroll zone and speed SHALL be configurable and only activate on the horizontal axis.

#### Scenario: Writer drags task near lane edge

- **WHEN** a writer drags a task card close to the left or right edge of the phases scroller
- **THEN** the scroller moves horizontally incrementally until the pointer leaves the zone or the task is dropped

## MODIFIED Requirements

### Requirement: List mode presentation and filtering

List mode SHALL show each task's completion checkbox, title, and context-menu icon. List mode inline editor SHALL NOT include a Phase selector. List rows SHALL NOT show Task detail excerpts. The state control SHALL offer Incomplete, configured Phases, and Complete, with Complete overriding retained Phase in its current display. Complete Task text SHALL be subdued. Its filters SHALL provide title-only task search plus one exclusive button group ordered All, Incomplete, configured Phases, Complete; All SHALL be the default. A new-task entry SHALL appear as the last row.

#### Scenario: User views List mode

- **WHEN** List mode is active
- **THEN** Tasks appear in Board Order with completion checkbox, title, and context-menu icon

#### Scenario: User opens inline editor in List mode

- **WHEN** a writer activates inline task creation in List mode
- **THEN** the inline editor shows a title input without a Phase selector

#### Scenario: User filters by title

- **WHEN** a user enters title filter text
- **THEN** the system shows only tasks whose titles contain that text case-insensitively

#### Scenario: User combines filters

- **WHEN** a user selects a projection filter and enters title search text
- **THEN** the system shows only tasks matching both while leaving persisted data unchanged

#### Scenario: Search text exists only in Task details

- **WHEN** a user's search text appears in Task details but not its title
- **THEN** List mode does not show that Task because hidden detail text is not a search source

#### Scenario: Writer changes Task state from List

- **WHEN** a Workspace Writer chooses Incomplete, a configured Phase, or Complete from a Task's inline state control
- **THEN** the system applies the requested state while preserving retained Phase under Complete and preserving Board Order

#### Scenario: User toggles completion checkbox

- **WHEN** a writer changes a task checkbox in List mode
- **THEN** the system persists the new completion value without changing Board Order and updates the visible filtered result

### Requirement: Phases mode presentation

Phases mode SHALL render Incomplete as the fixed left lane, configured Phases in persisted order, and Complete as the fixed right lane. Incomplete SHALL start visible and Complete hidden on each Board visit. Small visibility controls SHALL sit directly above their corresponding left and right lanes. Task cards SHALL show title and context-menu icon without completion checkboxes or Task detail excerpts, and Complete Task text SHALL be subdued. Each lane SHALL render a new-task entry as its last element. Horizontally scrolling SHALL use custom Mantine-themed scrollbars.

#### Scenario: User views Phases mode

- **WHEN** Phases mode is active
- **THEN** the system displays ordered active lanes, each lane's tasks in Board Order, and a new-task entry at the bottom of each lane

#### Scenario: Board contains tasks without a Phase

- **WHEN** active tasks have no phase
- **THEN** the system shows those tasks in the leftmost Incomplete lane

### Requirement: Inline Phase management

Workspace Writers SHALL create, edit, reorder, and delete configured Phases directly in Phases mode. Each configured Phase header SHALL use its stored color and optional icon, provide inline title/color/icon editing and guarded deletion, and support pointer and keyboard reordering. Board settings SHALL NOT duplicate Phase controls. F2 SHALL activate inline rename on the selected Phase. The in-column new-task form SHALL use icon-only cancel and add buttons on the same row as the title input.

#### Scenario: Writer edits a Phase inline

- **WHEN** a Workspace Writer edits a Phase header title, color, or icon and saves
- **THEN** the system persists and immediately renders the changed metadata

#### Scenario: Writer reorders Phase lanes

- **WHEN** a Workspace Writer drags a configured Phase or uses its keyboard drag controls
- **THEN** the system persists the configured Phase order between Incomplete and Complete

#### Scenario: Writer activates inline Phase rename with F2

- **WHEN** a Workspace Writer selects a Phase and presses F2
- **THEN** the system focuses the Phase title input with the existing title selected

#### Scenario: Phase composer has compact buttons

- **WHEN** a Workspace Writer opens the in-column new-task form in a Phase lane
- **THEN** the cancel and add buttons render as icon-only `ActionIcon` components on the same row as the title input

### Requirement: Direct Board creation controls

Workspace Writers SHALL be able to create Tasks and Phases directly on the Board without opening settings or knowing a keyboard shortcut. Add task in List SHALL open an inline row at List end; Add task in Phases SHALL reveal Incomplete and open an inline entry at its end; each configured Phase lane SHALL provide its own Add task control. Phases mode SHALL provide Add phase directly above the lane region. Keyboard shortcuts SHALL remain accelerators rather than the only creation path. A new-task entry SHALL be present at the bottom of each task collection, providing an always-visible creation target.

#### Scenario: Writer adds a Task from the toolbar

- **WHEN** a Workspace Writer activates Add task on an empty or populated Board
- **THEN** the system opens inline entry in the active view's target collection

#### Scenario: Writer adds a Task from the bottom new-task entry

- **WHEN** a Workspace Writer activates the new-task entry at the bottom of a list or lane
- **THEN** the system opens an inline `TaskComposer` with title input focused

#### Scenario: Writer adds a Task in a lane

- **WHEN** a Workspace Writer activates Add task inside a configured Phase or Incomplete lane
- **THEN** the system creates the Task in that lane without requiring a separate Phase selection

#### Scenario: Writer adds a Phase on the Board

- **WHEN** a Workspace Writer activates Add phase in Phases mode
- **THEN** the system opens an inline title, color, and icon composer directly on the Board

#### Scenario: Complete starts hidden

- **WHEN** a user first opens a board in Phases mode
- **THEN** Complete is hidden and a small right-aligned control offers to show it

#### Scenario: User toggles fixed lanes

- **WHEN** a user activates the Incomplete or Complete visibility control
- **THEN** the system shows or hides that fixed lane without changing Task data

### Requirement: Comprehensive keyboard interaction

Boards SHALL support keyboard selection and actions whenever focus is outside a text input. Arrow keys SHALL change the selected workspace, board, task, phase, or new-task entry; Ctrl+Arrow SHALL move the selected object when its current collection supports movement; Enter SHALL open details or activate the new-task entry; Delete SHALL open confirmation; F2 SHALL activate inline title editing for tasks and phases; and `n` SHALL create an object in the focused collection with inline title editing active.

#### Scenario: User changes selection with arrows

- **WHEN** a workspace, board, task, phase, or new-task entry list has focus and the user presses an applicable Arrow key
- **THEN** the system moves visible selection in that direction and keeps the selected object in view

#### Scenario: User moves a list task with keyboard

- **WHEN** a writer selects a List mode task and presses Ctrl+ArrowUp or Ctrl+ArrowDown
- **THEN** the system moves the task one visible position and announces its new position

#### Scenario: User moves a phase task with keyboard

- **WHEN** a writer selects a Phases mode task and presses an applicable Ctrl+Arrow key
- **THEN** the system reorders it within its lane or moves it to the adjacent lane and announces the destination

#### Scenario: User opens inline rename on a phase

- **WHEN** an authorized user selects a Phase and presses F2
- **THEN** the system focuses the Phase title input with the existing title selected

#### Scenario: User opens inline rename on a task

- **WHEN** an authorized user selects a task and presses F2
- **THEN** the system focuses the task title input with the existing title selected

#### Scenario: User creates inline

- **WHEN** an authorized user focuses a collection and presses `n`
- **THEN** the system adds an inline draft for the collection's object type and focuses its title input

#### Scenario: User presses shortcut while typing

- **WHEN** focus is in an input, textarea, select, or editable markdown control
- **THEN** printable keys and editing keys modify that control instead of triggering board shortcuts

#### Scenario: User cancels inline editing

- **WHEN** an inline title input is active and the user presses Escape
- **THEN** the system cancels an unsaved draft or restores the previous title and focus

#### Scenario: User activates new-task entry with keyboard

- **WHEN** the new-task entry is selected and the user presses Enter
- **THEN** the system opens an inline `TaskComposer` with title input focused

### Requirement: Drag-and-drop task movement

Both board modes SHALL let writers move tasks using native Pointer Events for mouse, pen, and touch. Pointer movement SHALL keep layout stable until drop, show a clear target, and use the same persisted movement rules as Ctrl+Arrow and context-menu move actions. Drag controls SHALL use a visually distinct grip rather than the action-menu glyph. In Phases view, dragging near the scroller edge SHALL trigger horizontal auto-scroll. Drops SHALL apply optimistically with rollback on failure.

#### Scenario: Writer drags in List mode

- **WHEN** a writer drops a task before or after another visible List mode task
- **THEN** the system persists that relative list position while hidden filtered tasks retain relative order

#### Scenario: Writer drags across phase lanes

- **WHEN** a writer drops an active task into another phase or Incomplete lane
- **THEN** the system optimistically renders the task in its new position and lane, persists the destination, and rolls back on error

#### Scenario: Writer drags into visible Complete

- **WHEN** a writer drops an active task into Complete
- **THEN** the system marks the task complete, optimistically renders its new position, and rolls back on error

#### Scenario: Writer drags near phase scroller edge

- **WHEN** a writer drags a task within the auto-scroll zone near the phases scroller edge
- **THEN** the scroller moves horizontally to reveal more lanes

#### Scenario: Move fails

- **WHEN** the server rejects or fails a drag or keyboard move
- **THEN** the system rolls back to authoritative ordering, preserves task focus when possible, and announces the failure

### Requirement: Responsive and scrollable layouts

Boards SHALL remain operable on desktop and mobile. The index SHALL adapt the two-list selection flow to narrow screens, tint every Board row from its metadata color, and support Left/Right focus transitions between Workspace and Board lists. List mode SHALL avoid horizontal page overflow and SHALL render each task as a single compact row on narrow viewports. Phases mode SHALL provide one stable full-height native scroll viewport, full-height lanes, a custom-themed horizontal scrollbar at the viewport bottom, and lane-aware directional Task navigation. Selecting a column via keyboard SHALL snap the scroll position to make the selected column fully visible.

#### Scenario: User opens Boards on a narrow screen

- **WHEN** available width cannot show workspace and board lists side by side
- **THEN** the system presents a stacked or drill-in selection flow with controls to return to the previous list

#### Scenario: User opens Phases mode on mobile

- **WHEN** phase lanes exceed available width
- **THEN** the board region scrolls horizontally with a custom-themed scrollbar, without preventing vertical task scrolling or touch drag interaction

#### Scenario: List view tasks on narrow window

- **WHEN** the list view viewport width is narrow
- **THEN** each task row renders as a single compact line with truncated title

#### Scenario: User selects lane with keyboard

- **WHEN** a user navigates to a phase lane using arrow keys
- **THEN** the horizontal scroller snaps so the selected lane is fully visible