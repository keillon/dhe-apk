import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import type { AppLockSettings } from "@/types";
import { getCachedData, setCachedData, StorageKeys } from "./storage";

const PIN_SECURE_KEY = "dhe_app_lock_pin";

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i += 1) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return `pin_${Math.abs(hash)}_${pin.length}`;
}

export function getAppLockSettings(): AppLockSettings {
  return (
    getCachedData<AppLockSettings>(StorageKeys.appLock) ?? {
      enabled: false,
      useBiometric: false,
    }
  );
}

export async function saveAppLockSettings(settings: AppLockSettings): Promise<void> {
  setCachedData(StorageKeys.appLock, settings);

  if (settings.pinHash) {
    await SecureStore.setItemAsync(PIN_SECURE_KEY, settings.pinHash);
  } else {
    await SecureStore.deleteItemAsync(PIN_SECURE_KEY);
  }
}

export async function setAppLockPin(pin: string): Promise<void> {
  const pinHash = hashPin(pin);
  const current = getAppLockSettings();
  await saveAppLockSettings({ ...current, pinHash });
}

export async function verifyAppLockPin(pin: string): Promise<boolean> {
  const securePin = await SecureStore.getItemAsync(PIN_SECURE_KEY);
  const expected = securePin ?? getAppLockSettings().pinHash;
  if (!expected) return false;
  return expected === hashPin(pin);
}

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Desbloquear DHE",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar PIN",
  });
  return result.success;
}
