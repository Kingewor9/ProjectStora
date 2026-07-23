export interface Share {
  token: string;
  share_link: string;
  folder_id: string;
  folder_name: string;
  revoked: boolean;
  created_at: string;
}

export interface SharePreviewFile {
  name: string;
  file_type: string;
}

export interface SharePreviewFolder {
  name: string;
  files: SharePreviewFile[];
  subfolders: SharePreviewFolder[];
}

export type ClaimStatus = "in_progress" | "completed" | "delta";

export interface SharePreview {
  token: string;
  owner_name: string;
  revoked: boolean;
  root: SharePreviewFolder;
  total_files: number;
  total_folders: number;
  cost_credits: number;
  requester_is_unlimited: boolean;
  requester_credits: number;
  can_afford: boolean;
  claim_status: ClaimStatus | null;
  claimed_root_folder_id: string | null;
}

export interface ClaimResult {
  status: ClaimStatus;
  root_folder_id: string | null;
  copied_count: number;
  total_files: number;
  total_cost_charged: number;
}
