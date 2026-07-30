import { operation } from "$/framework/operation";
import type { RequestContext } from "@sigitex/route";

export const logout = operation({}, async (_, { request }: RequestContext) => {
  console.log("logging out", request.url)
})
