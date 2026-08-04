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
The Board toolbar SHALL provide a `SegmentedControl` that switches between List and Phases modes without changing persisted Task data or the Board route. Mode SHALL be transient personal presentation state, and each Board visit SHALL start in List mode.

#### Scenario: User opens a Board
- **WHEN** a user starts a new visit to a Board
- **THEN** the system displays List mode regardless of modes previously selected by any user

#### Scenario: User changes board mode
- **WHEN** a user selects List or Phases in the segmented control
- **THEN** the system immediately renders that projection of the same board tasks

#### Scenario: User opens another board
- **WHEN** a user navigates to another board
- **THEN** the system renders the selected board without carrying incompatible selection or drag state from the previous board

### Requirement: List mode presentation and filtering
List mode SHALL show each task's completion checkbox, title, phase icon and text when assigned, and context-menu icon. Its toolbar SHALL provide combinable filters for title text, completion, and phase, with board settings aligned to the right.

#### Scenario: User views List mode
- **WHEN** List mode is active
- **THEN** Tasks appear in Board Order with the required controls and metadata

#### Scenario: User filters by title
- **WHEN** a user enters title filter text
- **THEN** the system shows only tasks whose titles contain that text case-insensitively

#### Scenario: User combines filters
- **WHEN** a user selects title, completion, and phase filters together
- **THEN** the system shows only tasks matching all active filters while leaving persisted data unchanged

#### Scenario: User toggles completion checkbox
- **WHEN** a writer changes a task checkbox in List mode
- **THEN** the system persists the new completion value and updates the visible filtered result

### Requirement: Phases mode presentation
Phases mode SHALL render configured phases as ordered lanes with each phase's colored icon and title. Active tasks SHALL show title and context-menu icon without completion checkboxes. Active unassigned tasks SHALL appear in Unphased, and completed tasks SHALL appear in an Archive lane to the right of active lanes.

#### Scenario: User views Phases mode
- **WHEN** Phases mode is active
- **THEN** the system displays ordered active lanes and each lane's tasks in Board Order

#### Scenario: Board contains unphased tasks
- **WHEN** active tasks have no phase
- **THEN** the system shows those tasks in an Unphased lane

#### Scenario: Archive starts collapsed
- **WHEN** a user first opens a board in Phases mode
- **THEN** Archive is collapsed and the toolbar offers a control to expand it

#### Scenario: User toggles Archive
- **WHEN** a user activates the Archive toolbar control
- **THEN** the system expands or collapses the rightmost Archive lane without changing task completion

### Requirement: Configuration and task drawers
The system SHALL use drawers for workspace configuration, board configuration, and task details. Task details SHALL show the task ID, creator, title, complete value, markdown details, and phase, with inputs for every user-editable field.

#### Scenario: Palace Administrator opens Workspace settings
- **WHEN** a Palace Administrator activates Workspace settings
- **THEN** the system opens a drawer containing Workspace metadata, lifecycle actions, and Workspace Access controls

#### Scenario: Workspace Manager opens Workspace settings
- **WHEN** a Workspace Manager activates Workspace settings
- **THEN** the system opens a drawer containing Workspace Access controls without Workspace metadata or lifecycle actions

#### Scenario: Administrator opens board settings
- **WHEN** a Workspace Writer activates the right-aligned board settings control
- **THEN** the system opens a drawer containing board metadata and ordered phase controls

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
Workspace and board settings SHALL offer optional values from allowed Mantine theme colors and Phosphor icons, and phase settings SHALL require one value from each selector. List views and phase headers SHALL render selected icon and color metadata.

#### Scenario: User selects presentation metadata
- **WHEN** an authorized Palace Administrator or Workspace Writer chooses an allowed icon and color and saves settings
- **THEN** the system persists stable keys and renders that presentation consistently in lists and board views

#### Scenario: User submits unsupported presentation metadata
- **WHEN** a client submits a color or icon outside the allowed set
- **THEN** the system rejects the mutation without saving unsupported values

### Requirement: Guarded deletion
Every Workspace, Board, Phase, and Task delete action SHALL open a `Popover` containing Cancel and Delete buttons before any destructive API call is made. Confirmed deletion SHALL be permanent and the system SHALL NOT provide a recoverable Trash. Archive SHALL remain Task completion, not deletion.

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
Both board modes SHALL let writers move tasks using pointer, touch, and keyboard drag-and-drop. Dragging SHALL use the same persisted movement rules as Ctrl+Arrow and context-menu move actions.

#### Scenario: Writer drags in List mode
- **WHEN** a writer drops a task before or after another visible List mode task
- **THEN** the system persists that relative list position while hidden filtered tasks retain relative order

#### Scenario: Writer drags across phase lanes
- **WHEN** a writer drops an active task into another phase or Unphased lane
- **THEN** the system persists its destination phase and lane position

#### Scenario: Writer drags into expanded Archive
- **WHEN** a writer drops an active task into Archive
- **THEN** the system marks the task complete and persists its Archive position

#### Scenario: Move fails
- **WHEN** the server rejects or fails a drag or keyboard move
- **THEN** the system restores authoritative ordering, preserves task focus when possible, and announces the failure

### Requirement: Responsive and scrollable layouts
Boards SHALL remain operable on desktop and mobile. The index SHALL adapt the two-list selection flow to narrow screens, List mode SHALL avoid horizontal page overflow, and Phases mode SHALL provide intentional horizontal lane scrolling.

#### Scenario: User opens Boards on a narrow screen
- **WHEN** available width cannot show workspace and board lists side by side
- **THEN** the system presents a stacked or drill-in selection flow with controls to return to the previous list

#### Scenario: User opens Phases mode on mobile
- **WHEN** phase lanes exceed available width
- **THEN** the board region scrolls horizontally without preventing vertical task scrolling or touch drag interaction
