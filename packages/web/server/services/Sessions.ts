import type { DB } from "$/database"
import { Text } from "$/framework/Text"

export class Sessions {
  private readonly db: DB

  constructor({ db }: { db: DB }) {
    this.db = db
  }

  async create(userId: number, userAgent: string | undefined) {
    const now = new Date()
    const token = Text.uid()
    await this.db.session
      .insert({
        created_at: now,
        updated_at: now,
        user_agent: userAgent,
        used_at: now,
        token,
        user: userId,
      })
      .execute()
    return token
  }
}
