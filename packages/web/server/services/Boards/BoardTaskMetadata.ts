import { DomainError } from "$/errors/DomainError"

export const BoardTaskMetadata = {
  validateTitle(title: string) {
    if (!title.trim()) {
      throw new DomainError("invalid", "Task title is required.")
    }
  },
} as const
