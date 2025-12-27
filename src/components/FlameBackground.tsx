'use client';

import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  left: number;
  duration: number;
};

export default function FlameBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newParticle: Particle = {
        id: Date.now(),
        left: Math.random() * 100,
        duration: 8 + Math.random() * 4,
      };

      setParticles(prev => [...prev, newParticle]);

      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, newParticle.duration * 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-accent-primary rounded-full opacity-60"
          style={{
            left: `${particle.left}%`,
            animation: `ashFloat ${particle.duration}s linear forwards`,
          }}
        />
      ))}

      <div className="flame-bg-element w-64 h-64 top-[10%] left-[10%]" />
      <div className="flame-bg-element w-48 h-48 bottom-[20%] right-[15%] delay-1000" />
      <div className="flame-bg-element w-80 h-80 top-[40%] right-[30%] delay-500 opacity-10" />
    </div>
  );
}
