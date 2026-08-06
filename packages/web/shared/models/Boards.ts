import { type } from "arktype"
import { ID } from "./common"
import { BoardIconCatalog } from "./BoardIconCatalog"

export const BOARD_ICONS = BoardIconCatalog

export const BOARD_COLORS = [
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
] as const

export type BoardColor = typeof BoardColor.infer
export const BoardColor = type.enumerated(...BOARD_COLORS)

// Compile-time: the full icon catalog as a literal union (editor autocomplete).
export type BoardIcon = (typeof BoardIconCatalog)[number]
// Runtime: a cheap kebab-case shape check. Modelling the 1512-icon catalog as a
// `type.enumerated(...)` union cost ~6s of arktype compile at every server boot
// — each `.or("null")` / object embed recompiled the whole union. Icons are
// cosmetic (rendered as a `ph-<icon>` class), so a shape check is sufficient.
export const BoardIcon = type("/^[a-z0-9-]+$/").as<BoardIcon>()

export type WorkspaceAccessLevel = typeof WorkspaceAccessLevel.infer
export const WorkspaceAccessLevel = type.enumerated("read", "write", "manage")

export type BoardsCreator = typeof BoardsCreator.infer
export const BoardsCreator = type({
  id: ID,
  slug: "string > 0",
  name: "string > 0",
})

export type IdentityGroup = typeof IdentityGroup.infer
export const IdentityGroup = type({
  id: ID,
  uid: "string > 0",
  name: "string > 0",
})

export type WorkspaceAccess = typeof WorkspaceAccess.infer
export const WorkspaceAccess = type({
  group: ID,
  group_uid: "string > 0",
  group_name: "string > 0",
  level: WorkspaceAccessLevel,
  created_at: "string.date.iso",
  updated_at: "string.date.iso",
})

export type Workspace = typeof Workspace.infer
export const Workspace = type({
  id: ID,
  name: "string > 0",
  slug: "string > 0",
  color: BoardColor.or("null"),
  icon: BoardIcon.or("null"),
  access: WorkspaceAccessLevel,
  palace_admin: "boolean",
  creator: BoardsCreator,
  created_at: "string.date.iso",
  updated_at: "string.date.iso",
})

export type Board = typeof Board.infer
export const Board = type({
  id: ID,
  workspace: ID,
  name: "string > 0",
  slug: "string > 0",
  color: BoardColor.or("null"),
  icon: BoardIcon.or("null"),
  creator: BoardsCreator,
  created_at: "string.date.iso",
  updated_at: "string.date.iso",
})

export type BoardPhase = typeof BoardPhase.infer
export const BoardPhase = type({
  id: ID,
  board: ID,
  title: "string > 0",
  color: BoardColor,
  icon: BoardIcon.or("null"),
  position: "number.integer >= 0",
  created_at: "string.date.iso",
  updated_at: "string.date.iso",
})

export type BoardTask = typeof BoardTask.infer
export const BoardTask = type({
  id: ID,
  board: ID,
  phase: ID.or("null"),
  title: "string > 0",
  details: "string",
  complete: "boolean",
  position: "number.integer >= 0",
  creator: BoardsCreator,
  created_at: "string.date.iso",
  updated_at: "string.date.iso",
})

export type BoardAggregate = typeof BoardAggregate.infer
export const BoardAggregate = type({
  workspace: Workspace,
  board: Board,
  phases: BoardPhase.array(),
  tasks: BoardTask.array(),
})
