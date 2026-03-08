"use client";

export default function GoldParticles() {
  // Small twinkling background stars
  const stars = Array.from({ length: 130 }, (_, i) => {
    const seed = i * 137.508;
    const x = ((seed * 7.3) % 100).toFixed(2);
    const y = ((seed * 3.7) % 100).toFixed(2);
    const size = (0.5 + (i % 5) * 0.35).toFixed(1);
    const delay = ((i * 0.317) % 5).toFixed(2);
    const duration = (1.5 + (i % 5) * 0.7).toFixed(1);
    const isWarm = i % 7 === 0;

    return (
      <div
        key={`star-${i}`}
        className="absolute rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: isWarm ? "#FFF5C8" : "#FFFFFF",
          opacity: 0.75,
          animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
          boxShadow:
            Number(size) >= 1.5
              ? `0 0 ${Number(size) * 2}px rgba(255,255,255,0.7)`
              : "none",
        }}
        aria-hidden="true"
      />
    );
  });

  // Bright 4-pointed sparkle stars
  const sparkles = Array.from({ length: 14 }, (_, i) => {
    const seed = (i + 200) * 137.508;
    const x = ((seed * 7.3) % 88 + 6).toFixed(2);
    const y = ((seed * 3.7) % 83 + 6).toFixed(2);
    const delay = ((i * 0.73) % 4).toFixed(2);
    const size = 7 + (i % 5);

    return (
      <div
        key={`sparkle-${i}`}
        className="absolute"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          animation: `twinkle-fast ${2.5 + (i % 3) * 0.8}s ease-in-out ${delay}s infinite`,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="white" style={{ width: "100%", height: "100%" }}>
          <path d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z" opacity="0.9" />
        </svg>
      </div>
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{zIndex: 0}}>
      {stars}
      {sparkles}

      {/* Subtle gold nebula glow in hero area */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-87.5 rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse, #D4A017 0%, #FFD700 30%, transparent 70%)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
