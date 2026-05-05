export type ResponseBody =
  | { type: "text"; content: string }
  | { type: "binary"; base64: string }
  | { type: "empty" }

export interface HttpResponse {
  status: number
  status_text: string
  headers: [string, string][]
  body: ResponseBody
  elapsed_ms: number
  size_bytes: number
}
