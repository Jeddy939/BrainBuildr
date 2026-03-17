import React from 'react';

interface ActiveDistractionsProps {
  nudges: number;
  shinyMs: number;
  scandalMs: number;
  onActivateShiny: () => void;
  onActivateScandal: () => void;
}

const seconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

export default function ActiveDistractions({
  nudges,
  shinyMs,
  scandalMs,
  onActivateShiny,
  onActivateScandal
}: ActiveDistractionsProps) {
  return (
    <div className="panel-soft rounded-xl p-3 border border-amber-500/25 space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-amber-300">Active Distractions</p>

      <div className="chip rounded p-2 text-xs">
        <p className="text-slate-200 font-semibold">Drop a Shiny Gadget</p>
        <p className="text-slate-400 mt-1">Cost 10 nudges. Freeze anxiety drift for 60s, money generation x2.</p>
        <div className="mt-1 text-[11px] text-cyan-300">Active: {seconds(shinyMs)}s</div>
        <button
          onClick={onActivateShiny}
          disabled={nudges < 10}
          className="mt-2 rounded px-2 py-1 bg-amber-700 text-white disabled:opacity-40"
        >
          Activate (10 Nudges)
        </button>
      </div>

      <div className="chip rounded p-2 text-xs">
        <p className="text-slate-200 font-semibold">Manufacture Celebrity Scandal</p>
        <p className="text-slate-400 mt-1">Cost 5 nudges. Land/mining anxiety generation -80% for 120s.</p>
        <div className="mt-1 text-[11px] text-cyan-300">Active: {seconds(scandalMs)}s</div>
        <button
          onClick={onActivateScandal}
          disabled={nudges < 5}
          className="mt-2 rounded px-2 py-1 bg-amber-900 text-white disabled:opacity-40"
        >
          Activate (5 Nudges)
        </button>
      </div>
    </div>
  );
}

