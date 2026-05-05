import type { HttpRequest } from "../domain/http-request"
import type { HttpResponse } from "../domain/http-response"
import type { HttpGateway } from "../infrastructure/tauri-http-gateway"

export const makeSendRequest =
  (gateway: HttpGateway) =>
  (request: HttpRequest, environmentId?: string): Promise<HttpResponse> =>
    gateway.send(request, environmentId)
