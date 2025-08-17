import { z } from "zod";

export const YoutubeVideoSchema = z.object({
  id: z.string(), // YouTube videoId
  title: z.string(),
  description: z.string().optional(),
  publishedAt: z.string(), // ISO string
  thumbnail: z.string().url(),
  channelId: z.string(),
  channelTitle: z.string(),
  duration: z.number().optional(), // seconds, may require extra fetch
});

export type YoutubeVideo = z.infer<typeof YoutubeVideoSchema>;

export const ChannelSchema = z.object({
  id: z.string(), // channelId
  url: z.string().url(),
  title: z.string().optional(),
  videoCount: z.number().optional(),
});
export type Channel = z.infer<typeof ChannelSchema>;

// Helpers for parsing channel URL to channel handle or id
export function parseChannelUrl(input: string): { type: "handle" | "id" | "custom" | "unknown"; value: string } {
  try {
    const u = new URL(input);
    if (u.hostname !== "www.youtube.com" && u.hostname !== "youtube.com" && u.hostname !== "m.youtube.com") {
      return { type: "unknown", value: input };
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return { type: "unknown", value: input };
    if (parts[0] === "@") {
      return { type: "handle", value: parts.join("/") };
    }
    if (parts[0] === "channel" && parts[1]) {
      return { type: "id", value: parts[1] };
    }
    if (parts[0] === "c" && parts[1]) {
      return { type: "custom", value: parts[1] };
    }
    if (parts[0].startsWith("@")) {
      return { type: "handle", value: parts[0] };
    }
    return { type: "unknown", value: input };
  } catch {
    return { type: "unknown", value: input };
  }
}

// Minimal fetch wrappers using YouTube Data API v3
// Requires YT_API_KEY on server
const API_BASE = "https://www.googleapis.com/youtube/v3";

export async function fetchChannelIdByHandle(handleOrCustom: string, apiKey: string): Promise<string | null> {
  // handle may be like "@handle" or custom name, use search with type=channel
  const q = handleOrCustom.startsWith("@") ? handleOrCustom : handleOrCustom;
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) return null;
  const data = (await resp.json()) as {
    items?: Array<{ snippet?: { channelId?: string } }>;
  };
  const item = data.items?.[0];
  return item?.snippet?.channelId ?? null;
}

export async function fetchChannelMeta(channelId: string, apiKey: string) {
  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);
  const resp = await fetch(url.toString());
  if (!resp.ok) return null;
  const data = (await resp.json()) as {
    items?: Array<{ id: string; snippet?: { title?: string }; statistics?: { videoCount?: string } }>;
  };
  const c = data.items?.[0];
  if (!c) return null;
  return {
    id: c.id as string,
    title: c.snippet?.title as string,
    videoCount: Number(c.statistics?.videoCount ?? 0),
  } as const;
}

type SearchVideoItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
    channelId?: string;
    channelTitle?: string;
  };
};

function parseIso8601DurationToSeconds(iso: string): number {
  const re = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const m = re.exec(iso);
  if (!m) return 0;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

async function fetchDurations(ids: string[], apiKey: string): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("key", apiKey);
  const resp = await fetch(url.toString());
  if (!resp.ok) return {};
  const data = (await resp.json()) as {
    items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
  };
  const map: Record<string, number> = {};
  for (const it of data.items || []) {
    const sec = it.contentDetails?.duration ? parseIso8601DurationToSeconds(it.contentDetails.duration) : 0;
    map[it.id] = sec;
  }
  return map;
}

export async function fetchChannelVideos(channelId: string, apiKey: string, pageToken?: string) {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("maxResults", "50");
  url.searchParams.set("order", "date");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error("Failed to fetch videos");
  const data = (await resp.json()) as { items?: SearchVideoItem[]; nextPageToken?: string };
  const raw = (data.items || []).map((it) => ({
    id: it.id?.videoId || "",
    title: it.snippet?.title || "",
    description: it.snippet?.description,
    publishedAt: it.snippet?.publishedAt || new Date(0).toISOString(),
    thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "https://i.ytimg.com/img/no_thumbnail.jpg",
    channelId: it.snippet?.channelId || channelId,
    channelTitle: it.snippet?.channelTitle || "",
  }));
  const ids = raw.map((r) => r.id).filter(Boolean);
  const durationMap = await fetchDurations(ids, apiKey);
  const items = raw.map((r) => ({ ...r, duration: durationMap[r.id] }));
  const valid = items.filter((v) => YoutubeVideoSchema.safeParse(v).success);
  return { videos: valid, nextPageToken: data.nextPageToken };
}
