import type { Id } from "@/shared/domain/id"

export interface EnvVar {
  value: string
  secret: boolean
}

export interface Environment {
  id: Id
  name: string
  variables: Record<string, EnvVar>
}
