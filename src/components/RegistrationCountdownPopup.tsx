"use client";

import { useEffect, useMemo, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTargetDate(now: Date) {
  const target = new Date(now.getFullYear(), 2, 23, 23, 59, 59);
  if (now > target) {
    return new Date(now.getFullYear() + 1, 2, 23, 23, 59, 59);
  }
  return target;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function RegistrationCountdownPopup() {
  const targetDate = useMemo(() => getTargetDate(new Date()), []);
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetDate));

  useEffect(() => {
    setOpen(true);
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-gold/40 bg-bg-surface p-6 sm:p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-3 text-white/60 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          ✕
        </button>

        <p className="text-xs uppercase tracking-[0.25em] text-gold/75">Registration Alert</p>
        <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-text-primary">Register Fast</h3>
        <p className="mt-2 text-text-muted">Time left until March 23</p>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          <TimeBox value={timeLeft.days} label="Days" />
          <TimeBox value={timeLeft.hours} label="Hours" />
          <TimeBox value={timeLeft.minutes} label="Minutes" />
          <TimeBox value={timeLeft.seconds} label="Seconds" />
        </div>

        <button
          onClick={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("cf:open-modal", { detail: "register" }));
          }}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gold px-7 py-3 font-bold tracking-wide text-bg-primary transition-all duration-300 hover:bg-gold-light"
        >
          Register Now
        </button>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-gold/25 bg-black/25 py-3">
      <div className="text-xl sm:text-2xl font-bold text-gold-glow">{String(value).padStart(2, "0")}</div>
      <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-text-muted">{label}</div>
    </div>
  );
}
