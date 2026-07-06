"use client";

import { useEffect, useRef } from "react";

export function VideoBackdrop({
  src,
  scrollLength = "h-[50dvh] sm:h-[75dvh]",
}: {
  src: string;
  /** Tailwind height class(es) for the scroll-scrub zone. Defaults to 50dvh mobile / 75dvh desktop. */
  scrollLength?: string;
}) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const zoneRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video   = videoRef.current;
    const zone    = zoneRef.current;
    const overlay = overlayRef.current;
    if (!video || !zone || !overlay) return;

    let target  = 0;   // desired progress (0..1) from latest scroll
    let current = 0;   // rendered progress (LERPs toward target)
    let unlocked = false;
    let rafId = 0;

    // iOS Safari won't seek a paused video that hasn't been played yet.
    // Play + pause once to unlock currentTime writes.
    const unlockSeek = () => {
      if (unlocked) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => { video.pause(); unlocked = true; }).catch(() => {});
      } else {
        video.pause(); unlocked = true;
      }
    };

    const readProgress = () => {
      const scrollable = zone.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const rect = zone.getBoundingClientRect();
      return Math.max(0, Math.min(1, -rect.top / scrollable));
    };

    const onScroll = () => { target = readProgress(); };

    // rAF loop: LERP current toward target, drive video + overlay from `current`
    const tick = () => {
      // 0.15 reaches target in ~25 frames on 60 Hz — snappier than 0.12 while still smooth
      current += (target - current) * 0.15;
      // Snap to target on very small deltas to stop asymptotic drift
      if (Math.abs(target - current) < 0.0005) current = target;

      const dur = video.duration;
      if (dur && !Number.isNaN(dur)) {
        const t = current * dur;
        // Skip trivially-small seeks (< ~half a frame at 30fps)
        if (Math.abs(video.currentTime - t) > 0.016) {
          try { video.currentTime = t; } catch { /* iOS not ready yet */ }
        }
      }
      // Overlay: sine curve — dark (0.55) → bright (0.10) → dark (0.55)
      overlay.style.opacity = String(0.55 - 0.45 * Math.sin(current * Math.PI));

      rafId = requestAnimationFrame(tick);
    };

    const onReady = () => {
      target  = readProgress();
      current = target;
      unlockSeek();
    };

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplay", onReady);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // First user interaction on iOS — good moment to unlock
    window.addEventListener("touchstart", unlockSeek, { passive: true });
    window.addEventListener("click", unlockSeek);

    if (video.readyState >= 1) onReady();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplay", onReady);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("touchstart", unlockSeek);
      window.removeEventListener("click", unlockSeek);
    };
  }, []);

  return (
    <>
      {/* translate3d forces a GPU compositing layer — fixes iOS fixed-position repaint jitter */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ transform: "translate3d(0,0,0)", WebkitTransform: "translate3d(0,0,0)", willChange: "transform" } as React.CSSProperties}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          className="w-full h-full object-cover"
        />
        <div ref={overlayRef} className="absolute inset-0 bg-black" style={{ opacity: 0.55, willChange: "opacity" }} />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.72) 100%)" }}
        />
      </div>
      {/* Scroll zone — dvh units respect iOS dynamic address bar.
          Defaults to 50dvh mobile / 75dvh desktop so the Steps section is
          reached quickly while still giving the video time to play.
          Override via the scrollLength prop if a longer scrub zone is needed. */}
      <div ref={zoneRef} className={scrollLength} aria-hidden />
    </>
  );
}
