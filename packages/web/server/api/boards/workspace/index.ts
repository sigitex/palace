import { accessList } from "./accessList"
import { accessRemove } from "./accessRemove"
import { accessSet } from "./accessSet"
import { create } from "./create"
import { deleteWorkspace } from "./deleteWorkspace"
import { get } from "./get"
import { groups } from "./groups"
import { list } from "./list"
import { update } from "./update"

export const workspace = {
  list,
  get,
  create,
  update,
  delete: deleteWorkspace,
  groups,
  access: {
    list: accessList,
    set: accessSet,
    remove: accessRemove,
  },
} as const
