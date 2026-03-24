"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function InstagramIcon() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function MeetupIcon() {
  return (
    <Image
      src="/home-page/meetup.png"
      alt="Meetup"
      width={28}
      height={28}
      className="w-7 h-7 object-contain"
    />
  );
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  const staffLinks = [
    { href: "/core", label: "Core Login" },
    { href: "/admin", label: "Admin Login" },
    { href: "/judge", label: "Judge Login" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const socialLinks = [
    {
      name: "Instagram",
      icon: <InstagramIcon />,
      href: "https://www.instagram.com/awsvitc/",
    },
    {
      name: "Meetup",
      icon: <MeetupIcon />,
      href: "https://www.meetup.com/aws-cloud-club-at-vit-chennai/",
    },
  ];

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="relative py-16 sm:py-24 px-4 border-t border-gold/10"
    >
      <div className="max-w-4xl mx-auto text-center relative">
        <h3
          className={`font-(family-name:--font-space-grotesk) text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mb-8 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Connect with{" "}
          <span className="text-gold">AWS Cloud Club</span>{" "}
          VIT Chennai
        </h3>

        <div
          className={`flex justify-center gap-6 sm:gap-8 mb-12 transition-all duration-700 delay-200 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon group flex flex-col items-center gap-3"
            >
              <div className="relative p-4 rounded-2xl bg-transparent border border-gold/20 group-hover:border-gold/60 group-hover:bg-gold/5 transition-all duration-300">
                <div className="text-gold/70 group-hover:text-gold transition-colors duration-300">
                  {link.icon}
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
                  style={{
                    boxShadow: "0 0 20px rgba(212,160,23,0.3), 0 0 40px rgba(212,160,23,0.1)",
                  }}
                />
              </div>
              <span className="font-(family-name:--font-space-grotesk) text-xs sm:text-sm text-text-muted group-hover:text-gold transition-colors duration-300 tracking-wider">
                {link.name}
              </span>
            </a>
          ))}
        </div>

        <div className="w-24 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent mx-auto mb-6" />

        <p
          className={`font-(family-name:--font-space-grotesk) text-xs sm:text-sm text-text-muted/60 transition-all duration-700 delay-400 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
        >
          © 2026 AWS Cloud Club VIT Chennai. All rights reserved.
        </p>

        <div className="sm:hidden flex items-center justify-center gap-4 mt-5 text-xs">
          {staffLinks.map(({ href, label }) => (
            <a key={href} href={href} className="text-white/85 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>
      </div>

      <div
        className={`hidden sm:flex items-center gap-4 absolute right-6 bottom-6 transition-all duration-700 delay-500 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {staffLinks.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="text-xs text-white/85 hover:text-white transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
