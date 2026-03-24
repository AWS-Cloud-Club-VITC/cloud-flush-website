"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const sponsors = [
  {
    name: "Institution of Engineers (India) - VIT Chennai Chapter",
    tier: "Gold",
    logoSrc: "/home-page/ie-logo.png",
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
      className="relative py-20 sm:py-32 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className={`font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading text-center mx-auto mb-4 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          OUR SPONSORS
        </h2>
        <p
          className={`font-(family-name:--font-space-grotesk) text-text-muted text-base sm:text-lg mb-14 max-w-2xl transition-all duration-700 delay-200 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ marginInline: "auto", textAlign: "center" }}
        >
          Cloud-Flush is made possible by the generous support of our sponsors and partners.
        </p>

        <div className="grid grid-cols-1 gap-6 mb-12 max-w-md mx-auto">
          {sponsors.map((sponsor, i) => (
            <div
              key={i}
              className={`group relative bg-transparent border border-gold/15 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center hover:border-gold/35 hover:shadow-[0_0_25px_rgba(212,160,23,0.08)] transition-all duration-500 ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-linear-to-r from-transparent via-gold/40 to-transparent group-hover:via-gold/80 transition-all" />

              <span className="absolute top-4 right-4 font-(family-name:--font-space-grotesk) text-[10px] tracking-[0.2em] uppercase text-gold/50 border border-gold/15 rounded-full px-3 py-1">
                {sponsor.tier}
              </span>

              <div className="mb-4">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border border-gold/35 ring-2 ring-gold/20 bg-white/90">
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <p className="text-sm sm:text-base font-semibold text-text-primary">{sponsor.name}</p>

              <div className="glow-ring rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
