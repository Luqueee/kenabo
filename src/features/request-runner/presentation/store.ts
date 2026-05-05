import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { generateId } from "@/shared/domain/id"
import {
  createEmptyRequest,
  type HttpRequest,
} from "../domain/http-request"
import type { HttpResponse } from "../domain/http-response"
import type { HttpMethod } from "../domain/http-method"
import { makeSendRequest } from "../application/send-request"
import { tauriHttpGateway } from "../infrastructure/tauri-http-gateway"

const sendRequest = makeSendRequest(tauriHttpGateway)

type Status = "idle" | "loading" | "success" | "error"

interface RunnerState {
  request: HttpRequest
  response: HttpResponse | null
  status: Status
  error: string | null
  setUrl: (url: string) => void
  setMethod: (method: HttpMethod) => void
  setHeader: (index: number, patch: Partial<{ name: string; value: string; enabled: boolean }>) => void
  addHeader: () => void
  removeHeader: (index: number) => void
  setBodyJson: (content: string) => void
  send: () => Promise<void>
}

export const useRunnerStore = create<RunnerState>()(
  immer((set, get) => ({
    request: createEmptyRequest(generateId()),
    response: null,
    status: "idle",
    error: null,
    setUrl: (url) =>
      set((s) => {
        s.request.url = url
      }),
    setMethod: (method) =>
      set((s) => {
        s.request.method = method
      }),
    setHeader: (index, patch) =>
      set((s) => {
        Object.assign(s.request.headers[index], patch)
      }),
    addHeader: () =>
      set((s) => {
        s.request.headers.push({ name: "", value: "", enabled: true })
      }),
    removeHeader: (index) =>
      set((s) => {
        s.request.headers.splice(index, 1)
      }),
    setBodyJson: (content) =>
      set((s) => {
        s.request.body = { type: "json", content }
      }),
    send: async () => {
      set((s) => {
        s.status = "loading"
        s.error = null
      })
      try {
        const response = await sendRequest(get().request)
        set((s) => {
          s.response = response
          s.status = "success"
        })
      } catch (e) {
        set((s) => {
          s.status = "error"
          s.error = e instanceof Error ? e.message : String(e)
        })
      }
    },
  })),
)
