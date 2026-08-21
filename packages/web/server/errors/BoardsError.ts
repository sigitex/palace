export type BoardsErrorCode =
  | "conflict"
  | "forbidden"
  | "invalid"
  | "not-empty"
  | "not-found"

export class BoardsError extends Error {
  constructor(
    readonly code: BoardsErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "BoardsError"
  }
}
