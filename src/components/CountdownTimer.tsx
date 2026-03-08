"use client";

import { useEffect, useState, useRef } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date("2026-03-23T09:00:00+05:30").getTime();

function getTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = Math.max(0, TARGET_DATE - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const prevValue = useRef(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prevValue.current !== value) {
      setFlipping(true);
      const timer = setTimeout(() => setFlipping(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="countdown-digit relative bg-bg-surface border border-gold/20 rounded-lg sm:rounded-xl px-3 py-3 sm:px-5 sm:py-4 min-w-[60px] sm:min-w-[90px] shadow-[inset_0_0_20px_rgba(212,160,23,0.05),0_0_15px_rgba(212,160,23,0.1)] hover:shadow-[inset_0_0_30px_rgba(212,160,23,0.1),0_0_25px_rgba(212,160,23,0.2)] transition-shadow duration-500">
        <span
          className={`font-[family-name:var(--font-jetbrains)] text-3xl sm:text-5xl lg:text-6xl font-bold text-gold-glow block text-center ${
            flipping ? "digit-flip" : ""
          }`}
        >
          {display}
        </span>
      </div>
      <span className="font-[family-name:var(--font-syne)] text-[10px] sm:text-xs text-text-muted uppercase tracking-[0.25em]">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-3 sm:gap-4 lg:gap-6 justify-center">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <CountdownUnit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 lg:gap-6 justify-center">
      <CountdownUnit value={timeLeft.days} label="Days" />
      <CountdownUnit value={timeLeft.hours} label="Hours" />
      <CountdownUnit value={timeLeft.minutes} label="Minutes" />
      <CountdownUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}
