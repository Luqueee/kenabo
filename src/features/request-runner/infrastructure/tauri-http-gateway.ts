import { tauri } from "@/shared/infrastructure/tauri-client"
import type { HttpRequest } from "../domain/http-request"
import type { HttpResponse } from "../domain/http-response"

export interface HttpGateway {
  send(request: HttpRequest, environmentId?: string): Promise<HttpResponse>
}

export const tauriHttpGateway: HttpGateway = {
  send: (request, environmentId) =>
    tauri.invoke<HttpResponse>("execute_request", {
      request,
      environmentId: environmentId ?? null,
    }),
}
