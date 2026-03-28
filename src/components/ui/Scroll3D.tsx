"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  maxRotateDeg?: number;
  maxTranslatePx?: number;
};

export function Scroll3D({
  children,
  className,
  maxRotateDeg = 7,
  maxTranslatePx = 10,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    function update() {
      raf = 0;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const vw = window.innerWidth || 1;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const nx = (cx - vw / 2) / (vw / 2);
      const ny = (cy - vh / 2) / (vh / 2);

      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
      const x = clamp(nx, -1, 1);
      const y = clamp(ny, -1, 1);

      const rotateY = x * maxRotateDeg;
      const rotateX = -y * maxRotateDeg;

      const visible = rect.bottom > 0 && rect.top < vh;
      const strength = visible
        ? clamp(1 - Math.abs(y) * 0.55, 0.35, 1)
        : 0;

      const translateY = -y * maxTranslatePx * strength;

      node.style.transform = `perspective(900px) translate3d(0, ${translateY.toFixed(
        2,
      )}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    }

    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [maxRotateDeg, maxTranslatePx]);

  return (
    <div
      ref={ref}
      className={`will-change-transform transition-transform duration-200 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
