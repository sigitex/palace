import { boardsView } from "../../app/state/boardsView"
import { describe, expect, test } from "bun:test"

describe("boardsView", () => {
  test("resets board-scoped state only when board identity changes", () => {
    boardsView.setBoard(101, 11)
    boardsView.setMode("phases")
    boardsView.selectTask(12)
    boardsView.openTaskComposer(3)
    boardsView.setPhaseComposerVisible(true)
    boardsView.toggleCompleteLane()
    boardsView.setActivePhaseEditor(3)

    boardsView.setBoard(101, 99)
    expect(boardsView.selectedTask).toBe(12)
    expect(boardsView.mode).toBe("phases")
    expect(boardsView.taskComposerVisible).toBe(true)

    boardsView.setBoard(102, 21)
    expect(boardsView.selectedTask).toBe(21)
    expect(boardsView.mode).toBe("list")
    expect(boardsView.listSearch).toBe("")
    expect(boardsView.listProjection).toBe("all")
    expect(boardsView.taskComposerVisible).toBe(false)
    expect(boardsView.phaseComposerVisible).toBe(false)
    expect(boardsView.incompleteLaneVisible).toBe(true)
    expect(boardsView.completeLaneVisible).toBe(false)
    expect(boardsView.activePhaseEditor).toBeNull()
  })

  test("mode entry restores panel defaults without changing selection", () => {
    boardsView.setBoard(201, 31)
    boardsView.setListSearch("milk")
    boardsView.setListProjection("complete")
    boardsView.openTaskComposer()

    boardsView.setMode("phases")
    expect(boardsView.selectedTask).toBe(31)
    expect(boardsView.listSearch).toBe("")
    expect(boardsView.listProjection).toBe("all")
    expect(boardsView.taskComposerVisible).toBe(false)

    boardsView.openTaskComposer()
    boardsView.setPhaseComposerVisible(true)
    boardsView.toggleIncompleteLane()
    boardsView.toggleCompleteLane()
    boardsView.setActivePhaseEditor(7)
    boardsView.setMode("list")

    expect(boardsView.taskComposerVisible).toBe(false)
    expect(boardsView.phaseComposerVisible).toBe(false)
    expect(boardsView.incompleteLaneVisible).toBe(true)
    expect(boardsView.completeLaneVisible).toBe(false)
    expect(boardsView.activePhaseEditor).toBeNull()
  })
})
