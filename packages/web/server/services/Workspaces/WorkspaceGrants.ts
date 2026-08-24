import type { DatabaseConnection } from "$/database"
import type { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import { IdentityGroups } from "$/services/IdentityGroups"
import { WorkspaceAuthorization } from "$/services/Workspaces/WorkspaceAuthorization"
import { WorkspacePresenter } from "$/services/Workspaces/WorkspacePresenter"
import type {
  IdentityGroup,
  WorkspaceAccess,
  WorkspaceAccessLevel,
} from "shared/models"

export class WorkspaceGrants {
  private readonly db: DatabaseConnection
  private readonly authorization: WorkspaceAuthorization
  private readonly groups: IdentityGroups
  private readonly presenter: WorkspacePresenter

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
    this.authorization = new WorkspaceAuthorization({ db })
    this.groups = new IdentityGroups({ db })
    this.presenter = new WorkspacePresenter({ db })
  }

  async list(actor: Actor, slug: string): Promise<WorkspaceAccess[]> {
    const { row } = await this.authorization.authorize(actor, slug, "manage")
    const grants = await this.db.workspaceAccess
      .select("*")
      .where("workspace", "=", row.id)
      .orderBy([["group", "asc"]])
      .fetch()
    return Promise.all(grants.map((grant) => this.presenter.access(grant)))
  }

  async listGroups(actor: Actor, slug: string): Promise<IdentityGroup[]> {
    await this.authorization.authorize(actor, slug, "manage")
    return this.groups.list()
  }

  async set(
    actor: Actor,
    slug: string,
    groupID: number,
    level: WorkspaceAccessLevel,
  ): Promise<WorkspaceAccess[]> {
    const { row } = await this.authorization.authorize(actor, slug, "manage")
    await this.groups.require(groupID)
    const [existing] = await this.db.workspaceAccess
      .select("*")
      .where("workspace", "=", row.id)
      .where("group", "=", groupID)
      .limit(1)
      .fetch()
    if (existing?.level === "manage" && level !== "manage") {
      await this.requireAnotherManager(row.id, groupID)
    }
    const now = new Date()
    if (existing) {
      await this.db.workspaceAccess
        .update({ level, updated_at: now })
        .where("workspace", "=", row.id)
        .where("group", "=", groupID)
        .execute()
    } else {
      await this.db.workspaceAccess
        .insert({
          workspace: row.id,
          group: groupID,
          level,
          created_at: now,
          updated_at: now,
        })
        .execute()
    }
    return this.list(actor, slug)
  }

  async remove(
    actor: Actor,
    slug: string,
    groupID: number,
  ): Promise<WorkspaceAccess[]> {
    const { row } = await this.authorization.authorize(actor, slug, "manage")
    const [existing] = await this.db.workspaceAccess
      .select("*")
      .where("workspace", "=", row.id)
      .where("group", "=", groupID)
      .limit(1)
      .fetch()
    if (!existing) {
      throw new DomainError("not-found", "Workspace Access was not found.")
    }
    if (existing.level === "manage") {
      await this.requireAnotherManager(row.id, groupID)
    }
    await this.db.workspaceAccess
      .delete()
      .where("workspace", "=", row.id)
      .where("group", "=", groupID)
      .execute()
    return this.list(actor, slug)
  }

  async createManager(workspaceID: number, groupID: number, createdAt: Date) {
    await this.db.workspaceAccess
      .insert({
        workspace: workspaceID,
        group: groupID,
        level: "manage",
        created_at: createdAt,
        updated_at: createdAt,
      })
      .execute()
  }

  async deleteAll(workspaceID: number) {
    await this.db.workspaceAccess
      .delete()
      .where("workspace", "=", workspaceID)
      .execute()
  }

  private async requireAnotherManager(
    workspaceID: number,
    excludedGroup: number,
  ) {
    const managers = await this.db.workspaceAccess
      .select("group")
      .where("workspace", "=", workspaceID)
      .where("level", "=", "manage")
      .fetch()
    if (!managers.some(({ group }) => group !== excludedGroup)) {
      throw new DomainError(
        "conflict",
        "Workspace must retain at least one Manager group.",
      )
    }
  }
}
