import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
} from "react"

const ACTIVATION_DISTANCE = 5

export function usePointerDrag<Source, Target>({
  resolveTarget,
  onDrop,
  sourceClassName,
  autoScroll: userConfig,
}: usePointerDrag.Options<Source, Target>) {
  const scrollConfig = {
    axis: "both",
    zoneSize: 48,
    speed: 1,
    ...userConfig,
  } as Required<usePointerDrag.AutoScrollConfig>
  const options = useRef({
    resolveTarget,
    onDrop,
    sourceClassName,
    scrollConfig,
  })
  const session = useRef<DragSession<Source, Target> | null>(null)
  options.current = { resolveTarget, onDrop, sourceClassName, scrollConfig }

  useEffect(
    () => () => {
      if (session.current) cleanup(session.current)
    },
    [],
  )

  const handle = useCallback(
    (source: Source): usePointerDrag.Handle => ({
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (event.button !== 0) return
        if (session.current) cleanup(session.current)

        event.currentTarget.setPointerCapture(event.pointerId)
        session.current = {
          pointer: event.pointerId,
          handle: event.currentTarget,
          source,
          startX: event.clientX,
          startY: event.clientY,
          active: false,
          sourceElement: null,
          sourceClassName: null,
          target: null,
          latestPoint: null,
          lastPoint: null,
          ghost: null,
          scrollContainer: null,
          indicators: [],
          frame: null,
          scrollFrame: null,
        }
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const current = session.current
        if (!current || current.pointer !== event.pointerId) return
        if (
          !current.active &&
          Math.hypot(
            event.clientX - current.startX,
            event.clientY - current.startY,
          ) < ACTIVATION_DISTANCE
        ) {
          return
        }

        event.preventDefault()
        if (!current.active) activate(current)
        current.latestPoint = { x: event.clientX, y: event.clientY }
        schedule(current)
      },
      onPointerUp(event: ReactPointerEvent<HTMLElement>) {
        finish(event)
      },
      onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
        cancel(event.pointerId)
      },
      onLostPointerCapture(event: ReactPointerEvent<HTMLElement>) {
        cancel(event.pointerId)
      },
    }),
    [],
  )

  function activate(current: DragSession<Source, Target>) {
    current.active = true
    current.sourceElement =
      current.handle.closest<HTMLElement>("[data-drag-source]")
    current.sourceClassName = options.current.sourceClassName ?? null
    current.scrollContainer =
      current.handle.closest<HTMLElement>("[data-drag-scroll]")
    current.ghost = createGhost(current.handle, current.sourceElement)
    if (current.sourceElement && current.sourceClassName) {
      current.sourceElement.classList.add(current.sourceClassName)
    }
  }

  function schedule(current: DragSession<Source, Target>) {
    if (current.frame !== null) return
    current.frame = requestAnimationFrame(() => {
      current.frame = null
      if (session.current === current) processLatest(current)
    })
  }

  function processLatest(current: DragSession<Source, Target>) {
    const point = current.latestPoint
    if (!point) return
    current.latestPoint = null
    current.lastPoint = point

    positionGhost(current.ghost, point)
    autoScroll(current.scrollContainer, point, options.current.scrollConfig)
    const resolution = options.current.resolveTarget(
      document.elementFromPoint(point.x, point.y),
      current.source,
      point,
    )
    current.target = resolution?.value ?? null
    applyIndicators(current, resolution?.indicators ?? [])

    const scrollConfig = options.current.scrollConfig
    if (autoScroll(current.scrollContainer, point, scrollConfig)) {
      if (current.scrollFrame === null) {
        current.scrollFrame = requestAnimationFrame(() => scrollLoop(current))
      }
    } else {
      stopScrollLoop(current)
    }
  }

  function scrollLoop(current: DragSession<Source, Target>) {
    if (current.scrollFrame === null) return
    current.scrollFrame = null
    const point = current.latestPoint ?? current.lastPoint
    if (!point || !current.scrollContainer) return
    if (
      autoScroll(current.scrollContainer, point, options.current.scrollConfig)
    ) {
      current.scrollFrame = requestAnimationFrame(() => scrollLoop(current))
    }
  }

  function stopScrollLoop(current: DragSession<Source, Target>) {
    if (current.scrollFrame !== null) {
      cancelAnimationFrame(current.scrollFrame)
      current.scrollFrame = null
    }
  }

  function finish(event: ReactPointerEvent<HTMLElement>) {
    const current = session.current
    if (!current || current.pointer !== event.pointerId) return
    if (current.active) {
      current.latestPoint = { x: event.clientX, y: event.clientY }
      flush(current)
    }
    const target = current.target
    const source = current.source
    const active = current.active
    cleanup(current)
    if (active && target) {
      const result = options.current.onDrop(source, target)
      if (result) result.catch(() => undefined)
    }
  }

  function flush(current: DragSession<Source, Target>) {
    if (current.frame !== null) {
      cancelAnimationFrame(current.frame)
      current.frame = null
    }
    processLatest(current)
  }

  function cancel(pointer: number) {
    const current = session.current
    if (current?.pointer === pointer) cleanup(current)
  }

  function cleanup(current: DragSession<Source, Target>) {
    if (current.frame !== null) cancelAnimationFrame(current.frame)
    stopScrollLoop(current)
    current.ghost?.remove()
    if (current.sourceElement && current.sourceClassName) {
      current.sourceElement.classList.remove(current.sourceClassName)
    }
    for (const indicator of current.indicators) {
      indicator.element.classList.remove(indicator.className)
    }
    if (current.handle.hasPointerCapture(current.pointer)) {
      current.handle.releasePointerCapture(current.pointer)
    }
    if (session.current === current) session.current = null
  }

  function applyIndicators(
    current: DragSession<Source, Target>,
    next: readonly usePointerDrag.Indicator[],
  ) {
    for (const indicator of current.indicators) {
      if (!next.some((candidate) => sameIndicator(candidate, indicator))) {
        indicator.element.classList.remove(indicator.className)
      }
    }
    for (const indicator of next) {
      if (
        !current.indicators.some((candidate) =>
          sameIndicator(candidate, indicator),
        )
      ) {
        indicator.element.classList.add(indicator.className)
      }
    }
    current.indicators = next
  }

  return { handle }
}

