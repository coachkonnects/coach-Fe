import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number; x: number; y: number; size: number; duration: number; delay: number;
}

export function ParticleLayer() {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 30 }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 4 + 2, duration: Math.random() * 3 + 2, delay: Math.random() * 2,
    })));
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute bg-white rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, boxShadow: "0 0 10px rgba(255,255,255,0.8)" }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
