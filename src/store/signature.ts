import { create } from "zustand";

interface SignatureStore {
  result: string | null;
  setResult: (value: string | null) => void;
  clearResult: () => void;
}

export const useSignatureStore = create<SignatureStore>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
