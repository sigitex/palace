import type { DatabaseConnection, DB } from "$/database"
import type { BoardPhaseRow, BoardRow, BoardTaskRow } from "$/database/boards"
import type { Actor } from "$/authorization/Actor"
import { BoardsError } from "$/errors/BoardsError"
import type { MoveAnchors } from "$/services/Boards/MoveAnchors"
import type { TaskDestination } from "$/services/Boards/TaskDestination"
import type { Workspaces } from "$/services/Workspaces"
import {
  BOARD_COLORS,
  BOARD_ICONS,
  type Board,
  type BoardAggregate,
  type BoardColor,
  type BoardIcon,
  type BoardPhase,
  type BoardTask,
} from "shared/models"

export class Boards {
  private readonly db: DB
  private readonly workspaces: Workspaces

  constructor({ db, workspaces }: { db: DB; workspaces: Workspaces }) {
    this.db = db
    this.workspaces = workspaces
  }

  async list(actor: Actor, workspaceSlug: string): Promise<Board[]> {
    const { row: workspace } = await this.workspaces.authorize(
      actor,
      workspaceSlug,
      "read",
    )
    const rows = await this.db.board
      .select("*")
      .where("workspace", "=", workspace.id)
      .orderBy([["name", "asc"]])
      .fetch()
    return Promise.all(rows.map((row) => presentBoard(row, this.db)))
  }

  async get(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
  ): Promise<BoardAggregate> {
    await this.workspaces.authorize(actor, workspaceSlug, "read")
    const row = await requireBoardRow(this.db, workspaceSlug, boardSlug)
    return this.aggregate(actor, workspaceSlug, row, this.db)
  }

  async create(
    actor: Actor,
    workspaceSlug: string,
    metadata: Pick<Board, "name" | "slug" | "color" | "icon">,
  ): Promise<Board> {
    validateBoardMetadata(metadata)
    return this.db.transaction(async (db) => {
      const { row: workspace } = await this.workspaces.authorize(
        actor,
        workspaceSlug,
        "write",
        db,
      )
      await requireUnusedBoardSlug(db, workspace.id, metadata.slug)
      const now = new Date()
      const [row] = await db.board
        .insert({
          ...metadata,
          workspace: workspace.id,
          created_by: actor.user,
          created_at: now,
          updated_at: now,
        })
        .returning("*")
        .execute()
      return presentBoard(row, db)
    })
  }

