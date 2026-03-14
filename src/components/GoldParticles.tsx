"use client";

function SoftCloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 520 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <ellipse cx="150" cy="134" rx="78" ry="52" fill="#D6D6D6" />
      <ellipse cx="232" cy="118" rx="96" ry="66" fill="#E2E2E2" />
      <ellipse cx="312" cy="134" rx="84" ry="56" fill="#DCDCDC" />
      <ellipse cx="212" cy="156" rx="172" ry="52" fill="#CFCFCF" />
      <ellipse cx="178" cy="168" rx="58" ry="20" fill="#AFAFAF" opacity="0.28" />
      <ellipse cx="268" cy="170" rx="64" ry="21" fill="#9F9F9F" opacity="0.24" />
    </svg>
  );
}

export default function GoldParticles() {
  // Small twinkling background stars
  const stars = Array.from({ length: 130 }, (_, i) => {
    const seed = i * 137.508;
    const x = ((seed * 7.3) % 100).toFixed(2);
    const y = ((seed * 3.7) % 100).toFixed(2);
    const size = (0.5 + (i % 5) * 0.35).toFixed(1);
    const delay = ((i * 0.317) % 5).toFixed(2);
    const duration = (1.5 + (i % 5) * 0.7).toFixed(1);
    const isBlue = i % 6 === 0;

    return (
      <div
        key={`star-${i}`}
        className="absolute rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: isBlue ? "#BBD8FF" : "#FFFFFF",
          opacity: 0.75,
          animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`,
          boxShadow:
            Number(size) >= 1.5
              ? `0 0 ${Number(size) * 3}px rgba(149,192,255,0.58)`
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

      <SoftCloud
        className="absolute top-[8%] left-0 w-72 sm:w-md"
        style={{ animation: "cloud-drift 60s linear infinite", opacity: 0.38 }}
      />
      <SoftCloud
        className="absolute top-[34%] left-0 w-64 sm:w-88"
        style={{ animation: "cloud-drift-reverse 74s linear infinite 8s", opacity: 0.3 }}
      />
      <SoftCloud
        className="absolute top-[60%] left-0 w-80 sm:w-104"
        style={{ animation: "cloud-drift 92s linear infinite 14s", opacity: 0.34 }}
      />
      <SoftCloud
        className="absolute bottom-[8%] left-0 w-60 sm:w-80"
        style={{ animation: "cloud-drift-reverse 84s linear infinite 22s", opacity: 0.26 }}
      />

      {/* Subtle cool glow in hero area */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-87.5 rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(135,182,255,0.26) 0%, rgba(96,144,230,0.16) 36%, transparent 72%)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
