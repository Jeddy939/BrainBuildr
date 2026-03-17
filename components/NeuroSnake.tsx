import React, { useEffect, useMemo, useRef, useState } from 'react';

type Vec = { x: number; y: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number };
type Dir = 'up' | 'down' | 'left' | 'right';

interface NeuroSnakeProps {
  onFinish: (result: { score: number }) => void;
}

const GRID_W = 24;
const GRID_H = 16;
const WIDTH = 800;
const HEIGHT = 450;
const CELL_W = WIDTH / GRID_W;
const CELL_H = HEIGHT / GRID_H;

const randomCell = (): Vec => ({
  x: Math.floor(Math.random() * GRID_W),
  y: Math.floor(Math.random() * GRID_H)
});

const sameCell = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y;

const nextFromDirection = (head: Vec, dir: Dir): Vec => {
  if (dir === 'up') return { x: head.x, y: head.y - 1 };
  if (dir === 'down') return { x: head.x, y: head.y + 1 };
  if (dir === 'left') return { x: head.x - 1, y: head.y };
  return { x: head.x + 1, y: head.y };
};

const isOpposite = (a: Dir, b: Dir) =>
  (a === 'up' && b === 'down') ||
  (a === 'down' && b === 'up') ||
  (a === 'left' && b === 'right') ||
  (a === 'right' && b === 'left');

const directionFromKey = (key: string): Dir | null => {
  if (key === 'ArrowUp' || key.toLowerCase() === 'w') return 'up';
  if (key === 'ArrowDown' || key.toLowerCase() === 's') return 'down';
  if (key === 'ArrowLeft' || key.toLowerCase() === 'a') return 'left';
  if (key === 'ArrowRight' || key.toLowerCase() === 'd') return 'right';
  return null;
};

