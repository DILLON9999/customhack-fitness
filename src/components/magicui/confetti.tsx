"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface ConfettiProps {
  onComplete?: () => void;
}

export default function Confetti({ onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
  }>>([]);

  useEffect(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
    }));
    
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: particle.x,
            top: particle.y,
          }}
          initial={{
            y: -10,
            rotate: particle.rotation,
            scale: particle.scale,
          }}
          animate={{
            y: window.innerHeight + 10,
            rotate: particle.rotation + 180,
            scale: 0,
          }}
          transition={{
            duration: 3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
} 