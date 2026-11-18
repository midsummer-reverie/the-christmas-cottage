"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

type MusicContextValue = { musicOn: boolean; setMusicOn: (enabled: boolean) => void };
const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [musicOn, setMusicOn] = useState(true);
  const playerRef = useRef<HTMLIFrameElement>(null);

  const setPlayback = (enabled: boolean) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({
      event: "command",
      func: enabled ? "playVideo" : "pauseVideo",
      args: [],
    }), "https://www.youtube.com");
  };

  const toggleMusic = () => {
    const nextEnabled = !musicOn;
    setMusicOn(nextEnabled);
    setPlayback(nextEnabled);
  };

  return <MusicContext.Provider value={{ musicOn, setMusicOn }}>
    {children}
    <button
      className="global-music-toggle"
      type="button"
      onClick={toggleMusic}
      aria-pressed={musicOn}
      aria-label={musicOn ? "ปิดเสียงเพลงพื้นหลัง" : "เปิดเพลงพื้นหลัง"}
      title={musicOn ? "ปิดเสียงเพลงพื้นหลัง" : "เปิดเพลงพื้นหลัง"}
    ><span aria-hidden="true">{musicOn ? "♫" : "♪̸"}</span>{musicOn ? "ปิดเสียงเพลง" : "เปิดเพลง"}</button>
    <iframe
      ref={playerRef}
      className="global-music-player"
      title="เพลงคริสต์มาสพื้นหลัง"
      src="https://www.youtube.com/embed/UxFrNqgRckw?autoplay=1&controls=0&loop=1&playlist=UxFrNqgRckw&playsinline=1&enablejsapi=1"
      allow="autoplay; encrypted-media"
      aria-hidden="true"
      tabIndex={-1}
      onLoad={() => { if (!musicOn) setPlayback(false); }}
    />
  </MusicContext.Provider>;
}

export function useBackgroundMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useBackgroundMusic must be used inside MusicProvider");
  return context;
}
