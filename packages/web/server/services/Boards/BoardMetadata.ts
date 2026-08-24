import { DomainError } from "$/errors/DomainError"
import { BOARD_COLORS, BOARD_ICONS, type Board } from "shared/models"

export const BoardMetadata = {
  validate(metadata: Pick<Board, "name" | "slug" | "color" | "icon">) {
    if (!metadata.name.trim() || !metadata.slug.trim()) {
      throw new DomainError("invalid", "Board name and slug are required.")
    }
    if (metadata.color && !BOARD_COLORS.includes(metadata.color)) {
      throw new DomainError("invalid", "Unsupported Board color.")
    }
    if (metadata.icon && !BOARD_ICONS.includes(metadata.icon)) {
      throw new DomainError("invalid", "Unsupported Board icon.")
    }
  },
} as const
