"use client";

import { useEffect, useRef, useState } from "react";
import {
  isSpeechSupported,
  speakKorean,
  claimPlayback,
  releasePlayback,
} from "@/lib/speech";
import { useSpeechSupported } from "@/lib/useSpeechSupported";
import { labels } from "@/lib/labels";

type Props = {
  /** Văn bản tiếng Hàn để đọc TTS */
  text: string;
  /** File MP3 tùy chọn — ưu tiên hơn TTS, lỗi file thì fallback TTS một lần */
  audioUrl?: string | null;
  rate?: number;
  size?: "sm" | "md";
  className?: string;
};

export function AudioButton({ text, audioUrl, rate, size = "sm", className }: Props) {
  // SSR-safe: useSyncExternalStore trả false lúc SSR/hydration, giá trị thật sau đó
  const speechSupported = useSpeechSupported();
  const status: "ready" | "unavailable" =
    audioUrl || speechSupported ? "ready" : "unavailable";
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  function stop() {
    const s = stopRef.current;
    stopRef.current = null;
    if (s) {
      releasePlayback(s);
      s();
    }
    setPlaying(false);
  }

  function playTts() {
    const cancel = speakKorean(text, {
      rate,
      onEnd: () => {
        stopRef.current = null;
        setPlaying(false);
      },
      onError: () => {
        stopRef.current = null;
        setPlaying(false);
      },
    });
    // speakKorean tự claim/release; stopRef chỉ cần gọi cancel + reset UI
    stopRef.current = () => {
      cancel();
      setPlaying(false);
    };
    setPlaying(true);
  }

  function playFile(url: string) {
    let audio = audioRef.current;
    if (!audio || audio.src !== url) {
      audio = new Audio(url);
      audioRef.current = audio;
    }

    let fellBack = false;
    const stopFile = () => {
      audio!.pause();
      audio!.currentTime = 0;
      releasePlayback(stopFile);
      if (stopRef.current === stopFile) stopRef.current = null;
      setPlaying(false);
    };

    audio.onended = () => {
      releasePlayback(stopFile);
      if (stopRef.current === stopFile) stopRef.current = null;
      setPlaying(false);
    };
    audio.onerror = () => {
      // File hỏng → fallback TTS đúng một lần
      releasePlayback(stopFile);
      if (fellBack) return;
      fellBack = true;
      if (isSpeechSupported()) {
        playTts();
      } else {
        if (stopRef.current === stopFile) stopRef.current = null;
        setPlaying(false);
      }
    };

    claimPlayback(stopFile);
    stopRef.current = stopFile;
    setPlaying(true);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      audio!.onerror?.(new Event("error") as never);
    });
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (status !== "ready") return;

    if (playing) {
      stop();
      return;
    }
    if (audioUrl) {
      playFile(audioUrl);
    } else {
      playTts();
    }
  }

  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const icon = size === "md" ? 20 : 15;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "unavailable"}
      title={status === "unavailable" ? labels.lesson.audioUnavailable : undefined}
      aria-label={playing ? labels.lesson.stopAudio : labels.lesson.playAudio}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full transition ${
        playing
          ? "animate-pulse bg-brand-100 text-brand-700"
          : status === "unavailable"
            ? "cursor-not-allowed text-slate-300"
            : "text-brand-500 hover:bg-brand-50 hover:text-brand-700"
      } ${className ?? ""}`}
    >
      {/* Icon loa */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
      </svg>
    </button>
  );
}
