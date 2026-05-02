import { invoke } from "@tauri-apps/api/core"
import type { FileEntry, SearchResult } from "../domain/file-entry"
import type { SmbShare } from "@/features/smb/domain/share"

export interface DirectoryPage {
  entries: FileEntry[]
  total: number
  offset: number
  limit: number
}

export const fsGateway = {
  list: (path: string, options?: { limit?: number; offset?: number }) =>
    invoke<DirectoryPage>("list_directory", { path, options: options ?? null }),
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
  renameAndList: (
    src: string,
    newName: string,
    options?: { limit?: number; offset?: number }
  ) =>
    invoke<DirectoryPage>("rename_and_list", {
      src,
      newName,
      options: options ?? null,
    }),
  delete: (path: string) => invoke<void>("delete_entry", { path }),
  copy: (src: string, dest: string) => invoke<void>("copy_entry", { src, dest }),
  move: (src: string, dest: string) => invoke<void>("move_entry", { src, dest }),
  openTerminal: (path: string, terminalId?: string | null) =>
    invoke<void>("open_terminal", { path, terminalId: terminalId ?? null }),
  listTerminals: () =>
    invoke<{ id: string; name: string }[]>("list_terminals"),
  smbList: () => invoke<SmbShare[]>("smb_list"),
  smbSave: (share: SmbShare, password?: string | null) =>
    invoke<SmbShare>("smb_save", { share, password: password ?? null }),
  smbDelete: (id: string) => invoke<void>("smb_delete", { id }),
  smbMount: (id: string) => invoke<string>("smb_mount", { id }),
  smbUnmount: (id: string) => invoke<void>("smb_unmount", { id }),
  smbIsMounted: (id: string) => invoke<boolean>("smb_is_mounted", { id }),
}
