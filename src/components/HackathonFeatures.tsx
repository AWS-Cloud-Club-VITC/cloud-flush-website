"use client";

import { useEffect, useRef, useState } from "react";

type RoundNode = {
  round: number;
  title: string;
  multiplier: string;
  winners: string;
  constraint: string;
  x: number;
  y: number;
};

const roundNodes: RoundNode[] = [
  {
    round: 1,
    title: "Foundation",
    multiplier: "x1.0",
    winners: "Top 5",
    constraint: "Core domain constraints released",
    x: 8,
    y: 54,
  },
  {
    round: 2,
    title: "Pressure",
    multiplier: "x1.5",
    winners: "Top 4",
    constraint: "Performance constraints unlocked",
    x: 28,
    y: 25,
  },
  {
    round: 3,
    title: "Scale",
    multiplier: "x2.0",
    winners: "Top 3",
    constraint: "Reliability and scale constraints",
    x: 50,
    y: 66,
  },
  {
    round: 4,
    title: "Hard Mode",
    multiplier: "x2.5",
    winners: "Top 2",
    constraint: "Security and stress constraints",
    x: 72,
    y: 30,
  },
  {
    round: 5,
    title: "Finale",
    multiplier: "x3.0",
    winners: "Top 1",
    constraint: "Wildcard final constraint",
    x: 90,
    y: 56,
  },
];

export default function HackathonFeatures() {
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

  const pathD = roundNodes
    .map((node, index) => `${index === 0 ? "M" : "L"} ${node.x} ${node.y}`)
    .join(" ");

  return (
    <section ref={sectionRef} id="features" className="relative py-20 sm:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <h2
          className={`font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading text-center mx-auto mb-4 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          5-ROUND BETTING TREE AND SCORE LOGIC
        </h2>

        <p
          className={`mx-auto mb-10 max-w-4xl text-center text-sm sm:text-base text-text-muted transition-all duration-700 delay-150 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          The hackathon runs through 5 rounds. Constraints are revealed round by round. Betting outcome and
          evaluation points move the pot, then final overall score is split as 40% from betting-evaluation points
          and 60% from judge pitching.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5 sm:gap-6 mb-6">
          <article
            className={`relative overflow-hidden rounded-3xl border border-gold/20 bg-black/25 p-5 sm:p-7 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "220ms" }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80">Round Progression Tree</p>
                <span className="text-[11px] text-white/55">Horizontal Zig-Zag Node Path</span>
              </div>

              <div className="relative rounded-2xl border border-white/10 bg-black/35 p-4 sm:p-5 h-96 sm:h-105">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(212,160,23,0.35)"
                    strokeWidth="0.6"
                    strokeDasharray="2.5 2"
                    style={{ animation: "dash 4s linear infinite" }}
                  />
                </svg>

                {roundNodes.map((node, index) => (
                  <div
                    key={node.round}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-full bg-gold/20 blur-xl"
                        style={{ animation: `pulse-glow ${1.8 + index * 0.3}s ease-in-out infinite` }}
                      />

                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-gold/45 bg-black/85 flex items-center justify-center shadow-[0_0_16px_rgba(212,160,23,0.45)]">
                        <div className="text-center">
                          <p className="text-[10px] text-white/55 leading-none">R{node.round}</p>
                          <p className="text-sm sm:text-base font-bold text-white leading-tight">{node.multiplier}</p>
                        </div>
                      </div>

                      <div
                        className="absolute top-full mt-2 rounded-lg border border-gold/20 bg-black/80 px-2.5 py-1.5 min-w-24 text-center"
                        style={{ left: "50%", transform: "translateX(-50%)" }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{node.title}</p>
                        <p className="text-[11px] text-gold/90 font-semibold">{node.winners}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-gold/20 bg-black/35 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gold/80">Betting and Pot Rule</p>
                <p className="text-sm text-white/85 mt-1.5">
                  Pot movement in each round is driven by final bet + evaluation score under that round multiplier.
                  Better evaluation with better bet timing gives stronger round payout.
                </p>
              </div>
            </div>
          </article>

          <article
            className={`rounded-3xl border border-gold/20 bg-black/25 p-5 sm:p-7 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "320ms" }}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80 mb-4">Overall Score Split</p>

            <div className="flex items-center justify-center">
              <div
                className="relative h-48 w-48 rounded-full"
                style={{
                  background:
                    "conic-gradient(rgba(212,160,23,1) 0% 40%, rgba(88,166,255,0.95) 40% 100%)",
                  boxShadow: "0 0 28px rgba(212,160,23,0.25)",
                }}
              >
                <div className="absolute inset-5 rounded-full bg-[#070a12] border border-white/10 flex flex-col items-center justify-center">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Final Score</p>
                  <p className="text-2xl font-black text-white">40 / 60</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="rounded-xl border border-gold/20 bg-black/35 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                  <p className="text-xs text-gold font-semibold">40% Betting + Evaluation Points</p>
                </div>
                <p className="text-xs text-white/70">Calculated from round betting outcome and evaluation performance.</p>
              </div>

              <div className="rounded-xl border border-sky-300/25 bg-black/35 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
                  <p className="text-xs text-sky-200 font-semibold">60% Judge Pitching Score</p>
                </div>
                <p className="text-xs text-white/70">Final presentation, clarity, feasibility, and impact judged by panel.</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Score Formula</p>
              <p className="text-sm text-white/85 mt-1">
                Final Score = 0.40 x (Betting + Evaluation Points) + 0.60 x (Judge Pitching)
              </p>
            </div>
          </article>
        </div>

        <article
          className={`rounded-3xl border border-gold/20 bg-black/25 p-5 sm:p-7 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "420ms" }}
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80 mb-4">Round-by-Round Constraint Reveal</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
            {roundNodes.map((node) => (
              <div key={node.round} className="rounded-xl border border-gold/15 bg-black/35 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Round {node.round}</p>
                <p className="text-base font-semibold text-white mt-0.5">{node.title}</p>
                <p className="text-xs text-gold/90 mt-0.5">{node.multiplier} · {node.winners}</p>
                <p className="text-sm text-white/75 mt-2">{node.constraint}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
