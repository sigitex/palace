import { call } from "@/common/call"
import { TaskMovement, type TaskMove } from "@/Boards/Task/TaskMovement"
import {
  useMutation as useReactMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query"
import { notifications } from "@mantine/notifications"
import type { BoardAggregate } from "shared/models"

export namespace BoardsQuery {
  export const keys = {
    prefix: {
      all: ["boards"] as const,
      workspace: workspaceKey,
      aggregates: (workspace: string) =>
        [...workspaceKey(workspace), "board"] as const,
    },
    exact: {
      workspaces: ["boards", "workspaces"] as const,
      boards: (workspace: string) =>
        [...workspaceKey(workspace), "boards"] as const,
      aggregate: boardKey,
      access: (workspace: string) =>
        [...workspaceKey(workspace), "access"] as const,
      groups: (workspace: string) =>
        [...workspaceKey(workspace), "groups"] as const,
    },
  }

  export function useWorkspaces() {
    return useQuery({
      queryKey: keys.exact.workspaces,
      queryFn: () => call.boards.workspace.list(null),
    })
  }

  export function useBoards(workspace?: string) {
    return useQuery({
      queryKey: keys.exact.boards(workspace ?? ""),
      queryFn: () => call.boards.board.list({ workspace: workspace! }),
      enabled: Boolean(workspace),
    })
  }

  export function useBoard(workspace?: string, board?: string) {
    return useQuery({
      queryKey: keys.exact.aggregate(workspace ?? "", board ?? ""),
      queryFn: () =>
        call.boards.board.get({ workspace: workspace!, board: board! }),
      enabled: Boolean(workspace && board),
    })
  }

  export function useAccess(workspace?: string, enabled = true) {
    return useQuery({
      queryKey: keys.exact.access(workspace ?? ""),
      queryFn: () =>
        call.boards.workspace.access.list({ workspace: workspace! }),
      enabled: Boolean(workspace && enabled),
    })
  }

  export function useGroups(workspace?: string, enabled = true) {
    return useQuery({
      queryKey: keys.exact.groups(workspace ?? ""),
      queryFn: () => call.boards.workspace.groups({ workspace: workspace! }),
      enabled: Boolean(workspace && enabled),
    })
  }

  export function useAction<Variables, Result>(
    mutationFn: (variables: Variables) => Promise<Result>,
    options: ActionOptions<Result, Variables> = {},
  ) {
    const client = useQueryClient()
    const { invalidateExact, invalidatePrefix, ...mutationOptions } = options
    return useReactMutation({
      ...mutationOptions,
      mutationFn,
      async onSuccess(data, variables, context, mutation) {
        const exact =
          typeof invalidateExact === "function"
            ? invalidateExact(data, variables)
            : (invalidateExact ?? [])
        const prefixes =
          typeof invalidatePrefix === "function"
            ? invalidatePrefix(data, variables)
            : (invalidatePrefix ?? [])
        await Promise.all(
          [
            ...exact.map((queryKey) => ({ queryKey, exact: true })),
            ...prefixes.map((queryKey) => ({ queryKey })),
          ].map((filters) => client.invalidateQueries(filters)),
        )
        await mutationOptions.onSuccess?.(data, variables, context, mutation)
      },
    })
  }

  export function useMoveTask(
    workspace: string,
    board: string,
    onError?: (error: Error) => void,
  ) {
    const client = useQueryClient()
    const queryKey = keys.exact.aggregate(workspace, board)
    return useReactMutation({
      scope: { id: `boards-task-move:${workspace}:${board}` },
      mutationFn: (move: TaskMove) => call.boards.task.move(move),
      async onMutate(move) {
        await client.cancelQueries({ queryKey, exact: true })
        const previous = client.getQueryData<BoardAggregate>(queryKey)
        if (previous) {
          client.setQueryData(queryKey, TaskMovement.apply(previous, move))
        }
        return { previous }
      },
      onSuccess(aggregate) {
        client.setQueryData(queryKey, aggregate)
      },
      async onError(error, _move, context) {
        if (context?.previous) {
          client.setQueryData(queryKey, context.previous)
        }
        notifications.show({
          color: "red",
          title: "Task move failed",
          message: error.message,
        })
        onError?.(error)
        await client.refetchQueries({ queryKey, exact: true })
      },
    })
  }
}

type ActionOptions<Result, Variables> = Omit<
  UseMutationOptions<Result, Error, Variables>,
  "mutationFn"
> & {
  invalidateExact?:
    | readonly QueryKey[]
    | ((data: Result, variables: Variables) => readonly QueryKey[])
  invalidatePrefix?:
    | readonly QueryKey[]
    | ((data: Result, variables: Variables) => readonly QueryKey[])
}

function workspaceKey(workspace: string) {
  return ["boards", "workspace", workspace] as const
}

function boardKey(workspace: string, board: string) {
  return [...workspaceKey(workspace), "board", board] as const
}
