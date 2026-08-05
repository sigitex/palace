import { BoardsState } from "@/Boards/State/BoardsState"
import { describe, expect, test } from "bun:test"

describe("BoardsState", () => {
  test("resets board-scoped state only when board identity changes", () => {
    BoardsState.setBoard(101, 11)
    BoardsState.setMode("phases")
    BoardsState.selectTask(12)
    BoardsState.openTaskComposer(3)
    BoardsState.setPhaseComposerVisible(true)
    BoardsState.toggleCompleteLane()
    BoardsState.setActivePhaseEditor(3)

    BoardsState.setBoard(101, 99)
    expect(BoardsState.selectedTask).toBe(12)
    expect(BoardsState.mode).toBe("phases")
    expect(BoardsState.taskComposerVisible).toBe(true)

    BoardsState.setBoard(102, 21)
    expect(BoardsState.selectedTask).toBe(21)
    expect(BoardsState.mode).toBe("list")
    expect(BoardsState.listSearch).toBe("")
    expect(BoardsState.listProjection).toBe("all")
    expect(BoardsState.taskComposerVisible).toBe(false)
    expect(BoardsState.phaseComposerVisible).toBe(false)
    expect(BoardsState.incompleteLaneVisible).toBe(true)
    expect(BoardsState.completeLaneVisible).toBe(false)
    expect(BoardsState.activePhaseEditor).toBeNull()
  })

  test("mode entry restores panel defaults without changing selection", () => {
    BoardsState.setBoard(201, 31)
    BoardsState.setListSearch("milk")
    BoardsState.setListProjection("complete")
    BoardsState.openTaskComposer()

    BoardsState.setMode("phases")
    expect(BoardsState.selectedTask).toBe(31)
    expect(BoardsState.listSearch).toBe("")
    expect(BoardsState.listProjection).toBe("all")
    expect(BoardsState.taskComposerVisible).toBe(false)

    BoardsState.openTaskComposer()
    BoardsState.setPhaseComposerVisible(true)
    BoardsState.toggleIncompleteLane()
    BoardsState.toggleCompleteLane()
    BoardsState.setActivePhaseEditor(7)
    BoardsState.setMode("list")

    expect(BoardsState.taskComposerVisible).toBe(false)
    expect(BoardsState.phaseComposerVisible).toBe(false)
    expect(BoardsState.incompleteLaneVisible).toBe(true)
    expect(BoardsState.completeLaneVisible).toBe(false)
    expect(BoardsState.activePhaseEditor).toBeNull()
  })
})
