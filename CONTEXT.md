# Palace

Palace organizes shared family resources and tools. This glossary names domain concepts that cross those tools.

## Organization

**Workspace**:
A shared organizational container for Boards.
_Avoid_: Group, team

**Empty Workspace**:
A Workspace containing no Boards. Workspace Access records do not count as content.

**Palace Administrator**:
A platform operator responsible for shared Palace structures, including Workspace identity and lifecycle.

**Creator**:
The User recorded as having created a resource. Creator is provenance, not ownership or authority.
_Avoid_: Owner

**Slug**:
The user-editable URL locator for a Workspace or Board. A Slug is not permanent identity; changing it invalidates old links without redirect.
_Avoid_: ID, alias

## Boards

**Board**:
An ordered collection of Tasks that can be viewed as one List or organized into Phase lanes.

**Task**:
A unit of work or interest on a Board. A Task has one place in Board Order, may belong to a Phase, and may be complete.
_Avoid_: Card, item

**Complete Task**:
A Task marked complete that retains its Phase and appears in Archive. Reopening it returns it to that retained Phase.
_Avoid_: Archived Task

**Phase**:
A freely assignable category used to organize Tasks. Phase order defines lane presentation, not allowed transitions or a separate Task order.
_Avoid_: Column, status

**Board Order**:
The single canonical sequence of Tasks on a Board, shared by List and Phases views.
_Avoid_: List order, lane order

**List View**:
The flat presentation of all Tasks in Board Order.

**Phases View**:
The presentation of Tasks grouped into Phase lanes, Unphased, and Archive while preserving Board Order.

**Workspace Access**:
A group grant inherited by every Board in a Workspace. Read views content, write manages all Board, Phase, and Task content, and manage additionally changes Workspace Access; Boards have no separate permissions.
_Avoid_: Board access

**Workspace Writer**:
A user with write-level Workspace Access. A Workspace Writer manages Board, Phase, and Task content but not Workspace Access or Workspace lifecycle.

**Workspace Manager**:
A user with manage-level Workspace Access. A Workspace Manager has all Workspace Writer rights and changes Workspace Access, but does not control Workspace identity or lifecycle.
_Avoid_: Workspace administrator, Board administrator

**Archive**:
The Phases view of complete Tasks. Archive is reversible completion, not deleted-object storage or a recovery mechanism.
_Avoid_: Trash, recycle bin
