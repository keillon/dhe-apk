import { useFeedbackStore, type ToastType } from "@/store/feedback";

export const feedback = {
  toast: {
    success: (message: string) => useFeedbackStore.getState().showToast("success", message),
    error: (message: string) => useFeedbackStore.getState().showToast("error", message),
    warning: (message: string) => useFeedbackStore.getState().showToast("warning", message),
    info: (message: string) => useFeedbackStore.getState().showToast("info", message),
  },

  async alert(title: string, message: string): Promise<void> {
    await useFeedbackStore.getState().showDialog(title, message, [
      { text: "Entendi", style: "primary", value: "ok" },
    ]);
  },

  async confirm(title: string, message: string, confirmText = "Confirmar"): Promise<boolean> {
    const result = await useFeedbackStore.getState().showDialog(title, message, [
      { text: "Cancelar", style: "cancel", value: "cancel" },
      { text: confirmText, style: "primary", value: "confirm" },
    ]);
    return result === "confirm";
  },

  async choose(
    title: string,
    message: string,
    options: { text: string; value: string; style?: "default" | "cancel" | "destructive" | "primary" }[]
  ): Promise<string> {
    return useFeedbackStore.getState().showDialog(
      title,
      message,
      options.map((opt) => ({
        text: opt.text,
        value: opt.value,
        style: opt.style ?? "default",
      }))
    );
  },
};

export type { ToastType };
