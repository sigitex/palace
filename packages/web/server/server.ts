import "@sigitex/ssjs"
import { app, assets, cookies, prefix, route, www } from "@sigitex/route"
import { bun } from "@sigitex/route/bun"
import { container } from "$/container"
import { Filter } from "$/framework/Filter"
import { routes } from "shared/routes"
import { api } from "$/api"
import { configure } from "arktype"
import { operations } from "$/api/operations"
import { session } from "$/framework/session"

configure({ onUndeclaredKey: "delete" })

export default {
  fetch: route(
    {
      container,
      middlewares: [cookies(), session()],
    },
    bun({ assets: "assets" }),
    Filter.prod(www({ secure: true })),
    prefix(routes.api, api(operations)),
    app(routes.app),
    assets(),
  ),
}
