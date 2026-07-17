import client from "./client";
import type { Share, SharePreview, ClaimResult } from "@/types/share.types";

export async function createShare(folderId: string): Promise<Share> {
  const { data } = await client.post<Share>("/api/shares", { folder_id: folderId });
  return data;
}

export async function fetchMyShares(): Promise<Share[]> {
  const { data } = await client.get<Share[]>("/api/shares");
  return data;
}

export async function revokeShare(token: string): Promise<void> {
  await client.post(`/api/shares/${token}/revoke`);
}

export async function fetchSharePreview(token: string): Promise<SharePreview> {
  const { data } = await client.get<SharePreview>(`/api/shares/${token}`);
  return data;
}

export async function claimShare(token: string): Promise<ClaimResult> {
  const { data } = await client.post<ClaimResult>(`/api/shares/${token}/claim`);
  return data;
}
