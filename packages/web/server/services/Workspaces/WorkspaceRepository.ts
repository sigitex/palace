import type { DatabaseConnection } from "$/database"
import type { WorkspaceRow } from "$/database/boards"
import { DomainError } from "$/errors/DomainError"
import type { Workspace } from "shared/models"

type Metadata = Pick<Workspace, "name" | "slug" | "color" | "icon">

export class WorkspaceRepository {
  private readonly db: DatabaseConnection

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
  }

  list(): Promise<WorkspaceRow[]> {
    return this.db.workspace
      .select("*")
      .orderBy([["name", "asc"]])
      .fetch()
  }

  async find(slug: string): Promise<WorkspaceRow | undefined> {
    const [row] = await this.db.workspace
      .select("*")
      .where("slug", "=", slug)
      .limit(1)
      .fetch()
    return row
  }

  async require(slug: string): Promise<WorkspaceRow> {
    const row = await this.find(slug)
    if (!row) {
      throw new DomainError("not-found", `Workspace '${slug}' was not found.`)
    }
    return row
  }

  async requireUnusedSlug(slug: string) {
    const rows = await this.db.workspace
      .select("id")
      .where("slug", "=", slug)
      .limit(1)
      .fetch()
    if (rows.length > 0) {
      throw new DomainError(
        "conflict",
        `Workspace slug '${slug}' is already in use.`,
      )
    }
  }

  async create(
    metadata: Metadata,
    creator: number,
    createdAt: Date,
  ): Promise<WorkspaceRow> {
    const [row] = await this.db.workspace
      .insert({
        ...metadata,
        created_by: creator,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .returning("*")
      .execute()
    return row
  }

  async update(
    workspaceID: number,
    metadata: Metadata,
    updatedAt: Date,
  ): Promise<WorkspaceRow> {
    const [row] = await this.db.workspace
      .update({ ...metadata, updated_at: updatedAt })
      .where("id", "=", workspaceID)
      .returning("*")
      .execute()
    return row
  }

  async hasBoards(workspaceID: number) {
    const rows = await this.db.board
      .select("id")
      .where("workspace", "=", workspaceID)
      .limit(1)
      .fetch()
    return rows.length > 0
  }

  async delete(workspaceID: number) {
    await this.db.workspace.delete().where("id", "=", workspaceID).execute()
  }
}
