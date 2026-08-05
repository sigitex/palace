import type { Actor } from "$/authorization/Actor"
import { BoardsError } from "$/errors/BoardsError"
import {
  InvalidRequest,
  NotFound,
  RouterError,
  Unauthorized,
} from "@sigitex/route"

export namespace BoardsOperation {
  export async function run<Result>(
    context: {
      user?: { id: number } | null
      groups?: readonly string[] | null
    },
    work: (actor: Actor) => Promise<Result>,
  ): Promise<Result> {
    if (!context.user || !context.groups) {
      throw new Unauthorized()
    }
    try {
      return await work({ user: context.user.id, groups: context.groups })
    } catch (error) {
      if (!(error instanceof BoardsError)) {
        throw error
      }
      switch (error.code) {
        case "not-found":
          throw new NotFound(error.message)
        case "invalid":
          throw new InvalidRequest(error.message)
        case "forbidden":
          throw new RouterError(403, error.message)
        case "conflict":
        case "not-empty":
          throw new RouterError(409, error.message)
      }
    }
  }
}
