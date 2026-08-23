import type { DatabaseConnection, DB } from "$/database"
import type { WorkspaceAccessRow, WorkspaceRow } from "$/database/boards"
import type { GroupRow } from "$/database/identity"
import { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import {
  BOARD_COLORS,
  BOARD_ICONS,
  type BoardColor,
  type BoardIcon,
  type IdentityGroup,
  type Workspace,
  type WorkspaceAccess,
  type WorkspaceAccessLevel,
} from "shared/models"

export class Workspaces {
  private readonly db: DB

  constructor({ db }: { db: DB }) {
    this.db = db
  }

  async list(actor: Actor): Promise<Workspace[]> {
    const rows = await this.db.workspace
      .select("*")
      .orderBy([["name", "asc"]])
      .fetch()
    const readable = await Promise.all(
      rows.map(async (row) => {
        const access = await workspaceAccess(actor, row.id, this.db)
        return access ? presentWorkspace(row, actor, access, this.db) : null
      }),
    )
    return readable.filter(
      (workspace): workspace is Workspace => workspace !== null,
    )
  }

  async get(
    actor: Actor,
    slug: string,
    db: DatabaseConnection = this.db,
  ): Promise<Workspace> {
    const { row, access } = await this.authorize(actor, slug, "read", db)
    return presentWorkspace(row, actor, access, db)
  }

  async create(
    actor: Actor,
    metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
    managerGroup: number,
  ): Promise<Workspace> {
    requirePalaceAdmin(actor)
    validateMetadata(metadata)
    return this.db.transaction(async (db) => {
      await requireGroup(db, managerGroup)
      await requireUnusedSlug(db, metadata.slug)
      const now = new Date()
      const [row] = await db.workspace
        .insert({
          ...metadata,
          created_by: actor.user,
          created_at: now,
          updated_at: now,
        })
        .returning("*")
        .execute()
      await db.workspaceAccess
        .insert({
          workspace: row.id,
          group: managerGroup,
          level: "manage",
          created_at: now,
          updated_at: now,
        })
        .execute()
      return presentWorkspace(row, actor, "manage", db)
    })
  }

  async update(
    actor: Actor,
    slug: string,
    metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
  ): Promise<Workspace> {
    requirePalaceAdmin(actor)
    validateMetadata(metadata)
    return this.db.transaction(async (db) => {
      const row = await requireWorkspaceRow(db, slug)
      if (metadata.slug !== slug) {
        await requireUnusedSlug(db, metadata.slug)
      }
      const [updated] = await db.workspace
        .update({ ...metadata, updated_at: new Date() })
        .where("id", "=", row.id)
        .returning("*")
        .execute()
      return presentWorkspace(updated, actor, "manage", db)
    })
  }

  async delete(actor: Actor, slug: string): Promise<Workspace> {
    requirePalaceAdmin(actor)
    return this.db.transaction(async (db) => {
      const row = await requireWorkspaceRow(db, slug)
      const boards = await db.board
        .select("id")
        .where("workspace", "=", row.id)
        .limit(1)
        .fetch()
      if (boards.length > 0) {
        throw new DomainError(
          "not-empty",
          "Workspace contains Boards. Delete them before deleting the Workspace.",
        )
      }
      const workspace = await presentWorkspace(row, actor, "manage", db)
      await db.workspaceAccess
        .delete()
        .where("workspace", "=", row.id)
        .execute()
      await db.workspace.delete().where("id", "=", row.id).execute()
      return workspace
    })
  }

  async listAccess(
    actor: Actor,
    slug: string,
    db: DatabaseConnection = this.db,
  ): Promise<WorkspaceAccess[]> {
    const { row } = await this.authorize(actor, slug, "manage", db)
    const grants = await db.workspaceAccess
      .select("*")
      .where("workspace", "=", row.id)
      .orderBy([["group", "asc"]])
      .fetch()
    return Promise.all(grants.map((grant) => presentAccess(grant, db)))
  }

  async groups(actor: Actor, slug: string): Promise<IdentityGroup[]> {
    await this.authorize(actor, slug, "manage")
    return this.db.group
      .select("id", "uid", "name")
      .orderBy([["name", "asc"]])
      .fetch()
  }

  async setAccess(
    actor: Actor,
    slug: string,
    groupID: number,
    level: WorkspaceAccessLevel,
  ): Promise<WorkspaceAccess[]> {
    return this.db.transaction(async (db) => {
      const { row } = await this.authorize(actor, slug, "manage", db)
      await requireGroup(db, groupID)
      const [existing] = await db.workspaceAccess
        .select("*")
        .where("workspace", "=", row.id)
        .where("group", "=", groupID)
        .limit(1)
        .fetch()
      if (existing?.level === "manage" && level !== "manage") {
        await requireAnotherManager(db, row.id, groupID)
      }
      const now = new Date()
      if (existing) {
        await db.workspaceAccess
          .update({ level, updated_at: now })
          .where("workspace", "=", row.id)
          .where("group", "=", groupID)
          .execute()
      } else {
        await db.workspaceAccess
          .insert({
            workspace: row.id,
            group: groupID,
            level,
            created_at: now,
            updated_at: now,
          })
          .execute()
      }
      return this.listAccess(actor, slug, db)
    })
  }

  async removeAccess(
    actor: Actor,
    slug: string,
    groupID: number,
  ): Promise<WorkspaceAccess[]> {
    return this.db.transaction(async (db) => {
      const { row } = await this.authorize(actor, slug, "manage", db)
      const [existing] = await db.workspaceAccess
        .select("*")
        .where("workspace", "=", row.id)
        .where("group", "=", groupID)
        .limit(1)
        .fetch()
      if (!existing) {
        throw new DomainError("not-found", "Workspace Access was not found.")
      }
      if (existing.level === "manage") {
        await requireAnotherManager(db, row.id, groupID)
      }
      await db.workspaceAccess
        .delete()
        .where("workspace", "=", row.id)
        .where("group", "=", groupID)
        .execute()
      return this.listAccess(actor, slug, db)
    })
  }

  async authorize(
    actor: Actor,
    slug: string,
    minimum: WorkspaceAccessLevel,
    db?: DatabaseConnection,
  ): Promise<{ row: WorkspaceRow; access: WorkspaceAccessLevel }> {
    const connection = db ?? this.db
    const row = await requireWorkspaceRow(connection, slug, true)
    const access = await workspaceAccess(actor, row.id, connection)
    if (!access) {
      throw new DomainError("not-found", "Workspace was not found.")
    }
    if (accessRank(access) < accessRank(minimum)) {
      throw new DomainError(
        "forbidden",
        `Workspace ${minimum} access is required.`,
      )
    }
    return { row, access }
  }
}

async function workspaceAccess(
  actor: Actor,
  workspaceID: number,
  db: DatabaseConnection,
): Promise<WorkspaceAccessLevel | null> {
  if (Actor.isPalaceAdmin(actor)) {
    return "manage"
  }
  const grants = await db.workspaceAccess
    .select("*")
    .where("workspace", "=", workspaceID)
    .fetch()
  let access: WorkspaceAccessLevel | null = null
  for (const grant of grants) {
    const [identityGroup] = await db.group
      .select("uid")
      .where("id", "=", grant.group)
      .limit(1)
      .fetch()
    if (
      identityGroup &&
      actor.groups.includes(identityGroup.uid) &&
      (!access || accessRank(grant.level) > accessRank(access))
    ) {
      access = grant.level
    }
  }
  return access
}

async function presentWorkspace(
  row: WorkspaceRow,
  actor: Actor,
  access: WorkspaceAccessLevel,
  db: DatabaseConnection,
): Promise<Workspace> {
  const [creator] = await db.user
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

async function presentAccess(
  grant: WorkspaceAccessRow,
  db: DatabaseConnection,
): Promise<WorkspaceAccess> {
  const identityGroup = await requireGroup(db, grant.group)
  return {
    group: identityGroup.id,
    group_uid: identityGroup.uid,
    group_name: identityGroup.name,
    level: grant.level,
    created_at: grant.created_at.toISOString(),
    updated_at: grant.updated_at.toISOString(),
  }
}

function requirePalaceAdmin(actor: Actor) {
  if (!Actor.isPalaceAdmin(actor)) {
    throw new DomainError(
      "forbidden",
      "Palace Administrator access is required.",
    )
  }
}

function validateMetadata(
  metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
) {
  if (!metadata.name.trim() || !metadata.slug.trim()) {
    throw new DomainError("invalid", "Workspace name and slug are required.")
  }
  if (metadata.color && !BOARD_COLORS.includes(metadata.color)) {
    throw new DomainError("invalid", "Unsupported Workspace color.")
  }
  if (metadata.icon && !BOARD_ICONS.includes(metadata.icon)) {
    throw new DomainError("invalid", "Unsupported Workspace icon.")
  }
}

async function requireWorkspaceRow(
  db: DatabaseConnection,
  slug: string,
  hideInaccessible = false,
) {
  const [row] = await db.workspace
    .select("*")
    .where("slug", "=", slug)
    .limit(1)
    .fetch()
  if (!row) {
    throw new DomainError(
      "not-found",
      hideInaccessible
        ? "Workspace was not found."
        : `Workspace '${slug}' was not found.`,
    )
  }
  return row
}

async function requireUnusedSlug(db: DatabaseConnection, slug: string) {
  const rows = await db.workspace
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

async function requireGroup(
  db: DatabaseConnection,
  groupID: number,
): Promise<GroupRow> {
  const [identityGroup] = await db.group
    .select("*")
    .where("id", "=", groupID)
    .limit(1)
    .fetch()
  if (!identityGroup) {
    throw new DomainError("not-found", "Identity group was not found.")
  }
  return identityGroup
}

async function requireAnotherManager(
  db: DatabaseConnection,
  workspaceID: number,
  excludedGroup: number,
) {
  const managers = await db.workspaceAccess
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

function accessRank(access: WorkspaceAccessLevel) {
  return { read: 1, write: 2, manage: 3 }[access]
}
