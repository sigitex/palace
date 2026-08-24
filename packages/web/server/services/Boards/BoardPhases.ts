import type { DatabaseConnection } from "$/database"
import type { BoardPhaseRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import type { MoveAnchors } from "$/services/Boards/MoveAnchors"
import { OrderedRows } from "$/services/Boards/OrderedRows"
import type { BoardPhase } from "shared/models"

type Metadata = Pick<BoardPhase, "title" | "color" | "icon">

export class BoardPhases {
  private readonly db: DatabaseConnection

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
  }

  list(boardID: number): Promise<BoardPhaseRow[]> {
    return this.db.boardPhase
      .select("*")
      .where("board", "=", boardID)
      .orderBy([["position", "asc"]])
      .fetch()
  }

  async require(boardID: number, phaseID: number): Promise<BoardPhaseRow> {
    const [phase] = await this.db.boardPhase
      .select("*")
      .where("board", "=", boardID)
      .where("id", "=", phaseID)
      .limit(1)
      .fetch()
    if (!phase) {
      throw new DomainError("not-found", "Phase was not found in this Board.")
    }
    return phase
  }

  async create(
    boardID: number,
    metadata: Metadata,
    createdAt: Date,
  ): Promise<BoardPhaseRow> {
    const phases = await this.list(boardID)
    const [row] = await this.db.boardPhase
      .insert({
        ...metadata,
        board: boardID,
        position: phases.length,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .returning("*")
      .execute()
    return row
  }

  async update(
    phaseID: number,
    metadata: Metadata,
    updatedAt: Date,
  ): Promise<BoardPhaseRow> {
    const [row] = await this.db.boardPhase
      .update({ ...metadata, updated_at: updatedAt })
      .where("id", "=", phaseID)
      .returning("*")
      .execute()
    return row
  }

  async move(
    boardID: number,
    phaseID: number,
    anchors: MoveAnchors,
  ): Promise<BoardPhaseRow[]> {
    const ordered = new OrderedRows(await this.list(boardID)).move(
      phaseID,
      anchors,
    )
    await Promise.all(
      ordered.map((phase, position) =>
        this.db.boardPhase
          .update({ position })
          .where("id", "=", phase.id)
          .execute(),
      ),
    )
    return ordered.map((phase, position) => ({ ...phase, position }))
  }

  async delete(boardID: number, phaseID: number): Promise<BoardPhaseRow> {
    const phase = await this.require(boardID, phaseID)
    const tasks = await this.db.boardTask
      .select("*")
      .where("board", "=", boardID)
      .orderBy([["position", "asc"]])
      .fetch()
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
      await this.db.boardTask
        .update({
          position,
          ...(affected ? { phase: null, updated_at: now } : {}),
        })
        .where("id", "=", task.id)
        .execute()
    }
    await this.db.boardPhase.delete().where("id", "=", phase.id).execute()
    const phases = (await this.list(boardID)).map((row, position) => ({
      ...row,
      position,
    }))
    for (const row of phases) {
      await this.db.boardPhase
        .update({ position: row.position })
        .where("id", "=", row.id)
        .execute()
    }
    return phase
  }
}
