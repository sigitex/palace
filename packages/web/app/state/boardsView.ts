import { proxy } from "valtio"
import { useProxy } from "valtio/utils"

export const boardsView = proxy({
  boardID: null as number | null,
  mode: "list" as "list" | "phases",
  selectedTask: null as number | null,
  selectedNewTask: null as string | null,
  pendingTaskIds: [] as number[],
  listSearch: "",
  listProjection: "all" as
    | "all"
    | "incomplete"
    | "complete"
    | `phase:${number}`,
  taskComposerVisible: false,
  taskComposerPhase: null as number | null,
  phaseComposerVisible: false,
  incompleteLaneVisible: true,
  completeLaneVisible: false,
  activePhaseEditor: null as number | null,

  setBoard(boardID: number | null, selectedTask: number | null = null) {
    if (boardsView.boardID === boardID) return
    boardsView.boardID = boardID
    boardsView.mode = "list"
    boardsView.selectedTask = selectedTask
    resetPanels()
  },

  setMode(mode: "list" | "phases") {
    if (boardsView.mode === mode) return
    boardsView.mode = mode
    resetPanels()
  },

  selectTask(taskID: number | null) {
    boardsView.selectedTask = taskID
    boardsView.selectedNewTask = null
  },

  selectNewTask(id: string | null) {
    boardsView.selectedNewTask = id
    boardsView.selectedTask = null
  },

  addPendingTask(taskID: number) {
    if (!boardsView.pendingTaskIds.includes(taskID)) {
      boardsView.pendingTaskIds = [...boardsView.pendingTaskIds, taskID]
    }
  },

  clearPendingTask(taskID: number) {
    boardsView.pendingTaskIds = boardsView.pendingTaskIds.filter(
      (id) => id !== taskID,
    )
  },

  setListSearch(search: string) {
    boardsView.listSearch = search
  },

  setListProjection(
    projection: "all" | "incomplete" | "complete" | `phase:${number}`,
  ) {
    boardsView.listProjection = projection
  },

  openTaskComposer(phase: number | null = null) {
    boardsView.taskComposerVisible = true
    boardsView.taskComposerPhase = phase
    if (boardsView.mode === "phases" && phase === null) {
      boardsView.incompleteLaneVisible = true
    }
  },

  closeTaskComposer() {
    boardsView.taskComposerVisible = false
    boardsView.taskComposerPhase = null
  },

  setPhaseComposerVisible(visible: boolean) {
    boardsView.phaseComposerVisible = visible
  },

  toggleIncompleteLane() {
    boardsView.incompleteLaneVisible = !boardsView.incompleteLaneVisible
  },

  toggleCompleteLane() {
    boardsView.completeLaneVisible = !boardsView.completeLaneVisible
  },

  setActivePhaseEditor(phaseID: number | null) {
    boardsView.activePhaseEditor = phaseID
  },
})

export const useBoardsView = () => useProxy(boardsView)

function resetPanels() {
  boardsView.listSearch = ""
  boardsView.listProjection = "all"
  boardsView.taskComposerVisible = false
  boardsView.taskComposerPhase = null
  boardsView.phaseComposerVisible = false
  boardsView.incompleteLaneVisible = true
  boardsView.completeLaneVisible = false
  boardsView.activePhaseEditor = null
  boardsView.selectedNewTask = null
}
