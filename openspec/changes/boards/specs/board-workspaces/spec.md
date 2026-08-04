## ADDED Requirements

### Requirement: Persistent workspace lifecycle
The system SHALL let Palace Administrators create, read, update, and permanently delete Workspaces. Each Workspace SHALL have a name, globally unique slug, optional allowed theme color, optional allowed Phosphor icon, and immutable creator. Workspace Managers SHALL NOT control Workspace identity or lifecycle.

#### Scenario: Palace Administrator creates a Workspace
- **WHEN** a Palace administrator submits a valid workspace name, unused slug, and initial admin group
- **THEN** the system persists the workspace and makes it addressable at `/boards/<workspace-slug>`

#### Scenario: Palace Administrator updates Workspace metadata
- **WHEN** a Palace Administrator changes the Workspace name, slug, color, or icon to valid values
- **THEN** the system persists the new metadata and uses the new slug for subsequent workspace URLs

#### Scenario: Duplicate Workspace slug is rejected
- **WHEN** a Palace Administrator submits a Workspace slug already used by another Workspace
- **THEN** the system rejects the mutation without changing either workspace

#### Scenario: Palace Administrator deletes an Empty Workspace
- **WHEN** a Palace Administrator confirms deletion of a Workspace with no attached resources
- **THEN** the system permanently removes its Workspace Access grants and the Workspace

#### Scenario: Palace Administrator attempts to delete a non-empty Workspace
- **WHEN** a Palace Administrator confirms deletion of a Workspace containing a Board
- **THEN** the system rejects deletion and identifies that attached resources must be removed first

#### Scenario: Workspace Manager attempts Workspace mutation
- **WHEN** a Workspace Manager attempts to rename, re-slug, recolor, re-icon, or delete a Workspace
- **THEN** the system rejects the operation without changing the Workspace

#### Scenario: Workspace Creator loses platform authority
- **WHEN** a Workspace Creator is no longer a Palace Administrator
- **THEN** Creator provenance alone grants no right to update or delete that Workspace

### Requirement: Group-based Workspace Access
The system SHALL associate each Workspace with one or more configured identity groups at `read`, `write`, or `manage` access. A user's effective Workspace Access SHALL be the highest level granted by any group to which the user belongs and SHALL apply to every Board, Phase, and Task in that Workspace without per-Board overrides.

#### Scenario: User receives highest group grant
- **WHEN** a user belongs to one group with read access and another group with write access to the same workspace
- **THEN** the system grants that user write access to the workspace

#### Scenario: Workspace Manager configures Workspace Access
- **WHEN** a Workspace Manager adds, changes, or removes a group access grant
- **THEN** subsequent Boards operations in that Workspace use the updated grant

#### Scenario: Workspace always retains a Manager
- **WHEN** an access update would leave a Workspace with no manage group and no Palace Administrator override
- **THEN** the system rejects the update without changing Workspace Access grants

### Requirement: Server-enforced Workspace permission levels
The system MUST enforce inherited Workspace Access on every Boards API operation. Read access SHALL permit viewing all Boards content in the Workspace, write access SHALL additionally permit Board, Phase, and Task mutations, and manage access SHALL additionally permit Workspace Access configuration. Manage SHALL add no content mutation power beyond write. Members of `palace-admins` SHALL own Workspace lifecycle and have manage access in all Workspaces.

#### Scenario: Read user views workspace content
- **WHEN** a user with read access requests a workspace, its boards, or their tasks
- **THEN** the system returns the requested content

#### Scenario: Read user attempts mutation
- **WHEN** a user with read access attempts to create, update, move, complete, or delete a Board, Phase, or Task
- **THEN** the system rejects the operation without changing data

#### Scenario: Workspace Writer manages content
- **WHEN** a user with write access performs a valid Board, Phase, or Task mutation
- **THEN** the system applies the mutation

#### Scenario: Workspace Writer attempts policy change
- **WHEN** a user with write access attempts to change Workspace Access
- **THEN** the system rejects the policy change without changing access grants

#### Scenario: Inaccessible direct request is denied
- **WHEN** a user requests a workspace resource without any applicable grant
- **THEN** the system returns no resource data and does not reveal descendant content

### Requirement: Workspace discovery
The system SHALL return only Workspaces where the current user has read-level Workspace Access and SHALL include each Workspace's name, slug, icon, color, and effective Workspace Access level.

#### Scenario: User lists workspaces
- **WHEN** an authenticated user opens Boards
- **THEN** the system lists every Workspace readable through Workspace Access and omits every other Workspace

#### Scenario: User has no Workspace Access
- **WHEN** an authenticated non-administrator has no Workspace Access grants
- **THEN** the system shows an empty workspace state without exposing workspace names
