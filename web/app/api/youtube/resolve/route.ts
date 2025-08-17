import { NextRequest, NextResponse } from "next/server";
import { fetchChannelIdByHandle, parseChannelUrl } from "@/lib/youtube";

export async function POST(req: NextRequest) {
  const { input } = (await req.json()) as { input: string };
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Server missing YT_API_KEY" },
      { status: 500 }
    );

  const parsed = parseChannelUrl(input);
  let channelId: string | null = null;
  if (parsed.type === "id") channelId = parsed.value;
  else channelId = await fetchChannelIdByHandle(parsed.value, apiKey);

  if (!channelId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ channelId });
}
