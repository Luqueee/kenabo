export type Id = string

export const generateId = (): Id => crypto.randomUUID()
