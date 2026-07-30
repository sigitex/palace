export type BrowserSession = {
  readonly key: string
  readonly name: string
  readonly groups: string[]
}

export namespace BrowserSession {
  export const KEY_COOKIE = "fg_session_key"
  export const DATA_COOKIE = "fg_session_data"

  export function stringify({ key, name, groups }: BrowserSession) {
    return `1~${key}~${esc(name)}~${groups.join("~")}`
  }

  export function parse(value: string | undefined): BrowserSession | undefined {
    if (!value) {
      return undefined
    }
    const [_version, key, name, ...groups] = value.split("~")
    return {
      key,
      name: unesc(name),
      groups,
    }
  }

  function esc(text: string) {
    return text.replaceAll("~", "<<TILDE>>")
  }

  function unesc(text: string) {
    return text.replaceAll("<<TILDE>>", "~")
  }
}
