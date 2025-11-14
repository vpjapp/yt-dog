"use client";
import { useStore } from "@/store/useStore";

export default function ChannelList() {
  const channels = useStore((s) => s.channels);
  const videosByChannel = useStore((s) => s.videosByChannel);
  const removeChannel = useStore((s) => s.removeChannel);

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
            <div
              key={c.id}
              className="flex items-center justify-between rounded border p-3 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <a href={`/channels/${c.id}`} className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {c.title || c.url}
                </div>
                <div className="text-xs opacity-70">
                  {watched}/{total} watched
                </div>
              </a>
              <button
                className="ml-3 text-xs rounded border px-2 py-1 hover:bg-red-600 hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirm("Remove this channel and all its data?")) return;
                  removeChannel(c.id);
                }}
              >
                Remove
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
