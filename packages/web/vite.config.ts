import react from "@vitejs/plugin-react-swc"
import { defineConfig, type Plugin } from "vite"
import { server } from "./server.vite.plugin"

export default defineConfig({
  plugins: [react(), ...dev(server(["bun", "run", "serve"]))],
  server: {
    proxy: {
      "/api": "http://localhost:3000"
    }
  },
  resolve: {
    tsconfigPaths: true,
  },
})

function dev(plugin: Plugin) {
  // TODO: turn off in prod
  return [plugin]
}
