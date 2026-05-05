import type { Id } from "@/shared/domain/id"
import type { HttpRequest } from "@/features/request-runner/domain/http-request"

export interface Folder {
  id: Id
  name: string
  folders: Folder[]
  requests: HttpRequest[]
}

export interface Collection {
  id: Id
  name: string
  root: Folder
}
