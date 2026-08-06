import { SMALL } from "@/common/responsive"
import { vars } from "@/theme"
import styled from "@emotion/styled"
import { Link } from "wouter"

export const HeaderLink = styled(Link)({
  display: "flex",
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5vw",
  textDecoration: "none",
  color: vars.colors.text,
  "&:hover,:active": {
    backgroundColor: vars.colors.primaryColors[7],
    color: vars.colors.white,
  },
  "&.active": {
    backgroundColor: vars.colors.primaryColors[9],
    color: vars.colors.white,
  },
})

export const HeaderLabel = styled.span({
  fontSize: "calc(min(1.4vw, 1.2em))",
  [SMALL]: {
    display: "none",
  },
})
