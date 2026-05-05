import type { HttpRequest } from "../domain/http-request"

export function buildCurl(req: HttpRequest): string {
  const parts: string[] = ["curl"]

  if (req.method !== "GET") {
    parts.push(`-X ${req.method}`)
  }

  let url = req.url
  const enabledParams = req.query.filter((q) => q.enabled && q.name)

  if (req.auth.type === "api-key" && req.auth.placement === "query") {
    enabledParams.push({ name: req.auth.key, value: req.auth.value, enabled: true })
  }

  if (enabledParams.length > 0) {
    const qs = enabledParams
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
      .join("&")
    url += (url.includes("?") ? "&" : "?") + qs
  }

  parts.push(`'${url}'`)

  const enabledHeaders = req.headers.filter((h) => h.enabled && h.name)
  for (const h of enabledHeaders) {
    parts.push(`-H '${h.name}: ${h.value}'`)
  }

  if (req.auth.type === "bearer") {
    parts.push(`-H 'Authorization: Bearer ${req.auth.token}'`)
  } else if (req.auth.type === "basic") {
    parts.push(`-u '${req.auth.username}:${req.auth.password}'`)
  } else if (req.auth.type === "api-key" && req.auth.placement === "header") {
    parts.push(`-H '${req.auth.key}: ${req.auth.value}'`)
  }

  if (req.body.type === "json") {
    parts.push(`-H 'Content-Type: application/json'`)
    parts.push(`-d '${req.body.content}'`)
  } else if (req.body.type === "text") {
    parts.push(`-d '${req.body.content}'`)
  } else if (req.body.type === "raw") {
    parts.push(`-H 'Content-Type: ${req.body["content-type"]}'`)
    parts.push(`-d '${req.body.content}'`)
  } else if (req.body.type === "form") {
    for (const f of req.body.fields.filter((f) => f.enabled && f.name)) {
      parts.push(`-F '${f.name}=${f.value}'`)
    }
  }

  return parts.join(" \\\n  ")
}
