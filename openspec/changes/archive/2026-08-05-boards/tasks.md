## 1. Foundations and Data Model

- [x] 1.1 Add shared ArkType wire models, access-level types, stable theme color and Phosphor icon allowlists, and static icon resolution for Boards resources.
- [x] 1.2 Add `workspace` and `workspace_access` Outlaw tables with creator, unique slug, inherited group grant, read/write/manage level, timestamp, constraint, and lookup-index definitions.
- [x] 1.3 Add `board`, `board_phase`, and `board_task` Outlaw tables with scoped slug constraints, foreign keys, canonical task position, timestamps, and parent/order indexes.
- [x] 1.4 Register new tables in the database schema and add an injectable temporary SQLite database setup for service and API tests.
- [x] 1.5 Add runtime dependencies for safe markdown rendering plus browser interaction test tooling and package scripts.

## 2. Identity and Workspace Authorization

- [x] 2.1 Replace hard-coded session groups with group UIDs resolved from persisted `member` and `group` rows while retaining the `palace-admins` platform override.
- [x] 2.2 Create a `Workspaces` service for Palace-admin-only identity/lifecycle and Manager-controlled access plus a `Boards` service for inherited permission checks and inaccessible-resource handling.
- [x] 2.3 Implement Palace-admin-only Workspace create/update mutations and Manager-controlled Workspace Access mutations, including global slug uniqueness and last-Manager protection.
- [x] 2.4 Implement Workspace deletion that rejects Boards and transactionally removes Workspace Access grants plus an Empty Workspace.
- [x] 2.5 Add service tests for persisted memberships, highest effective grants, Workspace filtering, inherited access across all Boards, read-only behavior, Writer content control, Manager policy control, non-authoritative Creator provenance, Palace Administrator lifecycle ownership and override, last-Manager protection, non-empty Workspace rejection, and Empty Workspace deletion.

## 3. Board, Phase, and Task Domain Operations

- [x] 3.1 Implement Board list/get/create/update operations with Workspace-scoped slug validation, stable Creator metadata, and explicit slug changes that leave no redirects.
- [x] 3.2 Implement transactional board deletion with descendant cleanup and tests proving other workspace boards remain unchanged.
- [x] 3.3 Implement phase create/update/reorder operations with required allowed color, optional allowed icon, and deterministic positions.
- [x] 3.4 Implement phase deletion that clears task assignments, appends active tasks to Incomplete, preserves completed tasks, and closes phase-order gaps.
- [x] 3.5 Implement task create/get/update/delete operations with board-scoped numeric identity, markdown source preservation, phase ownership validation, creator metadata, and order cleanup.
- [x] 3.6 Implement semantic task movement by destination and current anchors, maintaining one canonical Board Order and atomic cross-phase, Complete, and reopen behavior.
- [x] 3.7 Add domain tests for Board slug scope, Phase lifecycle, unrestricted Phase transitions, foreign-Phase rejection, shared ordering across both views, filtered-anchor movement, stale numeric positions, completion/reopen behavior, and empty aggregates.

## 4. Typed Boards API

- [x] 4.1 Define nested workspace, board, phase, and task RPC input/output contracts with ISO timestamp strings and aggregate board responses.
- [x] 4.2 Add Workspace and board RPC handlers that validate requests, delegate lifecycle to `Workspaces` and Boards policy to `Boards`, and return authorized results.
- [x] 4.3 Add phase and task RPC handlers, including semantic move commands, and register all Boards operations and the service in the server container.
- [x] 4.4 Add API boundary tests for malformed input, unsupported icon/color keys, missing sessions, denied access, board-scoped task lookup, and mutation responses.

## 5. Routing and Boards Index

- [x] 5.1 Add typed path builders for workspace, board, and task URLs; register all existing Boards route patterns in `Layout/Routes`; and make navigation use the shared Boards index route.
- [x] 5.2 Add TanStack Query hooks for workspace lists, board aggregates, and mutation invalidation without duplicating server data in Valtio.
- [x] 5.3 Build the desktop Boards index with left workspace and right board vertical lists, icon/color metadata, URL-driven selection, access-aware actions, and empty/error/loading states.
- [x] 5.4 Add narrow-screen stacked or drill-in workspace/board selection with clear back navigation and no horizontal page overflow.
- [x] 5.5 Add arrow selection, Enter/double-click opening, F2 inline rename, and context-sensitive `n` inline creation for workspace and board lists, with shortcuts disabled while typing.

## 6. Board Views and Task Movement

- [x] 6.1 Build the Board shell and header with transient List/Phases Tabs that start in List, Board title metadata, local selection state, and right-aligned settings action.
- [x] 6.2 Build List mode rows with completion checkbox, title, colored phase icon/text, context menu, deterministic ordering, and combined title/completion/phase filters.
- [x] 6.3 Build Phases mode with ordered colored Phase lanes, fixed Incomplete and Complete projections, task cards, horizontal scrolling, and direct lane visibility controls.
- [x] 6.4 Add shared native pointer and keyboard movement that updates Board Order during List reordering, within-lane reordering, cross-phase movement, and Complete/reopen behavior.
- [x] 6.5 Add task context-menu movement as a non-drag fallback and route drag, Ctrl+Arrow, and menu actions through the same semantic move functions.
- [x] 6.6 Add board-task keyboard selection, Enter/double-click details, F2 inline rename, `n` inline creation, Delete confirmation opening, Ctrl+Arrow movement, focus retention, scrolling, and screen-reader announcements.
- [x] 6.7 Handle move failures by restoring authoritative query data, retaining focus where possible, and displaying and announcing the error.

## 7. Drawers, Settings, and Deletion

