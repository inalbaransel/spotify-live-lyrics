# 🎵 Spotify Now Playing Tracker

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

### 🚀 [Live Demo](https://music.baransel.site) | 📺 [Video Demo](https://youtu.be/oq9h6XLDtbE)

Real-time Spotify tracking with synchronized karaoke-style lyrics

</div>

---

## ✨ Features

- 🎸 **Real-time Spotify Integration** - Live playback tracking via Firebase backend
- 📝 **Synchronized Lyrics** - Karaoke-style word-by-word highlighting with LRC format
- 🎨 **Dynamic Theming** - Auto color extraction from album artwork
- 🎧 **Deezer Preview** - 30-second audio previews
- ⚡ **Latency Compensation** - 600ms offset for perfect sync
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Firebase Cloud Functions
- **APIs**: Spotify Web API, LRCLib, Deezer

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
BACKEND_API_URL=your_firebase_function_url
```

## 🔧 Backend Setup

Your Firebase function should return:

```json
{
  "track": "Song Name",
  "artist": "Artist Name",
  "albumArt": "https://...",
  "progressMs": 45000,
  "durationMs": 354000,
  "isPlaying": true
}
```

See [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api) for implementation details.

## 📦 Deployment

```bash
vercel --prod
```

## ‍💻 Developer

**Baransel İnal** - [baransel.site](https://baransel.site) | [@inalbaransel](https://github.com/inalbaransel)

## 📄 License

MIT

---

<div align="center">

⭐ Star this repo if you like it!

</div>
