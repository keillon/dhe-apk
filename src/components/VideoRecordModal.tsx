import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mic, MicOff, Pause, Play, Square, X } from "lucide-react-native";
import { colors } from "@/theme";

const MAX_VIDEO_DURATION_SEC = 45;

interface VideoRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onRecorded: (uri: string, withAudio: boolean) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function VideoRecordModal({ visible, onClose, onRecorded }: VideoRecordModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [withAudio, setWithAudio] = useState(true);
  const [recording, setRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pauseAvailable, setPauseAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setRecording(false);
      setIsPaused(false);
      setElapsedSec(0);
      setWithAudio(true);
      setError("");
      return;
    }

    void (async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
    })();
  }, [visible, cameraPermission?.granted, requestCameraPermission]);

  useEffect(() => {
    if (!recording || isPaused) return;

    const timer = setInterval(() => {
      setElapsedSec((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [recording, isPaused]);

  useEffect(() => {
    if (!withAudio || !visible) return;

    void (async () => {
      if (!micPermission?.granted) {
        await requestMicPermission();
      }
    })();
  }, [withAudio, visible, micPermission?.granted, requestMicPermission]);

  const canRecord = cameraPermission?.granted && (!withAudio || micPermission?.granted);

  const handleCameraReady = () => {
    const features = cameraRef.current?.getSupportedFeatures();
    setPauseAvailable(features?.toggleRecordingAsyncAvailable ?? false);
  };

  const handleStart = async () => {
    if (!cameraRef.current || recording || !canRecord) return;

    setError("");
    setRecording(true);
    setIsPaused(false);
    setElapsedSec(0);

    try {
      const result = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SEC,
      });

      if (result?.uri) {
        onRecorded(result.uri, withAudio);
        onClose();
      }
    } catch {
      setError("Não foi possível gravar o vídeo.");
    } finally {
      setRecording(false);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    cameraRef.current?.stopRecording();
  };

  const handleTogglePause = async () => {
    if (!cameraRef.current || !recording || !pauseAvailable) return;

    try {
      await cameraRef.current.toggleRecordingAsync();
      setIsPaused((current) => !current);
    } catch {
      setError("Não foi possível pausar a gravação.");
    }
  };

  const handleClose = () => {
    if (recording) {
      cameraRef.current?.stopRecording();
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
            <X size={22} color={colors.text} />
          </Pressable>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Gravar vídeo</Text>
            {recording ? (
              <View style={styles.timerRow}>
                <View style={[styles.recDot, isPaused && styles.recDotPaused]} />
                <Text style={styles.timerText}>
                  {isPaused ? "Pausado" : "Gravando"} {formatTime(elapsedSec)} / {formatTime(MAX_VIDEO_DURATION_SEC)}
                </Text>
              </View>
            ) : (
              <Text style={styles.topSubtitle}>Máximo {MAX_VIDEO_DURATION_SEC}s</Text>
            )}
          </View>

          <View style={styles.topSpacer} />
        </View>

        {!recording ? (
          <View style={styles.audioRow}>
            <Pressable
              onPress={() => setWithAudio(true)}
              style={[styles.audioOption, withAudio && styles.audioOptionActive]}
            >
              <Mic size={16} color={withAudio ? colors.bg : colors.text} />
              <Text style={[styles.audioText, withAudio && styles.audioTextActive]}>Com áudio</Text>
            </Pressable>
            <Pressable
              onPress={() => setWithAudio(false)}
              style={[styles.audioOption, !withAudio && styles.audioOptionActive]}
            >
              <MicOff size={16} color={!withAudio ? colors.bg : colors.text} />
              <Text style={[styles.audioText, !withAudio && styles.audioTextActive]}>Sem áudio</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.cameraWrap}>
          {canRecord ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              mode="video"
              mute={!withAudio}
              active
              onCameraReady={handleCameraReady}
            />
          ) : (
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>
                Permita o acesso à câmera{withAudio ? " e ao microfone" : ""} para gravar.
              </Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.bottomBar}>
          {!recording ? (
            <Pressable
              onPress={() => void handleStart()}
              disabled={!canRecord}
              style={[styles.primaryBtn, !canRecord && styles.primaryBtnDisabled]}
            >
              <View style={styles.recordCircle} />
              <Text style={styles.primaryBtnText}>Iniciar gravação</Text>
            </Pressable>
          ) : (
            <View style={styles.recordingControls}>
              {pauseAvailable ? (
                <Pressable onPress={() => void handleTogglePause()} style={styles.secondaryBtn}>
                  {isPaused ? (
                    <Play size={20} color={colors.text} fill={colors.text} />
                  ) : (
                    <Pause size={20} color={colors.text} />
                  )}
                  <Text style={styles.secondaryBtnText}>{isPaused ? "Retomar" : "Pausar"}</Text>
                </Pressable>
              ) : null}

              <Pressable onPress={handleStop} style={styles.stopBtn}>
                <Square size={18} color="#fff" fill="#fff" />
                <Text style={styles.stopBtnText}>Finalizar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
  },
  topSpacer: {
    width: 40,
  },
  topTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  topSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recDotPaused: {
    backgroundColor: colors.warning,
  },
  timerText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  audioRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  audioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  audioOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  audioText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  audioTextActive: {
    color: colors.bg,
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  recordCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  recordingControls: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.elevated,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  stopBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  stopBtnText: {
    color: colors.bg,
    fontWeight: "700",
    fontSize: 14,
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    color: colors.text,
    textAlign: "center",
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: "600",
  },
});
