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

`board_task` has nullable `phase`, `complete`, `details`, and one `position`. That position defines canonical Board Order in both views. Phase lanes and Archive show ordered subsets of Board Order rather than maintaining competing sequences. Completed tasks retain their phase assignment, so reopening a task returns it to that phase.

Parent lookup and ordering indexes cover Workspace Access, board slugs, phase positions, and task positions. Board deletion is explicit and child-first in a transaction. Workspace deletion is rejected while any Board remains; once empty, its Workspace Access rows can be removed with the Workspace. Deleting a Phase clears affected Task phases rather than deleting them.

Alternative considered: model Workspaces as identity groups. Rejected because a Workspace is a resource container that may grant several identity groups different levels. Alternative considered: add per-Board overrides. Rejected because they complicate discovery and effective access without a current need. Alternative considered: keep independent List and lane positions. Rejected because the same Board could express conflicting priority and movement in one view would have no visible meaning in the other.

### Separate Workspace lifecycle from inherited access

Add a cohesive `Workspaces` service responsible for Workspace identity, access policy, and lifecycle. Workspace lifecycle remains restricted to `palace-admins`; Workspace Managers change access grants. Add a separate `Boards` service responsible for Board lookup, inherited permission checks, CRUD, and ordered mutations. RPC handlers validate wire input and delegate policy to the owning service; handlers do not issue direct table mutations.

Session middleware resolves group UIDs from persisted `member` rows instead of binding hard-coded groups. Effective Workspace Access is the highest level granted through any current group. Read permits viewing every Board in the Workspace, write adds all Board, Phase, and Task mutations, and manage additionally changes Workspace Access. Manage adds no separate content power beyond write. Workspace Managers cannot rename, re-slug, or delete the Workspace. Members of `palace-admins` own Workspace lifecycle and have manage access in all Workspaces, providing a bootstrap path.

Every Boards read filters Workspaces without applicable Workspace Access, and every direct Workspace, Board, Phase, or Task operation repeats inherited authorization on the server. Client-side hiding remains a convenience, not a security boundary.

`created_by` records immutable provenance only. It never bypasses current Workspace Access or Palace Administrator requirements, so removing a user's group grant also removes access to resources that user created.

Alternative considered: let Workspace Managers own Workspace lifecycle. Rejected because manage exists only to control access, while Palace Administrators own shared container identity. Alternative considered: authorize only in React with the existing `Auth` component. Rejected because direct RPC calls would bypass it. Alternative considered: duplicate access checks in each handler. Rejected because permission drift would be likely.

### Use typed aggregate RPC operations

Extend `operations.boards` with nested workspace, board, phase, and task commands. Shared ArkType wire models define request and response shapes. Responses expose numeric IDs, slugs, metadata, creator summaries, and timestamps as ISO 8601 strings rather than incorrectly typing JSON values as `Date`.

Board retrieval returns the board, phases, and tasks needed by either view. Mutations return the affected aggregate or entity so TanStack Query can update and then invalidate the authoritative board query. Move commands accept a destination lane plus before/after task anchors, not client-generated numeric positions. The service resolves anchors against current Board Order and renumbers affected rows in one SQLite transaction.

Alternative considered: add conventional REST endpoints. Rejected because Palace already has a typed RPC convention and client generator. Alternative considered: accept complete reordered arrays. Rejected because stale clients could overwrite unrelated movement and payloads grow with board size.

### Make routes the source of truth for selected resources

Add one Boards page under existing route patterns. `/boards` shows the workspace and board lists, `/boards/:workspace` selects a workspace, `/boards/:workspace/:board` opens a board, and `/boards/:workspace/:board/:task` opens that task in a drawer over its board. Closing the task drawer navigates back to the board URL, so direct links and browser history work naturally.

Workspace and Board configuration drawers are local UI state because they are transient settings surfaces, not separately addressable resources. Workspace settings expose lifecycle and metadata only to Palace Administrators, while Workspace Managers can change only Workspace Access there. Board settings are available to Workspace Writers. Current keyboard selection, List/Phases mode, filters, and Archive expansion are local page state. Each Board mount starts in List View with Archive collapsed; neither preference is persisted or shared.

TanStack Query owns server data and mutation lifecycle. Wouter owns URL state. Local component state owns transient editing, filtering, selection, and drag projection. This prevents Valtio from becoming a second server cache.

Alternative considered: store the selected task only in component state. Rejected because task deep links and browser navigation are explicit requirements.

### Use semantic movement shared by drag and keyboard controls

Add `@dnd-kit/core` and `@dnd-kit/sortable` for pointer, touch, and keyboard sensors. Both drag gestures and Ctrl+Arrow commands call the same movement functions and RPC commands. Screen-reader announcements describe pickup, destination, and completion; visible context-menu move actions provide a non-drag fallback.

List mode changes Board Order. Phases mode changes that same order and, when crossing lanes, phase or completion state. Each lane displays its tasks in Board Order. Active tasks without a phase appear in an Unphased lane. Completed tasks appear in one Archive lane regardless of retained phase; moving out of Archive clears completion and assigns the destination phase. Reordering a filtered list places the moved task relative to visible anchor tasks while hidden tasks retain relative order.

Phases provide free organization rather than workflow enforcement. Phase order controls presentation only; any Workspace Writer can move a Task directly between any Phases without transition rules.

Integer positions are renumbered across the Board after each move. This is simple and reliable for household-scale boards. A sparse rank scheme would reduce writes but add rebalance and comparison complexity without demonstrated need.

### Store stable icon and color keys

Store optional Mantine theme color names and Phosphor icon registry keys, never CSS values or component source. A shared allowlist drives ArkType validation and UI selectors. Phases require both an icon and color; workspaces and boards may omit either. Rendering resolves keys through a static icon map so API data cannot select arbitrary modules or markup.

Alternative considered: store arbitrary colors and icon names. Rejected because values could become invalid, inaccessible, or unsafe as dependencies change.

### Treat completion and deletion as different concepts

Completion moves Tasks into the reversible Archive projection; it does not delete data. Task, Board, and Workspace deletion is permanent and requires a Mantine Popover containing explicit Cancel and Delete actions. Board deletion removes its Phase and Task descendants in a server transaction. Workspace deletion succeeds only for an Empty Workspace and removes access rows, never Boards. Phase deletion preserves Tasks by making them unphased.

No soft-delete layer is added. It would complicate every query and permission path without a recovery requirement.

### Test policy and interaction boundaries

Use Bun tests with temporary SQLite databases for service policy, access filtering, validation, deletion, and ordering invariants. Add browser interaction coverage for route-backed drawers, combined filters, keyboard creation/rename/delete/move commands, and pointer/keyboard drag-and-drop. Tests use public UI and API boundaries rather than private component state. Update `README.md` with routes, permissions, modes, and keyboard commands.

## Risks / Trade-offs

- **Hard-coded group behavior currently masks real membership:** Resolve `member` rows in session middleware and test users with disjoint groups before relying on Workspace permissions.
- **Multi-row reorder or Board delete can partially apply:** Execute policy check, row lookup, and all affected writes in one SQLite transaction.
- **Contiguous Board Order causes O(n) writes:** Accept for household-scale boards; move to sparse ranks only if measured board sizes make this material.
- **Drag-and-drop can exclude keyboard or touch users:** Configure all three sensor types, provide context-menu move actions, preserve focus, and cover keyboard behavior in browser tests.
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
