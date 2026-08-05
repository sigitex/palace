export namespace BoardsPath {
  export const index = "/boards"

  export function workspace(workspaceSlug: string) {
    return `${index}/${encodeURIComponent(workspaceSlug)}`
  }

  export function board(workspaceSlug: string, boardSlug: string) {
    return `${workspace(workspaceSlug)}/${encodeURIComponent(boardSlug)}`
  }

  export function task(
    workspaceSlug: string,
    boardSlug: string,
    taskID: number,
  ) {
    return `${board(workspaceSlug, boardSlug)}/${taskID}`
  }
}
