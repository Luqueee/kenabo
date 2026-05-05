import type { Folder } from "./collection"
import type { HttpRequest } from "@/features/request-runner/domain/http-request"

function mapFolder(folder: Folder, id: string, fn: (f: Folder) => Folder): Folder {
  if (folder.id === id) return fn(folder)
  return {
    ...folder,
    folders: folder.folders.map((f) => mapFolder(f, id, fn)),
  }
}

function mapRequest(
  folder: Folder,
  requestId: string,
  fn: (r: HttpRequest) => HttpRequest,
): Folder {
  return {
    ...folder,
    requests: folder.requests.map((r) => (r.id === requestId ? fn(r) : r)),
    folders: folder.folders.map((f) => mapRequest(f, requestId, fn)),
  }
}

export function addFolder(root: Folder, parentId: string, child: Folder): Folder {
  return mapFolder(root, parentId, (f) => ({ ...f, folders: [...f.folders, child] }))
}

export function addRequest(root: Folder, folderId: string, request: HttpRequest): Folder {
  return mapFolder(root, folderId, (f) => ({ ...f, requests: [...f.requests, request] }))
}

export function renameFolder(root: Folder, folderId: string, name: string): Folder {
  return mapFolder(root, folderId, (f) => ({ ...f, name }))
}

export function renameRequest(root: Folder, requestId: string, name: string): Folder {
  return mapRequest(root, requestId, (r) => ({ ...r, name }))
}

export function deleteFolder(root: Folder, folderId: string): Folder {
  return {
    ...root,
    folders: root.folders
      .filter((f) => f.id !== folderId)
      .map((f) => deleteFolder(f, folderId)),
  }
}

export function deleteRequest(root: Folder, requestId: string): Folder {
  return {
    ...root,
    requests: root.requests.filter((r) => r.id !== requestId),
    folders: root.folders.map((f) => deleteRequest(f, requestId)),
  }
}

export function updateRequest(root: Folder, request: HttpRequest): Folder {
  return mapRequest(root, request.id, () => request)
}
