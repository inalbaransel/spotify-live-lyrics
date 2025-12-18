# 🎵 Spotify Now Playing Tracker

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

### 🚀 [Live Demo](https://music.baransel.site) | 📺 [Video Demo](https://www.youtube.com/shorts/A1twl0MKRYE)

_Real-time Spotify tracking application with synchronized lyrics and karaoke-style visualization_

<img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge" alt="Status">
<img src="https://img.shields.io/badge/Mobile-Optimized-blueviolet?style=for-the-badge" alt="Mobile">

</div>

---

## 📖 Overview

A production-ready Next.js application that provides real-time Spotify playback tracking with synchronized LRC lyrics display. Features include karaoke-style word-by-word highlighting, dynamic color extraction from album art, and 30-second Deezer preview integration.

### Key Features

- **Real-time Synchronization**: Firebase Cloud Functions backend polls Spotify Web API
- **LRC Lyrics**: Millisecond-precision synchronized lyrics from LRCLib API
- **Karaoke Effect**: Word-by-word gradient animation using Framer Motion
- **Latency Compensation**: 600ms offset calibration for network delay
- **Dynamic Theming**: Dominant color extraction using fast-average-color
- **Responsive Design**: Mobile-first architecture with optimized layouts
- **Preview Playback**: Deezer API integration for 30-second previews

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- Next.js 14 (App Router)
- React 18 with TypeScript
- TailwindCSS 4 + Framer Motion
- Fast Average Color for palette extraction

**Backend:**

- Firebase Cloud Functions (Google Cloud Run)
- Spotify Web API integration
- Serverless architecture

**APIs:**

- [LRCLib](https://lrclib.net) - Synchronized lyrics (.lrc format)
- [Deezer API](https://developers.deezer.com) - Music preview streaming
- Custom Firebase endpoint - Spotify now-playing data

### Data Flow

```
Spotify API → Firebase Cloud Function → Next.js API Route → React Client
                                              ↓
                                         LRCLib API
                                              ↓
                                    Synchronized Display
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- Firebase account with Cloud Functions
- Spotify Developer account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/spotify-now-playing.git
cd spotify-now-playing

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create `.env.local`:

```env
BACKEND_API_URL=https://your-firebase-function.cloudfunctions.net/api/now-playing
```

### Backend Setup

Your Firebase Cloud Function must return this JSON structure:

```typescript
{
  track: string; // Track title
  artist: string; // Artist name
  albumArt: string; // Album cover URL
  progressMs: number; // Current playback position (ms)
  durationMs: number; // Total track duration (ms)
  isPlaying: boolean; // Playback state
}
```

**Spotify API Integration:**

1. Register app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Implement OAuth 2.0 authorization flow
3. Use `/me/player/currently-playing` endpoint
4. Deploy to Firebase Cloud Functions

---

## 🎨 Technical Highlights

### Synchronized Lyrics Algorithm

```typescript
// 600ms latency compensation for API/network delay
const LATENCY_OFFSET_MS = 600;
const adjustedProgressMs = data.progressMs + LATENCY_OFFSET_MS;

// Word-by-word gradient calculation
const wordProgress = ((lineProgress - start) / (end - start)) * 100;
```

### Progressive Enhancement

- **Desktop**: Split-screen layout with album reflection effect
- **Mobile**: Compact header, floating lyrics, bottom controls
- **Tablet**: Adaptive layout with optimized spacing

### Performance Optimizations

- Server-side rendering (SSR) for initial load
- Dynamic imports for heavy components
- Debounced API polling (5s interval)
- Memoized color calculations
- CSS containment for animation performance

---

## 📱 Responsive Design

The application implements a mobile-first approach with breakpoint-based layouts:

- **Mobile (< 768px)**: Compact header, vertical layout, touch-optimized controls
- **Tablet (768px - 1024px)**: Hybrid layout with expanded lyrics view
- **Desktop (> 1024px)**: Full split-screen with album artwork and reflection

---

## 🔧 API Routes

### `/api/now-playing`

Returns current playback state from Firebase backend.

**Response:**

```json
{
  "track": "Bohemian Rhapsody",
  "artist": "Queen",
  "albumArt": "https://...",
  "progressMs": 45000,
  "durationMs": 354000,
  "isPlaying": true
}
```

### `/api/lyrics`

Fetches synchronized lyrics in LRC format.

**Query Parameters:**

- `track`: Track name
- `artist`: Artist name

**Response:**

```json
{
  "lyrics": [
    { "time": 0, "text": "Is this the real life?", "duration": 3500 },
    { "time": 3500, "text": "Is this just fantasy?", "duration": 3200 }
  ]
}
```

### `/api/preview`

Retrieves 30-second preview URL from Deezer.

**Query Parameters:**

- `track`: Track name
- `artist`: Artist name

**Response:**

```json
{
  "previewUrl": "https://cdns-preview.dzcdn.net/..."
}
```

---

## 🎯 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Environment Variables

Set in Vercel dashboard or `.env.local`:

```env
BACKEND_API_URL=your_firebase_function_url
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Baransel İnal**

- Portfolio: [baransel.site](https://baransel.site)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## ⚠️ Legal Notice

This application uses Spotify and Deezer APIs for educational and demonstration purposes. Please review the respective platform terms of service for commercial use:

- [Spotify Developer Terms](https://developer.spotify.com/terms)
- [Deezer API Terms](https://developers.deezer.com/termsofuse)

---

<div align="center">

**Built with ❤️ using Next.js and TypeScript**

[⭐ Star this repo](https://github.com/yourusername/spotify-now-playing) | [🐛 Report Bug](https://github.com/yourusername/spotify-now-playing/issues) | [✨ Request Feature](https://github.com/yourusername/spotify-now-playing/issues)

</div>
