"use client";

import { useEffect, useRef } from "react";

export function VideoBackdrop({ src, scrollHeight = "300vh" }: { src: string; scrollHeight?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const zone = zoneRef.current;
    const overlay = overlayRef.current;
    if (!video || !zone || !overlay) return;

    video.pause();

    const update = () => {
      if (!video.duration) return;
      const rect = zone.getBoundingClientRect();
      const scrollable = zone.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        video.currentTime = 0;
        return;
      }
      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      video.currentTime = progress * video.duration;
      // Sine curve: dark (0.55) → bright (0.10) → dark (0.55)
      overlay.style.opacity = String(0.55 - 0.45 * Math.sin(progress * Math.PI));
    };

    video.addEventListener("loadedmetadata", update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      video.removeEventListener("loadedmetadata", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      {/* Fixed video pinned behind all content */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
        {/* Darkening overlay — opacity driven by scroll progress */}
        <div ref={overlayRef} className="absolute inset-0 bg-black" style={{ opacity: 0.55 }} />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.72) 100%)",
          }}
        />
      </div>
      {/* Scroll zone — inline spacer that drives the scrub */}
      <div ref={zoneRef} style={{ height: scrollHeight }} aria-hidden />
    </>
  );
}
