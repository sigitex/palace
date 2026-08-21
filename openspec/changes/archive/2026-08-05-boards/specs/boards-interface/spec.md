## ADDED Requirements

### Requirement: Boards index and nested routing

The system SHALL provide `/boards`, `/boards/:workspace`, `/boards/:workspace/:board`, and `/boards/:workspace/:board/:task` routes. The Boards index SHALL present workspaces in a left vertical list and boards for the selected workspace in a right vertical list on layouts wide enough to show both.

#### Scenario: User opens Boards index

- **WHEN** a user visits `/boards`
- **THEN** the system shows readable workspaces, a prompt to select one, and no board content from an unselected workspace

#### Scenario: User follows workspace link

- **WHEN** a user visits a readable workspace route
- **THEN** the system selects that workspace and shows only its boards in the board list

#### Scenario: User follows board link

- **WHEN** a user visits a readable board route
- **THEN** the system selects its workspace and board and displays that board in its current local mode

#### Scenario: User follows task deep link

- **WHEN** a user visits a readable task route directly
- **THEN** the system displays its containing board and opens task details in a drawer

#### Scenario: Route does not resolve to readable content

- **WHEN** a route names a missing or inaccessible workspace, board, or task
- **THEN** the system shows a not-found or access-denied state without leaking resource details

### Requirement: Selectable board modes

The Board SHALL place List and Phases tabs directly below a header containing Board metadata, Add task, and settings. Tabs SHALL switch modes without changing persisted Task data or the Board route. Mode SHALL be transient personal presentation state, and each Board visit SHALL start in List mode.

#### Scenario: User opens a Board

- **WHEN** a user starts a new visit to a Board
- **THEN** the system displays List mode regardless of modes previously selected by any user

#### Scenario: User changes board mode

- **WHEN** a user selects the List or Phases tab
- **THEN** the system immediately renders that projection of the same board tasks

#### Scenario: User opens another board

- **WHEN** a user navigates to another board
- **THEN** the system renders the selected board without carrying incompatible selection or drag state from the previous board

### Requirement: List mode presentation and filtering

List mode SHALL show each task's completion checkbox, title, inline editable Task state with appropriate color and optional icon, and context-menu icon. List rows SHALL NOT show Task detail excerpts. The state control SHALL offer Incomplete, configured Phases, and Complete, with Complete overriding retained Phase in its current display. Complete Task text SHALL be subdued. Its filters SHALL provide title-only task search plus one exclusive button group ordered All, Incomplete, configured Phases, Complete; All SHALL be the default.

#### Scenario: User views List mode

- **WHEN** List mode is active
- **THEN** Tasks appear in Board Order with the required controls and metadata

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

Phases mode SHALL render Incomplete as the fixed left lane, configured Phases in persisted order, and Complete as the fixed right lane. Incomplete SHALL start visible and Complete hidden on each Board visit. Small visibility controls SHALL sit directly above their corresponding left and right lanes. Task cards SHALL show title and context-menu icon without completion checkboxes or Task detail excerpts, and Complete Task text SHALL be subdued.

#### Scenario: User views Phases mode

- **WHEN** Phases mode is active
- **THEN** the system displays ordered active lanes and each lane's tasks in Board Order

#### Scenario: Board contains tasks without a Phase

- **WHEN** active tasks have no phase
- **THEN** the system shows those tasks in the leftmost Incomplete lane

### Requirement: Inline Phase management

Workspace Writers SHALL create, edit, reorder, and delete configured Phases directly in Phases mode. Each configured Phase header SHALL use its stored color and optional icon, provide inline title/color/icon editing and guarded deletion, and support pointer and keyboard reordering. Board settings SHALL NOT duplicate Phase controls.

#### Scenario: Writer edits a Phase inline

- **WHEN** a Workspace Writer edits a Phase header title, color, or icon and saves
- **THEN** the system persists and immediately renders the changed metadata

#### Scenario: Writer reorders Phase lanes

- **WHEN** a Workspace Writer drags a configured Phase or uses its keyboard drag controls
- **THEN** the system persists the configured Phase order between Incomplete and Complete

### Requirement: Direct Board creation controls

Workspace Writers SHALL be able to create Tasks and Phases directly on the Board without opening settings or knowing a keyboard shortcut. Add task in List SHALL open an inline row at List end; Add task in Phases SHALL reveal Incomplete and open an inline entry at its end; each configured Phase lane SHALL provide its own Add task control. Phases mode SHALL provide Add phase directly above the lane region. Keyboard shortcuts SHALL remain accelerators rather than the only creation path.

#### Scenario: Writer adds a Task from the toolbar

- **WHEN** a Workspace Writer activates Add task on an empty or populated Board
- **THEN** the system opens inline entry in the active view's target collection

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

### Requirement: Configuration and task drawers

The system SHALL use drawers for workspace configuration, board configuration, and task details. Task details SHALL use a document-first notebook surface with the Task title as heading, compact state control, rendered markdown by default, explicit details editing, readable non-disabled content for readers, and save/discard actions only while dirty.

#### Scenario: Palace Administrator opens Workspace settings

- **WHEN** a Palace Administrator activates Workspace settings
- **THEN** the system opens a drawer containing Workspace metadata, lifecycle actions, and Workspace Access controls

#### Scenario: Workspace Manager opens Workspace settings

- **WHEN** a Workspace Manager activates Workspace settings
- **THEN** the system opens a drawer containing Workspace Access controls without Workspace metadata or lifecycle actions

#### Scenario: Administrator opens board settings

- **WHEN** a Workspace Writer activates the right-aligned board settings control
- **THEN** the system opens a drawer containing Board metadata and lifecycle controls without Phase controls

