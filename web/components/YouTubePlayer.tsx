"use client";
import { useEffect, useRef } from "react";
import YouTubePlayer from "youtube-player";

type OrientationLockArg =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary"
  | "landscape-primary"
  | "landscape-secondary";

export default function YouTubeEmbed({
  videoId,
  onEnded,
}: {
  videoId: string;
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const player = YouTubePlayer(ref.current, {
      videoId,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
    });

    const onStateChange = (e: { data: number }) => {
      // 0 = ended
      if (e.data === 0) onEnded?.();
    };
    player.on("stateChange", onStateChange);

    const onFsChange = () => {
      const anyDoc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const fsEl =
        anyDoc.fullscreenElement || anyDoc.webkitFullscreenElement || null;
      const orientation = (
        screen as Screen & {
          orientation?: {
            lock?: (s: OrientationLockArg) => Promise<void>;
            unlock?: () => void;
          };
        }
      ).orientation;
      if (fsEl && orientation?.lock) {
        orientation.lock("landscape").catch(() => {});
      } else if (!fsEl && orientation?.unlock) {
        orientation.unlock();
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener(
      "webkitfullscreenchange",
      onFsChange as EventListener
    );

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFsChange as EventListener
      );
      player.destroy();
    };
  }, [videoId, onEnded]);

  return <div className="aspect-video w-full" ref={ref} />;
}
