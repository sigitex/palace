import type { DatabaseConnection } from "$/database"
import type { BoardTaskRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import { BoardPhases } from "$/services/Boards/BoardPhases"
import { BoardTasks } from "$/services/Boards/BoardTasks"
import type { MoveAnchors } from "$/services/Boards/MoveAnchors"
import type { TaskDestination } from "$/services/Boards/TaskDestination"

export class BoardTaskMovement {
  private readonly db: DatabaseConnection
  private readonly phases: BoardPhases
  private readonly tasks: BoardTasks

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
    this.phases = new BoardPhases({ db })
    this.tasks = new BoardTasks({ db })
  }

  async move(
    boardID: number,
    taskID: number,
    destination: TaskDestination,
    anchors: MoveAnchors,
  ) {
    if (destination.type === "phase" && destination.phase !== null) {
      await this.phases.require(boardID, destination.phase)
    }
    const rows = await this.tasks.list(boardID)
    const task = rows.find((row) => row.id === taskID)
    if (!task) {
      throw new DomainError("not-found", "Task was not found in this Board.")
    }
    const phase = destination.type === "phase" ? destination.phase : task.phase
    const complete =
      destination.type === "complete"
        ? true
        : destination.type === "phase"
          ? false
          : task.complete
    const remaining = rows.filter((row) => row.id !== taskID)
    BoardTaskMovement.validateAnchors(remaining, destination, anchors)
    const before = BoardTaskMovement.anchorIndex(remaining, anchors.before)
    const after = BoardTaskMovement.anchorIndex(remaining, anchors.after)
    if (before !== null && after !== null && after >= before) {
      throw new DomainError(
        "conflict",
        "Movement anchors are no longer ordered.",
      )
    }
    let index = before ?? (after === null ? -1 : after + 1)
    if (index < 0) {
      const last = remaining.findLastIndex((row) =>
        BoardTaskMovement.destinationContains(destination, row),
      )
      index = last === -1 ? remaining.length : last + 1
    }
    remaining.splice(index, 0, { ...task, phase, complete })
    const now = new Date()
    for (const [position, row] of remaining.entries()) {
      await this.db.boardTask
        .update({
          position,
          ...(row.id === taskID ? { phase, complete, updated_at: now } : {}),
        })
        .where("id", "=", row.id)
        .execute()
    }
  }

  private static validateAnchors(
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
      if (!row || !BoardTaskMovement.destinationContains(destination, row)) {
        throw new DomainError(
          "conflict",
          "Movement anchor is outside the destination.",
        )
      }
    }
  }

  private static destinationContains(
    destination: TaskDestination,
    task: BoardTaskRow,
  ) {
    if (destination.type === "board") {
      return true
    }
    if (destination.type === "complete") {
      return task.complete
    }
    return !task.complete && task.phase === destination.phase
  }

  private static anchorIndex(
    rows: BoardTaskRow[],
    anchor: number | null | undefined,
  ) {
    if (anchor === null || anchor === undefined) {
      return null
    }
    const index = rows.findIndex((row) => row.id === anchor)
    if (index === -1) {
      throw new DomainError("conflict", "Movement anchor is stale or invalid.")
    }
    return index
  }
}
