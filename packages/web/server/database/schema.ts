import { createSchema } from "@sigitex/outlaw"
import { user, group, session, member, login } from "$/database/identity"
import {
  workspace,
  workspaceAccess,
  workspaceAccessByWorkspace,
  workspaceAccessByGroup,
  board,
  boardByWorkspaceSlug,
  boardPhase,
  boardPhaseByBoardPosition,
  boardTask,
  boardTaskByBoardPosition,
  boardTaskByPhasePosition,
} from "$/database/boards"

export const schema = createSchema({
  user,
  group,
  session,
  member,
  login,
  workspace,
  workspaceAccess,
  workspaceAccessByWorkspace,
  workspaceAccessByGroup,
  board,
  boardByWorkspaceSlug,
  boardPhase,
  boardPhaseByBoardPosition,
  boardTask,
  boardTaskByBoardPosition,
  boardTaskByPhasePosition,
})
