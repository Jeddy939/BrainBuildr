import React, { useEffect, useRef, useState } from 'react';

interface FeedSundgrenProps {
  onFinish: (result: { score: number }) => void;
}

type Food = {
  x: number;
  y: number;
  vy: number;
  label: string;
  color: string;
  r: number;
};

const WIDTH = 800;
const HEIGHT = 450;
const PLAYER_Y = HEIGHT - 78;
const PLAYER_SPEED = 8;
const SPAWN_MS = 560;
const MAX_MISSES = 6;

const FOOD_POOL = [
  { label: 'A+', color: '#facc15' },
  { label: 'Pi', color: '#fb923c' },
  { label: 'DNA', color: '#22c55e' },
  { label: 'Book', color: '#60a5fa' },
  { label: 'Neuro', color: '#a78bfa' },
  { label: 'Quiz', color: '#f472b6' }
];

const FeedSundgren: React.FC<FeedSundgrenProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFinishRef = useRef(onFinish);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const endedRef = useRef(false);
  const classroomRef = useRef<HTMLImageElement | null>(null);
  const headRef = useRef<HTMLImageElement | null>(null);

  const stateRef = useRef<{
    x: number;
    foods: Food[];
    lastSpawn: number;
    misses: number;
    leftHeld: boolean;
    rightHeld: boolean;
    chewTimer: number;
  }>({
    x: WIDTH * 0.5,
    foods: [],
    lastSpawn: 0,
    misses: 0,
    leftHeld: false,
    rightHeld: false,
    chewTimer: 0
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const classroom = new Image();
    classroom.src = 'assets/sundgren-background.png';
    classroom.onload = () => {
      classroomRef.current = classroom;
    };
    classroom.onerror = () => {
      classroomRef.current = null;
    };

    const head = new Image();
    head.src = 'assets/sundgren-head.png';
    head.onload = () => {
      headRef.current = head;
    };
    head.onerror = () => {
      headRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        stateRef.current.leftHeld = true;
      }
      if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        stateRef.current.rightHeld = true;
      }
      if (key === ' ' && !hasStarted) {
        event.preventDefault();
        setHasStarted(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') stateRef.current.leftHeld = false;
      if (key === 'arrowright' || key === 'd') stateRef.current.rightHeld = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [hasStarted]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const endRun = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      setIsOver(true);
      onFinishRef.current({ score: scoreRef.current });
    };

    const spawnFood = (now: number) => {
      const pick = FOOD_POOL[Math.floor(Math.random() * FOOD_POOL.length)];
      const difficulty = Math.min(1, scoreRef.current / 30);
      const margin = 28;
      stateRef.current.foods.push({
        x: margin + Math.random() * (WIDTH - margin * 2),
        y: -24,
        vy: 1.9 + Math.random() * 0.9 + difficulty * 1.7,
        label: pick.label,
        color: pick.color,
        r: 18 + Math.random() * 4
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

    const draw = (ctx: CanvasRenderingContext2D) => {
      const st = stateRef.current;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      if (classroomRef.current) {
        ctx.drawImage(classroomRef.current, 0, 0, WIDTH, HEIGHT);
      } else {
        const fallback = ctx.createLinearGradient(0, 0, 0, HEIGHT);
        fallback.addColorStop(0, '#dbeafe');
        fallback.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = fallback;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      ctx.fillStyle = 'rgba(2,6,23,0.22)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (const food of st.foods) {
        const g = ctx.createRadialGradient(food.x - 4, food.y - 6, 2, food.x, food.y, food.r + 6);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, food.color);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(15,23,42,0.92)';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(food.label, food.x, food.y + 4);
      }

      const x = st.x;
      const y = PLAYER_Y;
      const portrait = headRef.current;
      if (portrait) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 44, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(portrait, x - 47, y - 56, 94, 94);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(226,232,240,0.9)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(x, y, 44, 0, Math.PI * 2);
      ctx.stroke();

      const chewOpen = st.chewTimer > 0;
      const mouthOpen = chewOpen ? 14 : 3;
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y + 20, 15, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
      if (chewOpen) {
        ctx.fillStyle = 'rgba(248,250,252,0.88)';
        ctx.fillRect(x - 10, y + 14, 20, 3);
      }

      ctx.fillStyle = 'rgba(15,23,42,0.52)';
      drawRoundedRect(ctx, 10, 10, 210, 82, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148,163,184,0.45)';
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, 10, 10, 210, 82, 12);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(241,245,249,0.95)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`Snacks caught: ${scoreRef.current}`, 20, 34);
      ctx.fillText(`Misses: ${st.misses}/${MAX_MISSES}`, 20, 56);
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('Move: A/D or Arrow Keys', 20, 78);

      if (!hasStarted && !isOver) {
        ctx.fillStyle = 'rgba(2,6,23,0.55)';
        drawRoundedRect(ctx, WIDTH * 0.5 - 180, HEIGHT * 0.5 - 45, 360, 90, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(125,211,252,0.35)';
        ctx.lineWidth = 1.4;
        drawRoundedRect(ctx, WIDTH * 0.5 - 180, HEIGHT * 0.5 - 45, 360, 90, 16);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(241,245,249,0.96)';
        ctx.font = 'bold 20px "JetBrains Mono", monospace';
        ctx.fillText('Tap To Begin Feeding', WIDTH * 0.5, HEIGHT * 0.5 - 5);
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(226,232,240,0.92)';
        ctx.fillText('Catch food in the mouth. Missing too many ends class.', WIDTH * 0.5, HEIGHT * 0.5 + 18);
      }
    };

    const update = (now: number) => {
      const st = stateRef.current;
      if (isOver || !hasStarted) return;

      if (st.leftHeld) st.x -= PLAYER_SPEED;
      if (st.rightHeld) st.x += PLAYER_SPEED;
      st.x = Math.max(48, Math.min(WIDTH - 48, st.x));

      if (now - st.lastSpawn >= SPAWN_MS || st.foods.length < 2) {
        spawnFood(now);
      }

      if (st.chewTimer > 0) st.chewTimer = Math.max(0, st.chewTimer - 16.67);

      const mouthX = st.x;
      const mouthY = PLAYER_Y + 20;
      const catchRadius = 30;
      let missesThisFrame = 0;

      st.foods = st.foods.filter((food) => {
        const nextY = food.y + food.vy;
        food.y = nextY;

        const dx = food.x - mouthX;
        const dy = food.y - mouthY;
        const caught = Math.sqrt(dx * dx + dy * dy) <= catchRadius + food.r * 0.55;
        if (caught) {
          st.chewTimer = 230;
          setScore((prev) => {
            const next = prev + 1;
            scoreRef.current = next;
            return next;
          });
          return false;
        }

        if (food.y - food.r > HEIGHT) {
          missesThisFrame += 1;
          return false;
        }
        return true;
      });

      if (missesThisFrame > 0) {
        st.misses += missesThisFrame;
        if (st.misses >= MAX_MISSES) endRun();
      }
    };

    const loop = (ts: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const delta = ts - last;
      last = ts;
      if (ctx) {
        if (delta > 0) update(ts);
        draw(ctx);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasStarted, isOver]);

  const handlePointerMove: React.PointerEventHandler<HTMLCanvasElement> = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rel = (event.clientX - rect.left) / Math.max(1, rect.width);
    stateRef.current.x = Math.max(48, Math.min(WIDTH - 48, rel * WIDTH));
  };

  const startGame = () => {
    if (!hasStarted) setHasStarted(true);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={startGame}
        onPointerMove={handlePointerMove}
        className="w-full rounded-xl border border-sky-500/35 shadow-[0_0_30px_rgba(56,189,248,0.15)] bg-slate-950 touch-none"
      />
      <p className="text-xs text-slate-400 mt-3">
        Drag/tap to position. Catch items in the mouth zone to trigger the chew animation.
      </p>
      <button
        type="button"
        onClick={startGame}
        className="mt-3 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs text-slate-200"
      >
        Start Round
      </button>
    </div>
  );
};

export default FeedSundgren;
