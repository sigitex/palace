import { Database } from "bun:sqlite"
import { CowboyConnection, createDatabase } from "@sigitex/outlaw"
import { BunConnection } from "@sigitex/outlaw/bun"
import { schema } from "$/database/schema"
import { hacks } from "$/database/hack"
import { fixtures } from "$/database/fixtures"

export type DB = ReturnType<typeof createDB>

export function createDB() {
  const sqlite = new Database("palace.sqlite")
  const bun = new BunConnection(sqlite)
  const connection = new CowboyConnection(bun, schema, {
    fixtures,
    hacks,
    runFixtures: true, // env.WEB_ENV !== "prod",
  })
  const db = createDatabase(connection, schema)
  return db
}
