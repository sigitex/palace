import type { operations } from "$/api/operations"
import { routes } from "shared/routes";

type Calls<Operations> = {
  [Name in keyof Operations]: Operations[Name] extends {
    input: { infer: infer Input }
    output: { infer: infer Output }
  }
    ? (
        ...args: Input extends undefined ? [] : [input: Input]
      ) => Promise<Output>
    : Calls<Operations[Name]>
}

export const call = createProxy([]) as Calls<typeof operations>

function createProxy(ancestors: string[]): unknown {
  return new Proxy(() => {}, {
    get(_target, name) {
      if (typeof name !== "string") {
        return
      }
      return createProxy([...ancestors, name])
    },
    async apply(_target, _this, args) {
      const response = await fetch([routes.api, ...ancestors].join("/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args[0] ?? null),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : response.statusText
        throw new Error(message)
      }
      return result
    },
  })
}
