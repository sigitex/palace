// oxlint-disable typescript/no-explicit-any typescript/no-invalid-void-type
import { DomainError } from "$/errors/DomainError"
import {
  InvalidRequest,
  NotFound,
  RouterError,
  ServerError,
  type RequestContext,
  type RequestHandler,
} from "@sigitex/route"
import { type, type Type } from "arktype"

type Undefined = typeof type.undefined

export type Operations = {
  [key: string]: OperationHandler<Type, Type> | Operations
}

export type OperationCheck = (context: any) => void | Promise<void>

export type OperationParams<
  Input extends Type | undefined,
  Output extends Type | undefined,
> = {
  checks?: readonly OperationCheck[]
  input?: Input
  output?: Output
}

export function operation<
  Input extends Type | undefined,
  Output extends Type | undefined,
>(
  { checks, input, output }: OperationParams<Input, Output>,

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
    let result: Output extends Type ? Output["infer"] : Undefined
    try {
      for (const check of checks ?? []) {
        await check(context)
      }
      result = await execute(valid as any, context)
    } catch (error) {
      throw mapDomainError(error)
    }
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

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof DomainError)) {
    return error
  }
  switch (error.code) {
    case "not-found":
      return new NotFound(error.message)
    case "invalid":
      return new InvalidRequest(error.message)
    case "forbidden":
      return new RouterError(403, error.message)
    case "conflict":
    case "not-empty":
      return new RouterError(409, error.message)
  }
}
