import { create } from "./create"
import { deleteTask } from "./deleteTask"
import { get } from "./get"
import { move } from "./move"
import { update } from "./update"

export const task = {
  create,
  get,
  update,
  delete: deleteTask,
  move,
} as const
