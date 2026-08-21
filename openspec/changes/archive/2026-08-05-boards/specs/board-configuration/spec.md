## ADDED Requirements

### Requirement: Board lifecycle and addressing

The system SHALL let Workspace Writers create, read, update, and permanently delete Boards within a Workspace. Each Board SHALL have a name, slug unique within its Workspace, optional allowed theme color, optional allowed Phosphor icon, and immutable creator, and SHALL be addressed at `/boards/<workspace-slug>/<board-slug>`.

#### Scenario: Administrator creates a board

- **WHEN** a Workspace Writer submits valid Board metadata with an unused slug in that Workspace
- **THEN** the system persists the board and returns its board URL

#### Scenario: Slug is reused in another workspace

- **WHEN** an administrator creates a board whose slug exists only in a different workspace
- **THEN** the system creates the board because board slugs are scoped to workspaces

#### Scenario: Duplicate board slug is rejected within workspace

- **WHEN** an administrator submits a board slug already used in the same workspace
- **THEN** the system rejects the mutation without changing either board

#### Scenario: Board name changes without implicit URL change

- **WHEN** an administrator changes a board name but does not edit its slug
- **THEN** the system preserves the existing slug and URL

#### Scenario: Workspace Writer changes Board slug

- **WHEN** a Workspace Writer saves a valid unused slug for an existing Board
- **THEN** the system uses the new Board URL immediately and old slug links no longer resolve

#### Scenario: Administrator deletes a board

- **WHEN** a Workspace Writer confirms Board deletion
- **THEN** the system permanently removes the board, its phases, and its tasks as one operation

#### Scenario: Board Creator loses Workspace Access

- **WHEN** a Board Creator no longer has write-level Workspace Access
- **THEN** Creator provenance alone grants no right to update or delete that Board

### Requirement: Board discovery

The system SHALL list readable boards for the selected workspace with each board's name, slug, icon, color, and creator.

#### Scenario: User selects a workspace

- **WHEN** a user with read access selects a workspace
- **THEN** the system lists that workspace's boards and no boards from other workspaces

#### Scenario: Workspace has no boards

- **WHEN** a user selects a readable workspace with no boards
- **THEN** the system shows an empty board state and offers Board creation only to Workspace Writers

### Requirement: Optional ordered phases

The system SHALL let Workspace Writers configure zero or more Phases on each Board. Every Phase SHALL have a title, allowed theme color, optional allowed Phosphor icon, and deterministic order. New Phase composition SHALL start without an icon.

#### Scenario: Administrator creates a phase

- **WHEN** a Workspace Writer adds a Phase with valid title and color plus an optional valid icon
- **THEN** the system appends the phase to that board's phase order

#### Scenario: Administrator edits a phase

- **WHEN** a Workspace Writer changes a Phase title, color, or icon
- **THEN** the system persists the metadata and shows it anywhere that phase is displayed

#### Scenario: Administrator reorders phases

- **WHEN** a Workspace Writer moves a Phase before or after another Phase
- **THEN** the system persists the resulting phase order for all users

#### Scenario: Board has no configured phases

- **WHEN** a user opens Phases mode on a board with zero phases
- **THEN** the system presents active tasks without a Phase in Incomplete and completed tasks in Complete

### Requirement: Phase deletion preserves tasks

Deleting a phase SHALL NOT delete its tasks. The system SHALL clear the deleted phase from affected tasks and place active affected tasks at the end of Incomplete.

#### Scenario: Administrator deletes a populated phase

- **WHEN** a Workspace Writer confirms deletion of a Phase containing active and completed Tasks
- **THEN** the system deletes the phase, preserves all tasks, clears their phase field, and appends active tasks to Incomplete

#### Scenario: Administrator deletes an empty phase

- **WHEN** a Workspace Writer confirms deletion of a Phase containing no Tasks
- **THEN** the system deletes the phase and closes the gap in phase order
