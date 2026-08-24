import { DomainError } from "$/errors/DomainError"
import { BOARD_COLORS, BOARD_ICONS, type BoardPhase } from "shared/models"

export const BoardPhaseMetadata = {
  validate(metadata: Pick<BoardPhase, "title" | "color" | "icon">) {
    if (!metadata.title.trim()) {
      throw new DomainError("invalid", "Phase title is required.")
    }
    if (!BOARD_COLORS.includes(metadata.color)) {
      throw new DomainError("invalid", "Unsupported Phase color.")
    }
    if (metadata.icon !== null && !BOARD_ICONS.includes(metadata.icon)) {
      throw new DomainError("invalid", "Unsupported Phase icon.")
    }
  },
} as const