- [x] 7.1 Build reusable Boards icon/color selectors backed by shared allowlists and render selected metadata in all workspace, board, phase, and task surfaces.
- [x] 7.2 Build the Workspace configuration drawer with Palace-admin-only metadata and deletion controls, clear non-empty deletion feedback, and group read/write/manage Workspace Access controls visible to Workspace Managers.
- [x] 7.3 Build the Workspace-Writer Board configuration drawer with metadata fields, Phase create/edit/reorder/delete controls, and permanent Board deletion.
- [x] 7.4 Build the route-backed task detail drawer with ID and creator display plus editable title, complete, phase, and markdown details with raw HTML disabled.
- [x] 7.5 Add Mantine confirmation Popovers with Cancel and Delete actions for workspace, board, phase, and task deletion; restore focus on cancel and choose a neighboring selection on success.
- [x] 7.6 Ensure closing a deep-linked task drawer returns to the board URL, browser history behaves correctly, and origin task focus is restored when visible.

## 8. Verification and Documentation

- [x] 8.1 Add browser tests for index and deep-link routing, responsive list flow, mode switching, combined filtering, drawer history, metadata selectors, and guarded deletion.
- [x] 8.2 Add browser tests for inline create/rename, shortcut suppression while editing, focus restoration, Ctrl+Arrow moves, pointer movement, directional keyboard controls, Complete movement, and failure rollback.
- [x] 8.3 Update `README.md` with Boards routes, mutable Slug link behavior, inherited read/write/manage Workspace Access, List and Phases behavior, Complete semantics, permanent deletion, and keyboard commands.
- [x] 8.4 Run formatting, lint, type checks, Bun tests, browser interaction tests, and `openspec validate boards`; fix all failures without changing unrelated worktree edits.

## 9. Direct Board Creation and Filters

- [x] 9.1 Add a visible Board-toolbar Task composer with title and Phase selection plus direct toolbar Phase creation in Phases mode.
- [x] 9.2 Add visible inline Task composers to every configured Phase lane and Incomplete while keeping `n` as an accelerator.
- [x] 9.3 Add task search, exclusive projection filters, inline colored Phase assignment, and Incomplete wording across the interface.
- [x] 9.4 Update browser coverage and README, then rerun formatting, lint, type checks, Bun tests, browser tests, build, and strict OpenSpec validation.

## 10. Board Interaction Redesign

- [x] 10.1 Replace the limited icon map and dropdown selectors with every Phosphor Duotone glyph, generated validation catalog, searchable paginated icon-only picker, direct color swatches, consistent metadata rendering, and shaded selection.
- [x] 10.2 Replace the mode switch with Tabs, move Task entry inline, combine List filters into All/Incomplete/Phase/Complete, add inline colored Phase assignment, and subdue Complete Tasks.
- [x] 10.3 Rebuild Phases mode with fixed left Incomplete and right Complete visibility controls plus inline Phase title/color/icon editing, guarded deletion, and pointer/keyboard Phase reordering.
- [x] 10.4 Remove Phase controls and Identity headings from settings, rename Archive semantics to Complete across private RPC/client code, and update user-facing terminology.
- [x] 10.5 Expand API/browser coverage and documentation, then run formatting, lint, type checks, Bun tests, browser tests, build, and strict OpenSpec validation.

## 11. Board Interaction Refinement

- [x] 11.1 Make Phase icons optional, make Complete override retained Phase in Task state controls, and preserve Board Order during non-movement Task state updates.
- [x] 11.2 Replace `@dnd-kit` with native Pointer Events for Task and Phase movement, clear insertion feedback, edge scrolling, and distinct six-dot drag grips.
- [x] 11.3 Give Phases mode a stable full-height native scroll viewport, full-height lanes, bottom scrollbar, and lane-aware directional keyboard navigation.
- [x] 11.4 Replace the Task form drawer with a notebook-style detail surface, simplify the Board header, tint every Board index row, and add Left/Right index focus transitions.
- [x] 11.5 Expand service/browser coverage and documentation, remove obsolete dependencies, then run formatting, lint, type checks, Bun tests, browser tests, build, and strict OpenSpec validation.

## 12. Architecture and Rendering Refactor

- [x] 12.1 Add adapter-neutral interactive transactions to Outlaw's core database API, implement FIFO outer transactions and nested savepoints for Bun, make Cowboy initialization shared and retryable, preserve Cloudflare batch-only behavior, and add transaction tests and documentation.
- [x] 12.2 Replace Palace's ambient transaction adapter with Outlaw's scoped database API and pass scoped connections through every transactional authorization, presentation, and aggregate helper.
- [x] 12.3 Move Boards authorization, error, and movement values to their owning layers; remove metadata parameter bags; split RPC handlers and ArkType descriptors into one operation per file; and preserve the nested public RPC shape with narrow operation dependencies.
- [x] 12.4 Reorganize the Boards frontend by Index, Board, List, Phases, Task, Presentation, Drag, State, and Shared responsibilities; extract isolated Task rows, Task cards, and Phase lanes; and add feature-local Valtio state that resets for a different Board without storing server data, form drafts, or drag coordinates.
- [x] 12.5 Move pointer drag targeting out of React state with ref and animation-frame processing, lightweight ghosts, cached scrolling, and direct target classes; build Phase task buckets in one pass; narrow query invalidation; avoid successful move refetches; and remove Task detail excerpts and details-based List search.
- [x] 12.6 Expand Outlaw unit and Palace service, API, state, movement, and browser coverage as needed; update relevant README documentation; then run formatting, lint, type checks, unit tests, browser tests, production build, strict OpenSpec validation, and diff checks.
