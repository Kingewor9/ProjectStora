export interface BalanceResponse {
  credits: number;
  plan?: string;
  subscription_expires_at?: string | null;
}

export interface ClaimResponse {
  credits: number;
  claimed: number;
  next_claim_at?: string;  // ISO datetime string — returned by daily-bonus after a successful claim
}

export interface TopUpInvoice {
  credit_amount: number;
  stars_cost: number;
  payload: string;
  invoice_link: string;
}

export type EarnTaskId = "daily" | "watch_ad" | "invite" | "subscribe";

export interface EarnTask {
  id: EarnTaskId;
  title: string;
  reward: number;
  actionLabel: string;
}
