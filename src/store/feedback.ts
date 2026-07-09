import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
}

export interface DialogButton {
  text: string;
  style?: "default" | "cancel" | "destructive" | "primary";
  value: string;
}

export interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
  resolver: ((value: string) => void) | null;
}

interface FeedbackStore {
  toast: ToastState;
  dialog: DialogState;
  showToast: (type: ToastType, message: string) => void;
  hideToast: () => void;
  showDialog: (title: string, message: string, buttons: DialogButton[]) => Promise<string>;
  resolveDialog: (value: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  toast: { visible: false, type: "info", message: "" },
  dialog: { visible: false, title: "", message: "", buttons: [], resolver: null },

  showToast: (type, message) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { visible: true, type, message } });
    toastTimer = setTimeout(() => {
      set({ toast: { visible: false, type, message: "" } });
      toastTimer = null;
    }, 3200);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { visible: false, type: "info", message: "" } });
  },

  showDialog: (title, message, buttons) =>
    new Promise<string>((resolve) => {
      set({
        dialog: { visible: true, title, message, buttons, resolver: resolve },
      });
    }),

  resolveDialog: (value) => {
    const { resolver } = get().dialog;
    resolver?.(value);
    set({
      dialog: { visible: false, title: "", message: "", buttons: [], resolver: null },
    });
  },
}));
