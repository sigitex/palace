import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { Actor } from "$/authorization/Actor"
import { TestContext } from "../TestContext"

const workspace = {
  name: "Household",
  slug: "household",
  color: "violet" as const,
  icon: "house" as const,
}

const board = {
  name: "Chores",
  slug: "chores",
  color: "blue" as const,
  icon: "list-checks" as const,
}

describe("Boards services", () => {
  let context: TestContext
  let admin: Actor

  beforeEach(async () => {
    context = await TestContext.create()
    admin = await context.actor("dan")
  })

  afterEach(() => context.close())

  test("resolves persisted memberships", async () => {
    expect(await context.users.groups(admin.user)).toEqual([
      "finch",
      "palace-admins",
    ])
    expect((await context.actor("zebra")).groups).toEqual(["bots"])
  })

  test("filters workspaces and uses highest effective grant", async () => {
    await context.workspaces.create(admin, workspace, 2)
    await context.workspaces.setAccess(admin, workspace.slug, 1, "read")
    await context.workspaces.setAccess(admin, workspace.slug, 3, "write")
    const house = await context.actor("house")
    const lara = await context.actor("lara")
    const zebra = await context.actor("zebra")

    expect((await context.workspaces.list(house))[0]?.access).toBe("write")
    expect((await context.workspaces.list(lara))[0]?.access).toBe("read")
    expect((await context.workspaces.list(zebra))[0]?.access).toBe("write")

    await context.workspaces.create(
      admin,
      { ...workspace, name: "Private", slug: "private" },
      2,
    )
    expect(
      (await context.workspaces.list(lara)).map(({ slug }) => slug),
    ).toEqual(["household"])
  })

  test("enforces inherited read, write, and manage access", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.workspaces.setAccess(admin, workspace.slug, 3, "write")
    const manager = await context.actor("lara")
    const writer = await context.actor("zebra")

    await expect(
      context.workspaces.update(manager, workspace.slug, {
        ...workspace,
        name: "Renamed",
      }),
    ).rejects.toMatchObject({ code: "forbidden" })
    await context.workspaces.setAccess(manager, workspace.slug, 3, "read")
    await expect(
      context.boards.create(writer, workspace.slug, board),
    ).rejects.toMatchObject({ code: "forbidden" })
    await context.workspaces.setAccess(manager, workspace.slug, 3, "write")
    const created = await context.boards.create(writer, workspace.slug, board)
    const task = await context.boards.createTask(
      writer,
      workspace.slug,
      board.slug,
      {
        title: "Sweep",
      },
    )
    expect(created.creator.slug).toBe("zebra")
    expect(task.creator.slug).toBe("zebra")
    expect(
      (await context.boards.get(manager, workspace.slug, board.slug)).tasks,
    ).toHaveLength(1)
  })

  test("creator provenance never grants authority", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    const formerAdmin = await context.actor("dan", [])

    await expect(
      context.boards.update(formerAdmin, workspace.slug, board.slug, {
        ...board,
        name: "Mine",
      }),
    ).rejects.toMatchObject({ code: "not-found" })
    await expect(
      context.workspaces.update(formerAdmin, workspace.slug, {
        ...workspace,
        name: "Mine",
      }),
    ).rejects.toMatchObject({ code: "forbidden" })
  })

  test("Palace Administrators own lifecycle and override workspace grants", async () => {
    await context.workspaces.create(admin, workspace, 1)
    const listed = await context.workspaces.list(admin)
    expect(listed[0]?.access).toBe("manage")
    expect(listed[0]?.palace_admin).toBe(true)

    const manager = await context.actor("lara")
    await expect(
      context.workspaces.delete(manager, workspace.slug),
    ).rejects.toMatchObject({ code: "forbidden" })
  })

  test("protects last Manager and supports empty Workspace deletion", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await expect(
      context.workspaces.removeAccess(admin, workspace.slug, 1),
    ).rejects.toMatchObject({ code: "conflict" })

    await context.workspaces.setAccess(admin, workspace.slug, 2, "manage")
    await context.workspaces.removeAccess(admin, workspace.slug, 1)
    await context.boards.create(admin, workspace.slug, board)
    await expect(
      context.workspaces.delete(admin, workspace.slug),
    ).rejects.toMatchObject({ code: "not-empty" })
    await context.boards.delete(admin, workspace.slug, board.slug)
    await context.workspaces.delete(admin, workspace.slug)
    expect(await context.workspaces.list(admin)).toEqual([])
  })

  test("scopes Board slugs to each Workspace and leaves no slug redirects", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.workspaces.create(
      admin,
      { ...workspace, name: "Family", slug: "family" },
      1,
    )
    await context.boards.create(admin, workspace.slug, board)
    await context.boards.create(admin, "family", board)
    await expect(
      context.boards.create(admin, workspace.slug, board),
    ).rejects.toMatchObject({ code: "conflict" })

    await context.boards.update(admin, workspace.slug, board.slug, {
      ...board,
      slug: "house-work",
    })
    await expect(
      context.boards.get(admin, workspace.slug, board.slug),
    ).rejects.toMatchObject({ code: "not-found" })
    expect(
      (await context.boards.get(admin, workspace.slug, "house-work")).board
        .name,
    ).toBe(board.name)
  })

  test("deletes one Board and its descendants without changing another", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    await context.boards.create(admin, workspace.slug, {
      ...board,
      name: "Shopping",
      slug: "shopping",
    })
    const phase = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Doing",
        color: "blue",
        icon: "check",
      },
    )
    await context.boards.createTask(admin, workspace.slug, board.slug, {
      title: "Sweep",
      phase: phase.id,
    })
    await context.boards.createTask(admin, workspace.slug, "shopping", {
      title: "Milk",
    })

    await context.boards.delete(admin, workspace.slug, board.slug)
    const other = await context.boards.get(admin, workspace.slug, "shopping")
    expect(other.tasks.map(({ title }) => title)).toEqual(["Milk"])
  })

  test("supports Phase lifecycle and preserves Tasks when deleting a Phase", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    const first = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "First",
        color: "red",
        icon: "star",
      },
    )
    const second = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Second",
        color: "green",
        icon: "check",
      },
    )
    await context.boards.updatePhase(
      admin,
      workspace.slug,
      board.slug,
      first.id,
      {
        title: "Ready",
        color: "orange",
        icon: "calendar",
      },
    )
    const moved = await context.boards.movePhase(
      admin,
      workspace.slug,
      board.slug,
      second.id,
      { before: first.id },
    )
    expect(moved.map(({ title, position }) => [title, position])).toEqual([
      ["Second", 0],
      ["Ready", 1],
    ])

    const active = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Active",
        phase: first.id,
      },
    )
    const complete = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Complete",
        phase: first.id,
      },
    )
    await context.boards.updateTask(
      admin,
      workspace.slug,
      board.slug,
      complete.id,
      {
        complete: true,
      },
    )
    await context.boards.deletePhase(
      admin,
      workspace.slug,
      board.slug,
      first.id,
    )
    const aggregate = await context.boards.get(
      admin,
      workspace.slug,
      board.slug,
    )
    expect(aggregate.phases.map(({ position }) => position)).toEqual([0])
    expect(aggregate.tasks.find(({ id }) => id === active.id)?.phase).toBeNull()
    expect(aggregate.tasks.find(({ id }) => id === complete.id)).toMatchObject({
      phase: null,
      complete: true,
    })
  })

  test("validates Phase ownership but allows unrestricted transitions", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    await context.boards.create(admin, workspace.slug, {
      ...board,
      name: "Other",
      slug: "other",
    })
    const first = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "First",
        color: "red",
        icon: "star",
      },
    )
    const last = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Last",
        color: "green",
        icon: "check",
      },
    )
    const foreign = await context.boards.createPhase(
      admin,
      workspace.slug,
      "other",
      {
        title: "Foreign",
        color: "blue",
        icon: "house",
      },
    )
    const task = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Move",
        phase: first.id,
      },
    )
    await context.boards.moveTask(
      admin,
      workspace.slug,
      board.slug,
      task.id,
      { type: "phase", phase: last.id },
      {},
    )
    expect(
      await context.boards.getTask(admin, workspace.slug, board.slug, task.id),
    ).toMatchObject({ phase: last.id, complete: false })
    await expect(
      context.boards.moveTask(
        admin,
        workspace.slug,
        board.slug,
        task.id,
        { type: "phase", phase: foreign.id },
        {},
      ),
    ).rejects.toMatchObject({ code: "not-found" })
  })

  test("maintains canonical order with filtered anchors and stale positions", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    const phase = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Doing",
        color: "blue",
        icon: "check",
      },
    )
    const one = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "One",
        phase: phase.id,
      },
    )
    const hidden = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Hidden",
      },
    )
    const two = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Two",
        phase: phase.id,
      },
    )
    const three = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Three",
        phase: phase.id,
      },
    )

    await context.boards.moveTask(
      admin,
      workspace.slug,
      board.slug,
      three.id,
      { type: "board" },
      { after: one.id, before: two.id },
    )
    let tasks = (await context.boards.get(admin, workspace.slug, board.slug))
      .tasks
    expect(tasks.map(({ title }) => title)).toEqual([
      "One",
      "Hidden",
      "Three",
      "Two",
    ])

    await context.db.boardTask
      .update({ position: 99 })
      .where("id", "=", one.id)
      .execute()
    await context.boards.moveTask(
      admin,
      workspace.slug,
      board.slug,
      two.id,
      { type: "phase", phase: phase.id },
      { before: three.id },
    )
    tasks = (await context.boards.get(admin, workspace.slug, board.slug)).tasks
    expect(tasks.map(({ position }) => position)).toEqual([0, 1, 2, 3])
    expect(
      tasks
        .filter(({ phase: id }) => id === phase.id)
        .map(({ title }) => title),
    ).toEqual(["Two", "Three", "One"])
    expect(tasks.find(({ id }) => id === hidden.id)?.title).toBe("Hidden")
  })

  test("completes and reopens Tasks into retained Phases", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    const phase = await context.boards.createPhase(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Doing",
        color: "blue",
        icon: "check",
      },
    )
    const task = await context.boards.createTask(
      admin,
      workspace.slug,
      board.slug,
      {
        title: "Sweep",
        details: "**carefully**",
        phase: phase.id,
      },
    )
    const before = (
      await context.boards.get(admin, workspace.slug, board.slug)
    ).tasks.map(({ id }) => id)
    await context.boards.moveTask(
      admin,
      workspace.slug,
      board.slug,
      task.id,
      { type: "complete" },
      {},
    )
    expect(
      await context.boards.getTask(admin, workspace.slug, board.slug, task.id),
    ).toMatchObject({
      complete: true,
      phase: phase.id,
      details: "**carefully**",
    })
    expect(
      (await context.boards.get(admin, workspace.slug, board.slug)).tasks.map(
        ({ id }) => id,
      ),
    ).toEqual(before)
    await context.boards.updateTask(
      admin,
      workspace.slug,
      board.slug,
      task.id,
      {
        complete: false,
      },
    )
    expect(
      await context.boards.getTask(admin, workspace.slug, board.slug, task.id),
    ).toMatchObject({ complete: false, phase: phase.id })
  })

  test("returns empty Board aggregates and scopes Task identity", async () => {
    await context.workspaces.create(admin, workspace, 1)
    await context.boards.create(admin, workspace.slug, board)
    await context.boards.create(admin, workspace.slug, {
      ...board,
      name: "Other",
      slug: "other",
    })
    const empty = await context.boards.get(admin, workspace.slug, board.slug)
    expect(empty.phases).toEqual([])
    expect(empty.tasks).toEqual([])
    const task = await context.boards.createTask(
      admin,
      workspace.slug,
      "other",
      {
        title: "Private to Board",
      },
    )
    await expect(
      context.boards.getTask(admin, workspace.slug, board.slug, task.id),
    ).rejects.toMatchObject({ code: "not-found" })
  })
})
