import Home from "@/Home"
import Family from "@/Family"
import { routes } from "shared/routes"
import { Route, Switch } from "wouter"

export default function Routes() {
  return (
    <Switch>
      <Route path={routes.app.home} component={Home} />
      <Route path={routes.app.family} component={Family} />
    </Switch>
  )
}
