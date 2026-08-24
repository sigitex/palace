import { DomainError } from "$/errors/DomainError"
import type { MoveAnchors } from "$/services/Boards/MoveAnchors"

export class OrderedRows<Row extends { id: number }> {
  private readonly rows: Row[]

  constructor(rows: Row[]) {
    this.rows = rows
  }

  move(movedID: number, anchors: MoveAnchors): Row[] {
    const moved = this.rows.find((row) => row.id === movedID)
    if (!moved) {
      throw new DomainError("not-found", "Ordered resource was not found.")
    }
    if (anchors.before === movedID || anchors.after === movedID) {
      throw new DomainError(
        "invalid",
        "A resource cannot be its own movement anchor.",
      )
    }
    const remaining = this.rows.filter((row) => row.id !== movedID)
    const before = OrderedRows.anchorIndex(remaining, anchors.before)
    const after = OrderedRows.anchorIndex(remaining, anchors.after)
    if (before !== null && after !== null && after >= before) {
      throw new DomainError(
        "conflict",
        "Movement anchors are no longer ordered.",
      )
    }
    const index = before ?? (after === null ? remaining.length : after + 1)
    remaining.splice(index, 0, moved)
    return remaining
  }

  private static anchorIndex(
    rows: { id: number }[],
    anchor: number | null | undefined,
  ) {
    if (anchor === null || anchor === undefined) {
      return null
    }
    const index = rows.findIndex((row) => row.id === anchor)
    if (index === -1) {
      throw new DomainError("conflict", "Movement anchor is stale or invalid.")
    }
    return index
  }
}