#### Scenario: User opens task details

- **WHEN** a user presses Enter on, or double-clicks, a selected task
- **THEN** the system navigates to the task route and opens its detail drawer

#### Scenario: User closes task details

- **WHEN** a user closes the task drawer
- **THEN** the system navigates to the containing board route and restores focus to the originating task when it remains visible

#### Scenario: Writer edits markdown details

- **WHEN** a writer edits task markdown in the detail drawer
- **THEN** the system saves the source and renders any preview with raw HTML disabled

### Requirement: Theme icon and color selection

Workspace and Board settings SHALL offer optional Mantine theme colors through direct color swatches. Icon selection SHALL offer every supported Phosphor Duotone glyph in an icon-only, searchable, paginated picker showing a few dozen icons at once. Inline Phase editing SHALL require color and allow a blank icon. Workspace, Board, Phase, filter, lane, and Task surfaces SHALL consistently render selected metadata.

#### Scenario: User selects presentation metadata

- **WHEN** an authorized Palace Administrator or Workspace Writer chooses an allowed icon and color and saves settings
- **THEN** the system persists stable keys and renders that presentation consistently in lists and board views

#### Scenario: User submits unsupported presentation metadata

- **WHEN** a client submits a color or icon outside the allowed set
- **THEN** the system rejects the mutation without saving unsupported values

### Requirement: Guarded deletion

Every Workspace, Board, Phase, and Task delete action SHALL open a `Popover` containing Cancel and Delete buttons before any destructive API call is made. Confirmed deletion SHALL be permanent and the system SHALL NOT provide a recoverable Trash. Complete SHALL remain Task completion, not deletion.

#### Scenario: User cancels deletion

- **WHEN** a user activates Delete and then chooses Cancel in the confirmation popover
- **THEN** the system closes the popover, restores focus to the trigger, and preserves the object

#### Scenario: User confirms deletion

- **WHEN** an authorized user chooses Delete in the confirmation popover
- **THEN** the system permanently performs the deletion, closes affected detail UI, and selects a sensible neighboring object

### Requirement: Comprehensive keyboard interaction

Boards SHALL support keyboard selection and actions whenever focus is outside a text input. Arrow keys SHALL change the selected workspace, board, task, or phase control; Ctrl+Arrow SHALL move the selected object when its current collection supports movement; Enter SHALL open details; Delete SHALL open confirmation; F2 SHALL activate inline title editing; and `n` SHALL create an object in the focused collection with inline title editing active.

#### Scenario: User changes selection with arrows

- **WHEN** a workspace, board, task, or phase list has focus and the user presses an applicable Arrow key
- **THEN** the system moves visible selection in that direction and keeps the selected object in view

#### Scenario: User moves a list task with keyboard

- **WHEN** a writer selects a List mode task and presses Ctrl+ArrowUp or Ctrl+ArrowDown
- **THEN** the system moves the task one visible position and announces its new position

#### Scenario: User moves a phase task with keyboard

- **WHEN** a writer selects a Phases mode task and presses an applicable Ctrl+Arrow key
- **THEN** the system reorders it within its lane or moves it to the adjacent lane and announces the destination

#### Scenario: User opens inline rename

- **WHEN** an authorized user selects a renamable object and presses F2
- **THEN** the system focuses an inline title input with the existing title selected

#### Scenario: User creates inline

- **WHEN** an authorized user focuses a collection and presses `n`
- **THEN** the system adds an inline draft for the collection's object type and focuses its title input

#### Scenario: User presses shortcut while typing

- **WHEN** focus is in an input, textarea, select, or editable markdown control
- **THEN** printable keys and editing keys modify that control instead of triggering board shortcuts

#### Scenario: User cancels inline editing

- **WHEN** an inline title input is active and the user presses Escape
- **THEN** the system cancels an unsaved draft or restores the previous title and focus

### Requirement: Drag-and-drop task movement

Both board modes SHALL let writers move tasks using native Pointer Events for mouse, pen, and touch. Pointer movement SHALL keep layout stable until drop, show a clear target, and use the same persisted movement rules as Ctrl+Arrow and context-menu move actions. Drag controls SHALL use a visually distinct grip rather than the action-menu glyph.

#### Scenario: Writer drags in List mode

- **WHEN** a writer drops a task before or after another visible List mode task
- **THEN** the system persists that relative list position while hidden filtered tasks retain relative order

#### Scenario: Writer drags across phase lanes

- **WHEN** a writer drops an active task into another phase or Incomplete lane
- **THEN** the system persists its destination phase and lane position

#### Scenario: Writer drags into visible Complete

- **WHEN** a writer drops an active task into Complete
- **THEN** the system marks the task complete and persists its Complete position

#### Scenario: Move fails

- **WHEN** the server rejects or fails a drag or keyboard move
- **THEN** the system restores authoritative ordering, preserves task focus when possible, and announces the failure

### Requirement: Responsive and scrollable layouts

Boards SHALL remain operable on desktop and mobile. The index SHALL adapt the two-list selection flow to narrow screens, tint every Board row from its metadata color, and support Left/Right focus transitions between Workspace and Board lists. List mode SHALL avoid horizontal page overflow. Phases mode SHALL provide one stable full-height native scroll viewport, full-height lanes, a horizontal scrollbar at the viewport bottom, and lane-aware directional Task navigation.

#### Scenario: User opens Boards on a narrow screen

- **WHEN** available width cannot show workspace and board lists side by side
- **THEN** the system presents a stacked or drill-in selection flow with controls to return to the previous list

#### Scenario: User opens Phases mode on mobile

- **WHEN** phase lanes exceed available width
- **THEN** the board region scrolls horizontally without preventing vertical task scrolling or touch drag interaction
