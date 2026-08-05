import { expect, test, type Page } from "@playwright/test"

test.describe.serial("Boards", () => {
  test("routes, filters, modes, drawers, selectors, and guarded deletion", async ({
    page,
  }) => {
    const seed = await setup(page)
    await page.goto("/boards")
    await expect(
      page.getByRole("heading", { name: "Workspaces" }),
    ).toBeVisible()
    await page.getByText(seed.workspace.name, { exact: true }).click()
    await expect(page).toHaveURL(`/boards/${seed.workspace.slug}`)
    const workspaceButton = page.getByRole("button", {
      name: seed.workspace.name,
      exact: true,
    })
    const boardButton = page.getByRole("button", {
      name: seed.board.name,
      exact: true,
    })
    expect(
      await boardButton.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe("rgba(0, 0, 0, 0)")
    await workspaceButton.focus()
    await page.keyboard.press("ArrowRight")
    await expect(boardButton).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(workspaceButton).toBeFocused()
    await boardButton.dblclick()
    await expect(page).toHaveURL(
      `/boards/${seed.workspace.slug}/${seed.board.slug}`,
    )
    await expect(
      page.getByRole("heading", { name: seed.board.name }),
    ).toBeVisible()
    await expect(page.getByText("Created by", { exact: false })).toHaveCount(0)
    await expect(
      page.getByText("Do this **carefully**.", { exact: true }),
    ).toHaveCount(0)
    await expect(page.getByRole("tab", { name: "List" })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await expect(page.getByRole("button", { name: "All" })).toBeVisible()
    await page.getByLabel("Search tasks").fill("carefully")
    await expect(page.getByText("Wash dishes", { exact: true })).toBeHidden()
    await expect(page.getByText("No tasks match this view.")).toBeVisible()
    await page.getByLabel("Search tasks").fill("wash")
    await page.getByRole("button", { name: "Doing" }).click()
    await expect(page.getByText("Wash dishes", { exact: true })).toBeVisible()
    await expect(page.getByText("Buy milk", { exact: true })).toBeHidden()

    await page.getByLabel("Search tasks").clear()
    await page.getByRole("button", { name: "All" }).click()
    await page.getByRole("tab", { name: "Phases" }).click()
    await expect(
      page.getByText("Do this **carefully**.", { exact: true }),
    ).toHaveCount(0)
    const phaseScroller = page.getByLabel("Phase lanes")
    const initialScrollerHeight = await phaseScroller.evaluate(
      (element) => element.clientHeight,
    )
    await expect(page.getByLabel("Complete lane", { exact: true })).toHaveCount(
      0,
    )
    await page.getByRole("button", { name: "Show Complete" }).click()
    await expect(
      page.getByLabel("Complete lane", { exact: true }),
    ).toBeVisible()
    expect(
      await phaseScroller.evaluate((element) => element.clientHeight),
    ).toBe(initialScrollerHeight)

    await page.getByText("Wash dishes", { exact: true }).dblclick()
    await expect(page).toHaveURL(
      `/boards/${seed.workspace.slug}/${seed.board.slug}/${seed.tasks.wash.id}`,
    )
    await expect(page.getByRole("dialog")).toContainText(
      `Task #${seed.tasks.wash.id} / Dan`,
    )
    await expect(page.getByText("carefully", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Edit details" }).click()
    await page.getByLabel("Task details").fill("Changed notes")
    await expect(page.getByText("Unsaved changes")).toBeVisible()
    await page.getByRole("button", { name: "Discard" }).click()
    await expect(page.getByText("carefully", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Edit details" }).click()
    await page.getByLabel("Task details").fill("Updated **notes**")
    await page.getByRole("button", { name: "Save task" }).click()
    await expect(page.getByText("notes", { exact: true })).toBeVisible()
    await expect(page.getByText("Unsaved changes")).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(page).toHaveURL(
      `/boards/${seed.workspace.slug}/${seed.board.slug}`,
    )

    await page.getByRole("button", { name: "Board settings" }).click()
    await expect(page.getByRole("dialog")).toContainText("Board settings")
    await expect(page.getByRole("dialog")).not.toContainText("Identity")
    await expect(page.getByRole("dialog")).not.toContainText("Phases")
    await expect(page.getByLabel("Color").first()).toBeVisible()
    await expect(page.getByLabel("Icon").first()).toBeVisible()
    await page.getByRole("button", { name: /Change .* icon/ }).click()
    await page.getByLabel("Search icons").fill("airplane")
    await page.getByRole("button", { name: "airplane", exact: true }).click()
    await page.keyboard.press("Escape")

    await page.getByRole("tab", { name: "List" }).click()
    await page.getByRole("button", { name: "Delete Wash dishes" }).click()
    await expect(
      page.getByText("Permanently delete task “Wash dishes”?"),
    ).toBeVisible()
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByText("Wash dishes", { exact: true })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/boards/${seed.workspace.slug}`)
    await expect(page.getByRole("button", { name: "Workspaces" })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.goto(`/boards/${seed.workspace.slug}/${seed.board.slug}`)
    await expect(page.getByRole("tab", { name: "List" })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  })

  test("inline editing, keyboard movement, drag, Complete, and rollback", async ({
    page,
  }) => {
    const seed = await setup(page)
    await page.goto(`/boards/${seed.workspace.slug}/${seed.board.slug}`)
    const wash = page.getByText("Wash dishes", { exact: true })
    await wash.click()
    await page.keyboard.press("n")
    const draft = page.getByLabel("Task title")
    await draft.fill("Wipe counters")
    await draft.press("Enter")
    await expect(page.getByText("Wipe counters", { exact: true })).toBeVisible()
    const beforeCheckbox = await taskOrder(page)
    await page.getByRole("checkbox", { name: "Complete Wipe counters" }).click()
    await expect(
      page.getByRole("checkbox", { name: "Reopen Wipe counters" }),
    ).toBeVisible()
    await expect.poll(() => taskOrder(page)).toEqual(beforeCheckbox)
    await page.getByRole("checkbox", { name: "Reopen Wipe counters" }).click()
    await expect(
      page.getByRole("checkbox", { name: "Complete Wipe counters" }),
    ).toBeVisible()
    await expect.poll(() => taskOrder(page)).toEqual(beforeCheckbox)

    await wash.click()
    await page.keyboard.press("F2")
    const rename = page.locator('input[value="Wash dishes"]')
    await rename.fill("Wash plates n")
    await rename.press("Enter")
    await expect(page.getByText("Wash plates n", { exact: true })).toBeVisible()
    await expect(page.getByLabel("Task title")).toHaveCount(0)

    const before = await taskOrder(page)
    let aggregateFetches = 0
    await page.route("**/api/boards/board/get", async (route) => {
      aggregateFetches += 1
      await route.continue()
    })
    await page.getByText("Wash plates n", { exact: true }).click()
    const successfulMove = page.waitForResponse("**/api/boards/task/move")
    await page.keyboard.press("Control+ArrowDown")
    const successfulMoveResponse = await successfulMove
    await successfulMoveResponse.finished()
    await page.evaluate(
      () =>
        new Promise((resolve) => requestAnimationFrame(() => resolve(null))),
    )
    expect(aggregateFetches).toBe(0)
    const afterKeyboard = await taskOrder(page)
    expect(afterKeyboard).not.toEqual(before)

    const beforePointer = await taskOrder(page)
    const rows = page.getByRole("option")
    if ((await rows.count()) >= 2) {
      await pointerDrag(
        page,
        rows.nth(0).getByRole("button", { name: /Drag/ }),
        rows.nth(1),
      )
      await expect.poll(() => taskOrder(page)).not.toEqual(beforePointer)
    }

    const beforeComplete = await taskOrder(page)
    await page
      .getByRole("button", { name: "Change state for Wash plates n" })
      .click()
    await page.getByRole("menuitem", { name: "Complete", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "Change state for Wash plates n" }),
    ).toContainText("Complete")
    await expect.poll(() => taskOrder(page)).toEqual(beforeComplete)
    await page.getByRole("tab", { name: "Phases" }).click()
    await page.getByRole("button", { name: "Show Complete" }).click()
    await expect(
      page.getByLabel("Complete lane", { exact: true }),
    ).toContainText("Wash plates n")
    await page.getByText("Buy milk", { exact: true }).click()
    await page.keyboard.press("ArrowRight")
    await expect(
      page.getByRole("option", { name: /Wash plates n/ }),
    ).toBeFocused()
    const leftTarget = page
      .getByLabel("Incomplete lane", { exact: true })
      .getByRole("option")
      .first()
    await page.keyboard.press("ArrowLeft")
    await expect(leftTarget).toBeFocused()

    await page.getByRole("tab", { name: "List" }).click()
    const authoritative = await taskOrder(page)
    aggregateFetches = 0
    await page.route(
      "**/api/boards/task/move",
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Simulated move failure" }),
        })
      },
      { times: 1 },
    )
    await page.getByRole("option").last().click()
    await page.keyboard.press("Control+ArrowUp")
    await expect(page.getByText("Task move failed")).toBeVisible()
    await expect.poll(() => aggregateFetches).toBe(1)
    await expect.poll(() => taskOrder(page)).toEqual(authoritative)

    await page.getByText("Buy milk", { exact: true }).dblclick()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("option", { name: /Buy milk/ })).toBeFocused()
  })

  test("empty Boards expose direct Task and Phase creation", async ({
    page,
  }) => {
    const seed = await setup(page)
    const empty = await api(page, "boards/board/create", {
      workspace: seed.workspace.slug,
      name: "Empty board",
      slug: `empty-${Date.now()}`,
      color: null,
      icon: null,
    })
    await page.goto(`/boards/${seed.workspace.slug}/${empty.slug}`)

    await page.getByRole("button", { name: "Add task" }).click()
    await page.getByLabel("Task title").fill("First task")
    await page.getByRole("button", { name: "Add task" }).last().click()
    await expect(page.getByText("First task", { exact: true })).toBeVisible()

    await page.getByRole("tab", { name: "Phases" }).click()
    await expect(
      page.getByLabel("Incomplete lane", { exact: true }),
    ).toContainText("First task")
    await page.getByRole("button", { name: "Add phase" }).click()
    await page.getByLabel("Phase title").fill("Review")
    await page.getByRole("button", { name: "Add phase" }).last().click()
    await expect(page.getByLabel("Review lane", { exact: true })).toBeVisible()
    const created = await api(page, "boards/board/get", {
      workspace: seed.workspace.slug,
      board: empty.slug,
    })
    expect(created.phases[0].icon).toBeNull()

    const review = page.getByLabel("Review lane", { exact: true })
    await review.getByLabel("Add task to Review").click()
    await review.getByLabel("Task title").fill("Check work")
    await review.getByRole("button", { name: "Add task", exact: true }).click()
    await expect(review).toContainText("Check work")

    await review.getByLabel("Edit Review").click()
    await review.getByLabel("Phase title").fill("Ready")
    await review.getByLabel("Red color").click()
    await review
      .getByRole("button", { name: /Choose icon|Change .* icon/ })
      .click()
    await page.getByLabel("Search icons").fill("airplane")
    await page.getByRole("button", { name: "airplane", exact: true }).click()
    await review.getByRole("button", { name: "Save phase" }).click()
    await expect(page.getByLabel("Ready lane", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Add phase" }).click()
    await page.getByLabel("Phase title").fill("Verify")
    await page
      .getByRole("button", { name: "Add phase", exact: true })
      .last()
      .click()
    const ready = page.getByLabel("Ready lane", { exact: true })
    const verify = page.getByLabel("Verify lane", { exact: true })
    await pointerDrag(
      page,
      page.getByRole("button", { name: "Drag phase Verify" }),
      ready,
    )
    await expect.poll(() => leftOf(verify, ready)).toBe(true)

    await page.getByRole("button", { name: "Drag phase Verify" }).focus()
    await page.keyboard.press("ArrowRight")
    await expect.poll(() => leftOf(ready, verify)).toBe(true)

    await page.setViewportSize({ width: 900, height: 800 })
    const scroller = page.getByLabel("Phase lanes")
    expect(
      await scroller.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true)
    const [scrollerBox, readyBox] = await Promise.all([
      scroller.boundingBox(),
      ready.boundingBox(),
    ])
    expect(
      scrollerBox && readyBox && readyBox.height >= scrollerBox.height - 20,
    ).toBe(true)
  })
})

async function setup(page: Page) {
  const login = await api(page, "session/login", {
    username: "dan",
    password: "********",
  })
  await page.addInitScript((session) => {
    localStorage.setItem("session", JSON.stringify(session))
  }, login)
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`
  const workspace = await api(page, "boards/workspace/create", {
    name: `House ${suffix}`,
    slug: `house-${suffix}`,
    color: "violet",
    icon: "house",
    manager_group: 1,
  })
  const board = await api(page, "boards/board/create", {
    workspace: workspace.slug,
    name: `Chores ${suffix}`,
    slug: `chores-${suffix}`,
    color: "blue",
    icon: "list-checks",
  })
  const phase = await api(page, "boards/phase/create", {
    workspace: workspace.slug,
    board: board.slug,
    title: "Doing",
    color: "green",
    icon: "check",
  })
  const wash = await api(page, "boards/task/create", {
    workspace: workspace.slug,
    board: board.slug,
    title: "Wash dishes",
    details: "Do this **carefully**.",
    phase: phase.id,
  })
  const milk = await api(page, "boards/task/create", {
    workspace: workspace.slug,
    board: board.slug,
    title: "Buy milk",
  })
  return { workspace, board, phase, tasks: { wash, milk } }
}

async function api(page: Page, operation: string, data: unknown) {
  const response = await page.request.post(`/api/${operation}`, { data })
  expect(response.ok(), await response.text()).toBe(true)
  return response.json()
}

async function taskOrder(page: Page) {
  return page
    .getByRole("option")
    .evaluateAll((elements) =>
      elements.map((element) => element.dataset.taskId),
    )
}

async function leftOf(
  left: ReturnType<Page["locator"]>,
  right: ReturnType<Page["locator"]>,
) {
  const [leftBox, rightBox] = await Promise.all([
    left.boundingBox(),
    right.boundingBox(),
  ])
  return Boolean(leftBox && rightBox && leftBox.x < rightBox.x)
}

async function pointerDrag(
  page: Page,
  source: ReturnType<Page["locator"]>,
  target: ReturnType<Page["locator"]>,
) {
  const [sourceBox, targetBox] = await Promise.all([
    source.boundingBox(),
    target.boundingBox(),
  ])
  if (!sourceBox || !targetBox) {
    throw new Error("Drag target is not visible")
  }
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, {
    steps: 10,
  })
  await page.mouse.up()
}
