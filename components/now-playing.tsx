"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import PreviewButton from "./preview-button";
import { motion, AnimatePresence } from "framer-motion";
import { FastAverageColor } from "fast-average-color";

const LATENCY_OFFSET_MS = 600;

interface TrackData {
  track: string;
  artist: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
  previewUrl?: string;
  id: string; // Spotify track ID
}

interface LyricLine {
  time: number; // milliseconds
  text: string;
  duration?: number; // Duration of this line in ms
}

const WaitingDots = ({
  startTime,
  duration,
  currentTime,
}: {
  startTime: number;
  duration: number;
  currentTime: number;
}) => {
  const elapsed = Math.max(0, currentTime - startTime);

  return (
    <div className="flex items-center gap-4 h-[60px]">
      {[0, 1, 2].map((i) => {
        const dotDuration = duration / 3;
        const dotStart = i * dotDuration;
        const dotEnd = (i + 1) * dotDuration;

        let dotProgress = 0;
        if (elapsed >= dotEnd) {
          dotProgress = 1;
        } else if (elapsed <= dotStart) {
          dotProgress = 0;
        } else {
          dotProgress = (elapsed - dotStart) / dotDuration;
        }

        return (
          <div
            key={i}
            className="h-5 w-5 rounded-full bg-white transition-all duration-75 ease-linear"
            style={{
              opacity: 0.2 + dotProgress * 0.8,
              transform: `scale(${1 + dotProgress * 0.1})`,
            }}
          />
        );
      })}
    </div>
  );
};

