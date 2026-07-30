import { type } from "arktype";

export type ID = typeof ID.infer
export const ID = type("number.integer >= 0")
