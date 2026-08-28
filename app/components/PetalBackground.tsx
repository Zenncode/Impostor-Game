"use client";
import React, { useEffect, useState } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: "petal" | "sparkle" | "orb";
  color: string;
};

export default function PetalBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ["#FF69B4", "#FF1493", "#FFB6C1", "#FF6EB4", "#FFA4D4"];
    const generated: Particle[] = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 14 + 6,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.4 + 0.15,
      type: i % 4 === 0 ? "orb" : i % 3 === 0 ? "sparkle" : "petal",
      color: colors[i % colors.length],
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Subtle radial background glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FF1493 0%, #FF69B4 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 right-10 w-[500px] h-[400px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FF69B4 0%, transparent 70%)",
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => {
        if (p.type === "petal") {
          return (
            <div
              key={p.id}
              className="absolute animate-float-petal"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.4}px`,
                background: `linear-gradient(135deg, ${p.color}, #FFF0F5)`,
                borderRadius: "50% 0 50% 50%",
                opacity: p.opacity,
                filter: "drop-shadow(0 0 4px rgba(255,105,180,0.4))",
                animationDuration: `${p.duration}s`,
                animationDelay: `-${p.delay}s`,
                transform: `rotate(${p.id * 35}deg)`,
              }}
            />
          );
        }
        if (p.type === "sparkle") {
          return (
            <div
              key={p.id}
              className="absolute animate-pulse"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size * 0.6}px`,
                height: `${p.size * 0.6}px`,
                background: p.color,
                borderRadius: "50%",
                opacity: p.opacity * 1.5,
                boxShadow: `0 0 10px ${p.color}`,
                animationDuration: `${p.duration * 0.4}s`,
                animationDelay: `-${p.delay}s`,
              }}
            />
          );
        }
        return (
          <div
            key={p.id}
            className="absolute rounded-full blur-sm animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size * 2}px`,
              height: `${p.size * 2}px`,
              background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
              opacity: p.opacity * 0.5,
              animationDuration: `${p.duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

