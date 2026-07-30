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
}
