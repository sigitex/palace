import { board } from "./board"
import { phase } from "./phase"
import { task } from "./task"
import { workspace } from "./workspace"

export const boards = {
  workspace,
  board,
  phase,
  task,
} as const
