import { proxy } from "valtio";
import { useProxy } from "valtio/utils";

const ui = proxy({
  isNavOpen: false,
  isDevToolsOpen: false,

  toggleNav() {
    this.isNavOpen = !this.isNavOpen
  },

  toggleDevTools() {
    this.isDevToolsOpen = !this.isDevToolsOpen
  }
})

export const useUI = () => useProxy(ui)