const NeuroSnake: React.FC<NeuroSnakeProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [direction, setDirection] = useState<Dir>('right');
  const [queuedDirection, setQueuedDirection] = useState<Dir>('right');
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const queuedDirectionRef = useRef<Dir>('right');
  const scoreRef = useRef(0);

  const stateRef = useRef<{
    snake: Vec[];
    food: Vec;
    particles: Particle[];
    pulse: number;
  }>({
    snake: [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 }
    ],
    food: { x: 14, y: 8 },
    particles: [],
    pulse: 0
  });

  const controls = useMemo(
    () => [
      { label: 'Up', dir: 'up' as Dir },
      { label: 'Left', dir: 'left' as Dir },
      { label: 'Down', dir: 'down' as Dir },
      { label: 'Right', dir: 'right' as Dir }
    ],
    []
  );

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    queuedDirectionRef.current = queuedDirection;
  }, [queuedDirection]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const d = directionFromKey(event.key);
      if (!d) return;
      event.preventDefault();
      if (!hasStarted) setHasStarted(true);
      setQueuedDirection(d);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasStarted]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const draw = (ctx: CanvasRenderingContext2D) => {
      const { snake, food, particles, pulse } = stateRef.current;

      const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
      bg.addColorStop(0, '#09131f');
      bg.addColorStop(1, '#102036');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const membrane = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.5, 20, WIDTH * 0.5, HEIGHT * 0.5, WIDTH * 0.7);
      membrane.addColorStop(0, 'rgba(34, 211, 238, 0.09)');
      membrane.addColorStop(1, 'rgba(14, 116, 144, 0)');
      ctx.fillStyle = membrane;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.strokeStyle = 'rgba(96, 165, 250, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_W; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_W, 0);
        ctx.lineTo(x * CELL_W, HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_H; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_H);
        ctx.lineTo(WIDTH, y * CELL_H);
        ctx.stroke();
      }

      const pathPoints = snake.map((part) => ({
        x: part.x * CELL_W + CELL_W / 2,
        y: part.y * CELL_H + CELL_H / 2
      }));

      if (pathPoints.length > 1) {
        const axonGlow = ctx.createLinearGradient(pathPoints[0].x, pathPoints[0].y, pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
        axonGlow.addColorStop(0, 'rgba(191, 219, 254, 0.9)');
        axonGlow.addColorStop(0.4, 'rgba(45, 212, 191, 0.9)');
        axonGlow.addColorStop(1, 'rgba(16, 185, 129, 0.4)');
        ctx.strokeStyle = axonGlow;
        ctx.lineWidth = Math.min(12, 4 + scoreRef.current * 0.15);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i += 1) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
        ctx.lineWidth = Math.max(2, Math.min(5, 2 + scoreRef.current * 0.05));
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i += 1) {
          ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.stroke();

        for (let i = 3; i < pathPoints.length; i += 3) {
          const p = pathPoints[i];
          const jitter = Math.sin(pulse + i) * 0.6;
          const branchLen = 8 + Math.min(12, scoreRef.current * 0.25);
          const angle = (i % 2 === 0 ? 1 : -1) * (0.9 + jitter);
          const bx = p.x + Math.cos(angle) * branchLen;
          const by = p.y + Math.sin(angle) * branchLen;
          ctx.strokeStyle = 'rgba(94, 234, 212, 0.5)';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      const head = pathPoints[0];
      const somaGlow = ctx.createRadialGradient(head.x, head.y, 3, head.x, head.y, 34);
      somaGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      somaGlow.addColorStop(0.35, 'rgba(125, 211, 252, 0.7)');
      somaGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = somaGlow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(191, 219, 254, 0.96)';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 12.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(14, 116, 144, 0.9)';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 4.2, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + pulse * 0.15;
        const dLen = 10 + Math.sin(pulse * 0.9 + i) * 3.2;
        const sx = head.x + Math.cos(angle) * 11;
        const sy = head.y + Math.sin(angle) * 11;
        const mx = head.x + Math.cos(angle + 0.3) * (16 + dLen * 0.5);
        const my = head.y + Math.sin(angle + 0.3) * (16 + dLen * 0.5);
        const ex = head.x + Math.cos(angle) * (20 + dLen);
        const ey = head.y + Math.sin(angle) * (20 + dLen);
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();
      }

      const fx = food.x * CELL_W + CELL_W / 2;
      const fy = food.y * CELL_H + CELL_H / 2;
      const pulseRadius = 8 + Math.sin(pulse) * 2.5;
      const impulse = ctx.createRadialGradient(fx, fy, 2, fx, fy, 18);
      impulse.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
      impulse.addColorStop(0.35, 'rgba(251, 191, 36, 0.85)');
      impulse.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = impulse;
      ctx.beginPath();
      ctx.arc(fx, fy, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      for (const p of particles) {
        const t = p.life / p.maxLife;
        ctx.fillStyle = `rgba(250, 204, 21, ${Math.max(0, t)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + t, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`Impulses ${scoreRef.current}`, 12, 22);
      ctx.fillText(`Axon ${snake.length}`, 12, 42);
    };

    const update = (deltaMs: number) => {
      const st = stateRef.current;
      st.pulse += deltaMs * 0.01;

      st.particles = st.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - deltaMs
        }))
        .filter((p) => p.life > 0);

      if (!hasStarted) return;

      const speedMs = Math.max(70, 145 - scoreRef.current * 2);
      accumulator += deltaMs;
      if (accumulator < speedMs) return;
      accumulator = 0;

      setDirection((prev) => {
        const nextDir = isOpposite(prev, queuedDirectionRef.current) ? prev : queuedDirectionRef.current;
        const head = st.snake[0];
        const newHead = nextFromDirection(head, nextDir);

        const wallHit = newHead.x < 0 || newHead.x >= GRID_W || newHead.y < 0 || newHead.y >= GRID_H;
        const selfHit = st.snake.some((s) => sameCell(s, newHead));
        if (wallHit || selfHit) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            setIsOver(true);
            onFinishRef.current({ score: scoreRef.current });
          }
          return nextDir;
        }

        const grown = [newHead, ...st.snake];
        if (sameCell(newHead, st.food)) {
          setScore((v) => {
            const nextScore = v + 1;
            scoreRef.current = nextScore;
            return nextScore;
          });
          const cx = st.food.x * CELL_W + CELL_W / 2;
          const cy = st.food.y * CELL_H + CELL_H / 2;
          for (let i = 0; i < 14; i += 1) {
            st.particles.push({
              x: cx,
              y: cy,
              vx: (Math.random() - 0.5) * 2.2,
              vy: (Math.random() - 0.5) * 2.2,
              life: 380 + Math.random() * 220,
              maxLife: 600
            });
          }
          let nextFood = randomCell();
          while (grown.some((s) => sameCell(s, nextFood))) nextFood = randomCell();
          st.food = nextFood;
          st.snake = grown;
        } else {
          grown.pop();
          st.snake = grown;
        }

        return nextDir;
      });
    };

    const loop = (ts: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const delta = ts - last;
      last = ts;
      if (ctx) {
        if (!isOver) update(delta);
        draw(ctx);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isOver, hasStarted]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={() => setHasStarted(true)}
        className="w-full rounded-xl border border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.2)] bg-slate-950"
      />
      <p className="text-xs text-slate-400 mt-3">
        Controls: Arrow keys or WASD. Avoid cortical self-collision.
      </p>
      {!hasStarted && <p className="text-xs text-sky-300 mt-1">Tap/click or press a movement key to start.</p>}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {controls.map((control) => (
          <button
            key={control.dir}
            onClick={() => {
              setHasStarted(true);
              setQueuedDirection(control.dir);
            }}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-200"
          >
            {control.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NeuroSnake;
