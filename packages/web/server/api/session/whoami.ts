import { operation } from "$/framework/operation"
import { type } from "arktype"
import type { User } from "shared/models"

export const whoami = operation(
  {
    output: type.null.or("string")
  },
  async (_, { user }: { user: User }) => {
    if (!user) {
      return null
    }
    return user.slug
  },
)
