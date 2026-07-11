export interface StoraUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
  language: string;
  timezone: string | null;
  is_onboarded: boolean;
  credits: number;
}

export interface OnboardingRequest {
  channel_id: string;
}
