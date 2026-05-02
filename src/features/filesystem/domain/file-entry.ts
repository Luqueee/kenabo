export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: number
  extension: string | null
}

export interface SearchResult {
  name: string
  path: string
  is_dir: boolean
  size: number
  modified: number
  extension: string | null
  score: number
}
