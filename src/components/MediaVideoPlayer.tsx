import { useEffect } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { resolveMediaUrl } from "@/utils/media-url";

interface MediaVideoPlayerProps {
  uri: string;
  active: boolean;
}

export function MediaVideoPlayer({ uri, active }: MediaVideoPlayerProps) {
  const source = resolveMediaUrl(uri);

  const player = useVideoPlayer(source || null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    if (!source) return;

    if (!active) {
      player.pause();
    }
  }, [active, player, source]);

  if (!source) return null;

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      nativeControls
      contentFit="contain"
    />
  );
}
