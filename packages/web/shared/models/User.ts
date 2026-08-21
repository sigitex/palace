import { type } from "arktype"
import { ID } from "./common"

export type User = typeof User.infer
export const User = type({
  id: ID,
  uid: "string",
  created_at: "Date",
  updated_at: "Date",
  slug: "string > 0",
  name: "string > 0",
  email: "string.email | null",
  sms: "string | null",
})
