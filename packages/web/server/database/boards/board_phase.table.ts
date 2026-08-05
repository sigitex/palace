import { createIndex, createTable, integer, text } from "@sigitex/outlaw"
import { board } from "$/database/boards/board.table"

export type BoardPhaseRow = typeof boardPhase.infer

export const boardPhase = createTable("board_phase", {
  id: integer.primaryKey.autoincrement,
  board: integer.notNull.foreignKey.references(board.id),
  created_at: integer.notNull.map.timestamp,
  updated_at: integer.notNull.map.timestamp,
  title: text.notNull,
  color: text.notNull,
  icon: text,
  position: integer.notNull,
})

export const boardPhaseByBoardPosition = createIndex(
  "board_phase_board_position_idx",
).on(boardPhase.board, boardPhase.position)
