import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Square, Video, X } from "lucide-react-native";
import { colors } from "@/theme";

const MAX_VIDEO_DURATION_SEC = 45;

interface VideoRecordModalProps {
  visible: boolean;
  withAudio: boolean;
  onClose: () => void;
  onRecorded: (uri: string) => void;
}

export function VideoRecordModal({
  visible,
  withAudio,
  onClose,
  onRecorded,
}: VideoRecordModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setRecording(false);
      setError("");
      return;
    }

    void (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (withAudio && !micPermission?.granted) {
        await requestMicPermission();
      }
    })();
  }, [
    visible,
    withAudio,
    cameraPermission?.granted,
    micPermission?.granted,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const canRecord =
    cameraPermission?.granted && (!withAudio || micPermission?.granted);

  const handleStart = async () => {
    if (!cameraRef.current || recording || !canRecord) return;

    setError("");
    setRecording(true);

    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SEC,
      });

      if (result?.uri) {
        onRecorded(result.uri);
        onClose();
      }
    } catch {
      setError("Não foi possível gravar o vídeo.");
    } finally {
      setRecording(false);
    }
  };

  const handleStop = () => {
    cameraRef.current?.stopRecording();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {canRecord ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="video"
            mute={!withAudio}
            active
          />
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>
              Permita o acesso à câmera{withAudio ? " e ao microfone" : ""} para gravar.
            </Text>
          </View>
        )}

        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {withAudio ? "Gravando com áudio" : "Gravando sem áudio"}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#fff" />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.controls}>
            {!recording ? (
              <Pressable
                onPress={() => void handleStart()}
                disabled={!canRecord}
                style={[styles.recordBtn, !canRecord && styles.recordBtnDisabled]}
              >
                <Video size={22} color="#fff" />
                <Text style={styles.recordText}>Iniciar gravação</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleStop} style={styles.stopBtn}>
                <Square size={20} color="#fff" fill="#fff" />
                <Text style={styles.recordText}>Parar</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    padding: 8,
  },
  controls: {
    alignItems: "center",
    paddingBottom: 32,
  },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  recordBtnDisabled: {
    opacity: 0.5,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  recordText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },
});
