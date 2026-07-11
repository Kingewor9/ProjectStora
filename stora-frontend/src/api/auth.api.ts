import client from "./client";
import type { StoraUser, OnboardingRequest } from "@/types/user.types";

export async function startSession(): Promise<StoraUser> {
  const { data } = await client.post<StoraUser>("/api/auth/session");
  return data;
}

export async function configureOnboarding(payload: OnboardingRequest): Promise<StoraUser> {
  const { data } = await client.post<StoraUser>("/api/auth/onboarding/configure", payload);
  return data;
}
