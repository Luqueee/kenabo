import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Collection } from "../domain/collection"
import { makeCollectionService } from "../application/collection-service"
import { tauriCollectionGateway } from "../infrastructure/tauri-collection-gateway"

const service = makeCollectionService(tauriCollectionGateway)

interface CollectionsState {
  collections: Collection[]
  loading: boolean
  load: () => Promise<void>
  create: (name: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCollectionsStore = create<CollectionsState>()(
  immer((set) => ({
    collections: [],
    loading: false,
    load: async () => {
      set((s) => {
        s.loading = true
      })
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
      })
    },
    remove: async (id) => {
      await service.remove(id)
      set((s) => {
        s.collections = s.collections.filter((c) => c.id !== id)
      })
    },
  })),
)
