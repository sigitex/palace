export type RouteName = PathOf<typeof routes>

const boards = "/boards"

export const routes = {
  app: {
    home: "/",
    boards: {
      index: boards,
      workspace: `${boards}/:workspace`,
      board: `${boards}/:workspace/:board`,
      task: `${boards}/:workspace/:board/:task`
    },
  },
  api: "/api"
} as const

// URL builders for navigation. Derived from the same `boards` segment as the
// wouter patterns above so a route and its builder can't drift apart.
export const path = {
  boards: {
    index: boards,
    workspace: (workspace: string) =>
      `${boards}/${encodeURIComponent(workspace)}`,
    board: (workspace: string, board: string) =>
      `${path.boards.workspace(workspace)}/${encodeURIComponent(board)}`,
    task: (workspace: string, board: string, task: number) =>
      `${path.boards.board(workspace, board)}/${task}`
  }
} as const
