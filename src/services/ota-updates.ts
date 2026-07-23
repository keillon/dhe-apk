import * as Updates from "expo-updates";
import Constants from "expo-constants";
import { feedback } from "@/services/feedback";
import { logger } from "@/utils/logger";

export async function checkAndApplyOtaUpdate(): Promise<boolean> {
  if (__DEV__) return false;
  if (Constants.appOwnership === "expo") return false;

  try {
    if (!Updates.isEnabled) return false;

    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return false;

    feedback.toast.info("Baixando atualização...");
    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return false;

    feedback.toast.success("Atualização pronta. Reiniciando...");
    await Updates.reloadAsync();
    return true;
  } catch (error) {
    logger.warn("Updates", "Falha ao verificar OTA", error);
    return false;
  }
}
