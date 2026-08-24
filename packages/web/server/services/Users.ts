import type { DB } from "$/database"

export class Users {
  private readonly db: DB

  constructor({ db }: { db: DB }) {
    this.db = db
  }

  async get(slug: string) {
    const [user] = await this.db.user
      .select("*")
      .where("slug", "=", slug)
      .limit(1)
      .fetch()
    return user
  }

  async groups(userID: number) {
    const memberships = await this.db.member
      .select("group")
      .where("user", "=", userID)
      .fetch()
    const groups = await Promise.all(
      memberships.map(async ({ group }) => {
        const [row] = await this.db.group
          .select("uid")
          .where("id", "=", group)
          .limit(1)
          .fetch()
        return row?.uid
      }),
    )
    return groups.filter((uid): uid is string => uid !== undefined).toSorted()
  }
}
