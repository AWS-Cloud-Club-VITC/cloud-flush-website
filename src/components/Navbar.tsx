"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-bg-primary/80 backdrop-blur-xl border-b border-gold/20 shadow-[0_1px_20px_rgba(212,160,23,0.1)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-visible">
              <div className="orbit-ring" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-gold group-hover:border-gold-light transition-all duration-300 shadow-[0_0_20px_rgba(212,160,23,0.35)] group-hover:shadow-[0_0_30px_rgba(212,160,23,0.55)]">
                <Image
                  src="/awscc_logo.webp"
                  alt="AWS Cloud Club VIT Chennai"
                  fill
                  className="object-cover brightness-110"
                  priority
                />
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-[family-name:var(--font-cinzel)] text-sm font-bold text-text-primary tracking-wider group-hover:text-gold-light transition-colors duration-300">
                AWS Cloud Club
              </span>
              <span className="text-[10px] text-text-muted tracking-[0.2em] uppercase">
                VIT Chennai
              </span>
            </div>
          </a>

          <a
            href="#"
            className="gold-shimmer-btn relative px-6 py-2 sm:px-8 sm:py-2.5 rounded-full border border-gold/60 text-gold font-[family-name:var(--font-syne)] font-semibold text-sm tracking-wider hover:bg-gold/10 hover:border-gold transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,160,23,0.2)]"
          >
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}
