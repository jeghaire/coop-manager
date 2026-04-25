"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Direction = "up" | "left" | "right" | "scale" | "flip";

const initial: Record<Direction, string> = {
  up: "translateY(48px)",
  left: "translateX(-48px)",
  right: "translateX(48px)",
  scale: "scale(0.92) translateY(28px)",
  flip: "perspective(900px) rotateX(14deg) translateY(32px)"
};

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setActive(true), delay);
          observer.unobserve(el);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={
        mounted
          ? {
              opacity: active ? 1 : 0,
              transform: active ? "none" : initial[direction],
              transformOrigin: direction === "flip" ? "top center" : undefined,
              transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
