type WebEnv = "dev" | "stage" | "prod"

declare interface Env {
  readonly WEB_ENV: WebEnv
  readonly ASSETS: {
    fetch(request: Request | URL | string): Promise<Response>
  }
}
