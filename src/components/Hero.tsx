"use client";

import { useEffect, useRef, useState } from "react";

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="https://res.cloudinary.com/ddn6tl045/video/upload/v1773466607/hero-sky_vs5emv.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/28" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(123,173,255,0.14),transparent_36%),radial-gradient(circle_at_84%_22%,rgba(88,143,245,0.12),transparent_40%),linear-gradient(180deg,rgba(4,8,20,0.16)_0%,rgba(3,8,22,0.48)_78%,rgba(1,3,10,0.62)_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div
          className={`rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl backdrop-blur-md sm:p-10 transition-all duration-1000 ${
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            AWS Cloud Club VIT Chennai
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            CLOUD-FLUSH
          </h1>

          <p className="mt-4 text-lg font-medium italic tracking-wide text-white/90 sm:text-xl md:text-2xl">
            Where Code Meets Cloud. Where Ideas Become Infrastructure.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            The ultimate cloud hackathon by AWS Cloud Club VIT Chennai.
            <br className="hidden sm:block" />
            24 hours. Infinite possibilities. One leaderboard.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 sm:mt-9">
            <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5">24 Hours</span>
            <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5">March 23-24</span>
            <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5">Nethaji Auditorium</span>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("cf:open-modal", { detail: "register" }))}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-3 font-bold tracking-wide text-bg-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light"
            >
              Register Now
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button
              onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl border border-white/35 bg-white/10 px-8 py-3 font-semibold tracking-wide text-white transition-all duration-300 hover:bg-white/20"
            >
              Explore Details
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <svg
          className="h-6 w-6 text-white/55"
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
