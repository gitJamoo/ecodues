"use client";

import { useEffect, useRef } from "react";

export function VideoBackdrop({ src }: { src: string }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const zoneRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      // On mobile: just autoplay; no scroll scrub to avoid iOS fixed-position jank
      video.loop = true;
      video.play().catch(() => {});
      return;
    }

    // Desktop: scrub video with scroll
    const zone    = zoneRef.current;
    const overlay = overlayRef.current;
    if (!zone || !overlay) return;

    video.pause();

    const update = () => {
      if (!video.duration) return;
      const rect      = zone.getBoundingClientRect();
      const scrollable = zone.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { video.currentTime = 0; return; }
      const progress  = Math.max(0, Math.min(1, -rect.top / scrollable));
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
      {/* translateZ(0) forces GPU compositing — fixes iOS Safari fixed-position jank */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" } as React.CSSProperties}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
        <div ref={overlayRef} className="absolute inset-0 bg-black" style={{ opacity: 0.55 }} />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.72) 100%)" }}
        />
      </div>
      {/* Scroll zone — 150 dvh on mobile (shorter, avoids dead-space), 300 dvh on desktop */}
      <div ref={zoneRef} className="h-[150dvh] sm:h-[300dvh]" aria-hidden />
    </>
  );
}
