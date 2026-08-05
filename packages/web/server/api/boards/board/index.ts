import { create } from "./create"
import { deleteBoard } from "./deleteBoard"
import { get } from "./get"
import { list } from "./list"
import { update } from "./update"

export const board = {
  list,
  get,
  create,
  update,
  delete: deleteBoard,
} as const
