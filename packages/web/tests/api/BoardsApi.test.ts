import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { boards } from "$/api/boards"
import type { OperationHandler } from "$/framework/operation"
import type { Actor } from "$/authorization/Actor"
import type { Type } from "arktype"
import { TestContext } from "../TestContext"

let context: TestContext

describe("Boards API", () => {
  let admin: Actor

  beforeEach(async () => {
    context = await TestContext.create()
    admin = await context.actor("dan")
  })

  afterEach(() => context.close())

  test("rejects malformed JSON and malformed input", async () => {
    await expect(
      invokeRaw(boards.workspace.create, "{", admin),
    ).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      invoke(
        boards.workspace.create,
        {
          name: "",
          slug: "home",
          color: null,
          icon: null,
          manager_group: 1,
        },
        admin,
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  test("rejects unsupported icon and color keys", async () => {
    await expect(
      invoke(
        boards.workspace.create,
        {
          name: "Home",
          slug: "home",
          color: "infrared",
          icon: "uploaded-svg",
          manager_group: 1,
        },
        admin,
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  test("requires a session and hides inaccessible resources", async () => {
    await expect(invoke(boards.workspace.list, null)).rejects.toMatchObject({
      status: 401,
    })
    await context.workspaces.create(admin, metadata("Home", "home"), 2)
    const reader = await context.actor("lara")
    await expect(
      invoke(boards.board.list, { workspace: "home" }, reader),
    ).rejects.toMatchObject({ status: 404 })
  })

  test("maps domain failures to route errors", async () => {
    await expect(
      invoke(
        boards.workspace.create,
        { ...metadata(" ", "home"), manager_group: 1 },
        admin,
      ),
    ).rejects.toMatchObject({ status: 400 })

    const member = await context.actor("lara")
    await expect(
      invoke(
        boards.workspace.create,
        { ...metadata("Home", "home"), manager_group: 1 },
        member,
      ),
    ).rejects.toMatchObject({ status: 403 })

    await context.workspaces.create(admin, metadata("Home", "home"), 1)
    await expect(
      invoke(
        boards.workspace.create,
        { ...metadata("Another Home", "home"), manager_group: 1 },
        admin,
      ),
    ).rejects.toMatchObject({ status: 409 })
  })

  test("returns typed mutation data with ISO timestamps", async () => {
    const workspace = await invoke(
      boards.workspace.create,
      { ...metadata("Home", "home"), manager_group: 1 },
      admin,
    )
    expect(workspace).toMatchObject({
      slug: "home",
      access: "manage",
      palace_admin: true,
    })
    expect(typeof workspace.created_at).toBe("string")

    const board = await invoke(
      boards.board.create,
      { workspace: "home", ...metadata("Chores", "chores") },
      admin,
    )
    expect(board).toMatchObject({ slug: "chores" })
    expect(typeof board.updated_at).toBe("string")
  })

  test("scopes Task lookup to addressed Board", async () => {
    await context.workspaces.create(admin, metadata("Home", "home"), 1)
    await context.boards.create(admin, "home", metadata("One", "one"))
    await context.boards.create(admin, "home", metadata("Two", "two"))
    const task = await context.boards.createTask(admin, "home", "one", {
      title: "Scoped",
    })

    await expect(
      invoke(
        boards.task.get,
        {
          workspace: "home",
          board: "two",
          task: task.id,
        },
        admin,
      ),
    ).rejects.toMatchObject({ status: 404 })
  })
})

async function invoke<Output>(
  operation: OperationHandler<Type, Type<Output>>,
  input: unknown,
  actor?: Actor,
) {
  return invokeRaw(operation, JSON.stringify(input), actor)
}

async function invokeRaw<Output>(
  operation: OperationHandler<Type, Type<Output>>,
  body: string,
  actor?: Actor,
) {
  return operation({
    request: new Request("http://palace.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
    boards: context.boards,
    workspaces: context.workspaces,
    actor,
  } as never) as Promise<Output>
}

function metadata(name: string, slug: string) {
  return {
    name,
    slug,
    color: null,
    icon: null,
  }
}
