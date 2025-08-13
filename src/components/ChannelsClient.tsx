"use client";
import { useEffect, useMemo, useState } from "react";
import { markSkipped, markWatched, loadState } from "@/lib/storage";
import type { ResolveChannelResponse } from "@/types/youtube";

type Channel = { channelId: string; title?: string };

type Video = {
  id: string;
  title: string;
  description?: string;
  publishedAt: string;
  thumbnails: Record<string, { url: string; width?: number; height?: number }>;
  channelId: string;
  channelTitle?: string;
};

type VideosResp = { items: Video[]; nextPageToken?: string };

export default function ChannelsClient() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [videos, setVideos] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);

  // Load channels from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("yt-dog:channels");
      if (raw) setChannels(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("yt-dog:channels", JSON.stringify(channels));
  }, [channels]);

  const state = loadState();

  const selectedVideos = useMemo(
    () => (selected ? videos[selected] ?? [] : []),
    [selected, videos]
  );

  async function addChannel(url: string) {
    setError(null);
    try {
      const res = await fetch("/api/youtube/resolve-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to add channel");
      const json = (await res.json()) as ResolveChannelResponse;
      if (channels.some((c) => c.channelId === json.channelId)) return;
      setChannels((prev) => [
        ...prev,
        { channelId: json.channelId, title: json.title },
      ]);
      setSelected(json.channelId);
      void loadChannelVideos(json.channelId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadChannelVideos(channelId: string) {
    setLoading(true);
    try {
      let next: string | undefined = undefined;
      const all: Video[] = [];
      do {
        const url = new URL("/api/youtube/videos", window.location.origin);
        url.searchParams.set("channelId", channelId);
        if (next) url.searchParams.set("pageToken", next);
        const res = await fetch(url.toString());
        if (!res.ok)
          throw new Error((await res.json()).error || "Failed to load videos");
        const data = (await res.json()) as VideosResp;
        all.push(...data.items);
        next = data.nextPageToken;
      } while (next);
      setVideos((prev) => ({
        ...prev,
        [channelId]: all.sort((a, b) =>
          b.publishedAt.localeCompare(a.publishedAt)
        ),
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onWatch(id: string) {
    markWatched(id);
    setVideos((prev) => ({ ...prev }));
  }
  function onSkip(id: string) {
    markSkipped(id);
    setVideos((prev) => ({ ...prev }));
  }

  const suggestions = useMemo(() => {
    const vids = selectedVideos.filter(
      (v) => !state.watched[v.id] && !state.skipped[v.id]
    );
    return vids.slice(0, 10);
  }, [selectedVideos, state.watched, state.skipped]);

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            void addChannel(input.trim());
            setInput("");
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste YouTube channel URL (@handle or /channel/ID)"
            className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500">
            Add
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <h2 className="mt-6 mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Channels
        </h2>
        <ul className="space-y-1">
          {channels.map((c) => (
            <li key={c.channelId}>
              <button
                onClick={() => {
                  setSelected(c.channelId);
                  if (!videos[c.channelId]) void loadChannelVideos(c.channelId);
                }}
                className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                  selected === c.channelId
                    ? "bg-neutral-100 dark:bg-neutral-900"
                    : ""
                }`}
              >
                {c.title || c.channelId}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selected ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {channels.find((c) => c.channelId === selected)?.title ||
                  selected}
              </h2>
              <button
                onClick={() => void loadChannelVideos(selected)}
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Suggestions (newest unwatched)
            </h3>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((v) => (
                <VideoCard
                  key={v.id}
                  v={v}
                  onWatch={onWatch}
                  onSkip={onSkip}
                  onPlay={setPlaying}
                />
              ))}
            </div>

            <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
              All Videos
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedVideos.map((v) => (
                <VideoCard
                  key={v.id}
                  v={v}
                  onWatch={onWatch}
                  onSkip={onSkip}
                  onPlay={setPlaying}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Add a channel to get started.
          </p>
        )}
      </div>

      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-neutral-950 p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-white line-clamp-1">
                {playing.title}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onWatch(playing.id);
                    setPlaying(null);
                  }}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-500"
                >
                  Mark watched
                </button>
                <button
                  onClick={() => setPlaying(null)}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-white hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${playing.id}`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  v,
  onWatch,
  onSkip,
  onPlay,
}: {
  v: Video;
  onWatch: (id: string) => void;
  onSkip: (id: string) => void;
  onPlay: (v: Video) => void;
}) {
  const thumb = v.thumbnails?.medium?.url || v.thumbnails?.default?.url;
  const watched = !!loadState().watched[v.id];
  const skipped = !!loadState().skipped[v.id];

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
      <button onClick={() => onPlay(v)} className="block w-full">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt="thumbnail"
            className="mb-2 aspect-video w-full rounded-md object-cover"
          />
        ) : (
          <div className="mb-2 aspect-video w-full rounded-md bg-neutral-200 dark:bg-neutral-800" />
        )}
      </button>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="line-clamp-2 text-sm font-medium">{v.title}</h4>
          <p className="text-xs text-neutral-500">
            {new Date(v.publishedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onWatch(v.id)}
            className={`rounded-md px-2 py-1 text-xs ${
              watched
                ? "bg-green-600 text-white"
                : "border border-neutral-300 dark:border-neutral-700"
            }`}
            title="Mark watched"
          >
            ✓
          </button>
          <button
            onClick={() => onSkip(v.id)}
            className={`rounded-md px-2 py-1 text-xs ${
              skipped
                ? "bg-amber-600 text-white"
                : "border border-neutral-300 dark:border-neutral-700"
            }`}
            title="Skip"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
