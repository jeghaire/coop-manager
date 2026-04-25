"use client";

import { useRef, type ReactNode } from "react";

export function TiltCard({
  children,
  intensity = 8,
  className
}: {
  children: ReactNode;
  intensity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.transform = `perspective(1000px) rotateY(${x * intensity * 0.5}deg) rotateX(${-y * intensity * 0.4}deg) scale3d(1.015,1.015,1.015)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)`;
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        transition: "transform 0.18s cubic-bezier(0.16,1,0.3,1)",
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
    >
      {children}
    </div>
  );
}
