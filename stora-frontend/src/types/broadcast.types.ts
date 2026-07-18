export interface BroadcastPayload {
  text: string;
  link_url?: string | null;
  cta_text?: string | null;
  image_url?: string | null;
}

export interface BroadcastStarted {
  status: string;
  total_recipients: number;
}
