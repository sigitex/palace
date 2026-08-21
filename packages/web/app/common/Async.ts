/** A loadable slot: the data, whether a load is in flight, and the last error. */
export type Async<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

export namespace Async {
  export function create<T>(): Async<T> {
    return { data: null, loading: false, error: null }
  }

  /** Runs `fetch` into `slot`, tracking loading/error. Never throws. */
  export async function run<T>(
    slot: Async<T>,
    fetch: () => Promise<T>,
  ): Promise<T | null> {
    slot.loading = true
    slot.error = null
    try {
      const data = await fetch()
      slot.data = data
      return data
    } catch (error) {
      slot.error = error instanceof Error ? error.message : String(error)
      return null
    } finally {
      slot.loading = false
    }
  }
}
