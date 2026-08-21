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
  BoardTask,
  IdentityGroup,
  Workspace,
  WorkspaceAccess,
  WorkspaceAccessLevel,
} from "shared/models"

const boards = proxy({
  workspaces: Async.create<Workspace[]>(),
  boards: Async.create<Board[]>(),
  aggregate: Async.create<BoardAggregate>(),
  access: Async.create<WorkspaceAccess[]>(),
  groups: Async.create<IdentityGroup[]>(),
  pendingMove: null as number | null,
  creatingTask: false,
  creatingPhase: false,

  loadWorkspaces() {
    return Async.run(boards.workspaces, () => call.boards.workspace.list(null))
  },
  loadBoards(workspace: string) {
    return Async.run(boards.boards, () => call.boards.board.list({ workspace }))
  },
  loadAggregate(workspace: string, board: string) {
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
  loadAccess(workspace: string) {
    return Async.run(boards.access, () =>
      call.boards.workspace.access.list({ workspace }),
    )
  },
  loadGroups(workspace: string) {
    return Async.run(boards.groups, () =>
      call.boards.workspace.groups({ workspace }),
    )
  },

  async createTask(
    workspace: string,
    board: string,
    input: { title: string; phase: number | null },
  ) {
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
  async updateTask(
    workspace: string,
    board: string,
    task: number,
    patch: Partial<Pick<BoardTask, "title" | "details" | "complete" | "phase">>,
  ) {
    patchTask(task, patch) // optimistic; the server mirrors this exact change
    try {
      await call.boards.task.update({ workspace, board, task, ...patch })
    } catch (error) {
      await boards.loadAggregate(workspace, board) // revert on failure
      throw error
    }
  },
  completeTask(workspace: string, board: string, task: number) {
    return boards.updateTask(workspace, board, task, { complete: true })
  },
  async deleteTask(workspace: string, board: string, task: number) {
    await call.boards.task.delete({ workspace, board, task })
    await boards.loadAggregate(workspace, board)
  },
  moveTask(move: TaskMove) {
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
  stepTask(workspace: string, board: string, task: number, direction: -1 | 1) {
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

  async createPhase(
    workspace: string,
    board: string,
    input: { title: string; color: BoardColor; icon: BoardIcon | null },
  ) {
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
  async updatePhase(
    workspace: string,
    board: string,
    phase: number,
    patch: { title: string; color: BoardColor; icon: BoardIcon | null },
  ) {
    await call.boards.phase.update({ workspace, board, phase, ...patch })
    await boards.loadAggregate(workspace, board)
  },
  async deletePhase(workspace: string, board: string, phase: number) {
    await call.boards.phase.delete({ workspace, board, phase })
    await boards.loadAggregate(workspace, board)
  },
  async movePhaseTo(
    workspace: string,
    board: string,
    source: number,
    target: number,
    after: boolean,
  ) {
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
  async movePhaseStep(
    workspace: string,
    board: string,
    phase: number,
    direction: -1 | 1,
  ) {
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

  async createBoard(
    workspace: string,
    input: Pick<Board, "name" | "slug" | "color" | "icon">,
  ) {
    const board = await call.boards.board.create({ workspace, ...input })
    await boards.loadBoards(workspace)
    return board
  },
  async updateBoard(
    workspace: string,
    board: string,
    patch: Pick<Board, "name" | "slug" | "color" | "icon">,
  ) {
    await call.boards.board.update({ workspace, board, ...patch })
    await Promise.all([
      boards.loadBoards(workspace),
      boards.aggregate.data?.board.slug === board
        ? boards.loadAggregate(workspace, patch.slug || board)
        : null,
    ])
  },
  async deleteBoard(workspace: string, board: string) {
    await call.boards.board.delete({ workspace, board })
    if (boards.aggregate.data?.board.slug === board) {
      boards.clearAggregate()
    }
    await boards.loadBoards(workspace)
  },

  async createWorkspace(input: {
    name: string
    slug: string
    color: BoardColor | null
    icon: BoardIcon | null
    manager_group: number
  }) {
    await call.boards.workspace.create(input)
    await boards.loadWorkspaces()
  },
  async updateWorkspace(
    workspace: string,
    patch: Pick<Workspace, "name" | "slug" | "color" | "icon">,
  ) {
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
  async deleteWorkspace(workspace: string) {
    await call.boards.workspace.delete({ workspace })
    if (boards.aggregate.data?.workspace.slug === workspace) {
      boards.clearAggregate()
    }
    await boards.loadWorkspaces()
  },
  async setAccess(
    workspace: string,
    grant: { group: number; level: WorkspaceAccessLevel },
  ) {
    await call.boards.workspace.access.set({ workspace, ...grant })
    await afterAccessChange(workspace)
  },
  async removeAccess(workspace: string, group: number) {
    await call.boards.workspace.access.remove({ workspace, group })
    await afterAccessChange(workspace)
  },
})

export const useBoards = () => useProxy(boards)

function patchTask(
  taskID: number,
  patch: Partial<Pick<BoardTask, "title" | "details" | "complete" | "phase">>,
) {
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
