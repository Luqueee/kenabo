import { tauri } from "@/shared/infrastructure/tauri-client"
import type { Collection } from "../domain/collection"

export interface CollectionGateway {
  list(): Promise<Collection[]>
  create(name: string): Promise<Collection>
  save(collection: Collection): Promise<void>
  delete(id: string): Promise<void>
}

export const tauriCollectionGateway: CollectionGateway = {
  list: () => tauri.invoke<Collection[]>("list_collections"),
  create: (name) => tauri.invoke<Collection>("create_collection", { name }),
  save: (collection) => tauri.invoke<void>("save_collection", { collection }),
  delete: (id) => tauri.invoke<void>("delete_collection", { id }),
}
