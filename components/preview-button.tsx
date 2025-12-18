"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PreviewButtonProps {
  track: string;
  artist: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function PreviewButton({
  track,
  artist,
  onPlayStateChange,
}: PreviewButtonProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audio) {
      audio.pause();
      audio.remove();
      setAudio(null);
    }
    setIsPlaying(false);
    onPlayStateChange?.(false);
    setPreviewUrl(null);

    fetch(
      `/api/preview?track=${encodeURIComponent(
        track
      )}&artist=${encodeURIComponent(artist)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      })
      .catch(console.error);
  }, [track, artist]);

  const togglePreview = () => {
    if (!previewUrl) return;

    if (isPlaying && audio) {
      audio.pause();
      audio.remove();
      setAudio(null);
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      if (audio) {
        audio.pause();
        audio.remove();
        setAudio(null);
      }

      const newAudio = new Audio(previewUrl);
      newAudio.volume = 0.5;
      newAudio.addEventListener("ended", () => {
        setIsPlaying(false);
        onPlayStateChange?.(false);
        setAudio(null);
      });

      const playPromise = newAudio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudio(newAudio);
            setIsPlaying(true);
            onPlayStateChange?.(true);
          })
          .catch((error) => {
            console.error("Error playing preview:", error);
            newAudio.remove();
            setIsPlaying(false);
            onPlayStateChange?.(false);
          });
      } else {
        setAudio(newAudio);
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    }
  };

  if (!previewUrl) {
    return null;
  }

  return (
    <button
      onClick={togglePreview}
      className="group relative flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95 backdrop-blur-md border border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />

      {isPlaying ? (
        <>
          <div className="flex items-center gap-1 h-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-green-400 rounded-full"
                animate={{
                  height: [4, 12, 6, 14, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="relative z-10">Durdur</span>
        </>
      ) : (
        <>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-white"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="relative z-10">Ön İzleme</span>
        </>
      )}
    </button>
  );
}
