import client from "./client";
import type { Folder, FolderCreateInput } from "@/types/folder.types";

export async function fetchFolders(parentId: string | null): Promise<Folder[]> {
  const { data } = await client.get<Folder[]>("/api/folders", {
    params: parentId ? { parent_id: parentId } : {},
  });
  return data;
}

export async function fetchFolderDetail(folderId: string): Promise<Folder> {
  const { data } = await client.get<Folder>(`/api/folders/${folderId}`);
  return data;
}

export async function createFolder(input: FolderCreateInput): Promise<Folder> {
  const { data } = await client.post<Folder>("/api/folders", input);
  return data;
}
