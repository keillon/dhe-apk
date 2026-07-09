import { create } from "zustand";

interface SignatureStore {
  pendingResult: string | null;
  isOpening: boolean;
  setPendingResult: (value: string | null) => void;
  consumePendingResult: () => string | null;
  setOpening: (opening: boolean) => void;
}

export const useSignatureStore = create<SignatureStore>((set, get) => ({
  pendingResult: null,
  isOpening: false,
  setPendingResult: (pendingResult) => set({ pendingResult }),
  consumePendingResult: () => {
    const value = get().pendingResult;
    set({ pendingResult: null });
    return value;
  },
  setOpening: (isOpening) => set({ isOpening }),
}));
