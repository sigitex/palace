export type TaskDestination =
  | { type: "board" }
  | { type: "phase"; phase: number | null }
  | { type: "complete" }
