// oxlint-disable typescript/no-explicit-any typescript/no-invalid-void-type
import {
  InvalidRequest,
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
    const raw = await context.request.json()
    const valid = input ? input(raw) : raw
    if (valid instanceof type.errors) {
      throw new InvalidRequest("Invalid parameters.")
    }
    return await execute(valid as any, context)
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
