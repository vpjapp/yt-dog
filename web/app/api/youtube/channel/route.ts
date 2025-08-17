import { NextRequest, NextResponse } from "next/server";
import { fetchChannelMeta } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Server missing YT_API_KEY" },
      { status: 500 }
    );
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const meta = await fetchChannelMeta(id, apiKey);
  if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meta);
}