  async update(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    metadata: Pick<Board, "name" | "slug" | "color" | "icon">,
  ): Promise<Board> {
    validateBoardMetadata(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const row = await requireBoardRow(db, workspaceSlug, boardSlug)
      if (metadata.slug !== boardSlug) {
        await requireUnusedBoardSlug(db, row.workspace, metadata.slug)
      }
      const [updated] = await db.board
        .update({ ...metadata, updated_at: new Date() })
        .where("id", "=", row.id)
        .returning("*")
        .execute()
      return presentBoard(updated, db)
    })
  }

  async delete(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
  ): Promise<Board> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const row = await requireBoardRow(db, workspaceSlug, boardSlug)
      const board = await presentBoard(row, db)
      await db.boardTask.delete().where("board", "=", row.id).execute()
      await db.boardPhase.delete().where("board", "=", row.id).execute()
      await db.board.delete().where("id", "=", row.id).execute()
      return board
    })
  }

  async createPhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    metadata: Pick<BoardPhase, "title" | "color" | "icon">,
  ): Promise<BoardPhase> {
    validatePhaseMetadata(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const phases = await phaseRows(db, board.id)
      const now = new Date()
      const [row] = await db.boardPhase
        .insert({
          ...metadata,
          board: board.id,
          position: phases.length,
          created_at: now,
          updated_at: now,
        })
        .returning("*")
        .execute()
      return presentPhase(row)
    })
  }

  async updatePhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    phaseID: number,
    metadata: Pick<BoardPhase, "title" | "color" | "icon">,
  ): Promise<BoardPhase> {
    validatePhaseMetadata(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const phase = await requirePhaseRow(db, board.id, phaseID)
      const [updated] = await db.boardPhase
        .update({ ...metadata, updated_at: new Date() })
        .where("id", "=", phase.id)
        .returning("*")
        .execute()
      return presentPhase(updated)
    })
  }

  async movePhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    phaseID: number,
    anchors: MoveAnchors,
  ): Promise<BoardPhase[]> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const rows = await phaseRows(db, board.id)
      const ordered = reorderRows(rows, phaseID, anchors)
      await Promise.all(
        ordered.map((phase, position) =>
          db.boardPhase
            .update({ position })
            .where("id", "=", phase.id)
            .execute(),
        ),
      )
      return ordered.map((phase, position) =>
        presentPhase({ ...phase, position }),
      )
    })
  }

  async deletePhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    phaseID: number,
  ): Promise<BoardPhase> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const phase = await requirePhaseRow(db, board.id, phaseID)
      const tasks = await taskRows(db, board.id)
      const activeAffected = tasks.filter(
        (task) => task.phase === phase.id && !task.complete,
      )
      const remaining = tasks.filter(
        (task) => !(task.phase === phase.id && !task.complete),
      )
      const lastNoPhase = remaining.findLastIndex(
        (task) => task.phase === null && !task.complete,
      )
      remaining.splice(lastNoPhase + 1, 0, ...activeAffected)
      const now = new Date()
      for (const [position, task] of remaining.entries()) {
        const affected = task.phase === phase.id
        await db.boardTask
          .update({
            position,
            ...(affected ? { phase: null, updated_at: now } : {}),
          })
          .where("id", "=", task.id)
          .execute()
      }
      await db.boardPhase.delete().where("id", "=", phase.id).execute()
      const phases = (await phaseRows(db, board.id)).map((row, position) => ({
        ...row,
        position,
      }))
      for (const row of phases) {
        await db.boardPhase
          .update({ position: row.position })
          .where("id", "=", row.id)
          .execute()
      }
      return presentPhase(phase)
    })
  }

  async createTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    input: {
      title: string
      details?: string
      phase?: number | null
    },
  ): Promise<BoardTask> {
    validateTaskTitle(input.title)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const phase = input.phase ?? null
      if (phase !== null) {
        await requirePhaseRow(db, board.id, phase)
      }
      const tasks = await taskRows(db, board.id)
      const now = new Date()
      const [row] = await db.boardTask
        .insert({
          board: board.id,
          phase,
          created_by: actor.user,
          created_at: now,
          updated_at: now,
          title: input.title,
          details: input.details ?? "",
          complete: false,
          position: tasks.length,
        })
        .returning("*")
        .execute()
      return presentTask(row, db)
    })
  }

  async getTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
  ): Promise<BoardTask> {
    await this.workspaces.authorize(actor, workspaceSlug, "read")
    const board = await requireBoardRow(this.db, workspaceSlug, boardSlug)
    const task = await requireTaskRow(this.db, board.id, taskID)
    return presentTask(task, this.db)
  }

  async updateTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
    changes: Partial<
      Pick<BoardTask, "title" | "details" | "complete" | "phase">
    >,
  ): Promise<BoardTask> {
    if (changes.title !== undefined) {
      validateTaskTitle(changes.title)
    }
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const task = await requireTaskRow(db, board.id, taskID)
      const phase = changes.phase === undefined ? task.phase : changes.phase
      if (phase !== null) {
        await requirePhaseRow(db, board.id, phase)
      }
      await db.boardTask
        .update({
          ...(changes.title === undefined ? {} : { title: changes.title }),
          ...(changes.details === undefined
            ? {}
            : { details: changes.details }),
          ...(changes.complete === undefined
            ? {}
            : { complete: changes.complete }),
          ...(changes.phase === undefined ? {} : { phase: changes.phase }),
          updated_at: new Date(),
        })
        .where("id", "=", task.id)
        .execute()
      return presentTask(await requireTaskRow(db, board.id, task.id), db)
    })
  }

  async deleteTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
  ): Promise<BoardTask> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      const task = await requireTaskRow(db, board.id, taskID)
      const result = await presentTask(task, db)
      await db.boardTask.delete().where("id", "=", task.id).execute()
      const remaining = await taskRows(db, board.id)
      for (const [position, row] of remaining.entries()) {
        await db.boardTask
          .update({ position })
          .where("id", "=", row.id)
          .execute()
      }
      return result
    })
  }

  async moveTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
    destination: TaskDestination,
    anchors: MoveAnchors,
  ): Promise<BoardAggregate> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await requireBoardRow(db, workspaceSlug, boardSlug)
      if (destination.type === "phase" && destination.phase !== null) {
        await requirePhaseRow(db, board.id, destination.phase)
      }
      await moveTaskRows(db, board.id, taskID, destination, anchors)
      return this.aggregate(actor, workspaceSlug, board, db)
    })
  }

  private async aggregate(
    actor: Actor,
    workspaceSlug: string,
    board: BoardRow,
    db: DatabaseConnection,
  ): Promise<BoardAggregate> {
    const [workspace, phases, tasks] = await Promise.all([
      this.workspaces.get(actor, workspaceSlug, db),
      phaseRows(db, board.id),
      taskRows(db, board.id),
    ])
    return {
      workspace,
      board: await presentBoard(board, db),
      phases: phases.map(presentPhase),
      tasks: await Promise.all(tasks.map((task) => presentTask(task, db))),
    }
  }
}

