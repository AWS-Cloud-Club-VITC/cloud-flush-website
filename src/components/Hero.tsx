"use client";

import { useEffect, useRef, useState } from "react";
import CountdownTimer from "./CountdownTimer";
import GoldParticles from "./GoldParticles";

function CloudSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M160 90H45C25.67 90 10 74.33 10 55s15.67-35 35-35c1.23 0 2.44.07 3.64.2C55.8 8.34 68.57 0 83 0c18.78 0 34.44 13.68 37.42 31.64A30.04 30.04 0 01130 28c16.57 0 30 13.43 30 30 0 .34-.01.67-.02 1A24.99 24.99 0 01185 83c0 3.87-3.13 7-7 7h-18z"
        fill="url(#cloud-grad)"
        opacity="0.06"
      />
      <defs>
        <linearGradient id="cloud-grad" x1="10" y1="0" x2="185" y2="90">
          <stop stopColor="#D4A017" />
          <stop offset="1" stopColor="#FFD700" stopOpacity="0.3" />
        </linearGradient>
      </defs>
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
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, #1C1600 0%, #0A0A0A 60%, #0A0A0A 100%)",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 8s ease infinite",
        }}
        aria-hidden="true"
      />

      <GoldParticles />

      <CloudSVG className="absolute top-[10%] left-[-5%] w-[300px] sm:w-[500px] opacity-30" style={{ animation: "cloud-drift 25s ease-in-out infinite" } as React.CSSProperties} />
      <CloudSVG className="absolute bottom-[15%] right-[-5%] w-[250px] sm:w-[400px] opacity-20" style={{ animation: "cloud-drift-reverse 30s ease-in-out infinite" } as React.CSSProperties} />
      <CloudSVG className="absolute top-[50%] left-[20%] w-[200px] opacity-10" style={{ animation: "cloud-drift 35s ease-in-out infinite 5s" } as React.CSSProperties} />

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <h1
          className={`font-[family-name:var(--font-cinzel)] text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider gold-text-gradient hero-title-glow cursor-default whitespace-nowrap text-center transition-all duration-1000 ${
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
          <a
            href="#"
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
          </a>
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
