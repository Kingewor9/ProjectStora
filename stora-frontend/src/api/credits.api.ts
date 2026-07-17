import client from "./client";
import type { BalanceResponse, ClaimResponse, TopUpInvoice } from "@/types/credit.types";

export async function fetchBalance(): Promise<BalanceResponse> {
  const { data } = await client.get<BalanceResponse>("/api/credits/balance");
  return data;
}

export async function claimDailyBonus(): Promise<ClaimResponse> {
  const { data } = await client.post<ClaimResponse>("/api/credits/daily-bonus");
  return data;
}

export async function claimSubscribeBonus(): Promise<ClaimResponse> {
  const { data } = await client.post<ClaimResponse>("/api/credits/subscribe-bonus");
  return data;
}

export async function claimAdReward(rewardAmount: number): Promise<BalanceResponse> {
  const { data } = await client.post<BalanceResponse>("/api/credits/watch-ad", null, {
    params: { reward_amount: rewardAmount },
  });
  return data;
}

export async function createTopUpInvoice(creditAmount: number): Promise<TopUpInvoice> {
  const { data } = await client.post<TopUpInvoice>("/api/credits/topup/create-invoice", null, {
    params: { credit_amount: creditAmount },
  });
  return data;
}

export async function createUnlimitedPlanInvoice(): Promise<TopUpInvoice & { plan: string; period_days: number }> {
  const { data } = await client.post<TopUpInvoice & { plan: string; period_days: number }>(
    "/api/credits/unlimited/create-invoice"
  );
  return data;
}
