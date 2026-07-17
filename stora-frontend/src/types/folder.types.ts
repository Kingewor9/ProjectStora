export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  file_count: number;
  subfolder_count: number;
  is_shared: boolean;
  created_at: string;
}

export interface FolderCreateInput {
  name: string;
  parent_id: string | null;
}
