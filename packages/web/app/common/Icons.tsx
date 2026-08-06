import type { BoardIcon as IconName } from "shared/models"

export const Icons = {
  Calendar: "calendar",
  Photos: "camera",
  Admin: "gear",
  Home: "house",
  Boards: "kanban",
  Budget: "piggy-bank",
  Bots: "robot",
  Profile: "user",
  Family: "users-four",
} as const satisfies Record<string, IconName>
