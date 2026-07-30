import type { Fixtures } from "@sigitex/outlaw"
import { groupFixture, memberFixture, userFixture } from "./identity"

export const fixtures = {
  userFixture,
  groupFixture,
  memberFixture,
} as const satisfies Fixtures
