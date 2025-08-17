"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function ChannelInput() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const addChannel = useStore((s) => s.addChannel);
  const setVideos = useStore((s) => s.setVideos);
  const setIsFetching = useStore((s) => s.setIsFetching);

  const onAdd = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      // Resolve to channelId on server
      const res = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value.trim() }),
      });
      if (!res.ok) throw new Error("Resolve failed");
      const { channelId } = await res.json();

      // Fetch channel meta
      const metaRes = await fetch(`/api/youtube/channel?id=${encodeURIComponent(channelId)}`);
      const meta = metaRes.ok ? await metaRes.json() : undefined;
      const resolved = { id: channelId, url: value.trim(), title: meta?.title, videoCount: meta?.videoCount, addedAt: new Date().toISOString() };
      addChannel(value.trim(), resolved);

      // Background fetch initial videos via server
      setIsFetching(true);
      const vidsRes = await fetch(`/api/youtube/videos?id=${encodeURIComponent(channelId)}`);
      if (vidsRes.ok) {
        const batch = await vidsRes.json();
        setVideos(channelId, batch.videos || []);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add channel.");
    } finally {
      setLoading(false);
      setIsFetching(false);
      setValue("");
    }
  };

  return (
    <div className="flex w-full gap-2">
      <input
        className="flex-1 rounded border border-black/10 dark:border-white/20 bg-transparent px-3 py-2"
        placeholder="Paste YouTube channel URL or @handle"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
      />
      <button
        className="inline-flex items-center gap-2 rounded bg-foreground text-background px-3 py-2 disabled:opacity-50"
        disabled={loading}
        onClick={onAdd}
        aria-label="Add channel"
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/50 border-t-transparent inline-block" /> : "+"}
        Add
      </button>
    </div>
  );
}
