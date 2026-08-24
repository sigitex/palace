import { DomainError } from "$/errors/DomainError"
import { BOARD_COLORS, BOARD_ICONS, type Workspace } from "shared/models"

export const WorkspaceMetadata = {
  validate(
    metadata: Pick<Workspace, "name" | "slug" | "color" | "icon">,
  ) {
    if (!metadata.name.trim() || !metadata.slug.trim()) {
      throw new DomainError("invalid", "Workspace name and slug are required.")
    }
    if (metadata.color && !BOARD_COLORS.includes(metadata.color)) {
      throw new DomainError("invalid", "Unsupported Workspace color.")
    }
    if (metadata.icon && !BOARD_ICONS.includes(metadata.icon)) {
      throw new DomainError("invalid", "Unsupported Workspace icon.")
    }
  }
} as const
