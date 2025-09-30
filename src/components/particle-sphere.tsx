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
  const [colors, setColors] = useState({ black: '#000000', gold: '#e5c44f' });

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

    // Create a path for the triangle
    const trianglePath = new Path2D();
    const triangleSize = 4; // The "radius" of the triangle
    trianglePath.moveTo(0, -triangleSize);
    trianglePath.lineTo(triangleSize * Math.cos(Math.PI / 6), triangleSize * Math.sin(Math.PI / 6));
    trianglePath.lineTo(-triangleSize * Math.cos(Math.PI / 6), triangleSize * Math.sin(Math.PI / 6));
    trianglePath.closePath();


    function animate() {
      if (!ctx || !canvas) return;

      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      
      const rotateX = (p: Particle, angle: number) => {
        const y = p.y * Math.cos(angle) - p.z * Math.sin(angle);
        const z = p.y * Math.sin(angle) + p.z * Math.cos(angle);
        return { ...p, y, z };
      }
      
      const rotateY = (p: Particle, angle: number) => {
          const x = p.x * Math.cos(angle) + p.z * Math.sin(angle);
          const z = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
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
      
      const drawParticles = (particleArray: Particle[], color: string, rotationAngle: number) => {
        ctx.fillStyle = color;
        particleArray.forEach(p => {
          let rotated = rotateY(p, rotationAngle);
          rotated = rotateX(rotated, rotationAngle * 0.5);
          const proj = project(rotated, width, height);
          
          ctx.globalAlpha = proj.alpha;
          
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.scale(proj.scale, proj.scale);
          ctx.fill(trianglePath);
          ctx.restore();
        });
      }

      drawParticles(particles, colors.black, rotation);
      if (playerParticleCount > 0) {
        drawParticles(playerParticles, colors.gold, rotation);
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
