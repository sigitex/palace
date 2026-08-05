import { useEffect, useRef } from "react"

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const current = useRef(shortcuts)
  current.current = shortcuts

  useEffect(() => {
    function handle(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (
        event.altKey ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return
      }
      const shortcut = current.current.find(
        ({ key, enabled, control = false }) =>
          enabled &&
          control === (event.ctrlKey || event.metaKey) &&
          key.toLowerCase() === event.key.toLowerCase(),
      )
      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    }

    globalThis.addEventListener("keydown", handle)
    return () => globalThis.removeEventListener("keydown", handle)
  }, [])
}

type Shortcut = {
  key: string
  enabled: boolean
  control?: boolean
  action: () => void
}
