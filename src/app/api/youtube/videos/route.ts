import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  channelId: z.string().min(1),
  pageToken: z.string().optional(),
});

const YT_BASE = "https://www.googleapis.com/youtube/v3";

type ChannelContentDetails = {
  relatedPlaylists?: { uploads?: string };
};

type ChannelItem = {
  contentDetails?: ChannelContentDetails;
  snippet?: { title?: string };
};

type ChannelsResponse = {
  items?: ChannelItem[];
};

type PlaylistItem = {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  snippet?: {
    title?: string;
    description?: string;
    thumbnails?: Record<
      string,
      { url: string; width?: number; height?: number }
    >;
    channelId?: string;
    channelTitle?: string;
  };
};

type PlaylistItemsResponse = {
  items?: PlaylistItem[];
  nextPageToken?: string;
};

async function fetchChannelUploadsPlaylistId(
  channelId: string,
  apiKey: string
) {
  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set("part", "contentDetails,snippet");
  url.searchParams.set("id", channelId);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch channel");
  const data: ChannelsResponse = await res.json();
  const item = data.items?.[0];
  const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
  const title = item?.snippet?.title;
  if (!uploads) throw new Error("Uploads playlist not found");
  return { uploads, title };
}

async function fetchUploads(
  playlistId: string,
  apiKey: string,
  pageToken?: string
) {
  const url = new URL(`${YT_BASE}/playlistItems`);
  url.searchParams.set("part", "contentDetails,snippet");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", "25");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch uploads");
  return (await res.json()) as PlaylistItemsResponse;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing YT_API_KEY" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    channelId: searchParams.get("channelId"),
    pageToken: searchParams.get("pageToken") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const { uploads, title } = await fetchChannelUploadsPlaylistId(
      parsed.data.channelId,
      apiKey
    );
    const data = await fetchUploads(uploads, apiKey, parsed.data.pageToken);

    const items = (data.items ?? []).map((it) => ({
      id: it.contentDetails?.videoId ?? "",
      title: it.snippet?.title ?? "",
      description: it.snippet?.description,
      publishedAt: it.contentDetails?.videoPublishedAt ?? "",
      thumbnails: it.snippet?.thumbnails ?? {},
      channelId: it.snippet?.channelId ?? parsed.data.channelId,
      channelTitle: title || it.snippet?.channelTitle,
    }));

    return NextResponse.json({ items, nextPageToken: data.nextPageToken });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
