'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState } from 'react';

const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), { ssr: false });

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress]         = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  // Map scroll position inside this section to 0→1
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      const scrolled   = window.scrollY - el.offsetTop;
      setProgress(Math.max(0, Math.min(1, scrolled / scrollable)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fallback for reduced-motion users
  if (reducedMotion) {
    return (
      <div className="h-screen bg-gradient-to-b from-green-950 to-green-700 flex flex-col items-center justify-center text-center px-6">
        <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">EcoDues</p>
        <h1 className="text-5xl font-semibold text-white tracking-tight leading-tight">
          Your AI has a footprint.<br />
          <span className="text-green-300">Erase it — twice.</span>
        </h1>
      </div>
    );
  }

  // Overlay text phases
  const titleOpacity  = Math.max(0, 1 - progress * 5);
  const midOpacity    = Math.max(0, Math.min(1, (progress - 0.3) / 0.12) * (1 - (progress - 0.55) / 0.12));
  const endOpacity    = Math.max(0, (progress - 0.82) / 0.14);

  return (
    /* 500vh tall so the user scrolls through the animation */
    <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
      {/* Canvas stays fixed to the viewport during scroll */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Scene progress={progress} />

        {/* ── Overlay layer ── */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">

          {/* Phase 1: title (progress 0 → 0.2) */}
          <div
            className="text-center px-6 transition-none"
            style={{ opacity: titleOpacity }}
          >
            <p className="text-white/60 text-xs font-semibold tracking-[0.25em] uppercase mb-5">EcoDues</p>
            <h1 className="text-5xl sm:text-6xl font-semibold text-white tracking-tight leading-tight drop-shadow-2xl">
              Your AI has a footprint.<br />
              <span className="text-green-300">Erase it — twice.</span>
            </h1>
            <div className="mt-10 flex flex-col items-center gap-2 text-white/40">
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <span className="text-2xl animate-bounce">↓</span>
            </div>
          </div>

          {/* Phase 2: midpoint caption (progress ~0.3 → 0.55) */}
          <div
            className="absolute text-center px-6 transition-none"
            style={{ opacity: midOpacity }}
          >
            <p className="text-white text-2xl font-semibold drop-shadow-xl max-w-md leading-snug">
              Every prompt leaves a mark.<br />
              <span className="text-orange-300">Dead soil. Warmer skies.</span>
            </p>
          </div>

          {/* Phase 3: end caption (progress > 0.82) */}
          <div
            className="absolute bottom-16 text-center px-6 transition-none"
            style={{ opacity: endOpacity }}
          >
            <p className="text-white text-xl font-semibold drop-shadow-xl max-w-lg leading-snug">
              Your donations make this possible.<br />
              <span className="text-green-300">Twice the damage, back to the planet.</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/60 transition-none" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
