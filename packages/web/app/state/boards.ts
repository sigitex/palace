import { proxy } from "valtio"
import { useProxy } from "valtio/utils"
import { Async } from "@/common/Async"
import { call } from "@/common/call"
import { TaskMovement, type TaskMove } from "@/Boards/Task/TaskMovement"
import type {
  Board,
  BoardAggregate,
  BoardColor,
  BoardIcon,
  BoardPhase,
  BoardTask,
  IdentityGroup,
  Workspace,
  WorkspaceAccess,
  WorkspaceAccessLevel,
} from "shared/models"

type TaskPatch = Partial<
  Pick<BoardTask, "title" | "details" | "complete" | "phase">
>
type BoardPresentation = Pick<Board, "name" | "slug" | "color" | "icon">
type WorkspacePresentation = Pick<Workspace, "name" | "slug" | "color" | "icon">
type PhaseInput = { title: string; color: BoardColor; icon: BoardIcon | null }

type Boards = {
  workspaces: Async<Workspace[]>
  boards: Async<Board[]>
  aggregate: Async<BoardAggregate>
  access: Async<WorkspaceAccess[]>
  groups: Async<IdentityGroup[]>
  pendingMove: number | null
  creatingTask: boolean
  creatingPhase: boolean
  loadWorkspaces: () => Promise<Workspace[] | null>
  loadBoards: (workspace: string) => Promise<Board[] | null>
  loadAggregate: (
    workspace: string,
    board: string,
  ) => Promise<BoardAggregate | null>
  clearAggregate: () => void
  loadAccess: (workspace: string) => Promise<WorkspaceAccess[] | null>
  loadGroups: (workspace: string) => Promise<IdentityGroup[] | null>
  createTask: (
    workspace: string,
    board: string,
    input: { title: string; phase: number | null },
  ) => Promise<BoardTask>
  updateTask: (
    workspace: string,
    board: string,
    task: number,
    patch: TaskPatch,
  ) => Promise<void>
  completeTask: (
    workspace: string,
    board: string,
    task: number,
  ) => Promise<void>
  deleteTask: (workspace: string, board: string, task: number) => Promise<void>
  moveTask: (move: TaskMove) => Promise<void>
  stepTask: (
    workspace: string,
    board: string,
    task: number,
    direction: -1 | 1,
  ) => void
  createPhase: (
    workspace: string,
    board: string,
    input: PhaseInput,
  ) => Promise<BoardPhase>
  updatePhase: (
    workspace: string,
    board: string,
    phase: number,
    patch: PhaseInput,
  ) => Promise<void>
  deletePhase: (
    workspace: string,
    board: string,
    phase: number,
  ) => Promise<void>
  movePhaseTo: (
    workspace: string,
    board: string,
    source: number,
    target: number,
    after: boolean,
  ) => Promise<void>
  movePhaseStep: (
    workspace: string,
    board: string,
    phase: number,
    direction: -1 | 1,
  ) => Promise<void>
  createBoard: (workspace: string, input: BoardPresentation) => Promise<Board>
  updateBoard: (
    workspace: string,
    board: string,
    patch: BoardPresentation,
  ) => Promise<void>
  deleteBoard: (workspace: string, board: string) => Promise<void>
  createWorkspace: (input: {
    name: string
    slug: string
    color: BoardColor | null
    icon: BoardIcon | null
    manager_group: number
  }) => Promise<void>
  updateWorkspace: (
    workspace: string,
    patch: WorkspacePresentation,
  ) => Promise<void>
  deleteWorkspace: (workspace: string) => Promise<void>
  setAccess: (
    workspace: string,
    grant: { group: number; level: WorkspaceAccessLevel },
  ) => Promise<void>
  removeAccess: (workspace: string, group: number) => Promise<void>
}

