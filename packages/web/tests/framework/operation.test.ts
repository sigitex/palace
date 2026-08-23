import { expect, test } from "bun:test"
import { operation } from "$/framework/operation"
import { type } from "arktype"

test("runs checks in order before execution", async () => {
  const calls: string[] = []
  const handler = operation(
    {
      checks: [
        async () => {
          await Promise.resolve()
          calls.push("first")
        },
        () => {
          calls.push("second")
        },
      ],
      input: type.null,
      output: type.string,
    },
    async () => {
      calls.push("execute")
      return "result"
    },
  )

  expect(await handler(context(null))).toBe("result")
  expect(calls).toEqual(["first", "second", "execute"])
})

test("stops when a check fails", async () => {
  const error = new Error("Check failed.")
  const calls: string[] = []
  const handler = operation(
    {
      checks: [
        () => {
          calls.push("first")
          throw error
        },
        () => {
          calls.push("second")
        },
      ],
      input: type.null,
      output: type.string,
    },
    async () => {
      calls.push("execute")
      return "result"
    },
  )

  await expect(handler(context(null))).rejects.toBe(error)
  expect(calls).toEqual(["first"])
})

function context(input: unknown) {
  return {
    request: new Request("http://palace.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  } as never
}
