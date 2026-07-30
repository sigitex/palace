import {
  filter,
  InvalidRequest,
  type RequestContext,
  type RequestHandler,
} from "@sigitex/route"
import { type, type Type } from "arktype"

export namespace Filter {
  export const prod = filter(({ env }: { env: Env }) => env.WEB_ENV === "prod")
  export const dev = filter(({ env }: { env: Env }) => env.WEB_ENV === "dev")
  export function validate(Type: Type): RequestHandler {
    return async ({ request }: RequestContext) => {
      const input = await request.json()
      const valid = Type(input)
      if (valid instanceof type.errors) {
        throw new InvalidRequest("Invalid arguments.")
      }
      return true
    }
  }
}
