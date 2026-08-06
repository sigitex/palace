import classes from "@/Boards/Presentation/PresentationSelector.module.css"
import { BoardIcon } from "@/common/BoardIcon"
import {
  ActionIcon,
  Group,
  Input,
  Pagination,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useEffect, useState } from "react"
import { Icon } from "@/common/Icon"
import { BoardIconCatalog } from "shared/models/BoardIconCatalog"
import type { BoardIcon as BoardIconKey } from "shared/models"

const PAGE_SIZE = 48

export function IconSelector({
  icon,
  onChange,
  required = false,
}: IconSelector.Props) {
  const [opened, setOpened] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const matching = BoardIconCatalog.filter((value) =>
    value.includes(search.trim().toLowerCase().replaceAll(" ", "-")),
  )
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  const visible = matching.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  useEffect(() => setPage(1), [search])

  return (
    <Input.Wrapper label="Icon">
      <Group gap="xs" mt={4}>
        <Popover
          opened={opened}
          onChange={setOpened}
          position="bottom-start"
          width={390}
          trapFocus
          withinPortal
        >
          <Popover.Target>
            <ActionIcon
              size="xl"
              variant="default"
              aria-label={
                icon ? `Change ${title(icon)} icon` : "Choose icon"
              }
              onClick={() => setOpened((value) => !value)}
            >
              {icon ? (
                <BoardIcon icon={icon} size="1.5rem" />
              ) : (
                <Icon name="plus" />
              )}
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="sm">
              <TextInput
                autoFocus
                aria-label="Search icons"
                placeholder="Search icons"
                leftSection={<Icon name="magnifying-glass" />}
                value={search}
                onChange={(event) =>
                  setSearch(event.currentTarget.value)
                }
              />
              <SimpleGrid cols={8} spacing={4}>
                {visible.map((value) => (
                  <ActionIcon
                    key={value}
                    className={
                      icon === value
                        ? classes.pickerSelected
                        : undefined
                    }
                    size="lg"
                    variant="subtle"
                    aria-label={title(value)}
                    onClick={() => {
                      onChange(value)
                      setOpened(false)
                    }}
                  >
                    <BoardIcon icon={value} />
                  </ActionIcon>
                ))}
              </SimpleGrid>
              {visible.length === 0 && (
                <Text c="dimmed" size="sm" ta="center">
                  No matching icons
                </Text>
              )}
              <Pagination
                size="sm"
                total={pages}
                value={Math.min(page, pages)}
                onChange={setPage}
                withEdges
              />
            </Stack>
          </Popover.Dropdown>
        </Popover>
        {!required && icon && (
          <ActionIcon
            variant="subtle"
            aria-label="Remove icon"
            onClick={() => onChange(null)}
          >
            <Icon name="x" />
          </ActionIcon>
        )}
      </Group>
    </Input.Wrapper>
  )
}

export namespace IconSelector {
  export type Props = {
    icon: BoardIconKey | null
    onChange: (icon: BoardIconKey | null) => void
    required?: boolean
  }
}

function title(value: string) {
  return value.replaceAll("-", " ")
}
