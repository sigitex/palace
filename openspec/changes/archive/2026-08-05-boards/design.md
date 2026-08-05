## Context

Palace currently has Boards navigation and route patterns, but no Boards page, API, services, or database model. The web package uses React 19, Mantine, Wouter, TanStack Query, typed ArkType RPC operations, and an Outlaw-managed SQLite database. Existing session middleware binds a user but hard-codes group membership; Workspace Access must instead be enforced against persisted identity groups on the server.

Boards span several concerns: a reusable workspace domain, group authorization, persistent ordered data, route-driven drawers, two task projections, accessible drag-and-drop, and keyboard-first interaction. SQLite is sufficient for expected household-scale data, but reorder and delete operations must be atomic because Outlaw foreign keys do not provide cascading deletes.

## Goals / Non-Goals

**Goals:**

- Persist workspaces, group access, boards, phases, and tasks in SQLite behind typed RPC operations.
- Enforce inherited read, write, and manage Workspace Access on every server operation.
- Provide responsive List and Phases views with deep-linked task details.
- Keep task ordering deterministic across list reordering, phase movement, completion, filtering, and concurrent requests.
- Make primary actions available through pointer, touch, and keyboard interaction.
- Reuse Mantine, existing routing, icon conventions, and TanStack Query rather than introducing another UI architecture.

**Non-Goals:**

- Real-time multi-user updates, comments, attachments, due dates, assignees, labels, or notifications.
- Per-Board, per-Phase, or per-Task access rules beyond inherited Workspace Access.
- Persisted personal view preferences, saved filters, or custom icon uploads.
- General authentication or multi-site role redesign beyond resolving real group memberships for authorization.
- Compatibility aliases or redirects for changed workspace or board slugs.

## Decisions

### Model workspaces independently from Boards

Add `workspace`, `workspace_access`, `board`, `board_phase`, and `board_task` tables. `workspace` is not a renamed identity group: Workspace Access rows associate one Workspace with one or more identity groups, and every Board in that Workspace inherits those grants. No Board-level access table exists.

Workspaces have a globally unique slug. Board slugs are unique within a workspace. Names and slugs are separate; changing a name does not silently change its URL. Explicit slug changes take effect immediately without compatibility redirects because this is greenfield functionality.

`board_task` has nullable `phase`, `complete`, `details`, and one `position`. That position defines canonical Board Order in both views. Incomplete, configured Phase, and Complete lanes show ordered subsets of Board Order rather than maintaining competing sequences. Completed tasks retain their phase assignment, so reopening a task returns it to that phase.

Parent lookup and ordering indexes cover Workspace Access, board slugs, phase positions, and task positions. Board deletion is explicit and child-first in a transaction. Workspace deletion is rejected while any Board remains; once empty, its Workspace Access rows can be removed with the Workspace. Deleting a Phase clears affected Task phases rather than deleting them.

Alternative considered: model Workspaces as identity groups. Rejected because a Workspace is a resource container that may grant several identity groups different levels. Alternative considered: add per-Board overrides. Rejected because they complicate discovery and effective access without a current need. Alternative considered: keep independent List and lane positions. Rejected because the same Board could express conflicting priority and movement in one view would have no visible meaning in the other.

### Separate Workspace lifecycle from inherited access

Add a cohesive `Workspaces` service responsible for Workspace identity, access policy, and lifecycle. Workspace lifecycle remains restricted to `palace-admins`; Workspace Managers change access grants. Add a separate `Boards` service responsible for Board lookup, inherited permission checks, CRUD, and ordered mutations. RPC handlers validate wire input and delegate policy to the owning service; handlers do not issue direct table mutations.

Session middleware resolves group UIDs from persisted `member` rows instead of binding hard-coded groups. Effective Workspace Access is the highest level granted through any current group. Read permits viewing every Board in the Workspace, write adds all Board, Phase, and Task mutations, and manage additionally changes Workspace Access. Manage adds no separate content power beyond write. Workspace Managers cannot rename, re-slug, or delete the Workspace. Members of `palace-admins` own Workspace lifecycle and have manage access in all Workspaces, providing a bootstrap path.

Every Boards read filters Workspaces without applicable Workspace Access, and every direct Workspace, Board, Phase, or Task operation repeats inherited authorization on the server. Client-side hiding remains a convenience, not a security boundary.

`created_by` records immutable provenance only. It never bypasses current Workspace Access or Palace Administrator requirements, so removing a user's group grant also removes access to resources that user created.

