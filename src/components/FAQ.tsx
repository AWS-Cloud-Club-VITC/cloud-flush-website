"use client";

import { useEffect, useRef, useState } from "react";

const faqs = [
  {
    question: "Who can participate?",
    answer:
      "Any student team (2-4 members) can participate.",
  },
  {
    question: "Where is it happening?",
    answer:
      "Primary venue is VIT Chennai, with event instructions shared to all selected teams.",
  },
  {
    question: "What should we build?",
    answer:
      "A working cloud-based solution aligned to the released problem statement.",
  },
  {
    question: "How does betting work?",
    answer:
      "Each round has initial bet, decision phase (hold/double/withdraw), then settlement from score + final bet.",
  },
  {
    question: "Do we need AWS experience?",
    answer:
      "No. Basic familiarity helps, and mentors guide teams during the sprint.",
  },
  {
    question: "What do we submit?",
    answer:
      "Repository, deployed demo, and final presentation as per round instructions.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`bg-transparent border rounded-xl transition-all duration-300 ${
        isOpen
          ? "border-gold/30 shadow-[0_0_15px_rgba(212,160,23,0.06)]"
          : "border-gold/15 hover:border-gold/25"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="font-(family-name:--font-space-grotesk) text-base sm:text-lg font-semibold text-text-primary pr-4 group-hover:text-gold transition-colors">
          {faq.question}
        </span>
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-gold bg-gold/10 rotate-45"
              : "border-gold/30 group-hover:border-gold"
          }`}
        >
          <svg
            className="w-4 h-4 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>

      <div className={`faq-content ${isOpen ? "open" : ""}`}>
        <div>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <div className="h-px bg-gold/10 mb-4" />
            <p className="font-(family-name:--font-space-grotesk) text-sm sm:text-base text-text-muted leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-linear-to-b from-gold to-gold-light rounded-l-xl" />
      )}
    </div>
  );
}

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
      id="faq"
      className="relative py-20 sm:py-32 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className={`font-(family-name:--font-space-grotesk) text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading text-center mx-auto mb-16 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          QUICK FAQ
        </h2>

        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`relative transition-all duration-700 ${
                inView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            >
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
