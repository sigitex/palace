## 1. Foundations and Data Model

- [ ] 1.1 Add shared ArkType wire models, access-level types, stable theme color and Phosphor icon allowlists, and static icon resolution for Boards resources.
- [ ] 1.2 Add `workspace` and `workspace_access` Outlaw tables with creator, unique slug, inherited group grant, read/write/manage level, timestamp, constraint, and lookup-index definitions.
- [ ] 1.3 Add `board`, `board_phase`, and `board_task` Outlaw tables with scoped slug constraints, foreign keys, canonical task position, timestamps, and parent/order indexes.
- [ ] 1.4 Register new tables in the database schema and add an injectable temporary SQLite database setup for service and API tests.
- [ ] 1.5 Add runtime dependencies for accessible drag-and-drop and safe markdown rendering, plus browser interaction test tooling and package scripts.

## 2. Identity and Workspace Authorization

- [ ] 2.1 Replace hard-coded session groups with group UIDs resolved from persisted `member` and `group` rows while retaining the `palace-admins` platform override.
- [ ] 2.2 Create a `Workspaces` service for Palace-admin-only identity/lifecycle and Manager-controlled access plus a `Boards` service for inherited permission checks and inaccessible-resource handling.
- [ ] 2.3 Implement Palace-admin-only Workspace create/update mutations and Manager-controlled Workspace Access mutations, including global slug uniqueness and last-Manager protection.
- [ ] 2.4 Implement Workspace deletion that rejects Boards and transactionally removes Workspace Access grants plus an Empty Workspace.
- [ ] 2.5 Add service tests for persisted memberships, highest effective grants, Workspace filtering, inherited access across all Boards, read-only behavior, Writer content control, Manager policy control, non-authoritative Creator provenance, Palace Administrator lifecycle ownership and override, last-Manager protection, non-empty Workspace rejection, and Empty Workspace deletion.

## 3. Board, Phase, and Task Domain Operations

- [ ] 3.1 Implement Board list/get/create/update operations with Workspace-scoped slug validation, stable Creator metadata, and explicit slug changes that leave no redirects.
- [ ] 3.2 Implement transactional board deletion with descendant cleanup and tests proving other workspace boards remain unchanged.
- [ ] 3.3 Implement phase create/update/reorder operations with required allowed icon/color keys and deterministic positions.
- [ ] 3.4 Implement phase deletion that clears task assignments, appends active tasks to Unphased, preserves completed tasks, and closes phase-order gaps.
- [ ] 3.5 Implement task create/get/update/delete operations with board-scoped numeric identity, markdown source preservation, phase ownership validation, creator metadata, and order cleanup.
- [ ] 3.6 Implement semantic task movement by destination and current anchors, maintaining one canonical Board Order and atomic cross-phase, Archive, and reopen behavior.
- [ ] 3.7 Add domain tests for Board slug scope, Phase lifecycle, unrestricted Phase transitions, foreign-Phase rejection, shared ordering across both views, filtered-anchor movement, stale numeric positions, completion/reopen behavior, and empty aggregates.

## 4. Typed Boards API

- [ ] 4.1 Define nested workspace, board, phase, and task RPC input/output contracts with ISO timestamp strings and aggregate board responses.
- [ ] 4.2 Add Workspace and board RPC handlers that validate requests, delegate lifecycle to `Workspaces` and Boards policy to `Boards`, and return authorized results.
- [ ] 4.3 Add phase and task RPC handlers, including semantic move commands, and register all Boards operations and the service in the server container.
- [ ] 4.4 Add API boundary tests for malformed input, unsupported icon/color keys, missing sessions, denied access, board-scoped task lookup, and mutation responses.

## 5. Routing and Boards Index

- [ ] 5.1 Add typed path builders for workspace, board, and task URLs; register all existing Boards route patterns in `Layout/Routes`; and make navigation use the shared Boards index route.
- [ ] 5.2 Add TanStack Query hooks for workspace lists, board aggregates, and mutation invalidation without duplicating server data in Valtio.
- [ ] 5.3 Build the desktop Boards index with left workspace and right board vertical lists, icon/color metadata, URL-driven selection, access-aware actions, and empty/error/loading states.
- [ ] 5.4 Add narrow-screen stacked or drill-in workspace/board selection with clear back navigation and no horizontal page overflow.
- [ ] 5.5 Add arrow selection, Enter/double-click opening, F2 inline rename, and context-sensitive `n` inline creation for workspace and board lists, with shortcuts disabled while typing.

## 6. Board Views and Task Movement

- [ ] 6.1 Build the Board shell and toolbar with transient `SegmentedControl` List/Phases switching that starts in List, Board title metadata, local selection state, and right-aligned settings action.
- [ ] 6.2 Build List mode rows with completion checkbox, title, colored phase icon/text, context menu, deterministic ordering, and combined title/completion/phase filters.
- [ ] 6.3 Build Phases mode with ordered colored phase lanes, Unphased, task cards, horizontal scrolling, and rightmost Archive collapsed by default with a toolbar toggle.
- [ ] 6.4 Add shared pointer, touch, and keyboard drag-and-drop movement that updates Board Order during List reordering, within-lane reordering, cross-phase movement, and expanded Archive completion/reopening.
- [ ] 6.5 Add task context-menu movement as a non-drag fallback and route drag, Ctrl+Arrow, and menu actions through the same semantic move functions.
- [ ] 6.6 Add board-task keyboard selection, Enter/double-click details, F2 inline rename, `n` inline creation, Delete confirmation opening, Ctrl+Arrow movement, focus retention, scrolling, and screen-reader announcements.
- [ ] 6.7 Handle move failures by restoring authoritative query data, retaining focus where possible, and displaying and announcing the error.

## 7. Drawers, Settings, and Deletion

- [ ] 7.1 Build reusable Boards icon/color selectors backed by shared allowlists and render selected metadata in all workspace, board, phase, and task surfaces.
- [ ] 7.2 Build the Workspace configuration drawer with Palace-admin-only metadata and deletion controls, clear non-empty deletion feedback, and group read/write/manage Workspace Access controls visible to Workspace Managers.
- [ ] 7.3 Build the Workspace-Writer Board configuration drawer with metadata fields, Phase create/edit/reorder/delete controls, and permanent Board deletion.
- [ ] 7.4 Build the route-backed task detail drawer with ID and creator display plus editable title, complete, phase, and markdown details with raw HTML disabled.
- [ ] 7.5 Add Mantine confirmation Popovers with Cancel and Delete actions for workspace, board, phase, and task deletion; restore focus on cancel and choose a neighboring selection on success.
- [ ] 7.6 Ensure closing a deep-linked task drawer returns to the board URL, browser history behaves correctly, and origin task focus is restored when visible.

## 8. Verification and Documentation

- [ ] 8.1 Add browser tests for index and deep-link routing, responsive list flow, mode switching, combined filtering, drawer history, metadata selectors, and guarded deletion.
- [ ] 8.2 Add browser tests for inline create/rename, shortcut suppression while editing, focus restoration, Ctrl+Arrow moves, pointer drag, keyboard drag, Archive movement, and failure rollback.
- [ ] 8.3 Update `README.md` with Boards routes, mutable Slug link behavior, inherited read/write/manage Workspace Access, List and Phases behavior, Archive semantics, permanent deletion, and keyboard commands.
- [ ] 8.4 Run formatting, lint, type checks, Bun tests, browser interaction tests, and `openspec validate boards`; fix all failures without changing unrelated worktree edits.
