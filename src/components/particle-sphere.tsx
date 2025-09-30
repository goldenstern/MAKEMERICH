"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';

export type ActionType = 'deposit' | 'withdraw' | 'win' | 'lose' | null;

interface ParticleSphereProps {
  totalPool: number;
  playerStake: number;
  lastAction: ActionType;
  onAnimationComplete: () => void;
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
  color: string;
}

const POOL_PARTICLES = 1500;
const PLAYER_PARTICLES = 500;

export const ParticleSphere: React.FC<ParticleSphereProps> = ({ totalPool, playerStake, lastAction, onAnimationComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colors, setColors] = useState({ black: '#000000', gold: '#e5c44f' });
  const effectState = useRef<{ type: ActionType, progress: number, duration: number }>({ type: null, progress: 0, duration: 0 });

  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const black = `hsl(${computedStyle.getPropertyValue('--foreground').trim()})`;
    const gold = `hsl(${computedStyle.getPropertyValue('--primary').trim()})`;
    setColors({ black, gold });
  }, []);

  useEffect(() => {
    if (lastAction) {
      effectState.current = {
        type: lastAction,
        progress: 0,
        duration: lastAction === 'deposit' || lastAction === 'withdraw' ? 60 : 120,
      };
    }
  }, [lastAction]);

  const particles = useMemo(() => {
    const createParticles = (count: number, color: string): Particle[] => {
        const parts: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const theta = Math.acos((2 * (i + 0.5)) / count - 1);
            const phi = Math.sqrt(count * Math.PI) * theta;

            const x = 1 * Math.cos(phi) * Math.sin(theta);
            const y = 1 * Math.sin(phi) * Math.sin(theta);
            const z = 1 * Math.cos(theta);

            parts.push({
                theta: theta, phi: phi,
                x: x, y: y, z: z,
                ox: x, oy: y, oz: z,
                color: color,
            });
        }
        return parts;
    };
    return {
        pool: createParticles(POOL_PARTICLES, colors.black),
        player: createParticles(PLAYER_PARTICLES, colors.gold),
    }
  }, [colors]);


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
    
    let rotation = 0;
    
    const baseRadius = Math.min(width, height) * 0.3;

    let animationFrameId: number;

    const trianglePath = new Path2D();
    const triangleSize = 4;
    trianglePath.moveTo(0, -triangleSize / 2);
    trianglePath.lineTo(triangleSize / 2, triangleSize / 2);
    trianglePath.lineTo(-triangleSize / 2, triangleSize / 2);
    trianglePath.closePath();


    function animate() {
      if (!ctx || !canvas) return;

      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      if(canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Handle effects
      if (effectState.current.type && effectState.current.progress < 1) {
        effectState.current.progress += 1 / effectState.current.duration;
      } else if (effectState.current.type && effectState.current.progress >= 1) {
        effectState.current.type = null;
        effectState.current.progress = 0;
        onAnimationComplete();
      }

      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const project = (p: Particle, w: number, h: number, radius: number) => {
        const perspective = w * 0.8;
        const x = p.x * radius;
        const y = p.y * radius;
        const z = p.z * radius;

        const projection = perspective / (perspective + z);
        return {
          x: x * projection + w / 2,
          y: y * projection + h / 2,
          alpha: Math.max(0, Math.min(1, (z + radius) / (2 * radius))),
          scale: projection
        };
      }

      const getAlpha = (p: Particle, currentAlpha: number) => {
        const { type, progress } = effectState.current;
        if ((type === 'withdraw' || type === 'lose') && p.color === colors.gold) {
          return currentAlpha * (1 - progress);
        }
        return currentAlpha;
      }
      
      const rotateY = (p: Particle, angle: number) => {
          const x = p.x * Math.cos(angle) + p.z * Math.sin(angle);
          const z = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
          return { ...p, x, z };
      }
      
      const drawParticles = (particleArray: Particle[], radius: number) => {
        particleArray.forEach(p => {
            let rotated = rotateY(p, rotation);
            const proj = project(rotated, width, height, radius);
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = getAlpha(p, proj.alpha);
            
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.scale(proj.scale, proj.scale);
            ctx.fill(trianglePath);
            ctx.restore();
        });
      }

      // Calculate radii
      const stakeRatio = totalPool > 0 ? playerStake / totalPool : 0;
      let playerRadius = baseRadius * stakeRatio;

      // Handle animations affecting radius
      const { type, progress } = effectState.current;
      const p_progress = easeInOutCubic(progress);
      
      let poolRadius = baseRadius;
      if (type === 'deposit') {
          poolRadius = baseRadius * (1 - 0.2 * Math.sin(p_progress * Math.PI));
      }
      if (type === 'withdraw' && playerStake > 0) { // Check stake to avoid animation on withdraw all
          playerRadius = playerRadius * (1 + p_progress * 2);
      }
      if (type === 'win') {
          playerRadius = playerRadius * (1 + 0.5 * Math.sin(p_progress * Math.PI * 2));
      }
       if (type === 'lose') {
          playerRadius = playerRadius * (1 - p_progress);
      }

      // Draw spheres
      drawParticles(particles.pool, poolRadius);
      if (playerStake > 0) {
        drawParticles(particles.player, playerRadius);
      }

      rotation += 0.002;
      animationFrameId = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(() => {
        if (!canvas) return;
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

  }, [particles, colors, onAnimationComplete, playerStake, totalPool]);

  return <canvas ref={canvasRef} className="w-full h-full aspect-square" />;
};
