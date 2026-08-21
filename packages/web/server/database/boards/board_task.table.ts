import { createIndex, createTable, integer, text } from "@sigitex/outlaw"
import { user } from "$/database/identity"
import { board } from "$/database/boards/board.table"
import { boardPhase } from "$/database/boards/board_phase.table"

export type BoardTaskRow = typeof boardTask.infer

export const boardTask = createTable("board_task", {
  id: integer.primaryKey.autoincrement,
  board: integer.notNull.foreignKey.references(board.id),
  phase: integer.foreignKey.references(boardPhase.id),
  created_by: integer.notNull.foreignKey.references(user.id),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  title: text.notNull,
  details: text.notNull,
  complete: integer.notNull.map.boolean,
  position: integer.notNull,
})

export const boardTaskByBoardPosition = createIndex(
  "board_task_board_position_idx",
).on(boardTask.board, boardTask.position)

export const boardTaskByPhasePosition = createIndex(
  "board_task_phase_position_idx",
).on(boardTask.phase, boardTask.position)
