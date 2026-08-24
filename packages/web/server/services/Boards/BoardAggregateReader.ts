import type { DatabaseConnection } from "$/database"
import type { BoardRow } from "$/database/boards"
import type { Actor } from "$/authorization/Actor"
import { DomainError } from "$/errors/DomainError"
import { BoardPhases } from "$/services/Boards/BoardPhases"
import { BoardPresenter } from "$/services/Boards/BoardPresenter"
import { BoardTasks } from "$/services/Boards/BoardTasks"
import type { Workspaces } from "$/services/Workspaces"
import type { BoardAggregate } from "shared/models"

export class BoardAggregateReader {
  private readonly db: DatabaseConnection
  private readonly presenter: BoardPresenter
  private readonly workspaces: Workspaces

  constructor({
    db,
    workspaces,
  }: {
    db: DatabaseConnection
    workspaces: Workspaces
  }) {
    this.db = db
    this.presenter = new BoardPresenter({ db })
    this.workspaces = workspaces
  }

  async read(
    actor: Actor,
    workspaceSlug: string,
    board: BoardRow,
  ): Promise<BoardAggregate> {
    const workspace = await this.workspaces.get(actor, workspaceSlug, this.db)
    if (board.workspace !== workspace.id) {
      throw new DomainError("not-found", "Board was not found.")
    }
    const [phases, tasks] = await Promise.all([
      new BoardPhases({ db: this.db }).list(board.id),
      new BoardTasks({ db: this.db }).list(board.id),
    ])
    return {
      workspace,
      board: await this.presenter.board(board),
      phases: phases.map(BoardPresenter.phase),
      tasks: await Promise.all(tasks.map((task) => this.presenter.task(task))),
    }
  }
}
