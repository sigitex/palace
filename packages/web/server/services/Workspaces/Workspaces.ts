import type { DatabaseConnection, DB } from "$/database"
import type { WorkspaceRow } from "$/database/boards"
import { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import { IdentityGroups } from "$/services/IdentityGroups"
import { WorkspaceAuthorization } from "$/services/Workspaces/WorkspaceAuthorization"
import { WorkspaceGrants } from "$/services/Workspaces/WorkspaceGrants"
import { WorkspaceMetadata } from "$/services/Workspaces/WorkspaceMetadata"
import { WorkspacePresenter } from "$/services/Workspaces/WorkspacePresenter"
import { WorkspaceRepository } from "$/services/Workspaces/WorkspaceRepository"
import type {
  IdentityGroup,
  Workspace,
  WorkspaceAccess,
  WorkspaceAccessLevel,
} from "shared/models"

export class Workspaces {
  private readonly db: DB

  constructor({ db }: { db: DB }) {
    this.db = db
  }

  async list(actor: Actor): Promise<Workspace[]> {
    const repository = new WorkspaceRepository({ db: this.db })
    const authorization = new WorkspaceAuthorization({ db: this.db })
    const presenter = new WorkspacePresenter({ db: this.db })
    const rows = await repository.list()
    const readable = await Promise.all(
      rows.map(async (row) => {
        const access = await authorization.effectiveAccess(actor, row.id)
        return access ? presenter.workspace(row, actor, access) : null
      }),
    )
    return readable.filter(
      (workspace): workspace is Workspace => workspace !== null,
    )
  }

  async get(
    actor: Actor,
    slug: string,
    db?: DatabaseConnection,
  ): Promise<Workspace> {
    const connection = db ?? this.db
    const { row, access } = await new WorkspaceAuthorization({
      db: connection,
    }).authorize(actor, slug, "read")
    return new WorkspacePresenter({ db: connection }).workspace(
      row,
      actor,
      access,
    )
  }

  async create(
    actor: Actor,
    metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
    managerGroup: number,
  ): Promise<Workspace> {
    Actor.requirePalaceAdmin(actor)
    WorkspaceMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      const groups = new IdentityGroups({ db })
      const repository = new WorkspaceRepository({ db })
      const grants = new WorkspaceGrants({ db })
      await groups.require(managerGroup)
      await repository.requireUnusedSlug(metadata.slug)
      const now = new Date()
      const row = await repository.create(metadata, actor.user, now)
      await grants.createManager(row.id, managerGroup, now)
      return new WorkspacePresenter({ db }).workspace(row, actor, "manage")
    })
  }

  async update(
    actor: Actor,
    slug: string,
    metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
  ): Promise<Workspace> {
    Actor.requirePalaceAdmin(actor)
    WorkspaceMetadata.validate(metadata)
    return this.db.transaction(async (db) => {
      const repository = new WorkspaceRepository({ db })
      const row = await repository.require(slug)
      if (metadata.slug !== slug) {
        await repository.requireUnusedSlug(metadata.slug)
      }
      const updated = await repository.update(row.id, metadata, new Date())
      return new WorkspacePresenter({ db }).workspace(updated, actor, "manage")
    })
  }

  async delete(actor: Actor, slug: string): Promise<Workspace> {
    Actor.requirePalaceAdmin(actor)
    return this.db.transaction(async (db) => {
      const repository = new WorkspaceRepository({ db })
      const grants = new WorkspaceGrants({ db })
      const row = await repository.require(slug)
      if (await repository.hasBoards(row.id)) {
        throw new DomainError(
          "not-empty",
          "Workspace contains Boards. Delete them before deleting the Workspace.",
        )
      }
      const workspace = await new WorkspacePresenter({ db }).workspace(
        row,
        actor,
        "manage",
      )
      await grants.deleteAll(row.id)
      await repository.delete(row.id)
      return workspace
    })
  }

  async listAccess(
    actor: Actor,
    slug: string,
    db?: DatabaseConnection,
  ): Promise<WorkspaceAccess[]> {
    return new WorkspaceGrants({ db: db ?? this.db }).list(actor, slug)
  }

  async groups(actor: Actor, slug: string): Promise<IdentityGroup[]> {
    return new WorkspaceGrants({ db: this.db }).listGroups(actor, slug)
  }

  async setAccess(
    actor: Actor,
    slug: string,
    groupID: number,
    level: WorkspaceAccessLevel,
  ): Promise<WorkspaceAccess[]> {
    return this.db.transaction((db) =>
      new WorkspaceGrants({ db }).set(actor, slug, groupID, level),
    )
  }

  async removeAccess(
    actor: Actor,
    slug: string,
    groupID: number,
  ): Promise<WorkspaceAccess[]> {
    return this.db.transaction((db) =>
      new WorkspaceGrants({ db }).remove(actor, slug, groupID),
    )
  }

  async authorize(
    actor: Actor,
    slug: string,
    minimum: WorkspaceAccessLevel,
    db?: DatabaseConnection,
  ): Promise<{ row: WorkspaceRow; access: WorkspaceAccessLevel }> {
    return new WorkspaceAuthorization({ db: db ?? this.db }).authorize(
      actor,
      slug,
      minimum,
    )
  }
}
