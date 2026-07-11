import { create } from "zustand";

interface CreditState {
  balance: number;
  isProcessing: boolean;
  setBalance: (balance: number) => void;
  setProcessing: (processing: boolean) => void;
}

export const useCreditStore = create<CreditState>((set) => ({
  balance: 0,
  isProcessing: false,
  setBalance: (balance) => set({ balance }),
  setProcessing: (isProcessing) => set({ isProcessing }),
}));
