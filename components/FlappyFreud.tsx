import React, { useEffect, useRef, useState } from 'react';

interface FlappyFreudProps {
  onFinish: (result: { score: number }) => void;
}

type Pipe = {
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
  term: string;
};

const WIDTH = 800;
const HEIGHT = 450;
const GROUND_Y = HEIGHT - 24;
const FREUD_X = 150;
const PIPE_W = 82;
const PIPE_SPAWN_MS = 1650;
const BASE_PIPE_SPEED = 2.35;
const BASE_GRAVITY = 0.24;
const FLAP_VELOCITY = -6.1;
const MAX_FALL = 8.3;

const TERMS = [
  'ID',
  'EGO',
  'SUPEREGO',
  'DEFENSE',
  'LIBIDO',
  'OEDIPUS',
  'DREAMWORK',
  'TRANSFERENCE'
];

const FlappyFreud: React.FC<FlappyFreudProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFinishRef = useRef(onFinish);
  const scoreRef = useRef(0);
  const flapPulseRef = useRef(0);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const endedRef = useRef(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const stateRef = useRef<{
    y: number;
    vy: number;
    pipes: Pipe[];
    lastSpawn: number;
    time: number;
  }>({
    y: HEIGHT * 0.45,
    vy: 0,
    pipes: [],
    lastSpawn: 0,
    time: 0
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const img = new Image();
    img.src = 'assets/freud-head.jpg';
    img.onload = () => {
      imageRef.current = img;
    };
    img.onerror = () => {
      imageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const flap = () => {
      if (isOver) return;
      if (!hasStarted) setHasStarted(true);
      const st = stateRef.current;
      st.vy = FLAP_VELOCITY;
      flapPulseRef.current = 1;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        flap();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOver, hasStarted]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const endRun = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      setIsOver(true);
      onFinishRef.current({ score: scoreRef.current });
    };

    const spawnPipe = (now: number) => {
      const difficulty = Math.min(1, scoreRef.current / 20);
      const gapMax = 190 - difficulty * 28;
      const gapMin = 155 - difficulty * 35;
      const gapSize = gapMin + Math.random() * Math.max(10, gapMax - gapMin);
      const minGapY = 80;
      const maxGapY = HEIGHT - 120 - gapSize;
      const gapY = minGapY + Math.random() * Math.max(1, maxGapY - minGapY);
      const term = TERMS[Math.floor(Math.random() * TERMS.length)];
      stateRef.current.pipes.push({
        x: WIDTH + PIPE_W,
        gapY,
        gapSize,
        passed: false,
        term
      });
      stateRef.current.lastSpawn = now;
    };

    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const drawFreud = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number) => {
      const bodyTilt = Math.max(-0.35, Math.min(0.3, stateRef.current.vy * 0.04));
      const flapPulse = flapPulseRef.current;
      const armSwing = Math.sin(t * 0.024) * 0.35 + flapPulse * 0.75;
      const bodyY = y - 34;

      ctx.save();
      ctx.translate(x, bodyY);
      ctx.rotate(bodyTilt);

      // torso
      const coat = ctx.createLinearGradient(0, -6, 0, 56);
      coat.addColorStop(0, '#0f172a');
      coat.addColorStop(1, '#1f2937');
      ctx.fillStyle = coat;
      drawRoundedRect(ctx, -20, 28, 40, 44, 11);
      ctx.fill();

      // animated arms
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-13, 42);
      ctx.lineTo(-25 - armSwing * 8, 52 - armSwing * 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(13, 42);
      ctx.lineTo(25 + armSwing * 8, 52 + armSwing * 16);
      ctx.stroke();

      const portrait = imageRef.current;
      if (portrait) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 10, 30, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(portrait, -31, -20, 62, 76);
        ctx.restore();
      } else {
        // fallback if image is missing
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(0, 10, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 4, 18, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(0, 20, 18, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(226,232,240,0.72)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 10, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      bg.addColorStop(0, '#0b1020');
      bg.addColorStop(1, '#111827');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // moving "unconscious" haze
      const hazeX = 140 + Math.sin(st.time * 0.0008) * 80;
      const haze = ctx.createRadialGradient(hazeX, 110, 20, hazeX, 110, 180);
      haze.addColorStop(0, 'rgba(147,197,253,0.13)');
      haze.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = 'rgba(148,163,184,0.06)';
      for (let y = 24; y < HEIGHT - 24; y += 26) {
        ctx.fillRect(0, y, WIDTH, 1);
      }

      for (const pipe of st.pipes) {
        const topH = pipe.gapY;
        const botY = pipe.gapY + pipe.gapSize;

        const pipeFill = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
        pipeFill.addColorStop(0, '#1e293b');
        pipeFill.addColorStop(1, '#334155');

        ctx.fillStyle = pipeFill;
        drawRoundedRect(ctx, pipe.x, 0, PIPE_W, topH, 12);
        ctx.fill();
        drawRoundedRect(ctx, pipe.x, botY, PIPE_W, GROUND_Y - botY, 12);
        ctx.fill();

        ctx.strokeStyle = 'rgba(125,211,252,0.25)';
        ctx.lineWidth = 1.4;
        drawRoundedRect(ctx, pipe.x + 2, 2, PIPE_W - 4, Math.max(2, topH - 4), 10);
        ctx.stroke();
        drawRoundedRect(ctx, pipe.x + 2, botY + 2, PIPE_W - 4, Math.max(2, GROUND_Y - botY - 4), 10);
        ctx.stroke();

        ctx.fillStyle = 'rgba(226,232,240,0.95)';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pipe.term, pipe.x + PIPE_W / 2, Math.max(24, topH - 12));
        ctx.fillText(pipe.term, pipe.x + PIPE_W / 2, Math.min(GROUND_Y - 10, botY + 26));
      }

      drawFreud(ctx, FREUD_X, st.y, st.time);

      ctx.fillStyle = '#334155';
      ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
      ctx.fillStyle = 'rgba(148,163,184,0.55)';
      for (let x = 0; x < WIDTH; x += 16) {
        ctx.fillRect(x, GROUND_Y + 8, 8, 2);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(226,232,240,0.95)';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText(`Insight ${scoreRef.current}`, 12, 24);
      ctx.fillStyle = 'rgba(148,163,184,0.95)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('Flap: Space / W / Up / Click', 12, 44);

      if (!hasStarted && !isOver) {
        ctx.fillStyle = 'rgba(2,6,23,0.55)';
        drawRoundedRect(ctx, WIDTH * 0.5 - 180, HEIGHT * 0.5 - 56, 360, 112, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(125,211,252,0.35)';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, WIDTH * 0.5 - 180, HEIGHT * 0.5 - 56, 360, 112, 16);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(226,232,240,0.95)';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText('Tap To Begin', WIDTH * 0.5, HEIGHT * 0.5 - 10);
        ctx.fillStyle = 'rgba(148,163,184,0.95)';
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText('Press Space / W / Up or click', WIDTH * 0.5, HEIGHT * 0.5 + 18);
      }
    };

    const update = (deltaMs: number, now: number) => {
      const st = stateRef.current;
      if (isOver) return;
      if (!hasStarted) return;

      st.time += deltaMs;
      flapPulseRef.current *= 0.93;

      const difficulty = Math.min(1, scoreRef.current / 20);
      const gravity = BASE_GRAVITY + difficulty * 0.12;
      const pipeSpeed = BASE_PIPE_SPEED + difficulty * 1.35;
      const spawnMs = PIPE_SPAWN_MS - difficulty * 260;

      if (now - st.lastSpawn >= spawnMs || st.pipes.length === 0) {
        spawnPipe(now);
      }

      st.vy = Math.min(MAX_FALL, st.vy + gravity);
      st.y += st.vy;

      const freudRadius = 28;
      if (st.y - freudRadius < 0 || st.y + freudRadius > GROUND_Y) {
        endRun();
        return;
      }

      st.pipes = st.pipes
        .map((pipe) => ({ ...pipe, x: pipe.x - pipeSpeed }))
        .filter((pipe) => pipe.x + PIPE_W > -4);

      for (const pipe of st.pipes) {
        if (!pipe.passed && pipe.x + PIPE_W < FREUD_X - freudRadius) {
          pipe.passed = true;
          setScore((prev) => {
            const next = prev + 1;
            scoreRef.current = next;
            return next;
          });
        }

        const overlapX = FREUD_X + freudRadius > pipe.x && FREUD_X - freudRadius < pipe.x + PIPE_W;
        if (!overlapX) continue;

        const hitsTop = st.y - freudRadius < pipe.gapY;
        const hitsBottom = st.y + freudRadius > pipe.gapY + pipe.gapSize;
        if (hitsTop || hitsBottom) {
          endRun();
          return;
        }
      }
    };

    const loop = (ts: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const deltaMs = ts - last;
      last = ts;
      update(deltaMs, ts);
      if (ctx) draw(ctx);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isOver, hasStarted]);

  const flapFromPointer = () => {
    if (isOver) return;
    if (!hasStarted) setHasStarted(true);
    const st = stateRef.current;
    st.vy = FLAP_VELOCITY;
    flapPulseRef.current = 1;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={flapFromPointer}
        className="w-full rounded-xl border border-sky-500/35 shadow-[0_0_30px_rgba(56,189,248,0.14)] bg-slate-950 touch-none"
      />
      <p className="text-xs text-slate-400 mt-3">
        Freud flies by unresolved tension. Hit a term column and your defense mechanisms fail.
      </p>
      <button
        type="button"
        onClick={flapFromPointer}
        className="mt-3 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs text-slate-200"
      >
        Flap (mobile fallback)
      </button>
    </div>
  );
};

export default FlappyFreud;