Alternative considered: let Workspace Managers own Workspace lifecycle. Rejected because manage exists only to control access, while Palace Administrators own shared container identity. Alternative considered: authorize only in React with the existing `Auth` component. Rejected because direct RPC calls would bypass it. Alternative considered: duplicate access checks in each handler. Rejected because permission drift would be likely.

### Use typed aggregate RPC operations

Extend `operations.boards` with nested workspace, board, phase, and task commands. Each operation lives in its own file and owns its ArkType input and output descriptors; reusable response entity schemas remain shared models. Resource index files only assemble nested command objects, preserving the public RPC shape while keeping validation and implementation together. Responses expose numeric IDs, slugs, metadata, creator summaries, and timestamps as ISO 8601 strings rather than incorrectly typing JSON values as `Date`.

Board retrieval returns the board, phases, and tasks needed by either view. Mutations return the affected aggregate or entity so TanStack Query can update and then invalidate the authoritative board query. Move commands accept a destination lane plus before/after task anchors, not client-generated numeric positions. The service resolves anchors against current Board Order and renumbers affected rows in one SQLite transaction.

Alternative considered: add conventional REST endpoints. Rejected because Palace already has a typed RPC convention and client generator. Alternative considered: accept complete reordered arrays. Rejected because stale clients could overwrite unrelated movement and payloads grow with board size.

The API boundary converts authenticated session data into a small Actor value and maps domain errors to Route errors. Each operation declares only the services it uses rather than depending on a broad Boards request context. Domain values live beside their owner: Actor under authorization, shared Boards errors under errors, and movement values beside the Boards service.

Alternative considered: centralize every Boards request and response in one contract module or expose grouped operation modules. Rejected because Palace conventions favor operation-local validation, and a broad context hides each handler's actual dependencies.

### Put interactive transactions in Outlaw

Outlaw's core `Connection` capability optionally exposes an adapter-neutral interactive transaction callback, while every database API exposes `transaction` and reports an exported unsupported-capability error before invoking the callback. Each callback receives a fresh database API bound to its scoped connection. Palace services must use that scoped API for authorization, presentation, and writes rather than relying on ambient transaction state.

The Bun adapter serializes root operations FIFO, starts outer work with `BEGIN IMMEDIATE`, awaits commit or rollback, prevents unrelated root queries from entering active work, and implements nested transactions with savepoints. Transaction-scoped connections expire when their callback ends. Cowboy migration shares one retryable readiness Promise across concurrent first operations and forwards transactions only after migrations and seeds finish. Cloudflare D1 remains unsupported for interactive callbacks because its public API provides batching rather than callback transactions; `script()` continues to use D1 batch.

Alternative considered: keep Palace's Bun-specific `AsyncLocalStorage` transaction wrapper. Rejected because transaction semantics belong to the database adapter, ambient reentrancy hides accidental use of the root database, and other Outlaw consumers need a capability they can detect without importing Bun.

### Make routes the source of truth for selected resources

Add one Boards page under existing route patterns. `/boards` shows the workspace and board lists, `/boards/:workspace` selects a workspace, `/boards/:workspace/:board` opens a board, and `/boards/:workspace/:board/:task` opens that task in a drawer over its board. Closing the task drawer navigates back to the board URL, so direct links and browser history work naturally.

Workspace and Board configuration drawers are local UI state because they are transient settings surfaces, not separately addressable resources. Workspace settings expose lifecycle and metadata only to Palace Administrators, while Workspace Managers can change only Workspace Access there. Board settings are available to Workspace Writers but Phase management belongs inline in Phases mode. Current keyboard selection, List/Phases tab, filters, and fixed-lane visibility are local page state. Each Board mount starts in List with Incomplete visible and Complete hidden; these preferences are not persisted or shared.

TanStack Query owns server data and mutation lifecycle. Wouter owns URL state. A feature-local Valtio store owns shared transient Board mode, task selection, List filters, composer visibility, fixed-lane visibility, and active Phase editing, resetting when Board identity changes. Form drafts remain component-local. Pointer coordinates and drag targets remain imperative refs. This prevents Valtio from becoming a second server cache or pointer-event bus.

Alternative considered: store the selected task only in component state. Rejected because task deep links and browser navigation are explicit requirements.

### Use semantic movement shared by drag and keyboard controls

Use native Pointer Events with pointer capture for mouse, pen, and touch movement. Resolve drop targets through Board-owned DOM data attributes and commit only on pointer release so rows and lanes do not animate unpredictably during a gesture. Ctrl+Arrow commands and visible context-menu actions remain keyboard and non-drag fallbacks and call the same movement functions and RPC commands.

