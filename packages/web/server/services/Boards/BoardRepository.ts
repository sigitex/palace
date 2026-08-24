import type { DatabaseConnection } from "$/database"
import type { BoardRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import type { Board } from "shared/models"

type Metadata = Pick<Board, "name" | "slug" | "color" | "icon">

export class BoardRepository {
  private readonly db: DatabaseConnection

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
  }

  list(workspaceID: number): Promise<BoardRow[]> {
    return this.db.board
      .select("*")
      .where("workspace", "=", workspaceID)
      .orderBy([["name", "asc"]])
      .fetch()
  }

  async require(workspaceSlug: string, boardSlug: string): Promise<BoardRow> {
    const [workspace] = await this.db.workspace
      .select("id")
      .where("slug", "=", workspaceSlug)
      .limit(1)
      .fetch()
    if (!workspace) {
      throw new DomainError("not-found", "Board was not found.")
    }
    const [board] = await this.db.board
      .select("*")
      .where("workspace", "=", workspace.id)
      .where("slug", "=", boardSlug)
      .limit(1)
      .fetch()
    if (!board) {
      throw new DomainError("not-found", "Board was not found.")
    }
    return board
  }

  async requireUnusedSlug(workspaceID: number, slug: string) {
    const rows = await this.db.board
      .select("id")
      .where("workspace", "=", workspaceID)
      .where("slug", "=", slug)
      .limit(1)
      .fetch()
    if (rows.length > 0) {
      throw new DomainError(
        "conflict",
        `Board slug '${slug}' is already in use.`,
      )
    }
  }

  async create(
    workspaceID: number,
    metadata: Metadata,
    creator: number,
    createdAt: Date,
  ): Promise<BoardRow> {
    const [row] = await this.db.board
      .insert({
        ...metadata,
        workspace: workspaceID,
        created_by: creator,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .returning("*")
      .execute()
    return row
  }

  async update(
    boardID: number,
    metadata: Metadata,
    updatedAt: Date,
  ): Promise<BoardRow> {
    const [row] = await this.db.board
      .update({ ...metadata, updated_at: updatedAt })
      .where("id", "=", boardID)
      .returning("*")
      .execute()
    return row
  }

  async delete(boardID: number) {
    await this.db.boardTask.delete().where("board", "=", boardID).execute()
    await this.db.boardPhase.delete().where("board", "=", boardID).execute()
    await this.db.board.delete().where("id", "=", boardID).execute()
  }
}
