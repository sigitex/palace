export type RouteName = PathOf<typeof routes>

export const routes = {
  app: {
    home: "/",
    family: "/family",
    boards: {
      index: "/boards",
      workspace: "/boards/:workspace",
      board: "/boards/:workspace/:board",
      task: "/boards/:workspace/:board/:task"
    },
  },
  api: "/api"
} as const
