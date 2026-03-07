"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    value: "24",
    unit: "Hours",
    label: "Non-Stop Hacking",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    value: "100+",
    unit: "",
    label: "Hackers Expected",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-7.54 0" />
      </svg>
    ),
    value: "₹20K",
    unit: "",
    label: "Prize Pool",
  },
];

function CircuitCloudSVG() {
  return (
    <svg viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[350px] mx-auto">
      <path
        d="M320 230H90C50.24 230 18 197.76 18 158s32.24-72 72-72c2.53 0 5.03.14 7.5.41C110.68 37.15 137.03 10 169 10c38.66 0 70.9 28.16 77.04 65.14A61.8 61.8 0 01265 66c34.12 0 61.75 27.63 61.75 61.75 0 .7-.01 1.38-.04 2.06A51.44 51.44 0 01375 180c0 27.61-22.39 50-50 50h-5z"
        stroke="url(#circuit-grad)"
        strokeWidth="2"
        fill="rgba(212,160,23,0.03)"
      />
      <line x1="90" y1="158" x2="140" y2="158" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="50" strokeDashoffset="50" style={{ animation: "dash 1.5s ease forwards 0.5s" }} />
      <line x1="140" y1="158" x2="140" y2="120" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="38" strokeDashoffset="38" style={{ animation: "dash 1.2s ease forwards 0.8s" }} />
      <line x1="140" y1="120" x2="200" y2="120" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="60" strokeDashoffset="60" style={{ animation: "dash 1.5s ease forwards 1.1s" }} />
      <line x1="200" y1="120" x2="200" y2="180" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="60" strokeDashoffset="60" style={{ animation: "dash 1.5s ease forwards 1.4s" }} />
      <line x1="200" y1="180" x2="260" y2="180" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="60" strokeDashoffset="60" style={{ animation: "dash 1.5s ease forwards 1.7s" }} />
      <line x1="260" y1="180" x2="260" y2="140" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="40" strokeDashoffset="40" style={{ animation: "dash 1.2s ease forwards 2.0s" }} />
      <line x1="260" y1="140" x2="320" y2="140" stroke="#D4A017" strokeWidth="1" opacity="0.4" strokeDasharray="60" strokeDashoffset="60" style={{ animation: "dash 1.5s ease forwards 2.3s" }} />
      <line x1="150" y1="190" x2="220" y2="190" stroke="#D4A017" strokeWidth="1" opacity="0.3" strokeDasharray="70" strokeDashoffset="70" style={{ animation: "dash 1.5s ease forwards 1.0s" }} />
      <line x1="220" y1="190" x2="220" y2="160" stroke="#D4A017" strokeWidth="1" opacity="0.3" strokeDasharray="30" strokeDashoffset="30" style={{ animation: "dash 1.2s ease forwards 1.5s" }} />
      <line x1="170" y1="100" x2="170" y2="150" stroke="#D4A017" strokeWidth="1" opacity="0.3" strokeDasharray="50" strokeDashoffset="50" style={{ animation: "dash 1.5s ease forwards 0.7s" }} />
      <line x1="170" y1="150" x2="240" y2="150" stroke="#D4A017" strokeWidth="1" opacity="0.3" strokeDasharray="70" strokeDashoffset="70" style={{ animation: "dash 1.5s ease forwards 1.2s" }} />
      <circle cx="140" cy="158" r="4" fill="#D4A017" opacity="0.8" />
      <circle cx="140" cy="120" r="4" fill="#FFD700" opacity="0.6" />
      <circle cx="200" cy="120" r="4" fill="#D4A017" opacity="0.8" />
      <circle cx="200" cy="180" r="4" fill="#FFD700" opacity="0.6" />
      <circle cx="260" cy="180" r="4" fill="#D4A017" opacity="0.8" />
      <circle cx="260" cy="140" r="4" fill="#FFD700" opacity="0.6" />
      <circle cx="170" cy="150" r="3" fill="#D4A017" opacity="0.5" />
      <circle cx="220" cy="190" r="3" fill="#D4A017" opacity="0.5" />
      <circle cx="200" cy="150" r="30" fill="url(#glow-center)" opacity="0.3" />
      <path d="M195 125l-10 25h10l-5 25 20-30h-12l7-20z" fill="#FFD700" opacity="0.7" />
      <text x="200" y="280" textAnchor="middle" fill="#D4A017" fontSize="14" fontFamily="monospace" opacity="0.5">
        ☁ CLOUD INFRASTRUCTURE
      </text>
      <defs>
        <linearGradient id="circuit-grad" x1="18" y1="10" x2="375" y2="230">
          <stop stopColor="#D4A017" />
          <stop offset="0.5" stopColor="#FFD700" />
          <stop offset="1" stopColor="#D4A017" />
        </linearGradient>
        <radialGradient id="glow-center" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFD700" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function About() {
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
      id="about"
      className="relative py-20 sm:py-32 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className={`font-[family-name:var(--font-cinzel)] text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading mb-16 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          ABOUT THE HACKATHON
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          <div
            className={`transition-all duration-700 delay-200 ${
              inView
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <CircuitCloudSVG />
          </div>

          <div
            className={`transition-all duration-700 delay-400 ${
              inView
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <div className="space-y-5 font-[family-name:var(--font-syne)] text-text-primary/80 text-base sm:text-lg leading-relaxed">
              <p>
                <span className="text-gold font-semibold">Cloud-Flush</span> is
                the flagship hackathon of AWS Cloud Club VIT Chennai — a
                high-octane, 24-hour sprint where developers, designers, and
                dreamers collide to build the future on the cloud.
              </p>
              <p>
                Whether you&apos;re deploying serverless architectures, training
                ML models on SageMaker, or crafting full-stack applications with
                AWS Amplify — this is your arena to innovate, break limits, and
                ship real products.
              </p>
              <p>
                Expect world-class mentors, cutting-edge workshops, and the
                thrill of competing for prizes worth ₹20,000. No gatekeeping
                — just pure, raw engineering passion.
              </p>
              <p className="text-gold/80 italic font-medium">
                Build it. Deploy it. Flush the competition.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`relative bg-bg-surface border border-gold/10 rounded-xl p-6 sm:p-8 text-center group hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,160,23,0.08)] transition-all duration-500 stat-card-glow tilt-card ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${600 + i * 150}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-center mb-4 text-gold/70 group-hover:text-gold transition-colors">
                {stat.icon}
              </div>
              <div className="font-[family-name:var(--font-jetbrains)] text-3xl sm:text-4xl font-bold text-gold-glow counter-glow">
                {stat.value}
                {stat.unit && (
                  <span className="text-lg sm:text-xl ml-1 text-text-muted">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="mt-2 font-[family-name:var(--font-syne)] text-sm text-text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
