import type { DatabaseConnection } from "$/database"
import type { WorkspaceAccessRow, WorkspaceRow } from "$/database/boards"
import { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import { IdentityGroups } from "$/services/IdentityGroups"
import type {
  BoardColor,
  BoardIcon,
  Workspace,
  WorkspaceAccess,
  WorkspaceAccessLevel,
} from "shared/models"

export class WorkspacePresenter {
  private readonly db: DatabaseConnection
  private readonly groups: IdentityGroups

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
    this.groups = new IdentityGroups({ db })
  }

  async workspace(
    row: WorkspaceRow,
    actor: Actor,
    access: WorkspaceAccessLevel,
  ): Promise<Workspace> {
    const [creator] = await this.db.user
      .select("id", "slug", "name")
      .where("id", "=", row.created_by)
      .limit(1)
      .fetch()
    if (!creator) {
      throw new DomainError("not-found", "Workspace Creator was not found.")
    }
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      color: row.color as BoardColor | null,
      icon: row.icon as BoardIcon | null,
      access,
      palace_admin: Actor.isPalaceAdmin(actor),
      creator,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }
  }

  async access(grant: WorkspaceAccessRow): Promise<WorkspaceAccess> {
    const group = await this.groups.require(grant.group)
    return {
      group: group.id,
      group_uid: group.uid,
      group_name: group.name,
      level: grant.level,
      created_at: grant.created_at.toISOString(),
      updated_at: grant.updated_at.toISOString(),
    }
  }
}
