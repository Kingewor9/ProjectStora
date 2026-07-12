import client from "./client";
import type { StoraFile } from "@/types/file.types";

export async function fetchFilesInFolder(folderId: string): Promise<StoraFile[]> {
  const { data } = await client.get<StoraFile[]>(`/api/files/folder/${folderId}`);
  return data;
}

export async function searchFiles(query: string): Promise<StoraFile[]> {
  const { data } = await client.get<StoraFile[]>("/api/files/search", {
    params: { q: query },
  });
  return data;
}

export async function sendFileToChat(fileId: string): Promise<void> {
  await client.post(`/api/files/${fileId}/send`);
}

export async function deleteFile(fileId: string): Promise<void> {
  await client.delete(`/api/files/${fileId}`);
}

export async function renameFile(fileId: string, newName: string): Promise<void> {
  await client.patch(`/api/files/${fileId}/rename`, { file_name: newName });
}
