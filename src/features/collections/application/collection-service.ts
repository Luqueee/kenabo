import type { CollectionGateway } from "../infrastructure/tauri-collection-gateway"

export const makeCollectionService = (gateway: CollectionGateway) => ({
  list: () => gateway.list(),
  create: (name: string) => gateway.create(name),
  save: gateway.save,
  remove: gateway.delete,
})
