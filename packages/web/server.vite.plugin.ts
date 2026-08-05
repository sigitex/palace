import type { Plugin } from "vite"
import { spawn, type ChildProcess } from "node:child_process"

export function server(command: string[]): Plugin {
  let child: ChildProcess | null = null

  function kill() {
    if (!child) {
      return
    }
    const pid = child.pid
    child = null
    if (pid) {
      try {
        process.kill(-pid, "SIGINT")
      } catch {
        // ignore
      }
    }
  }

  function interrupt() {
    kill()
    process.exit(130)
  }

  function terminate() {
    kill()
    process.exit(143)
  }

  return {
    name: "server",
    configureServer() {
      const serverProcess = spawn(command[0], command.slice(1), {
        stdio: ["ignore", "inherit", "inherit"],
        detached: true,
      })
      child = serverProcess

      serverProcess.once("exit", (code) => {
        if (child === serverProcess) {
          console.error(`[server] process exited with code ${code}`)
          child = null
        }
      })

      process.once("exit", kill)
      process.once("SIGINT", interrupt)
      process.once("SIGTERM", terminate)
    },
    buildEnd() {
      process.off("exit", kill)
      process.off("SIGINT", interrupt)
      process.off("SIGTERM", terminate)
      kill()
    },
  }
}
