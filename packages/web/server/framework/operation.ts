// oxlint-disable typescript/no-explicit-any typescript/no-invalid-void-type
import {
  InvalidRequest,
  ServerError,
  type RequestContext,
  type RequestHandler,
} from "@sigitex/route"
import { type, type Type } from "arktype"

type Undefined = typeof type.undefined

export type Operations = {
  [key: string]: OperationHandler<Type, Type> | Operations
}

export function operation<
  Input extends Type | undefined,
  Output extends Type | undefined,
>(
  {
    input,
    output,
  }: {
    input?: Input
    output?: Output
  },

  execute: (
    input: Input extends Type ? Input["infer"] : any,
    context: any,
  ) => Promise<Output extends Type ? Output["infer"] : Undefined>,
): OperationHandler<
  Input extends Type ? Input : Undefined,
  Output extends Type ? Output : Undefined
> {
  const handler = async (context: RequestContext) => {
    let raw: unknown
    try {
      raw = await context.request.json()
    } catch {
      throw new InvalidRequest("Invalid JSON body.")
    }
    const valid = input ? input(raw) : raw
    if (valid instanceof type.errors) {
      throw new InvalidRequest("Invalid parameters.")
    }
    const result = await execute(valid as any, context)
    if (output) {
      const validOutput = output(result)
      if (validOutput instanceof type.errors) {
        throw new ServerError("Operation returned an invalid response.")
      }
      return validOutput
    }
    return result
  }
  handler.input = input ?? type.undefined
  handler.output = output ?? type.undefined
  return handler as any
}

export type OperationHandler<
  Input extends Type,
  Output extends Type,
> = RequestHandler & {
  input: Input
  output: Output
}
