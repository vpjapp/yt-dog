import { NextRequest, NextResponse } from "next/server";
import { fetchChannelVideos } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Server missing YT_API_KEY" }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const pageToken = searchParams.get("pageToken") || undefined;
  try {
    const data = await fetchChannelVideos(id, apiKey, pageToken);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
