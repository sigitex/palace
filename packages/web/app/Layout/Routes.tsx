import Home from "@/Home"
import Boards from "@/Boards"
import { routes } from "shared/routes"
import { Route, Switch } from "wouter"

export default function Routes() {
  return (
    <Switch>
      <Route path={routes.app.home} component={Home} />
      <Route path={routes.app.boards.task}>
        {(params) => (
          <Boards
            workspace={params.workspace}
            board={params.board}
            task={Number(params.task)}
          />
        )}
      </Route>
      <Route path={routes.app.boards.board}>
        {(params) => (
          <Boards workspace={params.workspace} board={params.board} />
        )}
      </Route>
      <Route path={routes.app.boards.workspace}>
        {(params) => <Boards workspace={params.workspace} />}
      </Route>
      <Route path={routes.app.boards.index}>{() => <Boards />}</Route>
    </Switch>
  )
}
