"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore, selectUnwatched } from "@/store/useStore";
import VideoCard from "@/components/VideoCard";

export default function ChannelDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [page, setPage] = useState(0);
  const setVideos = useStore((s) => s.setVideos);
  const isFetching = useStore((s) => s.isFetching);
  const setIsFetching = useStore((s) => s.setIsFetching);

  const visible = useStore(
    useMemo(() => selectUnwatched(id, 10 * (page + 1)), [id, page])
  );

  useEffect(() => {
    const run = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(
          `/api/youtube/videos?id=${encodeURIComponent(id)}`
        );
        if (res.ok) {
          const batch = await res.json();
          setVideos(id, batch.videos || []);
        }
      } finally {
        setIsFetching(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
