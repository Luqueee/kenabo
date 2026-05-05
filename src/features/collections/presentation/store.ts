import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { generateId } from "@/shared/domain/id"
import type { Collection, Folder } from "../domain/collection"
import {
  addFolder,
  addRequest,
  deleteFolder,
  deleteRequest,
  renameFolder,
  renameRequest,
  updateRequest,
} from "../domain/folder-ops"
import { makeCollectionService } from "../application/collection-service"
import { tauriCollectionGateway } from "../infrastructure/tauri-collection-gateway"
import { createEmptyRequest } from "@/features/request-runner/domain/http-request"
import type { HttpRequest } from "@/features/request-runner/domain/http-request"
import { showInputDialog } from "@/components/ui/input-dialog"

const service = makeCollectionService(tauriCollectionGateway)

interface CollectionsState {
  collections: Collection[]
  loading: boolean
  expanded: Record<string, boolean>

  load: () => Promise<void>
  create: (name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  rename: (id: string, name: string) => Promise<void>

  toggleExpanded: (id: string) => void

  addFolder: (collectionId: string, parentFolderId: string) => Promise<void>
  renameFolder: (collectionId: string, folderId: string, name: string) => Promise<void>
  removeFolder: (collectionId: string, folderId: string) => Promise<void>

  addRequest: (collectionId: string, folderId: string) => Promise<void>
  renameRequest: (collectionId: string, requestId: string, name: string) => Promise<void>
  removeRequest: (collectionId: string, requestId: string) => Promise<void>
  saveRequest: (collectionId: string, request: HttpRequest) => Promise<void>
}

function findCollection(collections: Collection[], id: string): Collection | undefined {
  return collections.find((c) => c.id === id)
}

export const useCollectionsStore = create<CollectionsState>()(
  immer((set, get) => ({
    collections: [],
    loading: false,
    expanded: {},

    load: async () => {
      set((s) => { s.loading = true })
      const collections = await service.list()
      set((s) => {
        s.collections = collections
        s.loading = false
      })
    },

    create: async (name) => {
      const collection = await service.create(name)
      set((s) => {
        s.collections.push(collection)
        s.expanded[collection.id] = true
      })
    },

    remove: async (id) => {
      await service.remove(id)
      set((s) => {
        s.collections = s.collections.filter((c) => c.id !== id)
      })
    },

    rename: async (id, name) => {
      const col = findCollection(get().collections, id)
      if (!col) return
      const updated = { ...col, name }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === id)
        if (c) c.name = name
      })
    },

    toggleExpanded: (id) => {
      set((s) => {
        s.expanded[id] = !s.expanded[id]
      })
    },

    addFolder: async (collectionId, parentFolderId) => {
      const name = await showInputDialog("Folder name")
      if (!name) return
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const newFolder: Folder = {
        id: generateId(),
        name,
        folders: [],
        requests: [],
      }
      const updated = { ...col, root: addFolder(col.root, parentFolderId, newFolder) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) {
          c.root = updated.root
          s.expanded[newFolder.id] = true
          s.expanded[parentFolderId] = true
        }
      })
    },

    renameFolder: async (collectionId, folderId, name) => {
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const updated = { ...col, root: renameFolder(col.root, folderId, name) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) c.root = updated.root
      })
    },

    removeFolder: async (collectionId, folderId) => {
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const updated = { ...col, root: deleteFolder(col.root, folderId) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) c.root = updated.root
      })
    },

    addRequest: async (collectionId, folderId) => {
      const name = (await showInputDialog("Request name")) ?? "Untitled"
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const req = createEmptyRequest(generateId())
      req.name = name
      const updated = { ...col, root: addRequest(col.root, folderId, req) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) {
          c.root = updated.root
          s.expanded[folderId] = true
        }
      })
    },

    renameRequest: async (collectionId, requestId, name) => {
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const updated = { ...col, root: renameRequest(col.root, requestId, name) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) c.root = updated.root
      })
    },

    removeRequest: async (collectionId, requestId) => {
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const updated = { ...col, root: deleteRequest(col.root, requestId) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) c.root = updated.root
      })
    },

    saveRequest: async (collectionId, request) => {
      const col = findCollection(get().collections, collectionId)
      if (!col) return
      const updated = { ...col, root: updateRequest(col.root, request) }
      await service.save(updated)
      set((s) => {
        const c = s.collections.find((c) => c.id === collectionId)
        if (c) c.root = updated.root
      })
    },
  })),
)
