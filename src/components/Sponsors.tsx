"use client";

import { useEffect, useRef, useState } from "react";

const sponsors = [
  {
    name: "Sponsor 1",
    tier: "Gold",
    logo: (
      <svg viewBox="0 0 120 40" fill="none" className="h-10 w-auto">
        <rect x="2" y="2" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <path d="M14 14h12v4H14zM14 22h8v4h-8z" fill="currentColor" opacity="0.4" />
        <text x="46" y="26" fill="currentColor" fontSize="16" fontFamily="var(--font-syne)" fontWeight="600">Sponsor 1</text>
      </svg>
    ),
  },
  {
    name: "Sponsor 2",
    tier: "Gold",
    logo: (
      <svg viewBox="0 0 130 40" fill="none" className="h-10 w-auto">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <path d="M12 22c0-6 4-10 8-10s8 4 8 10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <circle cx="20" cy="18" r="3" fill="currentColor" opacity="0.4" />
        <text x="44" y="26" fill="currentColor" fontSize="16" fontFamily="var(--font-syne)" fontWeight="600">Sponsor 2</text>
      </svg>
    ),
  },
];

export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="sponsors"
      className="relative py-20 sm:py-32 px-4 bg-bg-surface/30"
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className={`font-[family-name:var(--font-cinzel)] text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading mb-4 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          OUR SPONSORS
        </h2>
        <p
          className={`font-[family-name:var(--font-syne)] text-text-muted text-base sm:text-lg mb-14 max-w-2xl transition-all duration-700 delay-200 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Cloud-Flush is made possible by the generous support of our sponsors and partners.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {sponsors.map((sponsor, i) => (
            <div
              key={i}
              className={`group relative bg-bg-surface border border-gold/10 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center hover:border-gold/30 hover:shadow-[0_0_25px_rgba(212,160,23,0.08)] transition-all duration-500 ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent group-hover:via-gold/80 transition-all" />

              <span className="absolute top-4 right-4 font-[family-name:var(--font-jetbrains)] text-[10px] tracking-[0.2em] uppercase text-gold/50 border border-gold/15 rounded-full px-3 py-1">
                {sponsor.tier}
              </span>

              <div className="text-text-muted group-hover:text-gold/80 transition-colors duration-500 mb-4">
                {sponsor.logo}
              </div>

              <div className="glow-ring rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
