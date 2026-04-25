"use client";

import { useRef, type ReactNode } from "react";

// Applies a subtle whole-scene 3D perspective tilt as the mouse moves across
// the hero. The mockup (TiltCard) tilts more deeply within this outer tilt,
// creating a two-layer parallax depth effect.
export function HeroScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.transform = `perspective(1400px) rotateY(${x * 2.5}deg) rotateX(${-y * 1.8}deg)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(1400px) rotateY(0deg) rotateX(0deg)`;
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        transformStyle: "preserve-3d"
      }}
    >
      {children}
    </div>
  );
}
