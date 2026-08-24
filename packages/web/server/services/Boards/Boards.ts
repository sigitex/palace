import type { DB } from "$/database"
import type { Actor } from "$/authorization/Actor"
import { BoardAggregateReader } from "$/services/Boards/BoardAggregateReader"
import { BoardMetadata } from "$/services/Boards/BoardMetadata"
import { BoardPhaseMetadata } from "$/services/Boards/BoardPhaseMetadata"
import { BoardPhases } from "$/services/Boards/BoardPhases"
import { BoardPresenter } from "$/services/Boards/BoardPresenter"
import { BoardRepository } from "$/services/Boards/BoardRepository"
import { BoardTaskMetadata } from "$/services/Boards/BoardTaskMetadata"
import { BoardTaskMovement } from "$/services/Boards/BoardTaskMovement"
import { BoardTasks } from "$/services/Boards/BoardTasks"
import type { MoveAnchors } from "$/services/Boards/MoveAnchors"
import type { TaskDestination } from "$/services/Boards/TaskDestination"
import type { Workspaces } from "$/services/Workspaces"
import type {
  Board,
  BoardAggregate,
  BoardPhase,
  BoardTask,
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
    const rows = await new BoardRepository({ db: this.db }).list(workspace.id)
    const presenter = new BoardPresenter({ db: this.db })
    return Promise.all(rows.map((row) => presenter.board(row)))
  }

  async get(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
  ): Promise<BoardAggregate> {
    await this.workspaces.authorize(actor, workspaceSlug, "read")
    const row = await new BoardRepository({ db: this.db }).require(
      workspaceSlug,
      boardSlug,
    )
    return new BoardAggregateReader({
      db: this.db,
      workspaces: this.workspaces,
    }).read(actor, workspaceSlug, row)
  }

  async create(
    actor: Actor,
    workspaceSlug: string,
    metadata: Pick<Board, "name" | "slug" | "color" | "icon">,
  ): Promise<Board> {
    BoardMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      const { row: workspace } = await this.workspaces.authorize(
        actor,
        workspaceSlug,
        "write",
        db,
      )
      const repository = new BoardRepository({ db })
      await repository.requireUnusedSlug(workspace.id, metadata.slug)
      const row = await repository.create(
        workspace.id,
        metadata,
        actor.user,
        new Date(),
      )
      return new BoardPresenter({ db }).board(row)
    })
  }

  async update(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    metadata: Pick<Board, "name" | "slug" | "color" | "icon">,
  ): Promise<Board> {
    BoardMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const repository = new BoardRepository({ db })
      const row = await repository.require(workspaceSlug, boardSlug)
      if (metadata.slug !== boardSlug) {
        await repository.requireUnusedSlug(row.workspace, metadata.slug)
      }
      const updated = await repository.update(row.id, metadata, new Date())
      return new BoardPresenter({ db }).board(updated)
    })
  }

  async delete(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
  ): Promise<Board> {
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const repository = new BoardRepository({ db })
      const row = await repository.require(workspaceSlug, boardSlug)
      const board = await new BoardPresenter({ db }).board(row)
      await repository.delete(row.id)
      return board
    })
  }

  async createPhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    metadata: Pick<BoardPhase, "title" | "color" | "icon">,
  ): Promise<BoardPhase> {
    BoardPhaseMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const row = await new BoardPhases({ db }).create(
        board.id,
        metadata,
        new Date(),
      )
      return BoardPresenter.phase(row)
    })
  }

  async updatePhase(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    phaseID: number,
    metadata: Pick<BoardPhase, "title" | "color" | "icon">,
  ): Promise<BoardPhase> {
    BoardPhaseMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const phases = new BoardPhases({ db })
      const phase = await phases.require(board.id, phaseID)
      const updated = await phases.update(phase.id, metadata, new Date())
      return BoardPresenter.phase(updated)
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
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const rows = await new BoardPhases({ db }).move(
        board.id,
        phaseID,
        anchors,
      )
      return rows.map(BoardPresenter.phase)
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
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const phase = await new BoardPhases({ db }).delete(board.id, phaseID)
      return BoardPresenter.phase(phase)
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
    BoardTaskMetadata.validateTitle(input.title)
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const phase = input.phase ?? null
      const row = await new BoardTasks({ db }).create(
        board.id,
        phase,
        actor.user,
        input,
        new Date(),
      )
      return new BoardPresenter({ db }).task(row)
    })
  }

  async getTask(
    actor: Actor,
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
  ): Promise<BoardTask> {
    await this.workspaces.authorize(actor, workspaceSlug, "read")
    const board = await new BoardRepository({ db: this.db }).require(
      workspaceSlug,
      boardSlug,
    )
    const task = await new BoardTasks({ db: this.db }).require(board.id, taskID)
    return new BoardPresenter({ db: this.db }).task(task)
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
      BoardTaskMetadata.validateTitle(changes.title)
    }
    return this.db.transaction(async (db) => {
      await this.workspaces.authorize(actor, workspaceSlug, "write", db)
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const tasks = new BoardTasks({ db })
      const updated = await tasks.update(board.id, taskID, changes, new Date())
      return new BoardPresenter({ db }).task(updated)
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
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      const tasks = new BoardTasks({ db })
      const task = await tasks.require(board.id, taskID)
      const result = await new BoardPresenter({ db }).task(task)
      await tasks.delete(task)
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
      const board = await new BoardRepository({ db }).require(
        workspaceSlug,
        boardSlug,
      )
      await new BoardTaskMovement({ db }).move(
        board.id,
        taskID,
        destination,
        anchors,
      )
      return new BoardAggregateReader({
        db,
        workspaces: this.workspaces,
      }).read(actor, workspaceSlug, board)
    })
  }
}