const KaraokeWord = ({
  word,
  index,
  totalWords,
  lineProgress,
}: {
  word: string;
  index: number;
  totalWords: number;
  lineProgress: number;
}) => {
  const start = (index / totalWords) * 100;
  const end = ((index + 1) / totalWords) * 100;

  let localProgress = 0;
  if (lineProgress > end) {
    localProgress = 100;
  } else if (lineProgress < start) {
    localProgress = 0;
  } else {
    localProgress = ((lineProgress - start) / (end - start)) * 100;
  }

  return (
    <span
      className="inline-block whitespace-pre"
      style={{
        backgroundImage: `linear-gradient(90deg, #ffffff ${localProgress}%, rgba(255,255,255,0.2) ${localProgress}%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        transition: "background-image 0.1s linear",
      }}
    >
      {word}{" "}
    </span>
  );
};

export default function NowPlaying() {
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [progress, setProgress] = useState(0);
  const [localProgressMs, setLocalProgressMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>("#000000");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const lastTrack = useRef<string | null>(null);
  const lastProgressUpdate = useRef<number>(Date.now());
  const localProgressMsRef = useRef(0);

  useEffect(() => {
    localProgressMsRef.current = localProgressMs;
  }, [localProgressMs]);

  useEffect(() => {
    let isMounted = true;
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(`/api/now-playing?t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (isMounted && data && data.track) {
          setTrackData(data);
          const adjustedProgressMs = data.progressMs + LATENCY_OFFSET_MS;

          if (
            (Math.abs(adjustedProgressMs - localProgressMsRef.current) > 2000 ||
              !trackData) &&
            !isPreviewPlaying
          ) {
            setLocalProgressMs(adjustedProgressMs);
            setProgress((adjustedProgressMs / data.durationMs) * 100);
          }

          if (
            !lastTrack.current ||
            lastTrack.current !== data.track + data.artist
          ) {
            setLyrics([]);
            setLyrics([{ time: 0, text: "..." }]);
            fetchLyrics(data.track, data.artist);

            if (data.albumArt) {
              const fac = new FastAverageColor();
              const img = new window.Image();
              img.crossOrigin = "anonymous";
              img.src = data.albumArt;
              img.onload = () => {
                const color = fac.getColor(img);
                setDominantColor(color.hex);
              };
            }

            lastTrack.current = data.track + data.artist;
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching now playing:", error);
        setLoading(false);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPreviewPlaying]);

  const fetchLyrics = async (track: string, artist: string) => {
    try {
      const response = await fetch(
        `/api/lyrics?track=${encodeURIComponent(
          track
        )}&artist=${encodeURIComponent(artist)}`
      );
      const data = await response.json();

      if (data.lyrics && data.lyrics.length > 0) {
        const rawLyrics: LyricLine[] = data.lyrics;
        const processedLyrics: LyricLine[] = [];

        if (rawLyrics[0].time > 3000) {
          processedLyrics.push({
            time: 0,
            text: "...",
            duration: rawLyrics[0].time,
          });
        }

        for (let i = 0; i < rawLyrics.length; i++) {
          const currentLine = rawLyrics[i];
          let duration = 0;

          if (i < rawLyrics.length - 1) {
            const nextLine = rawLyrics[i + 1];
            duration = nextLine.time - currentLine.time;
          } else {
            duration = 5000;
          }

          if (i < rawLyrics.length - 1) {
            const nextLine = rawLyrics[i + 1];
            const gap = nextLine.time - currentLine.time;

            if (gap > 10000) {
              const activeDuration = Math.min(duration, 5000);
              processedLyrics.push({
                ...currentLine,
                duration: activeDuration,
              });

              const dotsTime = currentLine.time + activeDuration + 500;
              const dotsDuration = nextLine.time - dotsTime;

              if (dotsTime < nextLine.time) {
                processedLyrics.push({
                  time: dotsTime,
                  text: "...",
                  duration: dotsDuration,
                });
              }
            } else {
              processedLyrics.push({ ...currentLine, duration });
            }
          } else {
            processedLyrics.push({ ...currentLine, duration });
          }
        }

        setLyrics(processedLyrics);
      } else {
        setLyrics([{ time: 0, text: "..." }]);
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setLyrics([{ time: 0, text: "..." }]);
    }
  };

  useEffect(() => {
    if (lyrics.length > 0 && trackData) {
      const updateLyricIndex = () => {
        const currentTime = localProgressMs;
        let index = 0;
        for (let i = 0; i < lyrics.length; i++) {
          if (currentTime >= lyrics[i].time) {
            index = i;
          } else {
            break;
          }
        }
        setCurrentLyricIndex(index);
      };
      updateLyricIndex();
    }
  }, [localProgressMs, lyrics, trackData]);

  useEffect(() => {
    if (trackData?.isPlaying && !isPreviewPlaying) {
      lastProgressUpdate.current = Date.now();

      const timer = setInterval(() => {
        const now = Date.now();
        const delta = now - lastProgressUpdate.current;
        lastProgressUpdate.current = now;

        setLocalProgressMs((prev) => {
          if (!trackData) return prev;
          const next = prev + delta;
          if (next >= trackData.durationMs) return trackData.durationMs;
          return next;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [trackData?.isPlaying, isPreviewPlaying]);

  useEffect(() => {
    if (trackData?.durationMs) {
      setProgress((localProgressMs / trackData.durationMs) * 100);
    }
  }, [localProgressMs, trackData]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getVisibleLyrics = () => {
    if (lyrics.length === 0) return [];
    const start = Math.max(0, currentLyricIndex - 1);
    const end = Math.min(start + 5, lyrics.length);

    return lyrics.slice(start, end).map((line, index) => {
      const absoluteIndex = start + index;
      const relativeIndex = absoluteIndex - currentLyricIndex;
      return {
        ...line,
        relativeIndex,
        originalIndex: absoluteIndex,
      };
    });
  };

  const getLineProgress = (line: LyricLine) => {
    if (!line.duration) return 0;
    const timeInLine = localProgressMs - line.time;
    let percentage = (timeInLine / line.duration) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handlePreviewStateChange = (playing: boolean) => {
    setIsPreviewPlaying(playing);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-800 border-t-white" />
        </div>
      </div>
    );
  }

  if (!trackData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-2xl font-semibold">Şu an çalan şarkı yok</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black font-sans text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-[20%] -top-[20%] h-[80%] w-[80%] rounded-full opacity-40 mix-blend-screen blur-[120px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          style={{ backgroundColor: dominantColor }}
        />
        <motion.div
          className="absolute -right-[20%] -bottom-[20%] h-[80%] w-[80%] rounded-full opacity-40 mix-blend-screen blur-[120px]"
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
          style={{ backgroundColor: dominantColor }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full flex-col md:flex-row">
        {/* --- MOBILE LAYOUT START --- */}

        {/* Mobile Status Indicator (Above Header) */}
        <div className="flex md:hidden items-center justify-center pt-3 pb-1 z-20">
          {trackData.isPlaying ? (
            <span className="flex items-center gap-1.5 text-[8px] font-black tracking-wider text-red-500 uppercase">
              CANLI
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
            </span>
          ) : (
            <span className="text-[8px] font-black tracking-wider text-white/30 uppercase">
              BARANSEL EN SON BUNU DİNLEDİ
            </span>
          )}
        </div>

        {/* Mobile Header: Small Art & Info */}
        <div className="flex md:hidden items-center gap-4 px-6 pb-2 z-20">
          <div className="relative h-14 w-14 shrink-0 rounded-lg shadow-lg">
            <Image
              src={trackData.albumArt || "/placeholder.svg"}
              alt="Album Art"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate leading-tight">
              {trackData.track}
            </h2>
            <p className="text-sm text-white/60 truncate font-medium">
              {trackData.artist}
            </p>
          </div>
        </div>

        {/* --- DESKTOP LEFT SIDE (Original) --- */}
        <div className="hidden md:flex w-full flex-col justify-center p-6 md:w-1/2 md:justify-between md:p-12 z-20">
          <div className="hidden flex-1 md:block" />

          {/* Live Indicator / Status Text */}
          <div className="flex items-center justify-center mb-6 opacity-80 hover:opacity-100 transition-opacity">
            {trackData.isPlaying ? (
              <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-red-500 uppercase border border-red-500/20 px-2 py-1 rounded-full bg-red-500/10">
                CANLI
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[10px] font-black tracking-[0.1em] text-white/40 uppercase border border-white/10 px-3 py-1 rounded-full bg-white/5">
                BARANSEL EN SON BUNU DİNLEDİ
              </span>
            )}
          </div>

          {/* Album Art Container with Reflection */}
          <div className="relative mb-12 group perspective-[1000px]">
            {/* Main Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              key={trackData.albumArt}
              className="relative mx-auto aspect-square w-full max-w-[360px] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-20 transition-transform duration-500 hover:scale-[1.02]"
              style={{
                boxShadow: `0 20px 80px -10px ${dominantColor}60`, // Colored glow
              }}
            >
              <Image
                src={trackData.albumArt || "/placeholder.svg"}
                alt="Album Art"
                fill
                className="object-cover rounded-xl"
                priority
              />
            </motion.div>

            {/* Reflection */}
            <div
              className="absolute top-full left-0 right-0 h-[360px] w-full max-w-[360px] mx-auto opacity-40 pointer-events-none z-10"
              style={{
                transform: "scaleY(-1) translateY(0%)",
                maskImage:
                  "linear-gradient(transparent 50%, rgba(0,0,0,0.8) 100%)",
                WebkitMaskImage:
                  "linear-gradient(transparent 50%, rgba(0,0,0,0.8) 100%)",
              }}
            >
              <Image
                src={trackData.albumArt || "/placeholder.svg"}
                alt="Reflection"
                fill
                className="object-cover rounded-xl blur-sm"
              />
            </div>
          </div>

          {/* Progress and Info */}
          <div className="mt-4 space-y-8 max-w-[400px] mx-auto w-full">
            {/* Track Info */}
            <div className="text-center space-y-1">
              <h2
                className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md line-clamp-1"
                title={trackData.track}
              >
                {trackData.track}
              </h2>
              <p className="text-lg md:text-xl text-white/60 font-medium line-clamp-1">
                {trackData.artist}
              </p>
            </div>

            {/* Modern Progress Bar */}
            <div className="space-y-2 group">
              <div className="flex items-center justify-between text-xs font-semibold text-white/40 group-hover:text-white/80 transition-colors">
                <span>{formatTime(localProgressMs)}</span>
                <span>
                  -{formatTime(trackData.durationMs - localProgressMs)}
                </span>
              </div>
              <div className="relative w-full h-1.5 rounded-full bg-white/10 cursor-pointer overflow-visible">
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  style={{ width: `${progress}%` }}
                />
                {/* Glowing Tip */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    left: `${progress}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>

            {/* Glassy Controls */}
            <div className="flex justify-center items-center gap-6 pt-4">
              <PreviewButton
                track={trackData.track}
                artist={trackData.artist}
                onPlayStateChange={handlePreviewStateChange} // Added handler
              />

              <div className="w-px h-8 bg-white/10 mx-2" />

              <a
                href={`spotify:search:${encodeURIComponent(
                  `track:${trackData.track} artist:${trackData.artist}`
                )}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `spotify:search:${encodeURIComponent(
                    `track:${trackData.track} artist:${trackData.artist}`
                  )}`;
                  setTimeout(() => {
                    window.location.href = `https://open.spotify.com/search/${encodeURIComponent(
                      `${trackData.track} ${trackData.artist}`
                    )}`;
                  }, 500);
                }}
                title="Spotify'da Aç"
                className="group relative p-3 rounded-full bg-white/5 hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-md border border-white/5"
              >
                {/* Official SimpleIcons Spotify SVG */}
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  fill="#1DB954"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Spotify</title>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.78-.719 13.44 1.5.42.3.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.279c-.6.179-1.2-.18-1.38-.721-.18-.6.18-1.2.72-1.38 4.2-1.26 11.28-1.019 15.78 1.62.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </a>

              <a
                href={`vnd.youtube://results?search_query=${encodeURIComponent(
                  trackData.track +
                    " " +
                    trackData.artist +
                    " official music video"
                )}`}
                target="_blank"
                title="YouTube'da Ara"
                className="group relative p-3 rounded-full bg-white/5 hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-md border border-white/5"
              >
                {/* Red YouTube Icon (SVG) */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-300 group-hover:rotate-12"
                >
                  <path
                    d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33Z"
                    fill="#FF0000"
                  />
                  <polygon
                    points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                    fill="white"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="hidden flex-1 md:block" />
        </div>

        {/* --- LYRICS SECTION (Shared) --- */}
        <div className="flex flex-1 flex-col justify-center overflow-hidden w-full md:w-1/2 p-4 md:p-12 relative">
          {/* Gradient Masks for Scroll Effect (Mobile Only) */}
          <div className="md:hidden absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />

          <div
            className="relative flex flex-col items-start gap-4 h-[50vh] md:h-[500px] justify-center text-left"
            style={{ perspective: "1000px" }}
          >
            {lyrics.length > 0 ? (
              <AnimatePresence mode="popLayout" initial={false}>
                {getVisibleLyrics().map((line) => {
                  const isCurrent = line.relativeIndex === 0;
                  const isPast = line.relativeIndex < 0;
                  const isDots = line.text === "...";

                  const words = line.text.split(" ");
                  const lineProgress = isCurrent ? getLineProgress(line) : 0;

                  return (
                    <motion.div
                      layout
                      key={`${line.time}-${line.text}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{
                        opacity: isPast ? 0.3 : 1,
                        y: 0,
                        scale: isCurrent ? 1 : 0.95,
                        filter: isCurrent
                          ? "blur(0px)"
                          : isPast
                          ? "blur(1.5px)"
                          : `blur(${Math.max(1, line.relativeIndex * 2)}px)`,
                      }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="w-full origin-left block"
                    >
                      {isDots ? (
                        <div className="py-2 pl-1">
                          <WaitingDots
                            startTime={line.time}
                            duration={line.duration || 3000}
                            currentTime={localProgressMs}
                          />
                        </div>
                      ) : (
                        <p
                          className={`text-balance font-bold leading-snug transition-all duration-75 block text-4xl md:text-4xl lg:text-5xl`}
                          style={{
                            color: isPast
                              ? "rgba(255,255,255,0.3)"
                              : "rgba(255,255,255,0.2)",
                          }}
                        >
                          {!isCurrent
                            ? line.text
                            : words.map((word, wIdx) => (
                                <KaraokeWord
                                  key={wIdx}
                                  word={word}
                                  index={wIdx}
                                  totalWords={words.length}
                                  lineProgress={lineProgress}
                                />
                              ))}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="w-full pl-1">
                {/* Fallback for completely empty state, simulating loop */}
                <WaitingDots
                  startTime={localProgressMs - (localProgressMs % 3000)}
                  duration={3000}
                  currentTime={localProgressMs}
                />
              </div>
            )}
          </div>

          {/* Bottom Gradient Mask (Mobile) */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
        </div>

        {/* --- MOBILE FOOTER (Controls & Progress) --- */}
        <div className="md:hidden p-6 pt-2 z-20 bg-gradient-to-t from-black/60 to-transparent pb-10">
          {/* Progress Bar (Compact) */}
          <div className="flex items-center gap-3 text-[10px] font-medium text-white/50 mb-4">
            <span className="w-8 text-right">
              {formatTime(localProgressMs)}
            </span>
            <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-white rounded-full shadow-[0_0_10px_white]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-8">
              -{formatTime(trackData.durationMs - localProgressMs)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Spacer to center main controls if needed, or just justify-between */}

            {/* Spotify Link */}
            <a
              href={`spotify:search:${encodeURIComponent(
                `track:${trackData.track} artist:${trackData.artist}`
              )}`}
              className="p-3 text-white/50 hover:text-green-500 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.78-.719 13.44 1.5.42.3.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.279c-.6.179-1.2-.18-1.38-.721-.18-.6.18-1.2.72-1.38 4.2-1.26 11.28-1.019 15.78 1.62.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </a>

            {/* Preview Button (Center) */}
            <div className="scale-90">
              <PreviewButton
                track={trackData.track}
                artist={trackData.artist}
                onPlayStateChange={handlePreviewStateChange} // Added handler for mobile layout as well
              />
            </div>

            {/* YouTube Link */}
            <a
              href={`vnd.youtube://results?search_query=${encodeURIComponent(
                trackData.track +
                  " " +
                  trackData.artist +
                  " official music video"
              )}`}
              target="_blank"
              className="p-3 text-white/50 hover:text-red-500 transition-colors"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33Z" />
                <polygon
                  points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                  fill="black"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
