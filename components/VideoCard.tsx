"use client";
import { useCallback, useState } from "react";
import { useStore, WatchedStatus } from "@/store/useStore";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import YouTubeEmbed from "@/components/YouTubePlayer";

function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [
    h > 0 ? String(h) : null,
    String(h > 0 ? m.toString().padStart(2, "0") : m),
    String(s).padStart(2, "0"),
  ].filter(Boolean);
  return parts.join(":");
}

export default function VideoCard({
  channelId,
  videoId,
}: {
  channelId: string;
  videoId: string;
}) {
  const [open, setOpen] = useState(false);
  const video = useStore((s) =>
    s.videosByChannel[channelId]?.find((v) => v.id === videoId)
  );
  const markStatus = useStore((s) => s.markStatus);

  const onMark = (status: WatchedStatus) =>
    markStatus(channelId, videoId, status);
  const handleEnded = useCallback(
    () => onMark("watched"),
    [channelId, videoId]
  );
  if (!video) return null;

  return (
    <div className="rounded border p-2">
      <div className="grid grid-cols-[160px_1fr] gap-3 items-center">
        <div className="relative w-[160px] h-[90px]">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="space-y-1">
          <div className="font-medium line-clamp-2">{video.title}</div>
          <div className="text-xs opacity-70 flex gap-2 items-center">
            <span>
              {formatDistanceToNow(new Date(video.publishedAt), {
                addSuffix: true,
              })}
            </span>
            {video.duration ? (
              <span>• {formatDuration(video.duration)}</span>
            ) : null}
            <span>• {video.status}</span>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              className="rounded bg-green-600 text-white px-2 py-1"
              onClick={() => onMark("watched")}
            >
              Watched
            </button>
            <button
              className="rounded bg-yellow-600 text-white px-2 py-1"
              onClick={() => onMark("skipped")}
            >
              Skip
            </button>
            <button
              className="rounded border px-2 py-1"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Hide" : "Play"}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="mt-3">
          <YouTubeEmbed videoId={video.id} onEnded={handleEnded} />
        </div>
      )}
    </div>
  );
}
