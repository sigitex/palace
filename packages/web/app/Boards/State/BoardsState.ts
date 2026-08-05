import { proxy } from "valtio"
import { useProxy } from "valtio/utils"

export type BoardMode = "list" | "phases"

export type ListProjection =
  | "all"
  | "incomplete"
  | "complete"
  | `phase:${number}`

export type BoardsState = {
  boardID: number | null
  mode: BoardMode
  selectedTask: number | null
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
  setListSearch: (search: string) => void
  setListProjection: (projection: ListProjection) => void
  openTaskComposer: (phase?: number | null) => void
  closeTaskComposer: () => void
  setPhaseComposerVisible: (visible: boolean) => void
  toggleIncompleteLane: () => void
  toggleCompleteLane: () => void
  setActivePhaseEditor: (phaseID: number | null) => void
}

export const BoardsState = proxy<BoardsState>({
  boardID: null,
  mode: "list",
  selectedTask: null,
  listSearch: "",
  listProjection: "all",
  taskComposerVisible: false,
  taskComposerPhase: null,
  phaseComposerVisible: false,
  incompleteLaneVisible: true,
  completeLaneVisible: false,
  activePhaseEditor: null,

  setBoard(boardID, selectedTask = null) {
    if (BoardsState.boardID === boardID) return
    BoardsState.boardID = boardID
    BoardsState.mode = "list"
    BoardsState.selectedTask = selectedTask
    resetPanels()
  },

  setMode(mode) {
    if (BoardsState.mode === mode) return
    BoardsState.mode = mode
    resetPanels()
  },

  selectTask(taskID) {
    BoardsState.selectedTask = taskID
  },

  setListSearch(search) {
    BoardsState.listSearch = search
  },

  setListProjection(projection) {
    BoardsState.listProjection = projection
  },

  openTaskComposer(phase = null) {
    BoardsState.taskComposerVisible = true
    BoardsState.taskComposerPhase = phase
    if (BoardsState.mode === "phases" && phase === null) {
      BoardsState.incompleteLaneVisible = true
    }
  },

  closeTaskComposer() {
    BoardsState.taskComposerVisible = false
    BoardsState.taskComposerPhase = null
  },

  setPhaseComposerVisible(visible) {
    BoardsState.phaseComposerVisible = visible
  },

  toggleIncompleteLane() {
    BoardsState.incompleteLaneVisible = !BoardsState.incompleteLaneVisible
  },

  toggleCompleteLane() {
    BoardsState.completeLaneVisible = !BoardsState.completeLaneVisible
  },

  setActivePhaseEditor(phaseID) {
    BoardsState.activePhaseEditor = phaseID
  },
})

export function useBoardsState() {
  return useProxy(BoardsState)
}

function resetPanels() {
  BoardsState.listSearch = ""
  BoardsState.listProjection = "all"
  BoardsState.taskComposerVisible = false
  BoardsState.taskComposerPhase = null
  BoardsState.phaseComposerVisible = false
  BoardsState.incompleteLaneVisible = true
  BoardsState.completeLaneVisible = false
  BoardsState.activePhaseEditor = null
}
