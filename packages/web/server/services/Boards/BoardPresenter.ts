import type { DatabaseConnection } from "$/database"
import type { BoardPhaseRow, BoardRow, BoardTaskRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import type {
  Board,
  BoardColor,
  BoardIcon,
  BoardPhase,
  BoardTask,
} from "shared/models"

export class BoardPresenter {
  private readonly db: DatabaseConnection

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
  }

  async board(row: BoardRow): Promise<Board> {
    return {
      id: row.id,
      workspace: row.workspace,
      name: row.name,
      slug: row.slug,
      color: row.color as BoardColor | null,
      icon: row.icon as BoardIcon | null,
      creator: await this.requireCreator(row.created_by),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }
  }

  async task(row: BoardTaskRow): Promise<BoardTask> {
    return {
      id: row.id,
      board: row.board,
      phase: row.phase,
      title: row.title,
      details: row.details,
      complete: row.complete,
      position: row.position,
      creator: await this.requireCreator(row.created_by),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }
  }

  static phase(row: BoardPhaseRow): BoardPhase {
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

  private async requireCreator(userID: number) {
    const [creator] = await this.db.user
      .select("id", "slug", "name")
      .where("id", "=", userID)
      .limit(1)
      .fetch()
    if (!creator) {
      throw new DomainError("not-found", "Creator was not found.")
    }
    return creator
  }
}
