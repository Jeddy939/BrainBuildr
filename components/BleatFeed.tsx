import React from 'react';

interface BleatFeedProps {
  anxietyLevel: number;
  items: string[];
  className?: string;
}

const getTierLabel = (anxietyLevel: number) => {
  if (anxietyLevel <= 33) return 'Honeymoon';
  if (anxietyLevel <= 66) return 'Unease';
  return 'Pitchforks';
};

export default function BleatFeed({ anxietyLevel, items, className = '' }: BleatFeedProps) {
  const [expanded, setExpanded] = React.useState(false);
  const latest = items[0] || 'No public chatter yet.';

  return (
    <div className={`panel-soft rounded-xl border border-rose-500/25 transition-all ${expanded ? 'p-3' : 'p-2'} ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-rose-300">Humanity Feed</p>
          <p className="text-[10px] text-slate-400">{getTierLabel(anxietyLevel)} - {anxietyLevel.toFixed(1)}%</p>
        </div>
        {!expanded && (
          <p className="mt-1 text-[11px] text-slate-300 truncate">{latest}</p>
        )}
      </button>

      {expanded && (
        <div className="mt-2 max-h-[170px] overflow-y-auto space-y-1.5 pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">No public chatter yet.</p>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.slice(0, 16)}_${idx}`} className="rounded bg-ink-900/45 px-2 py-1.5 text-xs text-slate-200">
                {item}
              </div>
            ))
          )}
        </div>
      )}
      <div className="mt-1 text-[10px] text-slate-500">
        {expanded ? 'Click header to collapse' : 'Click to expand'}
      </div>
    </div>
  );
}
