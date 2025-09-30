"use client";

import React, { useRef, useEffect, useState } from 'react';

interface ParticleSphereProps {
  totalPool: number;
  playerStake: number;
}

interface Particle {
  theta: number;
  phi: number;
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  oz: number;
}

export const ParticleSphere: React.FC<ParticleSphereProps> = ({ totalPool, playerStake }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colors, setColors] = useState({ primary: '#000', foreground: '#fff' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      setColors({
        primary: `hsl(${computedStyle.getPropertyValue('--primary').trim()})`,
        foreground: `hsl(${computedStyle.getPropertyValue('--foreground').trim()})`,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    let particles: Particle[] = [];
    let playerParticles: Particle[] = [];
    
    let rotation = 0;
    
    const particleCount = Math.max(100, Math.min(2000, Math.floor(totalPool / 10)));
    const playerParticleCount = playerStake > 0 ? Math.max(50, Math.min(1000, Math.floor(playerStake / 10))) : 0;
    
    const poolRadius = width * 0.3;
    const stakeRatio = totalPool > 0 ? playerStake / totalPool : 0;
    // Make player radius proportional, but visually distinct
    const playerRadius = poolRadius * (Math.cbrt(stakeRatio) * 0.8 + 0.1);


    function createParticles(count: number, radius: number): Particle[] {
      const parts: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const theta = Math.acos((2 * (i + 0.5)) / count - 1);
        const phi = Math.sqrt(count * Math.PI) * theta;
        
        const x = radius * Math.cos(phi) * Math.sin(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(theta);

        parts.push({
          theta: theta,
          phi: phi,
          x: x, y: y, z: z,
          ox: x, oy: y, oz: z
        });
      }
      return parts;
    }

    particles = createParticles(particleCount, poolRadius);
    if (playerParticleCount > 0) {
      playerParticles = createParticles(playerParticleCount, playerRadius);
    }
    
    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;

      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      
      const rotateX = (p: Particle) => {
        const y = p.y * Math.cos(rotation) - p.z * Math.sin(rotation);
        const z = p.y * Math.sin(rotation) + p.z * Math.cos(rotation);
        return { ...p, y, z };
      }
      
      const rotateY = (p: Particle) => {
          const x = p.x * Math.cos(rotation) + p.z * Math.sin(rotation);
          const z = -p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
          return { ...p, x, z };
      }

      const project = (p: Particle, w: number, h: number) => {
        const perspective = w * 0.8;
        const projection = perspective / (perspective + p.z);
        return {
          x: p.x * projection + w / 2,
          y: p.y * projection + h / 2,
          alpha: Math.max(0, Math.min(1, (p.z + poolRadius) / (2 * poolRadius))),
          scale: projection
        };
      }
      
      const drawParticles = (particleArray: Particle[], color: string) => {
        particleArray.forEach(p => {
          let rotated = rotateY(p);
          rotated = rotateX(rotated);
          const proj = project(rotated, width, height);

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = proj.alpha;
          ctx.arc(proj.x, proj.y, 1 * proj.scale, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      drawParticles(particles, colors.primary);
      if (playerParticleCount > 0) {
        drawParticles(playerParticles, colors.foreground);
      }

      rotation += 0.002;
      animationFrameId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(() => {
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    });
    resizeObserver.observe(canvas);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };

  }, [totalPool, playerStake, colors]);

  return <canvas ref={canvasRef} className="w-full h-full aspect-square" />;
};
