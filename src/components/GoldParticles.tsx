"use client";

export default function GoldParticles() {
  const particles = Array.from({ length: 40 }, (_, i) => {
    const seed = i * 137.508;
    const x = ((seed * 7.3) % 100).toFixed(1);
    const y = ((seed * 3.7) % 100).toFixed(1);
    const size = (1 + (i % 3)).toFixed(0);
    const delay = ((i * 0.7) % 20).toFixed(1);
    const duration = (15 + (i % 10)).toFixed(0);
    const opacity = (0.1 + (i % 5) * 0.08).toFixed(2);

    return (
      <div
        key={`p-${i}`}
        className="absolute rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "var(--gold-glow)",
          opacity: Number(opacity),
          animation: `particle-float ${duration}s linear ${delay}s infinite`,
          boxShadow: `0 0 ${Number(size) * 4}px rgba(255, 215, 0, 0.3)`,
        }}
        aria-hidden="true"
      />
    );
  });

  const orbits = [
    { radius: 180, size: 4, duration: 25, opacity: 0.15 },
    { radius: 280, size: 3, duration: 35, opacity: 0.1 },
    { radius: 400, size: 5, duration: 45, opacity: 0.08 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {orbits.map((orbit, i) => (
          <div
            key={`orbit-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/5"
            style={{
              width: `${orbit.radius * 2}px`,
              height: `${orbit.radius * 2}px`,
              animation: `rotate-slow ${orbit.duration}s linear infinite${i % 2 ? " reverse" : ""}`,
            }}
            aria-hidden="true"
          >
            <div
              className="absolute rounded-full bg-gold"
              style={{
                width: `${orbit.size}px`,
                height: `${orbit.size}px`,
                top: `-${orbit.size / 2}px`,
                left: "50%",
                marginLeft: `-${orbit.size / 2}px`,
                opacity: orbit.opacity * 3,
                boxShadow: `0 0 ${orbit.size * 3}px rgba(255, 215, 0, 0.4)`,
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)",
          animation: "pulse-glow 6s ease-in-out infinite",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
