"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface ConfettiProps {
  onComplete?: () => void;
}

export default function Confetti({ onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    scale: number;
    side: 'left' | 'right';
  }>>([]);

  useEffect(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#FF7675", "#74B9FF"];
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    
    // Create particles from both sides
    const leftParticles = Array.from({ length: 30 }, (_, i) => ({
      id: `left-${i}`,
      x: -10, // Start from left edge
      y: screenHeight * 0.3 + Math.random() * screenHeight * 0.4, // Middle section of screen
      vx: Math.random() * 15 + 10, // Velocity towards right
      vy: (Math.random() - 0.5) * 10, // Random vertical velocity
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.8 + 0.4,
      side: 'left' as const,
    }));

    const rightParticles = Array.from({ length: 30 }, (_, i) => ({
      id: `right-${i}`,
      x: screenWidth + 10, // Start from right edge
      y: screenHeight * 0.3 + Math.random() * screenHeight * 0.4, // Middle section of screen
      vx: -(Math.random() * 15 + 10), // Velocity towards left
      vy: (Math.random() - 0.5) * 10, // Random vertical velocity
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.8 + 0.4,
      side: 'right' as const,
    }));

    setParticles([...leftParticles, ...rightParticles]);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: particle.color,
            left: particle.x,
            top: particle.y,
            borderRadius: Math.random() > 0.5 ? '50%' : '20%', // Mix of circles and rounded squares
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: particle.rotation,
            scale: particle.scale,
            opacity: 1,
          }}
          animate={{
            x: particle.vx * 20, // Travel across screen
            y: particle.vy * 10 + 200, // Some downward motion with randomness
            rotate: particle.rotation + 720, // Multiple rotations
            scale: 0.1,
            opacity: 0,
          }}
          transition={{
            duration: 4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
} 