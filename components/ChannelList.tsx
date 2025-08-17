"use client";
import { useStore } from "@/store/useStore";

export default function ChannelList() {
  const channels = useStore((s) => s.channels);
  const videosByChannel = useStore((s) => s.videosByChannel);

  return (
    <div className="space-y-2">
      {channels.length === 0 ? (
        <div className="text-sm opacity-70">No channels yet.</div>
      ) : (
        channels.map((c) => {
          const list = videosByChannel[c.id] || [];
          const watched = list.filter((v) => v.status === "watched").length;
          const total = list.length || c.videoCount || 0;
          return (
            <a key={c.id} href={`/channels/${c.id}`} className="block rounded border p-3 hover:bg-black/5 dark:hover:bg-white/5">
              <div className="text-sm font-medium">{c.title || c.url}</div>
              <div className="text-xs opacity-70">{watched}/{total} watched</div>
            </a>
          );
        })
      )}
    </div>
  );
}
