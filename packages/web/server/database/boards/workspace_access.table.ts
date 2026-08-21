import { createIndex, createTable, integer, text } from "@sigitex/outlaw"
import { group } from "$/database/identity"
import { workspace } from "$/database/boards/workspace.table"
import type { WorkspaceAccessLevel } from "shared/models"

export type WorkspaceAccessRow = typeof workspaceAccess.infer

export const workspaceAccess = createTable("workspace_access", {
  workspace: integer.notNull.foreignKey.references(workspace.id),
  group: integer.notNull.foreignKey.references(group.id),
  level: text.notNull.map<WorkspaceAccessLevel>(),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
})
  .primaryKey("workspace", "group")
  .check(`"level" IN ('read', 'write', 'manage')`)

export const workspaceAccessByWorkspace = createIndex(
  "workspace_access_workspace_idx",
).on(workspaceAccess.workspace)

export const workspaceAccessByGroup = createIndex(
  "workspace_access_group_idx",
).on(workspaceAccess.group)
