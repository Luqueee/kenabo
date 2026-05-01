import { invoke } from "@tauri-apps/api/core"

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
  score: number
}

export const listDirectory = (path: string): Promise<FileEntry[]> =>
  invoke("list_directory", { path })

export const getHomeDir = (): Promise<string> => invoke("get_home_dir")

export const openFile = (path: string): Promise<void> =>
  invoke("open_file", { path })

export const searchFiles = (root: string, query: string): Promise<SearchResult[]> =>
  invoke("search_files", { root, query })

export const indexPath = (root: string): Promise<number> =>
  invoke("index_path", { root })

export const clearSearchIndex = (): Promise<void> =>
  invoke("clear_search_index")