async function presentBoard(
  row: BoardRow,
  db: DatabaseConnection,
): Promise<Board> {
  const creator = await requireCreator(db, row.created_by)
  return {
    id: row.id,
    workspace: row.workspace,
    name: row.name,
    slug: row.slug,
    color: row.color as BoardColor | null,
    icon: row.icon as BoardIcon | null,
    creator,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

async function presentTask(
  row: BoardTaskRow,
  db: DatabaseConnection,
): Promise<BoardTask> {
  return {
    id: row.id,
    board: row.board,
    phase: row.phase,
    title: row.title,
    details: row.details,
    complete: row.complete,
    position: row.position,
    creator: await requireCreator(db, row.created_by),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function validateBoardMetadata(
  metadata: Pick<Board, "name" | "slug" | "color" | "icon">,
) {
  if (!metadata.name.trim() || !metadata.slug.trim()) {
    throw new BoardsError("invalid", "Board name and slug are required.")
  }
  if (metadata.color && !BOARD_COLORS.includes(metadata.color)) {
    throw new BoardsError("invalid", "Unsupported Board color.")
  }
  if (metadata.icon && !BOARD_ICONS.includes(metadata.icon)) {
    throw new BoardsError("invalid", "Unsupported Board icon.")
  }
}

function validatePhaseMetadata(
  metadata: Pick<BoardPhase, "title" | "color" | "icon">,
) {
  if (!metadata.title.trim()) {
    throw new BoardsError("invalid", "Phase title is required.")
  }
  if (!BOARD_COLORS.includes(metadata.color)) {
    throw new BoardsError("invalid", "Unsupported Phase color.")
  }
  if (metadata.icon !== null && !BOARD_ICONS.includes(metadata.icon)) {
    throw new BoardsError("invalid", "Unsupported Phase icon.")
  }
}

function validateTaskTitle(title: string) {
  if (!title.trim()) {
    throw new BoardsError("invalid", "Task title is required.")
  }
}

async function requireBoardRow(
  db: DatabaseConnection,
  workspaceSlug: string,
  boardSlug: string,
) {
  const [workspace] = await db.workspace
    .select("id")
    .where("slug", "=", workspaceSlug)
    .limit(1)
    .fetch()
  if (!workspace) {
    throw new BoardsError("not-found", "Board was not found.")
  }
  const [board] = await db.board
    .select("*")
    .where("workspace", "=", workspace.id)
    .where("slug", "=", boardSlug)
    .limit(1)
    .fetch()
  if (!board) {
    throw new BoardsError("not-found", "Board was not found.")
  }
  return board
}

async function requireUnusedBoardSlug(
  db: DatabaseConnection,
  workspaceID: number,
  slug: string,
) {
  const rows = await db.board
    .select("id")
    .where("workspace", "=", workspaceID)
    .where("slug", "=", slug)
    .limit(1)
    .fetch()
  if (rows.length > 0) {
    throw new BoardsError("conflict", `Board slug '${slug}' is already in use.`)
  }
}

async function requirePhaseRow(
  db: DatabaseConnection,
  boardID: number,
  phaseID: number,
) {
  const [phase] = await db.boardPhase
    .select("*")
    .where("board", "=", boardID)
    .where("id", "=", phaseID)
    .limit(1)
    .fetch()
  if (!phase) {
    throw new BoardsError("not-found", "Phase was not found in this Board.")
  }
  return phase
}

async function requireTaskRow(
  db: DatabaseConnection,
  boardID: number,
  taskID: number,
) {
  const [task] = await db.boardTask
    .select("*")
    .where("board", "=", boardID)
    .where("id", "=", taskID)
    .limit(1)
    .fetch()
  if (!task) {
    throw new BoardsError("not-found", "Task was not found in this Board.")
  }
  return task
}

function phaseRows(db: DatabaseConnection, boardID: number) {
  return db.boardPhase
    .select("*")
    .where("board", "=", boardID)
    .orderBy([["position", "asc"]])
    .fetch()
}

function taskRows(db: DatabaseConnection, boardID: number) {
  return db.boardTask
    .select("*")
    .where("board", "=", boardID)
    .orderBy([["position", "asc"]])
    .fetch()
}

function presentPhase(row: BoardPhaseRow): BoardPhase {
  return {
    id: row.id,
    board: row.board,
    title: row.title,
    color: row.color as BoardColor,
    icon: row.icon as BoardIcon | null,
    position: row.position,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

async function requireCreator(db: DatabaseConnection, userID: number) {
  const [creator] = await db.user
    .select("id", "slug", "name")
    .where("id", "=", userID)
    .limit(1)
    .fetch()
  if (!creator) {
    throw new BoardsError("not-found", "Creator was not found.")
  }
  return creator
}

function reorderRows<Row extends { id: number }>(
  rows: Row[],
  movedID: number,
  anchors: MoveAnchors,
) {
  const moved = rows.find((row) => row.id === movedID)
  if (!moved) {
    throw new BoardsError("not-found", "Ordered resource was not found.")
  }
  if (anchors.before === movedID || anchors.after === movedID) {
    throw new BoardsError(
      "invalid",
      "A resource cannot be its own movement anchor.",
    )
  }
  const remaining = rows.filter((row) => row.id !== movedID)
  const before = anchorIndex(remaining, anchors.before)
  const after = anchorIndex(remaining, anchors.after)
  if (before !== null && after !== null && after >= before) {
    throw new BoardsError("conflict", "Movement anchors are no longer ordered.")
  }
  const index = before ?? (after === null ? remaining.length : after + 1)
  remaining.splice(index, 0, moved)
  return remaining
}

function anchorIndex<Row extends { id: number }>(
  rows: Row[],
  anchor: number | null | undefined,
) {
  if (anchor === null || anchor === undefined) {
    return null
  }
  const index = rows.findIndex((row) => row.id === anchor)
  if (index < 0) {
    throw new BoardsError("conflict", "Movement anchor is stale or invalid.")
  }
  return index
}

async function moveTaskRows(
  db: DatabaseConnection,
  boardID: number,
  taskID: number,
  destination: TaskDestination,
  anchors: MoveAnchors,
  phaseOverride?: number | null,
) {
  const rows = await taskRows(db, boardID)
  const task = rows.find((row) => row.id === taskID)
  if (!task) {
    throw new BoardsError("not-found", "Task was not found in this Board.")
  }
  const phase =
    destination.type === "phase"
      ? destination.phase
      : phaseOverride === undefined
        ? task.phase
        : phaseOverride
  const complete =
    destination.type === "complete"
      ? true
      : destination.type === "phase"
        ? false
        : task.complete
  const remaining = rows.filter((row) => row.id !== taskID)
  validateTaskAnchors(remaining, destination, anchors)
  const before = anchorIndex(remaining, anchors.before)
  const after = anchorIndex(remaining, anchors.after)
  if (before !== null && after !== null && after >= before) {
    throw new BoardsError("conflict", "Movement anchors are no longer ordered.")
  }
  let index = before ?? (after === null ? -1 : after + 1)
  if (index < 0) {
    const last = remaining.findLastIndex((row) =>
      destinationContains(destination, row),
    )
    index = last < 0 ? remaining.length : last + 1
  }
  remaining.splice(index, 0, { ...task, phase, complete })
  const now = new Date()
  for (const [position, row] of remaining.entries()) {
    await db.boardTask
      .update({
        position,
        ...(row.id === taskID ? { phase, complete, updated_at: now } : {}),
      })
      .where("id", "=", row.id)
      .execute()
  }
}

function validateTaskAnchors(
  rows: BoardTaskRow[],
  destination: TaskDestination,
  anchors: MoveAnchors,
) {
  if (destination.type === "board") {
    return
  }
  for (const anchor of [anchors.after, anchors.before]) {
    if (anchor === null || anchor === undefined) {
      continue
    }
    const row = rows.find((task) => task.id === anchor)
    if (!row || !destinationContains(destination, row)) {
      throw new BoardsError(
        "conflict",
        "Movement anchor is outside the destination.",
      )
    }
  }
}

function destinationContains(destination: TaskDestination, task: BoardTaskRow) {
  if (destination.type === "board") {
    return true
  }
  if (destination.type === "complete") {
    return task.complete
  }
  return !task.complete && task.phase === destination.phase
}
