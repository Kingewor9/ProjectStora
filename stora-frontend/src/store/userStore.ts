import { create } from "zustand";
import type { StoraUser } from "@/types/user.types";

interface UserState {
  user: StoraUser | null;
  isLoading: boolean;
  setUser: (user: StoraUser) => void;
  setLoading: (loading: boolean) => void;
  updateCredits: (credits: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateCredits: (credits) =>
    set((state) => (state.user ? { user: { ...state.user, credits } } : state)),
}));
