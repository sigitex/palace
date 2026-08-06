import { vars } from "@/theme";
import styled from "@emotion/styled";
import { AppShell } from "@mantine/core";

export const HeaderContainer = styled(AppShell.Header)({
  display: "flex",
  justifyContent: "stretch",
  alignItems: "stretch",
  borderBottom: "solid 8px",
  borderBottomColor: vars.colors.primary,
})
