export type DomainErrorCode =
  | "conflict"
  | "forbidden"
  | "invalid"
  | "not-empty"
  | "not-found"

export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = "DomainError"
  }
}
