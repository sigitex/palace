import { proxy } from "valtio"
import { useProxy } from "valtio/utils"

export type BoardMode = "list" | "phases"

export type ListProjection =
  | "all"
  | "incomplete"
  | "complete"
  | `phase:${number}`

export type BoardsView = {
  boardID: number | null
  mode: BoardMode
  selectedTask: number | null
  selectedNewTask: string | null
  pendingTaskIds: number[]
  listSearch: string
  listProjection: ListProjection
  taskComposerVisible: boolean
  taskComposerPhase: number | null
  phaseComposerVisible: boolean
  incompleteLaneVisible: boolean
  completeLaneVisible: boolean
  activePhaseEditor: number | null
  setBoard: (boardID: number | null, selectedTask?: number | null) => void
  setMode: (mode: BoardMode) => void
  selectTask: (taskID: number | null) => void
  selectNewTask: (id: string | null) => void
  addPendingTask: (taskID: number) => void
  clearPendingTask: (taskID: number) => void
  setListSearch: (search: string) => void
  setListProjection: (projection: ListProjection) => void
  openTaskComposer: (phase?: number | null) => void
  closeTaskComposer: () => void
  setPhaseComposerVisible: (visible: boolean) => void
  toggleIncompleteLane: () => void
  toggleCompleteLane: () => void
  setActivePhaseEditor: (phaseID: number | null) => void
}

export const boardsView = proxy<BoardsView>({
  boardID: null,
  mode: "list",
  selectedTask: null,
  selectedNewTask: null,
  pendingTaskIds: [],
  listSearch: "",
  listProjection: "all",
  taskComposerVisible: false,
  taskComposerPhase: null,
  phaseComposerVisible: false,
  incompleteLaneVisible: true,
  completeLaneVisible: false,
  activePhaseEditor: null,

  setBoard(boardID, selectedTask = null) {
    if (boardsView.boardID === boardID) return
    boardsView.boardID = boardID
    boardsView.mode = "list"
    boardsView.selectedTask = selectedTask
    resetPanels()
  },

  setMode(mode) {
    if (boardsView.mode === mode) return
    boardsView.mode = mode
    resetPanels()
  },

  selectTask(taskID) {
    boardsView.selectedTask = taskID
    boardsView.selectedNewTask = null
  },

  selectNewTask(id) {
    boardsView.selectedNewTask = id
    boardsView.selectedTask = null
  },

  addPendingTask(taskID) {
    if (!boardsView.pendingTaskIds.includes(taskID)) {
      boardsView.pendingTaskIds = [...boardsView.pendingTaskIds, taskID]
    }
  },

  clearPendingTask(taskID) {
    boardsView.pendingTaskIds = boardsView.pendingTaskIds.filter(
      (id) => id !== taskID,
    )
  },

  setListSearch(search) {
    boardsView.listSearch = search
  },

  setListProjection(projection) {
    boardsView.listProjection = projection
  },

  openTaskComposer(phase = null) {
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

  setPhaseComposerVisible(visible) {
    boardsView.phaseComposerVisible = visible
  },

  toggleIncompleteLane() {
    boardsView.incompleteLaneVisible = !boardsView.incompleteLaneVisible
  },

  toggleCompleteLane() {
    boardsView.completeLaneVisible = !boardsView.completeLaneVisible
  },

  setActivePhaseEditor(phaseID) {
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
