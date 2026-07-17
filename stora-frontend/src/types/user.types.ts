export interface StoraUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  language: string;
  timezone: string | null;
  is_onboarded: boolean;
  credits: number;
  plan: string;
  subscription_expires_at: string | null;
  last_daily_claim: string | null;        // ISO datetime string (UTC), null if never claimed
  subscribe_bonus_claimed: boolean;
  redirect_shared_token?: string | null;  // present only right after onboarding/configure, one-shot
}

export interface OnboardingRequest {
  channel_id: string;
}
