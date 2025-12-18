import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mockData = {
      track: "Bohemian Rhapsody",
      artist: "Queen",
      albumArt: "/abstract-soundscape.png",
      progressMs: 45000,
      durationMs: 354000,
      isPlaying: true,
      previewUrl: null,
    };

    // Backend API: Firebase Cloud Function üzerinde çalışan Spotify entegrasyonu
    // Bu endpoint, Spotify Web API'sine bağlanarak şu anda çalan şarkı bilgilerini alır
    //
    // Dönen veri formatı:
    // {
    //   track: "Şarkı Adı",
    //   artist: "Sanatçı Adı",
    //   albumArt: "https://...",
    //   progressMs: 45000,      // Şarkının geçen süresi (milisaniye)
    //   durationMs: 354000,     // Şarkının toplam süresi (milisaniye)
    //   isPlaying: true         // Çalma durumu
    // }
    //
    // Kendi backend'inizi kurmak için:
    // 1. Firebase Cloud Functions veya benzeri bir servis kullanın
    // 2. Spotify Web API dokümantasyonuna bakın: https://developer.spotify.com/documentation/web-api
    // 3. Bu URL'i kendi endpoint'inizle değiştirin
    const response = await fetch("MY_BACKEND_API_ENDPOINT_HERE", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return NextResponse.json(
      { error: "Failed to fetch now playing data" },
      { status: 500 }
    );
  }
}
