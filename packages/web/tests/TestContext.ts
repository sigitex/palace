import { createTemporaryDB, type DB } from "$/database"
import type { Actor } from "$/authorization/Actor"
import { Boards } from "$/services/Boards"
import { Users } from "$/services/Users"
import { Workspaces } from "$/services/Workspaces"

export class TestContext {
  readonly users: Users
  readonly workspaces: Workspaces
  readonly boards: Boards

  private constructor(
    readonly db: DB,
    private readonly closeDB: () => void,
  ) {
    this.users = new Users({ db })
    this.workspaces = new Workspaces({ db })
    this.boards = new Boards({ db, workspaces: this.workspaces })
  }

  static async create() {
    const { db, close } = await createTemporaryDB(true)
    return new TestContext(db, close)
  }

  async actor(slug: string, groups?: string[]): Promise<Actor> {
    const user = await this.users.get(slug)
    if (!user) {
      throw new Error(`Fixture user '${slug}' was not found.`)
    }
    return {
      user: user.id,
      groups: groups ?? (await this.users.groups(user.id)),
    }
  }

  close() {
    this.closeDB()
  }
}
