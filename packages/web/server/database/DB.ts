import { Database } from "bun:sqlite"
import { CowboyConnection, createDatabase } from "@sigitex/outlaw"
import { BunConnection } from "@sigitex/outlaw/bun"
import { schema } from "$/database/schema"
import { hacks } from "$/database/hack"
import { fixtures } from "$/database/fixtures"

export type DB = ReturnType<typeof createDB>
export type DatabaseConnection = Omit<DB, "connection" | "transaction">

export type DBOptions = {
  sqlite?: Database
  filename?: string
  runFixtures?: boolean
}

export function createDB(options: DBOptions = {}) {
  const filename =
    options.filename ?? process.env.PALACE_DATABASE ?? "palace.sqlite"
  const sqlite = options.sqlite ?? new Database(filename)
  sqlite.run("PRAGMA foreign_keys = ON")
  return createDatabase(
    new CowboyConnection(new BunConnection(sqlite), schema, {
      fixtures,
      hacks,
      runFixtures: options.runFixtures ?? true, // env.WEB_ENV !== "prod",
    }),
    schema,
  )
}

export async function createTemporaryDB(runFixtures = false) {
  const sqlite = new Database(":memory:")
  const db = createDB({ sqlite, runFixtures })
  await db.connection.query("SELECT 1")
  return {
    db,
    close: () => sqlite.close(),
  }
}
