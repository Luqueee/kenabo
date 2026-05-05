import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { generateId } from "@/shared/domain/id"
import {
  createEmptyRequest,
  type AuthScheme,
  type HttpRequest,
  type QueryParam,
  type RequestBody,
} from "../domain/http-request"
import type { HttpResponse } from "../domain/http-response"
import type { HttpMethod } from "../domain/http-method"
import { makeSendRequest } from "../application/send-request"
import { tauriHttpGateway } from "../infrastructure/tauri-http-gateway"
import { useCollectionsStore as collectionsStore } from "@/features/collections/presentation/store"
import { useEnvironmentsStore as environmentsStore } from "@/features/environments/presentation/store"

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
  setBody: (body: RequestBody) => void
  setQuery: (index: number, patch: Partial<QueryParam>) => void
  addQuery: () => void
  removeQuery: (index: number) => void
  setAuth: (auth: AuthScheme) => void
  loadRequest: (request: HttpRequest, collectionId?: string) => Promise<void>
  activeCollectionId: string | null
  saveToCollection: () => Promise<void>
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
    setBody: (body) =>
      set((s) => {
        s.request.body = body
      }),
    setQuery: (index, patch) =>
      set((s) => {
        Object.assign(s.request.query[index], patch)
      }),
    addQuery: () =>
      set((s) => {
        s.request.query.push({ name: "", value: "", enabled: true })
      }),
    removeQuery: (index) =>
      set((s) => {
        s.request.query.splice(index, 1)
      }),
    setAuth: (auth) =>
      set((s) => {
        s.request.auth = auth
      }),
    activeCollectionId: null,
    loadRequest: async (request, collectionId) => {
      const { request: current, activeCollectionId } = get()
      if (current.id === request.id) return
      if (activeCollectionId) {
        await collectionsStore.getState().saveRequest(activeCollectionId, current)
      }
      set((s) => {
        s.request = request
        s.response = null
        s.status = "idle"
        s.error = null
        s.activeCollectionId = collectionId ?? null
      })
    },
    saveToCollection: async () => {
      const { request, activeCollectionId } = get()
      if (!activeCollectionId) return
      await collectionsStore.getState().saveRequest(activeCollectionId, request)
    },
    send: async () => {
      set((s) => {
        s.status = "loading"
        s.error = null
      })
      try {
        const activeEnvironmentId = environmentsStore.getState().activeId ?? undefined
        const response = await sendRequest(get().request, activeEnvironmentId)
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
