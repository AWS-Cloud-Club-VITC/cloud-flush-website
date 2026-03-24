"use client";

import Image from "next/image";
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
    value: "400+",
    unit: "",
    label: "Expected Builders",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-7.54 0" />
      </svg>
    ),
    value: "₹50K+",
    unit: "",
    label: "Prize Pool",
  },
];

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
          className={`font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading text-center mx-auto mb-16 transition-all duration-700 ${
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
              <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/15 bg-black/20 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                <Image
                  src="/home-page/about.png"
                  alt="Team seated around a strategy table"
                  width={640}
                  height={640}
                  className="h-auto w-full rounded-2xl object-contain"
                  priority
                />
                <p className="sr-only" aria-label="Image attribution">
                  Image source:{" "}
                  <a
                    href="https://pikbest.com/png-images/group-of-people-sitting-around-a-table-3d-cartoon_11707168.html"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-gold/80 hover:text-gold underline underline-offset-2"
                  >
                    Pikbest
                  </a>
                </p>
              </div>
          </div>

          <div
            className={`transition-all duration-700 delay-400 ${
              inView
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            <div className="space-y-5 font-(family-name:--font-space-grotesk) text-text-primary/80 text-base sm:text-lg leading-relaxed">
              <p>
                <span className="text-gold font-semibold">Cloud-Flush</span> is
                the flagship 24-hour build sprint by AWS Cloud Club VIT Chennai,
                designed for students who want to ship real cloud-native
                products under pressure.
              </p>
              <p>
                Teams move from idea to deployment in a single day, with support
                from mentors, technical checkpoints, and practical product
                feedback. It is not just another PPT event; your final score
                depends on what runs.
              </p>
              <p>
                This edition also includes a live strategy layer through the
                internal betting board, where performance and decision-making
                meet in real time for leaders and members.
              </p>
              <p className="text-gold/80 italic font-medium">
                Build fast. Deploy smart. Outlast the clock.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`relative bg-transparent border border-gold/15 rounded-xl p-6 sm:p-8 text-center group hover:border-gold/35 hover:shadow-[0_0_20px_rgba(212,160,23,0.08)] transition-all duration-500 stat-card-glow tilt-card ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${600 + i * 150}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-gold to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-center mb-4 text-gold/70 group-hover:text-gold transition-colors">
                {stat.icon}
              </div>
              <div className="font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl font-bold text-gold-glow counter-glow">
                {stat.value}
                {stat.unit && (
                  <span className="text-lg sm:text-xl ml-1 text-text-muted">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="mt-2 font-(family-name:--font-space-grotesk) text-sm text-text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
