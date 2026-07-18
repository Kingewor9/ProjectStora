import client from "./client";
import type { BroadcastPayload, BroadcastStarted } from "@/types/broadcast.types";

export async function sendBroadcast(payload: BroadcastPayload): Promise<BroadcastStarted> {
  const { data } = await client.post<BroadcastStarted>("/api/admin/broadcast", payload);
  return data;
}
