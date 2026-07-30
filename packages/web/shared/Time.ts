export namespace Time {
  export const SECONDS = 1000
  export const MINUTES = 60 * SECONDS
  export const HOURS = 60 * MINUTES
  export const DAYS = 24 * HOURS
  export const WEEKS = 7 * DAYS

  export function thisYear() {
    return new Date(2026, 0)
  }
}