export namespace usePointerDrag {
  export type Point = { x: number; y: number }

  export type Indicator = {
    element: Element
    className: string
  }

  export type Target<Value> = {
    value: Value
    indicators?: readonly Indicator[]
  }

  export type Options<Source, TargetValue> = {
    resolveTarget: (
      element: Element | null,
      source: Source,
      point: Point,
    ) => Target<TargetValue> | null
    onDrop: (
      source: Source,
      target: TargetValue,
    ) => undefined | Promise<unknown>
    sourceClassName?: string
    autoScroll?: AutoScrollConfig
  }

  export type AutoScrollConfig = {
    axis?: "x" | "y" | "both"
    zoneSize?: number
    speed?: number
  }

  export type Handle = {
    onPointerDown: PointerEventHandler<HTMLElement>
    onPointerMove: PointerEventHandler<HTMLElement>
    onPointerUp: PointerEventHandler<HTMLElement>
    onPointerCancel: PointerEventHandler<HTMLElement>
    onLostPointerCapture: PointerEventHandler<HTMLElement>
  }
}

type DragSession<Source, Target> = {
  pointer: number
  handle: HTMLElement
  source: Source
  startX: number
  startY: number
  active: boolean
  sourceElement: HTMLElement | null
  sourceClassName: string | null
  target: Target | null
  latestPoint: usePointerDrag.Point | null
  lastPoint: usePointerDrag.Point | null
  ghost: HTMLElement | null
  scrollContainer: HTMLElement | null
  indicators: readonly usePointerDrag.Indicator[]
  frame: number | null
  scrollFrame: number | null
}

function createGhost(handle: HTMLElement, source: HTMLElement | null) {
  if (!source) return null

  const ghost = document.createElement("div")
  const bounds = source.getBoundingClientRect()
  ghost.textContent = dragLabel(handle, source)
  Object.assign(ghost.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${Math.min(Math.max(bounds.width, 180), 320)}px`,
    maxWidth: "calc(100vw - 2rem)",
    padding: "0.65rem 0.8rem",
    border: "1px solid var(--mantine-color-default-border)",
    borderRadius: "var(--mantine-radius-sm)",
    background: "var(--mantine-color-body)",
    color: "var(--mantine-color-text)",
    fontSize: "var(--mantine-font-size-sm)",
    fontWeight: "600",
    lineHeight: "1.35",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    opacity: "0.92",
    pointerEvents: "none",
    zIndex: "10000",
    boxShadow: "var(--mantine-shadow-lg)",
  })
  ghost.setAttribute("aria-hidden", "true")
  document.body.append(ghost)
  return ghost
}

function dragLabel(handle: HTMLElement, source: HTMLElement) {
  if (source.dataset.dragLabel) return source.dataset.dragLabel
  if (handle.dataset.dragLabel) return handle.dataset.dragLabel
  if (source.dataset.taskId) return `Task ${source.dataset.taskId}`
  if (source.dataset.phaseId) return `Phase ${source.dataset.phaseId}`
  return "Moving item"
}

function positionGhost(ghost: HTMLElement | null, point: usePointerDrag.Point) {
  if (ghost) {
    ghost.style.transform = `translate3d(${point.x + 12}px, ${point.y + 12}px, 0)`
  }
}

function autoScroll(
  container: HTMLElement | null,
  point: usePointerDrag.Point,
  config: Required<usePointerDrag.AutoScrollConfig>,
): boolean {
  const scrollX = config.axis === "x" || config.axis === "both"
  const scrollY = config.axis === "y" || config.axis === "both"
  if (container) {
    const bounds = container.getBoundingClientRect()
    if (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    ) {
      const left = scrollX
        ? edgeSpeed(
            point.x,
            bounds.left,
            bounds.right,
            config.zoneSize,
            config.speed,
          )
        : 0
      const top = scrollY
        ? edgeSpeed(
            point.y,
            bounds.top,
            bounds.bottom,
            config.zoneSize,
            config.speed,
          )
        : 0
      if (left !== 0 || top !== 0) {
        const beforeLeft = container.scrollLeft
        const beforeTop = container.scrollTop
        container.scrollBy({ left, top, behavior: "auto" })
        return (
          container.scrollLeft !== beforeLeft ||
          container.scrollTop !== beforeTop
        )
      }
      return false
    }
  }

  if (scrollY) {
    const top = edgeSpeed(
      point.y,
      0,
      globalThis.innerHeight,
      config.zoneSize,
      config.speed,
    )
    if (top !== 0) {
      const beforeTop = globalThis.scrollY
      globalThis.scrollBy({ top, behavior: "auto" })
      return globalThis.scrollY !== beforeTop
    }
  }
  return false
}

function edgeSpeed(
  value: number,
  start: number,
  end: number,
  zone: number,
  speed: number,
) {
  if (value < start + zone) {
    return -Math.ceil((start + zone - value) / 4) * speed
  }
  if (value > end - zone) {
    return Math.ceil((value - (end - zone)) / 4) * speed
  }
  return 0
}

function sameIndicator(
  left: usePointerDrag.Indicator,
  right: usePointerDrag.Indicator,
) {
  return left.element === right.element && left.className === right.className
}
