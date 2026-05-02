import { invoke } from "@tauri-apps/api/core"
import type { FileEntry, SearchResult } from "../domain/file-entry"

export const fsGateway = {
  list: (path: string) => invoke<FileEntry[]>("list_directory", { path }),
  home: () => invoke<string>("get_home_dir"),
  open: (path: string) => invoke<void>("open_file", { path }),
  search: (root: string, query: string) =>
    invoke<SearchResult[]>("search_files", { root, query }),
  index: (root: string) => invoke<number>("index_path", { root }),
  clearIndex: () => invoke<void>("clear_search_index"),
  mkdir: (path: string) => invoke<void>("create_dir", { path }),
  mkfile: (path: string) => invoke<void>("create_file", { path }),
  rename: (src: string, newName: string) =>
    invoke<void>("rename_entry", { src, newName }),
  delete: (path: string) => invoke<void>("delete_entry", { path }),
  copy: (src: string, dest: string) => invoke<void>("copy_entry", { src, dest }),
  move: (src: string, dest: string) => invoke<void>("move_entry", { src, dest }),
}
