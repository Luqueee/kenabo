import type { Id } from "@/shared/domain/id"
import type { HttpMethod } from "./http-method"

export interface HeaderEntry {
  name: string
  value: string
  enabled: boolean
}

export interface QueryParam {
  name: string
  value: string
  enabled: boolean
}

export type RequestBody =
  | { type: "none" }
  | { type: "text"; content: string }
  | { type: "json"; content: string }
  | { type: "form"; fields: { name: string; value: string; enabled: boolean }[] }
  | { type: "raw"; "content-type": string; content: string }

export type AuthScheme =
  | { type: "none" }
  | { type: "basic"; username: string; password: string }
  | { type: "bearer"; token: string }
  | {
      type: "api-key"
      key: string
      value: string
      placement: "header" | "query"
    }

export interface HttpRequest {
  id: Id
  name: string
  method: HttpMethod
  url: string
  headers: HeaderEntry[]
  query: QueryParam[]
  body: RequestBody
  auth: AuthScheme
  timeout_ms: number | null
}

export const createEmptyRequest = (id: Id): HttpRequest => ({
  id,
  name: "Untitled",
  method: "GET",
  url: "",
  headers: [],
  query: [],
  body: { type: "none" },
  auth: { type: "none" },
  timeout_ms: null,
})
