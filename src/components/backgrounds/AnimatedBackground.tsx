import React from 'react';
import { Box, Package, Truck, Warehouse } from 'lucide-react';

const AnimatedBackground = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    icon: [Box, Package, Truck, Warehouse][i % 4],
    size: Math.random() * 20 + 10,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 15,
    x: Math.random() * 100,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
      
      {/* Dynamic gradient orbs */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-logistix-orange/10 via-transparent to-transparent blur-3xl opacity-30 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-logistix-blue/10 via-transparent to-transparent blur-3xl opacity-30 animate-pulse-slow" 
           style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-logistix-green/8 via-transparent to-logistix-orange/8 blur-3xl opacity-20 animate-scale-pulse"
           style={{ transform: 'translate(-50%, -50%)' }} />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                        bg-[length:100px_100px] bg-[image:radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)]" />
      </div>

      {/* Floating logistics icons */}
      {particles.map((particle) => {
        const Icon = particle.icon;
        return (
          <div
            key={particle.id}
            className="absolute animate-particle-float"
            style={{
              left: `${particle.x}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            <Icon 
              size={particle.size} 
              className="text-logistix-orange/20"
              style={{ opacity: particle.opacity }}
            />
          </div>
        );
      })}

      {/* Horizontal accent lines */}
      <div className="absolute inset-0">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-logistix-orange/20 to-transparent absolute top-1/4 animate-gradient-shift" />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-logistix-blue/15 to-transparent absolute top-2/4 animate-gradient-shift" 
             style={{ animationDelay: '2s' }} />
        <div className="h-px w-full bg-gradient-to-r from-transparent via-logistix-green/20 to-transparent absolute top-3/4 animate-gradient-shift" 
             style={{ animationDelay: '4s' }} />
      </div>

      {/* Spotlight effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-logistix-blue/5 rounded-full blur-3xl opacity-40 animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-logistix-orange/5 rounded-full blur-3xl opacity-40 animate-float" 
           style={{ animationDelay: '3s' }} />
    </div>
  );
};

export default AnimatedBackground;