import type { DatabaseConnection } from "$/database"
import type { WorkspaceRow } from "$/database/boards"
import { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import { WorkspaceRepository } from "$/services/Workspaces/WorkspaceRepository"
import type { WorkspaceAccessLevel } from "shared/models"

export class WorkspaceAuthorization {
  private readonly db: DatabaseConnection
  private readonly workspaces: WorkspaceRepository

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
    this.workspaces = new WorkspaceRepository({ db })
  }

  async authorize(
    actor: Actor,
    slug: string,
    minimum: WorkspaceAccessLevel,
  ): Promise<{ row: WorkspaceRow; access: WorkspaceAccessLevel }> {
    const row = await this.workspaces.find(slug)
    if (!row) {
      throw new DomainError("not-found", "Workspace was not found.")
    }
    const access = await this.effectiveAccess(actor, row.id)
    if (!access) {
      throw new DomainError("not-found", "Workspace was not found.")
    }
    if (
      WorkspaceAuthorization.rank(access) < WorkspaceAuthorization.rank(minimum)
    ) {
      throw new DomainError(
        "forbidden",
        `Workspace ${minimum} access is required.`,
      )
    }
    return { row, access }
  }

  async effectiveAccess(
    actor: Actor,
    workspaceID: number,
  ): Promise<WorkspaceAccessLevel | null> {
    if (Actor.isPalaceAdmin(actor)) {
      return "manage"
    }
    const grants = await this.db.workspaceAccess
      .select("*")
      .where("workspace", "=", workspaceID)
      .fetch()
    let access: WorkspaceAccessLevel | null = null
    for (const grant of grants) {
      const [group] = await this.db.group
        .select("uid")
        .where("id", "=", grant.group)
        .limit(1)
        .fetch()
      if (
        group &&
        actor.groups.includes(group.uid) &&
        (!access ||
          WorkspaceAuthorization.rank(grant.level) >
            WorkspaceAuthorization.rank(access))
      ) {
        access = grant.level
      }
    }
    return access
  }

  private static rank(access: WorkspaceAccessLevel) {
    return { read: 1, write: 2, manage: 3 }[access]
  }
}
