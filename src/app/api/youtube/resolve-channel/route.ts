import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ url: z.string().url() });

function extractHandleOrId(url: URL): { handle?: string; channelId?: string } {
  const host = url.host.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  // Examples:
  // https://www.youtube.com/@vercel
  // https://www.youtube.com/channel/UCZkjWyyLvzWeoVWEpRemrDQ
  if (host.endsWith("youtube.com")) {
    if (parts[0]?.startsWith("@")) {
      return { handle: parts[0] };
    }
    if (parts[0] === "channel" && parts[1]) {
      return { channelId: parts[1] };
    }
  }
  return {};
}

async function getChannelIdFromHandle(handle: string, apiKey: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", handle);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to resolve handle");
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    channelId: item.snippet?.channelId as string,
    title: item.snippet?.channelTitle as string,
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing YT_API_KEY" }, { status: 500 });
  }
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const inputUrl = new URL(parsed.data.url);
  const { handle, channelId } = extractHandleOrId(inputUrl);

  try {
    if (channelId) {
      return NextResponse.json({ channelId });
    }
    if (handle) {
      const resolved = await getChannelIdFromHandle(handle, apiKey);
      if (!resolved)
        return NextResponse.json(
          { error: "Channel not found" },
          { status: 404 }
        );
      return NextResponse.json(resolved);
    }
    return NextResponse.json({ error: "Unsupported URL" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
