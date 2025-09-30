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

const LOGO = '⨻';
const TOTAL_PARTICLES = 2000;
const MIN_PLAYER_PARTICLES = 20;

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

  const { poolParticles, playerParticles } = useMemo(() => {
    const stakeRatio = totalPool > 0 ? playerStake / totalPool : 0;
    let numPlayerParticles = Math.floor(stakeRatio * TOTAL_PARTICLES);
    
    if (playerStake > 0 && numPlayerParticles < MIN_PLAYER_PARTICLES) {
      numPlayerParticles = MIN_PLAYER_PARTICLES;
    }
    if (numPlayerParticles > TOTAL_PARTICLES) {
      numPlayerParticles = TOTAL_PARTICLES;
    }
    
    const numPoolParticles = TOTAL_PARTICLES - numPlayerParticles;

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
      poolParticles: createParticles(numPoolParticles, colors.black),
      playerParticles: createParticles(numPlayerParticles, colors.gold),
    };
  }, [totalPool, playerStake, colors]);


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

    const allParticles = [...poolParticles, ...playerParticles];
    
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

      const getRadius = (p: Particle) => {
        const { type, progress } = effectState.current;
        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const p_progress = easeInOutCubic(progress);

        if (type === 'deposit' && p.color === colors.black) {
           return baseRadius * (1 - 0.5 * Math.sin(p_progress * Math.PI));
        }
        if (type === 'withdraw' && p.color === colors.gold) {
            return baseRadius * (1 + p_progress * 2);
        }
        if (type === 'win' && p.color === colors.gold) {
           return baseRadius * (1 + 0.2 * Math.sin(p_progress * Math.PI * 2));
        }
        if (type === 'lose' && p.color === colors.gold) {
           return baseRadius * (1 - p_progress);
        }
        return baseRadius;
      }

      const getAlpha = (p: Particle, projectedZ: number) => {
        const { type, progress } = effectState.current;
        if (type === 'withdraw' && p.color === colors.gold) {
          return (1 - progress);
        }
         if (type === 'lose' && p.color === colors.gold) {
          return (1 - progress);
        }
        return Math.max(0, Math.min(1, (projectedZ + baseRadius) / (2 * baseRadius)));
      }
      
      const rotateY = (p: Particle, angle: number) => {
          const x = p.x * Math.cos(angle) + p.z * Math.sin(angle);
          const z = -p.x * Math.sin(angle) + p.z * Math.cos(angle);
          return { ...p, x, z };
      }

      const project = (p: Particle, w: number, h: number) => {
        const radius = getRadius(p);
        const perspective = w * 0.8;
        const x = p.x * radius;
        const y = p.y * radius;
        const z = p.z * radius;

        const projection = perspective / (perspective + z);
        return {
          x: x * projection + w / 2,
          y: y * projection + h / 2,
          alpha: getAlpha(p, z),
          scale: projection
        };
      }
      
      const drawParticle = (p: Particle) => {
        let rotated = rotateY(p, rotation);
        const proj = project(rotated, width, height);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = proj.alpha;
        
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.scale(proj.scale, proj.scale);
        ctx.fill(trianglePath);
        ctx.restore();
      }

      allParticles.forEach(drawParticle);

      // Draw and rotate the logo
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rotation * 2);
      ctx.fillStyle = colors.gold;
      ctx.font = `${baseRadius * 0.5}px "Space Grotesk"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LOGO, 0, 0);
      ctx.restore();


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

  }, [poolParticles, playerParticles, colors, onAnimationComplete]);

  return <canvas ref={canvasRef} className="w-full h-full aspect-square" />;
};
