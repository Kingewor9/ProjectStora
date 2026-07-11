import { create } from "zustand";
import type { Folder } from "@/types/folder.types";

interface BreadcrumbEntry {
  id: string;
  name: string;
}

interface FolderState {
  currentFolderId: string | null; // null = root
  breadcrumbs: BreadcrumbEntry[];
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;
  enterFolder: (folder: Folder) => void;
  goToBreadcrumb: (index: number) => void;
  goToRoot: () => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  currentFolderId: null,
  breadcrumbs: [],
  folders: [],
  setFolders: (folders) => set({ folders }),
  enterFolder: (folder) =>
    set((state) => ({
      currentFolderId: folder.id,
      breadcrumbs: [...state.breadcrumbs, { id: folder.id, name: folder.name }],
    })),
  goToBreadcrumb: (index) =>
    set((state) => {
      const trimmed = state.breadcrumbs.slice(0, index + 1);
      return {
        breadcrumbs: trimmed,
        currentFolderId: trimmed.length ? trimmed[trimmed.length - 1].id : null,
      };
    }),
  goToRoot: () => set({ currentFolderId: null, breadcrumbs: [] }),
}));
