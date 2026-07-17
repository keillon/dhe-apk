import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function shareTextFile(options: {
  content: string;
  filename: string;
  mimeType: string;
  dialogTitle: string;
}): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Compartilhamento não disponível neste dispositivo.");
  }

  const path = `${FileSystem.cacheDirectory}${options.filename}`;
  await FileSystem.writeAsStringAsync(path, options.content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(path, {
    mimeType: options.mimeType,
    dialogTitle: options.dialogTitle,
  });
}
