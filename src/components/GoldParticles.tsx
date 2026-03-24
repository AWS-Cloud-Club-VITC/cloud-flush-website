"use client";

import { useId } from "react";

function SoftCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const baseId = useId().replace(/:/g, "");
  const bodyGradientId = `${baseId}-body`;
  const shadowGradientId = `${baseId}-shadow`;
  const rimGradientId = `${baseId}-rim`;

  return (
    <svg
      viewBox="0 0 520 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id={bodyGradientId} cx="52%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#EEF4FF" />
          <stop offset="42%" stopColor="#D9E4FA" />
          <stop offset="100%" stopColor="#9CADCD" />
        </radialGradient>
        <radialGradient id={shadowGradientId} cx="50%" cy="100%" r="68%">
          <stop offset="0%" stopColor="#5F7396" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#1A2640" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={rimGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="150" cy="134" rx="78" ry="52" fill={`url(#${bodyGradientId})`} />
      <ellipse cx="232" cy="116" rx="98" ry="68" fill={`url(#${bodyGradientId})`} />
      <ellipse cx="318" cy="134" rx="88" ry="58" fill={`url(#${bodyGradientId})`} />
      <ellipse cx="214" cy="158" rx="178" ry="54" fill={`url(#${bodyGradientId})`} />

      <ellipse cx="214" cy="172" rx="190" ry="34" fill={`url(#${shadowGradientId})`} />

      <ellipse cx="172" cy="102" rx="58" ry="19" fill={`url(#${rimGradientId})`} opacity="0.42" />
      <ellipse cx="248" cy="92" rx="65" ry="20" fill={`url(#${rimGradientId})`} opacity="0.45" />
      <ellipse cx="316" cy="108" rx="55" ry="17" fill={`url(#${rimGradientId})`} opacity="0.34" />
    </svg>
  );
}

export default function GoldParticles() {
  // Small twinkling background stars
  const stars = Array.from({ length: 130 }, (_, i) => {
    const seed = i * 137.508;
    const x = ((seed * 7.3) % 100).toFixed(2);
    const y = ((seed * 3.7) % 100).toFixed(2);
    const size = (0.5 + (i % 5) * 0.35).toFixed(1);
    const delay = ((i * 0.317) % 5).toFixed(2);
    const duration = (1.5 + (i % 5) * 0.7).toFixed(1);
    const isBlue = i % 6 === 0;

    return (
      <div
        key={`star-${i}`}
        className="absolute rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: isBlue ? "#BBD8FF" : "#FFFFFF",
          opacity: 0.75,
          animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
          boxShadow:
            Number(size) >= 1.5
              ? `0 0 ${Number(size) * 3}px rgba(149,192,255,0.58)`
              : "none",
        }}
        aria-hidden="true"
      />
    );
  });

  // Bright 4-pointed sparkle stars
  const sparkles = Array.from({ length: 14 }, (_, i) => {
    const seed = (i + 200) * 137.508;
    const x = ((seed * 7.3) % 88 + 6).toFixed(2);
    const y = ((seed * 3.7) % 83 + 6).toFixed(2);
    const delay = ((i * 0.73) % 4).toFixed(2);
    const size = 7 + (i % 5);

    return (
      <div
        key={`sparkle-${i}`}
        className="absolute"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          animation: `twinkle-fast ${2.5 + (i % 3) * 0.8}s ease-in-out ${delay}s infinite`,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="white" style={{ width: "100%", height: "100%" }}>
          <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" opacity="0.9" />
        </svg>
      </div>
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{zIndex: 0}}>
      {stars}
      {sparkles}

      <div
        className="absolute top-[7%] left-0 w-72 sm:w-108"
        style={{ animation: "cloud-drift 66s linear infinite", opacity: 0.46 }}
      >
        <SoftCloud className="w-full" style={{ animation: "float 16s ease-in-out infinite" }} />
      </div>

      <div
        className="absolute top-[30%] left-0 w-60 sm:w-96"
        style={{ animation: "cloud-drift-reverse 82s linear infinite 7s", opacity: 0.32 }}
      >
        <SoftCloud className="w-full" style={{ animation: "float 20s ease-in-out infinite 2s" }} />
      </div>

      <div
        className="absolute top-[56%] left-0 w-80 sm:w-124"
        style={{ animation: "cloud-drift 94s linear infinite 12s", opacity: 0.36 }}
      >
        <SoftCloud className="w-full" style={{ animation: "float 18s ease-in-out infinite 1s" }} />
      </div>

      <div
        className="absolute bottom-[8%] left-0 w-56 sm:w-88"
        style={{ animation: "cloud-drift-reverse 88s linear infinite 20s", opacity: 0.28 }}
      >
        <SoftCloud className="w-full" style={{ animation: "float 22s ease-in-out infinite 3s" }} />
      </div>

      <div
        className="absolute top-[15%] -left-48 h-72 w-152 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(128,173,255,0.16) 0%, rgba(58,101,182,0.08) 44%, transparent 72%)",
        }}
      />

      <div
        className="absolute top-[45%] -right-40 h-64 w-lg rounded-full blur-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(132,180,255,0.15) 0%, rgba(55,96,173,0.07) 45%, transparent 74%)",
        }}
      />

      {/* Subtle cool glow in hero area */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-87.5 rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(135,182,255,0.26) 0%, rgba(96,144,230,0.16) 36%, transparent 72%)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
