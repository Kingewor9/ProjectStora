export interface StoraUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  language: string;
  timezone: string | null;
  is_onboarded: boolean;
  credits: number;
  last_daily_claim: string | null;        // ISO datetime string (UTC), null if never claimed
  subscribe_bonus_claimed: boolean;
}

export interface OnboardingRequest {
  channel_id: string;
}
