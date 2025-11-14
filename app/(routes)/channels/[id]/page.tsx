"use client";
import VideoCard from "@/components/VideoCard";
import { useStore } from "@/store/useStore";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

export default function ChannelDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [page, setPage] = useState(0);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const setVideos = useStore((s) => s.setVideos);
  const isFetching = useStore((s) => s.isFetching);
  const setIsFetching = useStore((s) => s.setIsFetching);

  // Stable selector using useShallow (zustand v5)
  const list = useStore(useShallow((s) => s.videosByChannel[id] || []));

  // Derive visible items outside of useStore
  const visible = useMemo(() => {
    const unwatched = list.filter((v) => v.status !== "watched");
    const sorted = [...unwatched].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    return sorted.slice(0, 10 * (page + 1));
  }, [list, page]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(
          `/api/youtube/videos?id=${encodeURIComponent(id)}`
        );
        if (!res.ok) return;
        const batch = await res.json();
        if (cancelled) return;
        setVideos(id, batch.videos || []);
        setNextToken(batch.nextPageToken ?? null);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // When there are fewer than 10 unwatched videos and we have more pages,
  // fetch the next page in the background.
  useEffect(() => {
    if (!nextToken) return;
    const unwatchedCount = list.filter((v) => v.status !== "watched").length;
    if (unwatchedCount >= 10) return;

    let cancelled = false;
    const run = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(
          `/api/youtube/videos?id=${encodeURIComponent(
            id
          )}&pageToken=${encodeURIComponent(nextToken)}`
        );
        if (!res.ok) return;
        const batch = await res.json();
        if (cancelled) return;
        setVideos(id, batch.videos || []);
        setNextToken(batch.nextPageToken ?? null);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, list, nextToken, setIsFetching, setVideos]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Channel</h1>
        {isFetching && (
          <div
            className="h-4 w-4 rounded-full bg-foreground animate-pulse"
            aria-label="Loading"
          />
        )}
      </div>
      <div className="grid gap-3">
        {visible.map((v) => (
          <VideoCard key={v.id} channelId={id} videoId={v.id} />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button
          className="rounded border px-3 py-2"
          onClick={() => setPage((p) => p + 1)}
        >
          Next 10
        </button>
      </div>
    </div>
  );
}
