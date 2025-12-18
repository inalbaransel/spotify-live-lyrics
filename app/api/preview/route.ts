import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const artist = searchParams.get("artist");

  if (!track || !artist) {
    return new Response(
      JSON.stringify({ error: "Track and artist are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const searchResponse = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(
        `${track} ${artist}`
      )}&limit=1`
    );
    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(JSON.stringify({ error: "Track not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const previewUrl = searchData.data[0].preview;

    return new Response(JSON.stringify({ previewUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching preview URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch preview URL" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
