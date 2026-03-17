import React, { useEffect, useRef, useState } from 'react';

type Cell = string | null;
type Dir = -1 | 1;

interface BrainBuilderProps {
  onFinish: (result: { score: number }) => void;
}

const W = 10;
const H = 18;
const CANVAS_W = 800;
const CANVAS_H = 450;
const CELL = Math.floor(Math.min((CANVAS_W - 220) / W, (CANVAS_H - 36) / H));
const GRID_W_PX = W * CELL;
const GRID_H_PX = H * CELL;
const OFFSET_X = Math.floor((CANVAS_W - GRID_W_PX) / 2);
const OFFSET_Y = Math.floor((CANVAS_H - GRID_H_PX) / 2);

type PieceDef = {
  id: string;
  color: string;
  cells: Array<[number, number]>;
};

const PIECES: PieceDef[] = [
  { id: 'I', color: '#fda4af', cells: [[-1, 0], [0, 0], [1, 0], [2, 0]] },
  { id: 'O', color: '#f9a8d4', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { id: 'T', color: '#fbcfe8', cells: [[-1, 0], [0, 0], [1, 0], [0, 1]] },
  { id: 'L', color: '#fecdd3', cells: [[-1, 0], [0, 0], [1, 0], [1, 1]] },
  { id: 'J', color: '#fda4af', cells: [[-1, 1], [-1, 0], [0, 0], [1, 0]] },
  { id: 'S', color: '#f9a8d4', cells: [[-1, 1], [0, 1], [0, 0], [1, 0]] },
  { id: 'Z', color: '#fca5a5', cells: [[-1, 0], [0, 0], [0, 1], [1, 1]] }
];

const rotate = (cells: Array<[number, number]>): Array<[number, number]> =>
  cells.map(([x, y]) => [-y, x]);

const BrainBuilder: React.FC<BrainBuilderProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const onFinishRef = useRef(onFinish);
  const scoreRef = useRef(0);

  const stateRef = useRef<{
    board: Cell[][];
    piece: PieceDef;
    cells: Array<[number, number]>;
    x: number;
    y: number;
    pulse: number;
  }>({
    board: Array.from({ length: H }, () => Array.from<Cell>({ length: W }).fill(null)),
    piece: PIECES[Math.floor(Math.random() * PIECES.length)],
    cells: PIECES[Math.floor(Math.random() * PIECES.length)].cells,
    x: Math.floor(W / 2),
    y: 1,
    pulse: 0
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const st = stateRef.current;
    st.piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    st.cells = st.piece.cells;
    st.x = Math.floor(W / 2);
    st.y = 1;
  }, []);

  const collides = (cells: Array<[number, number]>, x: number, y: number) => {
    const { board } = stateRef.current;
    for (const [cx, cy] of cells) {
      const px = cx + x;
      const py = cy + y;
      if (px < 0 || px >= W || py >= H) return true;
      if (py >= 0 && board[py][px]) return true;
    }
    return false;
  };

  const spawnNext = () => {
    const st = stateRef.current;
    const next = PIECES[Math.floor(Math.random() * PIECES.length)];
    st.piece = next;
    st.cells = next.cells;
    st.x = Math.floor(W / 2);
    st.y = 1;
    if (collides(st.cells, st.x, st.y)) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setIsOver(true);
        onFinishRef.current({ score: scoreRef.current });
      }
    }
  };

  const mergePiece = () => {
    const st = stateRef.current;
    for (const [cx, cy] of st.cells) {
      const px = cx + st.x;
      const py = cy + st.y;
      if (py >= 0 && py < H && px >= 0 && px < W) {
        st.board[py][px] = st.piece.color;
      }
    }

    let cleared = 0;
    st.board = st.board.filter((row) => {
      const full = row.every(Boolean);
      if (full) cleared += 1;
      return !full;
    });
    while (st.board.length < H) {
      st.board.unshift(Array.from<Cell>({ length: W }).fill(null));
    }
    if (cleared > 0) {
      setScore((prev) => {
        const next = prev + cleared * 120;
        scoreRef.current = next;
        return next;
      });
    }

    spawnNext();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isOver) return;
      const st = stateRef.current;
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', ' '].includes(key)) {
        event.preventDefault();
      }

      if (key === 'arrowleft' || key === 'a') {
        const nx = st.x - 1;
        if (!collides(st.cells, nx, st.y)) st.x = nx;
      }
      if (key === 'arrowright' || key === 'd') {
        const nx = st.x + 1;
        if (!collides(st.cells, nx, st.y)) st.x = nx;
      }
      if (key === 'arrowup' || key === 'w') {
        const rotated = rotate(st.cells);
        if (!collides(rotated, st.x, st.y)) st.cells = rotated;
      }
      if (key === 'arrowdown' || key === 's') {
        const ny = st.y + 1;
        if (!collides(st.cells, st.x, ny)) st.y = ny;
        else mergePiece();
      }
      if (key === ' ') {
        let ny = st.y;
        while (!collides(st.cells, st.x, ny + 1)) ny += 1;
        st.y = ny;
        mergePiece();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOver]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let dropAcc = 0;

    const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
      const { board, cells, x, y, piece, pulse } = st;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#0b1120');
      bg.addColorStop(1, '#0f172a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const skull = ctx.createRadialGradient(CANVAS_W * 0.5, CANVAS_H * 0.42, 40, CANVAS_W * 0.5, CANVAS_H * 0.5, CANVAS_W * 0.58);
      skull.addColorStop(0, 'rgba(226,232,240,0.18)');
      skull.addColorStop(0.6, 'rgba(148,163,184,0.08)');
      skull.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = skull;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // X-ray scan lines for "inside the head" feel
      ctx.strokeStyle = 'rgba(148,163,184,0.07)';
      ctx.lineWidth = 1;
      for (let sy = 8; sy < CANVAS_H; sy += 10) {
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(CANVAS_W, sy);
        ctx.stroke();
      }

      // Outer skull shell (x-ray style)
      ctx.strokeStyle = 'rgba(226,232,240,0.42)';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, 6, 4, CANVAS_W - 12, CANVAS_H - 8, 34);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 12, 10, CANVAS_W - 24, CANVAS_H - 20, 28);
      ctx.stroke();

      // Cranial chamber / inner scan window
      ctx.strokeStyle = 'rgba(56,189,248,0.26)';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, 22, 20, CANVAS_W - 44, CANVAS_H - 40, 20);
      ctx.stroke();

      // Eye sockets / jaw hint to read as skull, not just frame
      ctx.fillStyle = 'rgba(15,23,42,0.42)';
      ctx.beginPath();
      ctx.ellipse(CANVAS_W * 0.35, CANVAS_H * 0.28, 22, 15, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(CANVAS_W * 0.65, CANVAS_H * 0.28, 22, 15, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W * 0.25, CANVAS_H - 58);
      ctx.quadraticCurveTo(CANVAS_W * 0.5, CANVAS_H - 34, CANVAS_W * 0.75, CANVAS_H - 58);
      ctx.stroke();

      // Brain backdrop silhouette (behind grid)
      const brainX = 30;
      const brainY = 26;
      const brainW = CANVAS_W - 60;
      const brainH = CANVAS_H - 54;
      const cortexBg = ctx.createRadialGradient(
        brainX + brainW * 0.5,
        brainY + brainH * 0.38,
        20,
        brainX + brainW * 0.5,
        brainY + brainH * 0.5,
        brainW * 0.65
      );
      cortexBg.addColorStop(0, 'rgba(236,72,153,0.16)');
      cortexBg.addColorStop(0.55, 'rgba(190,24,93,0.10)');
      cortexBg.addColorStop(1, 'rgba(30,41,59,0)');
      ctx.fillStyle = cortexBg;
      drawRoundRect(ctx, brainX, brainY, brainW, brainH, 22);
      ctx.fill();

      // Cerebellum glow near base
      const cerebellum = ctx.createRadialGradient(CANVAS_W * 0.5, CANVAS_H - 74, 8, CANVAS_W * 0.5, CANVAS_H - 74, 58);
      cerebellum.addColorStop(0, 'rgba(251,113,133,0.20)');
      cerebellum.addColorStop(1, 'rgba(30,41,59,0)');
      ctx.fillStyle = cerebellum;
      ctx.beginPath();
      ctx.ellipse(CANVAS_W * 0.5, CANVAS_H - 74, 60, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lobe divisions
      ctx.strokeStyle = 'rgba(244,114,182,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W * 0.5, brainY + 8);
      ctx.lineTo(CANVAS_W * 0.5, brainY + brainH - 8);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125,211,252,0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i += 1) {
        const yy = brainY + 14 + i * ((brainH - 28) / 10);
        const wave = Math.sin(pulse * 0.7 + i * 0.65) * 6;
        ctx.beginPath();
        ctx.moveTo(brainX + 10, yy);
        ctx.bezierCurveTo(brainX + brainW * 0.35, yy + wave, brainX + brainW * 0.65, yy - wave, brainX + brainW - 10, yy);
        ctx.stroke();
      }

      for (let gy = 0; gy < H; gy += 1) {
        for (let gx = 0; gx < W; gx += 1) {
          const px = OFFSET_X + gx * CELL;
          const py = OFFSET_Y + gy * CELL;
          const color = board[gy][gx];
          if (!color) {
            ctx.fillStyle = 'rgba(100,116,139,0.03)';
            drawRoundRect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 8);
            ctx.fill();
            continue;
          }

          const tissue = ctx.createRadialGradient(px + CELL * 0.35, py + CELL * 0.28, 2, px + CELL * 0.5, py + CELL * 0.5, CELL * 0.8);
          tissue.addColorStop(0, color);
          tissue.addColorStop(0.6, 'rgba(236,72,153,0.65)');
          tissue.addColorStop(1, 'rgba(30,41,59,0.86)');
          ctx.fillStyle = tissue;
          drawRoundRect(ctx, px + 1.5, py + 1.5, CELL - 3, CELL - 3, 7);
          ctx.fill();

          ctx.strokeStyle = 'rgba(254,205,211,0.42)';
          ctx.lineWidth = 1.1;
          drawRoundRect(ctx, px + 2.5, py + 2.5, CELL - 5, CELL - 5, 6);
          ctx.stroke();

          // Gyri-like ridges on each block
          ctx.strokeStyle = 'rgba(254,242,242,0.20)';
          ctx.lineWidth = 0.9;
          for (let r = 0; r < 2; r += 1) {
            const yy = py + 7 + r * 7;
            ctx.beginPath();
            ctx.moveTo(px + 4, yy);
            ctx.quadraticCurveTo(px + CELL * 0.45, yy + Math.sin(pulse + gx + gy + r) * 2.2, px + CELL - 4, yy);
            ctx.stroke();
          }
        }
      }

      for (const [cx, cy] of cells) {
        const gx = cx + x;
        const gy = cy + y;
        if (gy < 0) continue;
        const px = OFFSET_X + gx * CELL;
        const py = OFFSET_Y + gy * CELL;
        const liveTissue = ctx.createRadialGradient(px + CELL * 0.35, py + CELL * 0.28, 2, px + CELL * 0.5, py + CELL * 0.5, CELL * 0.82);
        liveTissue.addColorStop(0, piece.color);
        liveTissue.addColorStop(0.62, 'rgba(244,114,182,0.72)');
        liveTissue.addColorStop(1, 'rgba(15,23,42,0.9)');
        ctx.fillStyle = liveTissue;
        drawRoundRect(ctx, px + 1, py + 1, CELL - 2, CELL - 2, 8);
        ctx.fill();

        ctx.strokeStyle = `rgba(255,255,255,${0.16 + Math.sin(pulse + gx + gy) * 0.08})`;
        ctx.lineWidth = 1.2;
        drawRoundRect(ctx, px + 2.5, py + 2.5, CELL - 5, CELL - 5, 6);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,241,242,0.24)';
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 8);
        ctx.quadraticCurveTo(px + CELL * 0.45, py + 5 + Math.sin(pulse + gx) * 2.1, px + CELL - 4, py + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 15);
        ctx.quadraticCurveTo(px + CELL * 0.55, py + 13 + Math.cos(pulse + gy) * 2.1, px + CELL - 4, py + 15);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(191,219,254,0.92)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(`Cortex score ${scoreRef.current}`, OFFSET_X - 6, 22);
    };

    const update = (deltaMs: number) => {
      const st = stateRef.current;
      st.pulse += deltaMs * 0.008;
      if (isOver) return;

      const speed = Math.max(120, 650 - Math.floor(scoreRef.current / 150) * 40);
      dropAcc += deltaMs;
      if (dropAcc < speed) return;
      dropAcc = 0;

      const ny = st.y + 1;
      if (!collides(st.cells, st.x, ny)) st.y = ny;
      else mergePiece();
    };

    const loop = (ts: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const delta = ts - last;
      last = ts;
      update(delta);
      if (ctx) draw(ctx);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isOver]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full rounded-xl border border-sky-500/35 shadow-[0_0_30px_rgba(56,189,248,0.15)] bg-slate-950"
      />
      <p className="text-xs text-slate-400 mt-3">
        Controls: `A/D` move, `W` rotate, `S` drop, `Space` hard-drop.
      </p>
    </div>
  );
};

export default BrainBuilder;
