// oxlint-disable typescript/no-explicit-any
import type { OperationHandler, Operations } from "$/framework/operation"
import { HTTP, MethodNotAllowed, type RequestContext, type RequestHandler } from "@sigitex/route"

type Table = Map<string, OperationHandler<any, any>>

export function api(operations: Operations): RequestHandler {
  const table: Table = new Map()
  walk([], operations, table)
  return async ({ request, url, dispatch }: RequestContext) => {
    if (request.method !== HTTP.method.POST) { // CHANGE
      throw new MethodNotAllowed()
    }
    const handler = table.get(url.pathname)
    if (handler) {
      return dispatch(handler, [])
    }
  }
}

function walk(ancestors: string[], operations: Operations, table: Table) {
  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation === "function") {
      table.set("/" + [...ancestors, name].join("/"), operation)
    } else {
      walk([...ancestors, name], operation, table)
    }
  }
}
