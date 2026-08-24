import type { DatabaseConnection } from "$/database"
import type { BoardTaskRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import { BoardPhases } from "$/services/Boards/BoardPhases"
import type { BoardTask } from "shared/models"

type Changes = Partial<
  Pick<BoardTask, "title" | "details" | "complete" | "phase">
>

export class BoardTasks {
  private readonly db: DatabaseConnection
  private readonly phases: BoardPhases

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
    this.phases = new BoardPhases({ db })
  }

  list(boardID: number): Promise<BoardTaskRow[]> {
    return this.db.boardTask
      .select("*")
      .where("board", "=", boardID)
      .orderBy([["position", "asc"]])
      .fetch()
  }

  async require(boardID: number, taskID: number): Promise<BoardTaskRow> {
    const [task] = await this.db.boardTask
      .select("*")
      .where("board", "=", boardID)
      .where("id", "=", taskID)
      .limit(1)
      .fetch()
    if (!task) {
      throw new DomainError("not-found", "Task was not found in this Board.")
    }
    return task
  }

  async create(
    boardID: number,
    phase: number | null,
    creator: number,
    input: { title: string; details?: string },
    createdAt: Date,
  ): Promise<BoardTaskRow> {
    if (phase !== null) {
      await this.phases.require(boardID, phase)
    }
    const tasks = await this.list(boardID)
    const [row] = await this.db.boardTask
      .insert({
        board: boardID,
        phase,
        created_by: creator,
        created_at: createdAt,
        updated_at: createdAt,
        title: input.title,
        details: input.details ?? "",
        complete: false,
        position: tasks.length,
      })
      .returning("*")
      .execute()
    return row
  }

  async update(
    boardID: number,
    taskID: number,
    changes: Changes,
    updatedAt: Date,
  ): Promise<BoardTaskRow> {
    const task = await this.require(boardID, taskID)
    const phase = changes.phase === undefined ? task.phase : changes.phase
    if (phase !== null) {
      await this.phases.require(boardID, phase)
    }
    await this.db.boardTask
      .update({
        ...(changes.title === undefined ? {} : { title: changes.title }),
        ...(changes.details === undefined ? {} : { details: changes.details }),
        ...(changes.complete === undefined
          ? {}
          : { complete: changes.complete }),
        ...(changes.phase === undefined ? {} : { phase: changes.phase }),
        updated_at: updatedAt,
      })
      .where("board", "=", boardID)
      .where("id", "=", taskID)
      .execute()
    return this.require(boardID, taskID)
  }

  async delete(task: BoardTaskRow) {
    await this.db.boardTask.delete().where("id", "=", task.id).execute()
    const remaining = await this.list(task.board)
    for (const [position, row] of remaining.entries()) {
      await this.db.boardTask
        .update({ position })
        .where("id", "=", row.id)
        .execute()
    }
  }
}
