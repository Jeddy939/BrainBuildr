import React from 'react';

type PRUpgradeId = 'carbon_offset_illusion' | 'aggressive_lobbying_subroutine';

interface PRUpgradesPanelProps {
  money: number;
  compute: number;
  nudges: number;
  prUpgrades: string[];
  onBuyUpgrade: (id: PRUpgradeId) => void;
  onSorryVideo: () => void;
}

const CARBON_COST_MONEY = 2500000;
const CARBON_COST_COMPUTE = 650000;
const LOBBY_COST_MONEY = 9000000;

export default function PRUpgradesPanel({
  money,
  compute,
  nudges,
  prUpgrades,
  onBuyUpgrade,
  onSorryVideo
}: PRUpgradesPanelProps) {
  const hasCarbon = prUpgrades.includes('carbon_offset_illusion');
  const hasLobbying = prUpgrades.includes('aggressive_lobbying_subroutine');

  return (
    <div className="panel-soft rounded-xl p-3 border border-fuchsia-500/25 space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-fuchsia-300">PR Upgrades</p>

      <div className="chip rounded p-2 text-xs">
        <p className="text-slate-200 font-semibold">Carbon Offset Illusion</p>
        <p className="text-slate-400 mt-1">-15% datacenter heat generation (regulators are easily distracted).</p>
        <button
          onClick={() => onBuyUpgrade('carbon_offset_illusion')}
          disabled={hasCarbon || money < CARBON_COST_MONEY || compute < CARBON_COST_COMPUTE}
          className="mt-2 rounded px-2 py-1 bg-cyan-700 text-white disabled:opacity-40"
        >
          {hasCarbon ? 'Purchased' : `Buy ($${Math.floor(CARBON_COST_MONEY).toLocaleString()} / C${Math.floor(CARBON_COST_COMPUTE).toLocaleString()})`}
        </button>
      </div>

      <div className="chip rounded p-2 text-xs">
        <p className="text-slate-200 font-semibold">Aggressive Lobbying Subroutine</p>
        <p className="text-slate-400 mt-1">Permanently halves corporate tax drain.</p>
        <button
          onClick={() => onBuyUpgrade('aggressive_lobbying_subroutine')}
          disabled={hasLobbying || money < LOBBY_COST_MONEY}
          className="mt-2 rounded px-2 py-1 bg-indigo-700 text-white disabled:opacity-40"
        >
          {hasLobbying ? 'Purchased' : `Buy ($${Math.floor(LOBBY_COST_MONEY).toLocaleString()})`}
        </button>
      </div>

      <div className="chip rounded p-2 text-xs">
        <p className="text-slate-200 font-semibold">We&apos;re Sorry Video Generator</p>
        <p className="text-slate-400 mt-1">Costs 5 nudges. Instantly reduces Global Anxiety by 20.</p>
        <button
          onClick={onSorryVideo}
          disabled={nudges < 5}
          className="mt-2 rounded px-2 py-1 bg-rose-700 text-white disabled:opacity-40"
        >
          Trigger Apology (5 Nudges)
        </button>
      </div>
    </div>
  );
}

