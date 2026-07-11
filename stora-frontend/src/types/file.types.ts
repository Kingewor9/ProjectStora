export type FileType = "photo" | "video" | "document" | "audio" | "text";

export interface StoraFile {
  id: string;
  folder_id: string;
  file_name: string;
  file_type: FileType;
  telegram_msg_link: string;
  file_size: number | null;
  created_at: string;
}