const boards: Boards = proxy({
  workspaces: Async.create<Workspace[]>(),
  boards: Async.create<Board[]>(),
  aggregate: Async.create<BoardAggregate>(),
  access: Async.create<WorkspaceAccess[]>(),
  groups: Async.create<IdentityGroup[]>(),
  pendingMove: null,
  creatingTask: false,
  creatingPhase: false,

  loadWorkspaces() {
    return Async.run(boards.workspaces, () => call.boards.workspace.list(null))
  },
  loadBoards(workspace) {
    return Async.run(boards.boards, () => call.boards.board.list({ workspace }))
  },
  loadAggregate(workspace, board) {
    const current = boards.aggregate.data
    const switching =
      current?.board.slug !== board || current.workspace.slug !== workspace
    if (!switching) {
      // Silent refresh of the board already on screen: no loading flicker and
      // no extra top-level renders — only the final data swap re-renders.
      return call.boards.board
        .get({ workspace, board })
        .then((data) => {
          boards.aggregate.data = data
          boards.aggregate.error = null
          return data
        })
        .catch((error) => {
          boards.aggregate.error =
            error instanceof Error ? error.message : String(error)
          return null
        })
    }
    boards.aggregate.data = null
    return Async.run(boards.aggregate, () =>
      call.boards.board.get({ workspace, board }),
    )
  },
  clearAggregate() {
    boards.aggregate.data = null
    boards.aggregate.error = null
  },
  loadAccess(workspace) {
    return Async.run(boards.access, () =>
      call.boards.workspace.access.list({ workspace }),
    )
  },
  loadGroups(workspace) {
    return Async.run(boards.groups, () =>
      call.boards.workspace.groups({ workspace }),
    )
  },

  async createTask(workspace, board, input) {
    boards.creatingTask = true
    try {
      const task = await call.boards.task.create({
        workspace,
        board,
        ...input,
      })
      await boards.loadAggregate(workspace, board)
      return task
    } finally {
      boards.creatingTask = false
    }
  },
  async updateTask(workspace, board, task, patch) {
    patchTask(task, patch) // optimistic; the server mirrors this exact change
    try {
      await call.boards.task.update({ workspace, board, task, ...patch })
    } catch (error) {
      await boards.loadAggregate(workspace, board) // revert on failure
      throw error
    }
  },
  completeTask(workspace, board, task) {
    return boards.updateTask(workspace, board, task, { complete: true })
  },
  async deleteTask(workspace, board, task) {
    await call.boards.task.delete({ workspace, board, task })
    await boards.loadAggregate(workspace, board)
  },
  moveTask(move) {
    // Optimistic and authoritative: TaskMovement.apply mirrors the server's
    // reordering, so we keep the optimistic result rather than overwriting with
    // the server response. Overwriting let rapid, concurrent moves clobber each
    // other out of order (the row flickering). Reload only to recover on error.
    boards.pendingMove = move.task
    const previous = boards.aggregate.data
    if (previous) {
      boards.aggregate.data = TaskMovement.apply(previous, move)
    }
    return call.boards.task
      .move(move)
      .then(() => {}) // discard the server aggregate; the optimistic apply stands
      .catch(async (error) => {
        await boards.loadAggregate(move.workspace, move.board)
        throw error
      })
      .finally(() => {
        boards.pendingMove = null
      })
  },
  stepTask(workspace, board, task, direction) {
    // Reads the live task order (a store method runs against the module proxy,
    // not a captured useProxy snapshot) so repeated keyboard nudges keep working.
    const list = boards.aggregate.data?.tasks ?? []
    const index = list.findIndex(({ id }) => id === task)
    if (
      index < 0 ||
      index + direction < 0 ||
      index + direction >= list.length
    ) {
      return
    }
    boards.moveTask({
      workspace,
      board,
      task,
      destination: { type: "board" },
      ...TaskMovement.anchors(list, task, index + direction),
    })
  },

  async createPhase(workspace, board, input) {
    boards.creatingPhase = true
    try {
      const phase = await call.boards.phase.create({
        workspace,
        board,
        ...input,
      })
      await boards.loadAggregate(workspace, board)
      return phase
    } finally {
      boards.creatingPhase = false
    }
  },
  async updatePhase(workspace, board, phase, patch) {
    await call.boards.phase.update({ workspace, board, phase, ...patch })
    await boards.loadAggregate(workspace, board)
  },
  async deletePhase(workspace, board, phase) {
    await call.boards.phase.delete({ workspace, board, phase })
    await boards.loadAggregate(workspace, board)
  },
  async movePhaseTo(workspace, board, source, target, after) {
    if (source === target) return
    const list = boards.aggregate.data?.phases ?? []
    const moving = list.find(({ id }) => id === source)
    const remaining = list.filter(({ id }) => id !== source)
    const targetIndex = remaining.findIndex(({ id }) => id === target)
    if (!moving || targetIndex < 0) return
    remaining.splice(targetIndex + (after ? 1 : 0), 0, moving)
    const movedIndex = remaining.findIndex(({ id }) => id === source)
    const without = remaining.filter(({ id }) => id !== source)
    await call.boards.phase.move({
      workspace,
      board,
      phase: source,
      after: without[movedIndex - 1]?.id ?? null,
      before: without[movedIndex]?.id ?? null,
    })
    await boards.loadAggregate(workspace, board)
  },
  async movePhaseStep(workspace, board, phase, direction) {
    const list = boards.aggregate.data?.phases ?? []
    const index = list.findIndex(({ id }) => id === phase)
    const target = list[index + direction]
    if (target) {
      await boards.movePhaseTo(
        workspace,
        board,
        phase,
        target.id,
        direction > 0,
      )
    }
  },

  async createBoard(workspace, input) {
    const board = await call.boards.board.create({ workspace, ...input })
    await boards.loadBoards(workspace)
    return board
  },
  async updateBoard(workspace, board, patch) {
    await call.boards.board.update({ workspace, board, ...patch })
    await Promise.all([
      boards.loadBoards(workspace),
      boards.aggregate.data?.board.slug === board
        ? boards.loadAggregate(workspace, patch.slug || board)
        : null,
    ])
  },
  async deleteBoard(workspace, board) {
    await call.boards.board.delete({ workspace, board })
    if (boards.aggregate.data?.board.slug === board) {
      boards.clearAggregate()
    }
    await boards.loadBoards(workspace)
  },

  async createWorkspace(input) {
    await call.boards.workspace.create(input)
    await boards.loadWorkspaces()
  },
  async updateWorkspace(workspace, patch) {
    await call.boards.workspace.update({ workspace, ...patch })
    await Promise.all([
      boards.loadWorkspaces(),
      boards.aggregate.data?.workspace.slug === workspace
        ? boards.loadAggregate(
            patch.slug || workspace,
            boards.aggregate.data.board.slug,
          )
        : null,
    ])
  },
  async deleteWorkspace(workspace) {
    await call.boards.workspace.delete({ workspace })
    if (boards.aggregate.data?.workspace.slug === workspace) {
      boards.clearAggregate()
    }
    await boards.loadWorkspaces()
  },
  async setAccess(workspace, grant) {
    await call.boards.workspace.access.set({ workspace, ...grant })
    await afterAccessChange(workspace)
  },
  async removeAccess(workspace, group) {
    await call.boards.workspace.access.remove({ workspace, group })
    await afterAccessChange(workspace)
  },
})

export const useBoards = () => useProxy(boards)

function patchTask(taskID: number, patch: TaskPatch) {
  const task = boards.aggregate.data?.tasks.find(({ id }) => id === taskID)
  if (task) {
    Object.assign(task, patch)
  }
}

async function afterAccessChange(workspace: string) {
  await Promise.all([
    boards.loadAccess(workspace),
    boards.loadWorkspaces(),
    boards.aggregate.data?.workspace.slug === workspace
      ? boards.loadAggregate(workspace, boards.aggregate.data.board.slug)
      : null,
  ])
}
