import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { type NextRequest } from "next/server";

interface LyricLine {
  time: number;
  text: string;
}

function parseLRC(lrcString: string): LyricLine[] {
  const lines = lrcString.split("\n");
  const lyrics: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.?(\d{2})?\](.*)/);

    if (match) {
      const minutes = Number.parseInt(match[1]);
      const seconds = Number.parseInt(match[2]);
      const centiseconds = match[3] ? Number.parseInt(match[3]) : 0;
      const text = match[4].trim();

      if (text) {
        const timeInMs = (minutes * 60 + seconds) * 1000 + centiseconds * 10;
        lyrics.push({ time: timeInMs, text });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const track = searchParams.get("track");
    const artist = searchParams.get("artist");

    console.log(`[API] Fetching lyrics for: ${track} - ${artist}`);

    if (!track || !artist) {
      return NextResponse.json(
        { error: "Track and artist are required" },
        { status: 400 }
      );
    }

    const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      artist
    )}&track_name=${encodeURIComponent(track)}`;

    console.log(`[API] Calling: ${lrclibUrl}`);
    const response = await fetch(lrclibUrl);

    if (response.ok) {
      const data = await response.json();
      console.log(`[API] Response found: ${!!data.syncedLyrics}`);

      if (data.syncedLyrics) {
        const lyrics = parseLRC(data.syncedLyrics);
        console.log(`[API] Parsed ${lyrics.length} lines`);
        return NextResponse.json({ lyrics });
      }
    } else {
      console.log(`[API] LRCLib response not ok: ${response.status}`);
    }

    console.log(`[API] No lyrics found, returning empty`);
    return NextResponse.json({ lyrics: [] });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return NextResponse.json({ lyrics: [] });
  }
}
