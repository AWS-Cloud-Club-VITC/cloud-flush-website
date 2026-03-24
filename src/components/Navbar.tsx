"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import AuthModal from "@/components/AuthModal";

type ModalMode = "login" | "register" | null;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setModalMode((e as CustomEvent<ModalMode>).detail);
    window.addEventListener("cf:open-modal", handler);
    return () => window.removeEventListener("cf:open-modal", handler);
  }, []);

  return (
    <>
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
                  src="/aws-logo.png"
                  alt="AWS Cloud Club VIT Chennai"
                  fill
                  className="object-cover brightness-110"
                  priority
                />
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-(family-name:--font-space-grotesk) text-sm font-bold text-text-primary tracking-wider group-hover:text-gold-light transition-colors duration-300">
                AWS Cloud Club
              </span>
              <span className="text-[10px] text-text-muted tracking-[0.2em] uppercase">
                VIT Chennai
              </span>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalMode("register")}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm font-semibold tracking-wider transition-all duration-300 text-black hover:opacity-90"
              style={{ background: "#D4A017" }}
            >
              Register
            </button>
            <button
              onClick={() => setModalMode("login")}
              className="gold-shimmer-btn relative px-5 py-2 sm:px-6 sm:py-2.5 rounded-full border border-gold/60 text-gold font-(family-name:--font-space-grotesk) font-semibold text-sm tracking-wider hover:bg-gold/10 hover:border-gold transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,160,23,0.2)]"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>

    {modalMode && (
      <AuthModal
        initialMode={modalMode}
        onClose={() => setModalMode(null)}
      />
    )}
    </>
  );
}
