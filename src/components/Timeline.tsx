"use client";

import { useEffect, useRef, useState } from "react";

const events = [
  {
    time: "March 20, 2025",
    title: "Registration Opens",
    description:
      "Team registrations go live. Form your squad of 2–4 and sign up on the portal.",
  },
  {
    time: "April 10, 2025",
    title: "Registration Closes",
    description:
      "Last day to register. Late entries will not be accepted — don't miss out.",
  },
  {
    time: "April 15 — 9:00 AM",
    title: "Hackathon Kickoff",
    description:
      "Opening ceremony, problem statement reveal, and AWS credits distribution. Let the hacking begin.",
  },
  {
    time: "April 15 — 2:00 PM",
    title: "Mentor Sessions",
    description:
      "One-on-one and group mentoring with AWS architects, industry leaders, and VIT faculty.",
  },
  {
    time: "April 15 — 9:00 PM",
    title: "Mid-Review",
    description:
      "Present your progress to the review panel. Feedback rounds to sharpen your solution.",
  },
  {
    time: "April 16 — 9:00 PM",
    title: "Final Submission",
    description:
      "Code freeze. Submit your project repo, demo video, and deployment URL.",
  },
  {
    time: "April 17 — 11:00 AM",
    title: "Results & Awards",
    description:
      "Grand jury evaluation, winner announcement, and prize distribution ceremony.",
  },
];

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative py-20 sm:py-32 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className={`font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading text-center mx-auto mb-16 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          EVENT TIMELINE
        </h2>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute left-4 sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-0.5 bg-linear-to-b from-gold/60 via-gold/30 to-transparent" />

          <div className="space-y-8 sm:space-y-12">
            {events.map((event, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={`relative flex items-start transition-all duration-700 ${
                    inView
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${200 + i * 120}ms` }}
                >
                  <div className="sm:hidden flex items-start gap-4 pl-10 w-full">
                    <div className="absolute left-2.5 top-1 timeline-dot" />
                    <div className="bg-transparent border border-gold/15 rounded-xl p-4 w-full hover:border-gold/30 transition-colors">
                      <span className="font-(family-name:--font-space-grotesk) text-xs text-gold/80 block mb-1">
                        {event.time}
                      </span>
                      <h3 className="font-(family-name:--font-space-grotesk) text-base font-semibold text-text-primary">
                        {event.title}
                      </h3>
                      <p className="mt-1 font-(family-name:--font-space-grotesk) text-sm text-text-muted leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:grid sm:grid-cols-[1fr_40px_1fr] w-full items-start">
                    <div
                      className={`${
                        isLeft ? "text-right pr-8" : ""
                      }`}
                    >
                      {isLeft && (
                        <div className="bg-transparent border border-gold/15 rounded-xl p-5 hover:border-gold/30 transition-colors inline-block text-left max-w-md ml-auto">
                          <span className="font-(family-name:--font-space-grotesk) text-xs text-gold/80 block mb-1">
                            {event.time}
                          </span>
                          <h3 className="font-(family-name:--font-space-grotesk) text-lg font-semibold text-text-primary">
                            {event.title}
                          </h3>
                          <p className="mt-1 font-(family-name:--font-space-grotesk) text-sm text-text-muted leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center">
                      <div className="timeline-dot mt-2" />
                    </div>

                    <div className={`${!isLeft ? "pl-8" : ""}`}>
                      {!isLeft && (
                        <div className="bg-transparent border border-gold/15 rounded-xl p-5 hover:border-gold/30 transition-colors inline-block text-left max-w-md">
                          <span className="font-(family-name:--font-space-grotesk) text-xs text-gold/80 block mb-1">
                            {event.time}
                          </span>
                          <h3 className="font-(family-name:--font-space-grotesk) text-lg font-semibold text-text-primary">
                            {event.title}
                          </h3>
                          <p className="mt-1 font-(family-name:--font-space-grotesk) text-sm text-text-muted leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
