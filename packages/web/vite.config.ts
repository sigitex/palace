import react from "@vitejs/plugin-react-swc"
import { defineConfig, type Plugin } from "vite"
import { server } from "./server.vite.plugin"

export default defineConfig({
  plugins: [
    react(),
    ...dev(
      server([
        "bun",
        "run",
        process.env.PALACE_BROWSER_TEST ? "serve:test" : "serve",
      ]),
    ),
  ],
  server: {
    proxy: {
      "/api": `http://localhost:${process.env.PALACE_SERVER_PORT ?? 3000}`,
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})

function dev(plugin: Plugin) {
  // TODO: turn off in prod
  return process.env.PALACE_NO_SERVER_PLUGIN ? [] : [plugin]
}
