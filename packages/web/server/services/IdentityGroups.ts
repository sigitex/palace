import type { DatabaseConnection } from "$/database"
import type { GroupRow } from "$/database/identity"
import { DomainError } from "$/errors/DomainError"
import type { IdentityGroup } from "shared/models"

export class IdentityGroups {
  private readonly db: DatabaseConnection

  constructor({ db }: { db: DatabaseConnection }) {
    this.db = db
  }

  list(): Promise<IdentityGroup[]> {
    return this.db.group
      .select("id", "uid", "name")
      .orderBy([["name", "asc"]])
      .fetch()
  }

  async require(groupID: number): Promise<GroupRow> {
    const [group] = await this.db.group
      .select("*")
      .where("id", "=", groupID)
      .limit(1)
      .fetch()
    if (!group) {
      throw new DomainError("not-found", "Identity group was not found.")
    }
    return group
  }
}
