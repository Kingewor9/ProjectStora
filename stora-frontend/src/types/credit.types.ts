export interface BalanceResponse {
  credits: number;
}

export interface ClaimResponse {
  credits: number;
  claimed: number;
}

export interface TopUpInvoice {
  credit_amount: number;
  stars_cost: number;
  payload: string;
}

export type EarnTaskId = "daily" | "watch_ad" | "invite" | "subscribe";

export interface EarnTask {
  id: EarnTaskId;
  title: string;
  reward: number;
  actionLabel: string;
}
