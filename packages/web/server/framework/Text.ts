import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("0123456789bcdfghjklmnpqrstvwxyz", 12)

export namespace Text {
  export function uid() {
    return nanoid()
  }
}
