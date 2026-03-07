"use client";

import { useEffect, useRef, useState } from "react";

const faqs = [
  {
    question: "Who can participate?",
    answer:
      "Cloud-Flush is open to all undergraduate and postgraduate students from any university across India. Whether you're a first-year or a final-year, all skill levels are welcome.",
  },
  {
    question: "Is it online or offline?",
    answer:
      "Cloud-Flush is a hybrid hackathon. The main event takes place on the VIT Chennai campus, but we also have limited remote participation slots for teams from other cities.",
  },
  {
    question: "What should I build?",
    answer:
      "You'll receive specific problem statements during the opening ceremony. Projects must leverage at least one AWS service. Think serverless apps, ML pipelines, IoT dashboards, or anything that runs on the cloud.",
  },
  {
    question: "Are there prizes?",
    answer:
      "Absolutely! The total prize pool is ₹20,000, including cash prizes, AWS credits, swag kits, and exciting opportunities with our sponsor companies.",
  },
  {
    question: "Do I need AWS experience?",
    answer:
      "Not at all. We'll host pre-hackathon workshops covering AWS fundamentals — from EC2 and S3 to Lambda and DynamoDB. Plus, mentors will be available throughout the event to help you get started.",
  },
  {
    question: "How many members per team?",
    answer:
      "Teams can have 2 to 4 members. Solo participation is not allowed — collaboration is key! Don't have a team? Join our Discord to find teammates.",
  },
  {
    question: "What do I need to bring?",
    answer:
      "Your laptop, charger, and enthusiasm. We provide the venue, Wi-Fi, meals, snacks, and AWS credits. Bring your A-game and a sleeping bag if you plan to power through the night.",
  },
  {
    question: "Will there be food and accommodation?",
    answer:
      "Yes! Meals, snacks, and beverages are covered for all on-site participants throughout the 24-hour event. Resting areas will be available on campus.",
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
      className={`bg-bg-surface border rounded-xl transition-all duration-300 ${
        isOpen
          ? "border-gold/30 shadow-[0_0_15px_rgba(212,160,23,0.06)]"
          : "border-gold/10 hover:border-gold/20"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="font-[family-name:var(--font-syne)] text-base sm:text-lg font-semibold text-text-primary pr-4 group-hover:text-gold transition-colors">
          {faq.question}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 ${
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
            <div className="h-[1px] bg-gold/10 mb-4" />
            <p className="font-[family-name:var(--font-syne)] text-sm sm:text-base text-text-muted leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold to-gold-light rounded-l-xl" />
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
      <div className="max-w-3xl mx-auto">
        <h2
          className={`font-[family-name:var(--font-cinzel)] text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary section-heading mb-16 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <div className="space-y-3 sm:space-y-4">
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