List mode changes Board Order. Phases mode changes that same order and, when crossing lanes, phase or completion state. Each lane displays its tasks in Board Order. Active tasks without a phase appear in fixed leftmost Incomplete. Completed tasks appear in fixed rightmost Complete regardless of retained phase; moving out of Complete clears completion and assigns the destination phase. Configured Phases reorder between those fixed lanes. Reordering a filtered list places the moved task relative to visible anchor tasks while hidden tasks retain relative order.

Phases provide free organization rather than workflow enforcement. Phase order controls presentation only; any Workspace Writer can move a Task directly between any Phases without transition rules.

Integer positions are renumbered across the Board after each move. This is simple and reliable for household-scale boards. A sparse rank scheme would reduce writes but add rebalance and comparison complexity without demonstrated need.

Pointer movement is an imperative hot path: source, target, latest point, ghost, and active scroll container remain in refs; the latest point is processed at most once per animation frame; and old/new target classes are changed directly on DOM elements. Lightweight label ghosts avoid cloning a Phase lane subtree. React renders controllers, lanes, rows, and cards only for semantic state changes, while Phase task buckets are built in one pass through Board Order.

Mutation cache updates are scoped to affected workspace, board list, access list, or aggregate keys. A successful Task move installs the aggregate returned by the server without an unconditional refetch; a failed move restores and refetches only its authoritative Board aggregate.

### Store stable icon and color keys

Store optional Mantine theme color names and Phosphor Duotone glyph keys, never CSS values or component source. A generated checked-in catalog from `@phosphor-icons/web` drives ArkType validation, searchable paginated icon selection, and safe font-class rendering without bundling thousands of React components. Phases require color but may omit icon; new Phase composition starts blank. Workspaces and boards may omit either. Direct swatches select colors and every metadata-bearing surface renders the stored values.

Alternative considered: store arbitrary colors and icon names. Rejected because values could become invalid, inaccessible, or unsafe as dependencies change.

### Treat completion and deletion as different concepts

Completion moves Tasks into the reversible Complete projection; it does not delete data. Task, Board, and Workspace deletion is permanent and requires a Mantine Popover containing explicit Cancel and Delete actions. Board deletion removes its Phase and Task descendants in a server transaction. Workspace deletion succeeds only for an Empty Workspace and removes access rows, never Boards. Phase deletion preserves Tasks by clearing their Phase.

No soft-delete layer is added. It would complicate every query and permission path without a recovery requirement.

### Test policy and interaction boundaries

Use Bun tests with temporary SQLite databases for service policy, access filtering, validation, deletion, and ordering invariants. Add browser interaction coverage for route-backed drawers, combined filters, keyboard creation/rename/delete/move commands, native pointer movement, and stable scrolling. Tests use public UI and API boundaries rather than private component state. Update `README.md` with routes, permissions, modes, and keyboard commands.

## Risks / Trade-offs

- **Hard-coded group behavior currently masks real membership:** Resolve `member` rows in session middleware and test users with disjoint groups before relying on Workspace permissions.
- **Multi-row reorder or Board delete can partially apply:** Execute policy check, row lookup, and all affected writes in one SQLite transaction.
- **Contiguous Board Order causes O(n) writes:** Accept for household-scale boards; move to sparse ranks only if measured board sizes make this material.
- **Drag-and-drop can exclude keyboard or touch users:** Preserve mouse, pen, and touch Pointer Events, provide context-menu move actions, preserve focus, and cover keyboard behavior in browser tests.
- **Markdown details can introduce script injection:** Render with raw HTML disabled and sanitize any renderer output; editing always preserves source markdown.
- **Wide phase boards can overflow small screens:** Keep lanes horizontally scrollable with touch-friendly handles while list and index layouts stack at narrow widths.
- **Changing a slug breaks old links:** Make slug edits explicit in settings and show the resulting URL before save; do not add speculative redirects.

## Migration Plan

1. Add schema tables and indexes; Outlaw creates them empty on first database use.
2. Resolve persisted session group memberships and add Boards service/API tests before exposing routes.
3. Add the Boards UI and navigation route, then run API, type, lint, and browser interaction checks.
4. Deploy schema and application code together. No data backfill is required because Boards has no existing records.
5. Before a rollback after production data exists, back up `palace.sqlite`; prefer a forward fix so a downgraded schema run cannot remove new tables.

## Open Questions

None. Scope decisions needed for implementation are resolved above.
