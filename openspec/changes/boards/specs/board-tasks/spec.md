## ADDED Requirements

### Requirement: Persistent task lifecycle
The system SHALL let users with workspace write access create, read, update, and permanently delete tasks within a board. Each task SHALL have a numeric ID, title, complete boolean, markdown details text, optional phase, immutable creator, and persistent ordering data.

#### Scenario: Writer creates a task
- **WHEN** a user with write access submits a non-empty task title to a board
- **THEN** the system creates an incomplete task, records the current user as creator, and appends it to Board Order

#### Scenario: Writer edits task fields
- **WHEN** a user with write access changes a task's title, complete value, details, or phase to valid values
- **THEN** the system persists all changed fields and leaves creator unchanged

#### Scenario: Markdown details are preserved
- **WHEN** a writer saves valid markdown source in task details
- **THEN** the system returns the same markdown source on subsequent reads

#### Scenario: Writer deletes a task
- **WHEN** a user with write access confirms task deletion
- **THEN** the system permanently removes that task and closes gaps in affected orders

#### Scenario: Task Creator loses Workspace Access
- **WHEN** a Task Creator no longer has write-level Workspace Access
- **THEN** Creator provenance alone grants no right to update or delete that Task

### Requirement: Board-scoped task identity
The system SHALL resolve a numeric task ID only within the workspace and board named by its route or API command.

#### Scenario: Task belongs to addressed board
- **WHEN** a readable task ID is requested under its owning workspace and board slugs
- **THEN** the system returns that task

#### Scenario: Task ID is requested under another board
- **WHEN** a task ID exists but not within the addressed board
- **THEN** the system returns no task data

### Requirement: Valid phase assignment
A Task Phase SHALL be empty or reference a Phase from the same Board. Completion SHALL be independent from Phase assignment so a Complete Task can retain its Phase for later reopening. Phase order SHALL NOT restrict transitions; a Workspace Writer may move a Task directly between any Phases in its Board.

#### Scenario: Writer assigns a board phase
- **WHEN** a writer assigns an active task to a phase belonging to its board
- **THEN** the system saves the phase and appends the task to that phase lane

#### Scenario: Writer skips intermediate Phases
- **WHEN** a Workspace Writer moves a Task directly between non-adjacent Phases
- **THEN** the system accepts the move without requiring intermediate transitions

#### Scenario: Writer assigns a foreign phase
- **WHEN** a writer assigns a task to a phase belonging to another board
- **THEN** the system rejects the mutation without changing the task

#### Scenario: Writer completes and reopens a phased task
- **WHEN** a writer completes a phased task and later reopens it without selecting another phase
- **THEN** the task leaves Archive and returns to its retained phase at the end of that lane

### Requirement: Canonical Board Order
The system SHALL maintain one deterministic Board Order shared by List and Phases modes. Each phase lane, Unphased, and Archive SHALL display its subset of tasks in Board Order, and movement in either mode SHALL update that same order while preserving the relative order of unaffected tasks.

#### Scenario: Writer reorders List mode
- **WHEN** a writer moves a task before or after another visible task in List mode
- **THEN** the system persists the new Board Order while preserving phase assignments

#### Scenario: Writer reorders within a phase lane
- **WHEN** a writer moves an active task before or after another task in the same phase lane
- **THEN** the system persists the new Board Order and List mode reflects that movement

#### Scenario: Writer moves between phase lanes
- **WHEN** a writer moves an active task into another phase lane
- **THEN** the system updates its phase and places it at the requested point in Board Order

#### Scenario: Writer moves task into Archive
- **WHEN** a writer moves an active task into Archive
- **THEN** the system marks it complete, retains its phase, and places it at the requested point in Board Order

#### Scenario: Writer moves task out of Archive
- **WHEN** a writer moves a completed task from Archive to a phase or Unphased lane
- **THEN** the system marks it incomplete, applies the destination phase, and places it at the requested point in Board Order

#### Scenario: Two moves target stale positions
- **WHEN** a move command names valid neighboring task anchors after another move has changed numeric positions
- **THEN** the system resolves current anchor order and applies the move atomically without duplicate positions

### Requirement: Task retrieval for board views
The system SHALL return the tasks, phase metadata, and ordering needed to render both board modes from one authoritative board result.

#### Scenario: Reader opens a board
- **WHEN** a user with read access opens a board
- **THEN** the system returns all board tasks in deterministic Board Order with their creator and phase metadata

#### Scenario: Board has no tasks
- **WHEN** a user opens a readable board containing no tasks
- **THEN** the system returns an empty task collection without error
