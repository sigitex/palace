# Palace

> Tools for family.

## Planned Features

- Calendar
- Family
- Budget
- Bots
- Photos
- Admin
- Profile
- Telegram Login
- OIDC Login

## Boards

Boards organize shared tasks inside group-controlled Workspaces.

### Routes

- `/boards` lists readable Workspaces.
- `/boards/<workspace-slug>` lists Boards in one Workspace.
- `/boards/<workspace-slug>/<board-slug>` opens a Board.
- `/boards/<workspace-slug>/<board-slug>/<task-id>` opens Task details over its Board.

Workspace and Board names do not control URLs. Authorized users may change Slugs explicitly. A changed Slug takes effect immediately; old links do not redirect.

### Access

Workspace Access comes from identity groups and applies to every Board, Phase, and Task in that Workspace:

- `read` views all Workspace content.
- `write` also creates, edits, moves, completes, and permanently deletes Board content.
- `manage` also configures group Workspace Access.

Palace Administrators create, rename, re-slug, and delete Workspaces. Workspace Managers do not control Workspace identity or lifecycle. Workspace deletion requires an Empty Workspace.

### Views

List mode shows canonical Board Order with title-only task search and one exclusive `All | Incomplete | <Phases> | Complete` filter group. All Tasks appear by default. List rows and Phase cards show titles without detail excerpts; full details remain in the Task notebook. Each Task exposes a colored state control where Complete overrides its retained Phase, and checkbox/state changes preserve Board Order. Complete Task text is subdued. Phases mode projects the same order into a fixed left Incomplete lane, ordered configured Phase lanes, and a fixed right Complete lane. Incomplete starts visible and Complete hidden; controls directly above the lanes toggle either projection.

Workspace Writers can add a Task from the Board header or directly inside Incomplete and configured Phase lanes. Header creation opens inline at the List end or Incomplete lane end. In Phases mode, Writers create, edit, delete, and pointer- or keyboard-reorder colored Phases directly on the Board. Phase icons are optional and new Phases start blank. One full-height native scroll viewport owns lane scrolling and keeps its horizontal scrollbar at the bottom. Settings contain Workspace or Board metadata, access, and lifecycle controls without duplicate Phase controls.

Complete means reversible Task completion, not deletion. Reopening restores a Task to its retained Phase. Task details use a document-first notebook with rendered markdown, explicit editing, and save/discard actions only while dirty. Deleting a Task, Board, Phase, or Empty Workspace is permanent and always requires confirmation. Metadata uses direct Mantine color swatches and a searchable, paginated picker containing every supported Phosphor Duotone glyph. Board index rows use their stored color as a light background tint.

### Keyboard

- Up/Down changes selection within a list or Phase lane.
- Left/Right switches Board index lists or selects the nearest Task in another visible Phase lane.
- `Enter` opens selected content.
- `F2` renames the selected item inline.
- `n` creates an inline draft in the focused collection.
- `Delete` opens deletion confirmation.
- `Ctrl+Arrow` moves the selected Task within or between supported collections.
- `Escape` cancels inline editing or closes a drawer.

Shortcuts stay inactive while typing in an input, textarea, selector, or markdown editor. Task and Phase movement uses native Pointer Events for mouse, pen, and touch with distinct six-dot grips. Keyboard movement and context-menu actions remain available without dragging.
