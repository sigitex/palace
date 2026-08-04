## Why

Palace needs a general-purpose shared list tool for household work such as to-do lists, shopping, and media queues. Boards provide one persistent, group-controlled place to organize those tasks as either a list or a phased workflow.

## What Changes

- Add Palace-administered workspace lifecycle with group-based read, write, and manage Workspace Access inherited by every board.
- Add board management within workspaces, including stable URL slugs, theme colors, Phosphor icons, and configurable ordered phases.
- Add task creation, editing, completion, deletion, ordering, filtering, and movement between phases.
- Add `/boards` routes for workspace and board navigation plus deep-linked task details.
- Add List and Phases board modes, pointer and keyboard drag-and-drop, inline creation and renaming, configuration drawers, and guarded deletion.
- Add typed API operations and database storage for all Boards data and authorization rules.
- Document Boards behavior and access rules in `README.md`.

## Capabilities

### New Capabilities
- `board-workspaces`: Workspace lifecycle, presentation, and group access inherited by every board in the workspace.
- `board-configuration`: Board lifecycle, slug addressing, presentation metadata, and ordered phase configuration.
- `board-tasks`: Persistent task lifecycle, task details, completion, phase assignment, ordering, filtering, and movement.
- `boards-interface`: Boards routing, List and Phases modes, drawers, deletion confirmation, responsive behavior, and comprehensive keyboard interaction.

### Modified Capabilities

None.

## Impact

- Adds Boards routes and pages under `packages/web/app`, shared wire models, and typed RPC operations under `/api`.
- Adds workspace, access, board, phase, and task tables to the Outlaw-managed SQLite schema, plus services that enforce inherited permissions and ordered updates.
- Adds an accessible drag-and-drop dependency and uses Mantine controls, drawers, popovers, theme colors, and the existing Phosphor icon family.
- Adds service/API tests and interaction coverage for routing, keyboard behavior, and drag-and-drop; browser-level coverage may require new test tooling.
- Updates `README.md` with user-facing Boards behavior.
