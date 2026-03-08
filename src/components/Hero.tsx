"use client";

import { useEffect, useRef, useState } from "react";
import CountdownTimer from "./CountdownTimer";

function CloudSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 500 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <circle cx="95"  cy="148" r="44" fill="#D4A017" />
      <circle cx="145" cy="132" r="60" fill="#D4A017" />
      <circle cx="212" cy="110" r="72" fill="#D4A017" />
      <circle cx="255" cy="90"  r="58" fill="#D4A017" />
      <circle cx="302" cy="102" r="78" fill="#D4A017" />
      <circle cx="388" cy="118" r="66" fill="#D4A017" />
      <circle cx="448" cy="138" r="50" fill="#D4A017" />
      <rect   x="72"  y="140" width="400" height="60" fill="#D4A017" />
      <ellipse cx="272" cy="200" rx="214" ry="18" fill="#D4A017" />
    </svg>
  );
}

export default function Hero() {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 scan-line"
    >
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#080808]" aria-hidden="true" />

      {/* Aurora glow blobs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            width: "90vw",
            height: "90vw",
            top: "-30%",
            left: "-20%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,160,23,0.18) 0%, rgba(212,160,23,0.06) 40%, transparent 65%)",
            animation: "aurora-drift-1 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "80vw",
            height: "80vw",
            bottom: "-25%",
            right: "-15%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,140,0,0.14) 0%, rgba(212,160,23,0.04) 40%, transparent 65%)",
            animation: "aurora-drift-2 26s ease-in-out infinite 6s",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "65vw",
            height: "65vw",
            top: "5%",
            left: "18%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(240,192,64,0.10) 0%, transparent 60%)",
            animation: "aurora-drift-3 32s ease-in-out infinite 12s",
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(212,160,23,0.3) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 25%, transparent 70%)",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />

      {/* Vignette depth overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(14,8,0,0.25) 0%, rgba(8,8,8,0.95) 78%)",
        }}
        aria-hidden="true"
      />

      {/* Gold-tinted drifting clouds */}
      <CloudSVG
        className="absolute top-[6%] left-0 w-100 sm:w-150"
        style={{ animation: "cloud-drift 42s linear infinite", filter: "blur(8px)", opacity: 0.10 } as React.CSSProperties}
      />
      <CloudSVG
        className="absolute top-[40%] left-0 w-85 sm:w-130"
        style={{ animation: "cloud-drift-reverse 56s linear infinite 10s", filter: "blur(10px)", opacity: 0.07 } as React.CSSProperties}
      />
      <CloudSVG
        className="absolute bottom-[10%] left-0 w-75 sm:w-110"
        style={{ animation: "cloud-drift 70s linear infinite 28s", filter: "blur(9px)", opacity: 0.09 } as React.CSSProperties}
      />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <h1
          className={`font-[family-name:var(--font-space-grotesk)] text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none cf-title-gradient hero-title-glow cursor-default whitespace-nowrap text-center transition-all duration-1000 ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          CLOUD-FLUSH
        </h1>

        <p
          className={`mt-4 sm:mt-6 font-[family-name:var(--font-syne)] text-lg sm:text-xl md:text-2xl text-text-primary/80 font-light italic tracking-wide transition-all duration-1000 delay-300 ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          Where Code Meets Cloud. Where Ideas Become Infrastructure.
        </p>

        <p
          className={`mt-3 sm:mt-4 font-[family-name:var(--font-syne)] text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          The ultimate cloud hackathon by AWS Cloud Club VIT Chennai.
          <br className="hidden sm:block" />{" "}
          24 hours. Infinite possibilities. One leaderboard.
        </p>

        <div
          className={`mt-8 sm:mt-12 transition-all duration-1000 delay-700 ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <CountdownTimer />
        </div>

        <div
          className={`mt-8 sm:mt-12 transition-all duration-1000 delay-[900ms] ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("cf:open-modal", { detail: "register" }))}
            className="magnetic-hover inline-flex items-center gap-2 px-8 sm:px-12 py-3 sm:py-4 bg-gold text-bg-primary font-[family-name:var(--font-syne)] font-bold text-base sm:text-lg tracking-wider rounded-lg hover:bg-gold-light hover:shadow-[0_0_30px_rgba(212,160,23,0.5),0_0_60px_rgba(212,160,23,0.2)] transition-all duration-300 active:scale-95 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              Register Now
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-gold/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
