import React, { useEffect, useMemo, useRef } from 'react';
import { GamePhase } from '../types';

type UniverseVizProps = {
  phase: GamePhase.Space | GamePhase.Rival;
  mappedPercent: number;
  discoveredGalaxies: number;
  claimedGalaxies: number;
  hostileSignals: number;
  relayCount: number;
  throughputMultiplier: number;
};

type StarPoint = { x: number; y: number; size: number; twinkle: number };
type GalaxyPoint = { x: number; y: number; radius: number; hue: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const fract = (value: number) => value - Math.floor(value);
const seeded = (seed: number) => fract(Math.sin(seed * 12.9898) * 43758.5453);

const STAR_COUNT = 420;
const MAX_RENDER_GALAXIES = 260;

const buildStarField = (): StarPoint[] =>
  Array.from({ length: STAR_COUNT }).map((_, index) => ({
    x: seeded(index + 11),
    y: seeded(index + 23),
    size: 0.4 + (seeded(index + 37) * 1.8),
    twinkle: seeded(index + 59) * Math.PI * 2
  }));

const buildGalaxyPoints = (count: number): GalaxyPoint[] => {
  if (count <= 0) return [];
  return Array.from({ length: count }).map((_, index) => {
    const normalized = (index + 1) / Math.max(1, count);
    const arm = index % 4;
    const baseAngle = (normalized * Math.PI * 9.5) + (arm * (Math.PI / 2));
    const angleJitter = (seeded(index + 71) - 0.5) * 0.48;
    const angle = baseAngle + angleJitter;
    const radius = 30 + (Math.pow(normalized, 0.78) * 300) + (seeded(index + 89) * 18);
    const armSpread = 0.58 + (seeded(index + 97) * 0.12);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * armSpread,
      radius: 1.8 + (seeded(index + 131) * 2.8),
      hue: 180 + (seeded(index + 177) * 110)
    };
  });
};

export default function UniverseViz({
  phase,
  mappedPercent,
  discoveredGalaxies,
  claimedGalaxies,
  hostileSignals,
  relayCount,
  throughputMultiplier
}: UniverseVizProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stars = useMemo(() => buildStarField(), []);
  const renderGalaxyCount = Math.min(MAX_RENDER_GALAXIES, Math.max(0, discoveredGalaxies));
  const galaxies = useMemo(() => buildGalaxyPoints(renderGalaxyCount), [renderGalaxyCount]);
  const claimedCount = Math.min(galaxies.length, Math.max(0, claimedGalaxies));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const parent = canvas.parentElement;
    if (!parent) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width));
      height = Math.max(220, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time * 0.001;
      const cx = width / 2;
      const cy = height / 2;
      const orbRadius = Math.min(width, height) * 0.42;
      const mappedRatio = clamp(mappedPercent / 100, 0, 1);
      const fogAlpha = 0.78 * (1 - mappedRatio);
      const hostilityTint = clamp(hostileSignals / 100, 0, 1);

      const bgGrad = ctx.createRadialGradient(cx, cy, orbRadius * 0.08, cx, cy, orbRadius * 1.35);
      bgGrad.addColorStop(0, phase === GamePhase.Rival ? '#211130' : '#0a1628');
      bgGrad.addColorStop(0.55, '#060c18');
      bgGrad.addColorStop(1, '#030509');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glowGrad = ctx.createRadialGradient(cx, cy, orbRadius * 0.12, cx, cy, orbRadius * 1.08);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      glowGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.06)');
      glowGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius * 1.02, 0, Math.PI * 2);
      ctx.fill();

      stars.forEach((star) => {
        const alpha = 0.18 + (Math.sin((t * 1.6) + star.twinkle) * 0.22) + (star.size * 0.1);
        ctx.fillStyle = `rgba(226, 232, 240, ${clamp(alpha, 0.06, 0.58)})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.clip();

      for (let i = 1; i < galaxies.length; i += 1) {
        if (i % 3 !== 0) continue;
        const from = galaxies[i - 1];
        const to = galaxies[i];
        const isClaimedLane = i < claimedCount;
        ctx.strokeStyle = isClaimedLane
          ? 'rgba(56, 189, 248, 0.22)'
          : 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = isClaimedLane ? 1.25 : 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + from.x, cy + from.y);
        ctx.lineTo(cx + to.x, cy + to.y);
        ctx.stroke();
      }

      for (let i = 0; i < galaxies.length; i += 1) {
        const galaxy = galaxies[i];
        const gx = cx + galaxy.x;
        const gy = cy + galaxy.y;
        const isClaimed = i < claimedCount;
        const pulse = 0.75 + (Math.sin((t * 2.2) + (i * 0.14)) * 0.25);

        if (isClaimed) {
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.35 + (0.25 * pulse)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(gx, gy, galaxy.radius * 2.7, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(34, 211, 238, ${0.25 + (0.2 * pulse)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }

        const hue = isClaimed ? 48 : galaxy.hue;
        const sat = isClaimed ? 96 : 82;
        const lit = isClaimed ? 66 : 63;
        const alpha = isClaimed ? 0.95 : 0.72;
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(gx, gy, galaxy.radius * (isClaimed ? 1.35 : 1), 0, Math.PI * 2);
        ctx.fill();
      }

      const relayRadius = clamp(orbRadius * 0.16, 28, 78);
      const relayNodes = Math.min(18, relayCount);
      for (let i = 0; i < relayNodes; i += 1) {
        const angle = ((Math.PI * 2) / Math.max(1, relayNodes)) * i + (t * 0.35);
        const rx = cx + (Math.cos(angle) * relayRadius);
        const ry = cy + (Math.sin(angle) * relayRadius);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.beginPath();
        ctx.arc(rx, ry, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (fogAlpha > 0.02) {
        ctx.fillStyle = `rgba(2, 6, 23, ${fogAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hostilityTint > 0.01) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.08 + (hostilityTint * 0.2)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, orbRadius * 1.01, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#e2e8f0';
      ctx.font = "600 12px 'Trebuchet MS', 'Segoe UI', sans-serif";
      ctx.fillText('OBSERVABLE UNIVERSE MAP', 20, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.font = "600 11px 'Trebuchet MS', 'Segoe UI', sans-serif";
      ctx.fillText(`Mapped ${mappedPercent.toFixed(1)}%  •  Discovered ${discoveredGalaxies}  •  Claimed ${claimedGalaxies}`, 20, 44);
      ctx.fillText(`Throughput x${throughputMultiplier.toFixed(2)}  •  Hostile Signals ${hostileSignals.toFixed(1)}%`, 20, 60);

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    raf = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [stars, galaxies, claimedCount, mappedPercent, discoveredGalaxies, claimedGalaxies, hostileSignals, relayCount, throughputMultiplier, phase]);

  return (
    <div className="h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Observable universe operations map" />
    </div>
  );
}

