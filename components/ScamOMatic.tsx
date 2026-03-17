import React, { useEffect, useState } from 'react';
import { Info, Minus, Plus, X } from 'lucide-react';

export type ScamOMaticOutcome = {
  resource: 'money';
  bet: number;
  multiplier: number;
  delta: number;
  label: string;
};

type ScamOMaticProps = {
  money: number;
  onFinish: (outcome: ScamOMaticOutcome) => void;
};

type SymbolType = 'HOUSE' | 'THEFT' | 'PAWN' | 'LOAN' | 'SCAM' | 'DEBT' | 'L' | 'O' | 'S' | 'E' | 'R' | '!';
const MAX_BET_PER_LINE = 1000;
const SPIN_LIMIT = 10;
const HOUSE_EDGE_RATE = 0.15;

const SYMBOLS: Record<SymbolType, { label: string; color: string; emoji?: string }> = {
  HOUSE: { label: 'HOUSE', color: 'bg-gradient-to-br from-red-600 to-red-900 text-white border-2 border-red-400', emoji: '🏦' },
  THEFT: { label: 'THEFT', color: 'bg-gradient-to-br from-green-700 to-green-900 text-white border-2 border-green-400', emoji: '🦹' },
  PAWN: { label: 'PAWN', color: 'bg-gradient-to-br from-orange-500 to-red-600 text-white', emoji: '🏪' },
  LOAN: { label: 'LOAN', color: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white', emoji: '💸' },
  SCAM: { label: 'SCAM', color: 'bg-gradient-to-br from-purple-600 to-purple-900 text-white', emoji: '🤡' },
  DEBT: { label: 'DEBT', color: 'bg-gradient-to-br from-zinc-600 to-zinc-900 text-white', emoji: '💳' },
  L: { label: 'L', color: 'bg-zinc-900 text-red-500 border-2 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]' },
  O: { label: 'O', color: 'bg-zinc-900 text-orange-500 border-2 border-orange-500 shadow-[inset_0_0_20px_rgba(249,115,22,0.5)]' },
  S: { label: 'S', color: 'bg-zinc-900 text-yellow-400 border-2 border-yellow-400 shadow-[inset_0_0_20px_rgba(250,204,21,0.5)]' },
  E: { label: 'E', color: 'bg-zinc-900 text-green-400 border-2 border-green-400 shadow-[inset_0_0_20px_rgba(74,222,128,0.5)]' },
  R: { label: 'R', color: 'bg-zinc-900 text-blue-400 border-2 border-blue-400 shadow-[inset_0_0_20px_rgba(96,165,250,0.5)]' },
  '!': { label: '!', color: 'bg-zinc-900 text-purple-400 border-2 border-purple-400 shadow-[inset_0_0_20px_rgba(192,132,252,0.5)]' }
};

const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  HOUSE: 2, THEFT: 3, PAWN: 5, LOAN: 6, SCAM: 7, DEBT: 8,
  L: 12, O: 12, S: 12, E: 12, R: 12, '!': 12
};

const getRandomSymbol = (): SymbolType => {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    if (random < weight) return symbol as SymbolType;
    random -= weight;
  }
  return '!';
};

const PAYTABLE: Record<SymbolType, number[]> = {
  HOUSE: [10, 100, 1000, 5000], THEFT: [2, 5, 20, 100],
  PAWN: [2, 25, 100, 500], LOAN: [2, 20, 80, 400],
  SCAM: [0, 15, 50, 200], DEBT: [0, 10, 40, 150],
  L: [0, 5, 20, 100], O: [0, 5, 20, 100],
  S: [0, 5, 20, 100], E: [0, 5, 20, 100],
  R: [0, 5, 20, 100], '!': [0, 5, 20, 100]
};

const PAYLINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0]
];

interface WinLine {
  lineIndex: number;
  symbol: SymbolType;
  count: number;
  amount: number;
  positions: { col: number; row: number }[];
}

const calculateWins = (grid: SymbolType[][], betPerLine: number, activeLines: number) => {
  const wins: WinLine[] = [];
  let totalWin = 0;
  let loserSpins = 0;

  for (let i = 0; i < activeLines; i += 1) {
    const line = PAYLINES[i];

    const loserTarget = ['L', 'O', 'S', 'E', 'R'];
    let isLoser = true;
    const loserPositions: { col: number; row: number }[] = [];
    for (let col = 0; col < 5; col += 1) {
      const row = line[col];
      const symbol = grid[col][row];
      loserPositions.push({ col, row });
      if (symbol !== loserTarget[col] && symbol !== 'HOUSE') {
        isLoser = false;
        break;
      }
    }

    if (isLoser) {
      loserSpins += 15;
      const amount = 1000 * betPerLine;
      wins.push({ lineIndex: i, symbol: 'L', count: 5, amount, positions: loserPositions });
      totalWin += amount;
    }

    let matchSymbol: SymbolType | null = null;
    let matchCount = 0;
    const positions: { col: number; row: number }[] = [];

    for (let col = 0; col < 5; col += 1) {
      const row = line[col];
      const symbol = grid[col][row];

      if (symbol === 'THEFT') break;

      if (col === 0) {
        matchSymbol = symbol;
        matchCount = 1;
        positions.push({ col, row });
      } else if (symbol === matchSymbol || symbol === 'HOUSE') {
        matchCount += 1;
        positions.push({ col, row });
      } else if (matchSymbol === 'HOUSE') {
        matchSymbol = symbol;
        matchCount += 1;
        positions.push({ col, row });
      } else {
        break;
      }
    }

    if (matchSymbol && matchSymbol !== 'THEFT') {
      const payouts = PAYTABLE[matchSymbol];
      const payoutIndex = matchCount - 2;
      if (payoutIndex >= 0 && payouts[payoutIndex] > 0) {
        const amount = payouts[payoutIndex] * betPerLine;
        wins.push({ lineIndex: i, symbol: matchSymbol, count: matchCount, amount, positions });
        totalWin += amount;
      }
    }
  }

  let scatterCount = 0;
  const scatterPositions: { col: number; row: number }[] = [];
  for (let col = 0; col < 5; col += 1) {
    for (let row = 0; row < 3; row += 1) {
      if (grid[col][row] === 'THEFT') {
        scatterCount += 1;
        scatterPositions.push({ col, row });
      }
    }
  }

  let scatterWin = 0;
  if (scatterCount >= 2) {
    const payoutIndex = scatterCount - 2;
    if (payoutIndex >= 0 && PAYTABLE.THEFT[payoutIndex] > 0) {
      scatterWin = PAYTABLE.THEFT[payoutIndex] * (betPerLine * activeLines);
      totalWin += scatterWin;
      wins.push({ lineIndex: -1, symbol: 'THEFT', count: scatterCount, amount: scatterWin, positions: scatterPositions });
    }
  }

  return { wins, scatterWin, totalWin, loserSpins };
};

export default function ScamOMatic({ money, onFinish }: ScamOMaticProps) {
  const [grid, setGrid] = useState<SymbolType[][]>(() => Array(5).fill(Array(3).fill('!')));
  const [displayGrid, setDisplayGrid] = useState<SymbolType[][]>(grid);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [sessionStartCredits, setSessionStartCredits] = useState(0);
  const [credits, setCredits] = useState(0);
  const [betPerLine, setBetPerLine] = useState(1);
  const [lines, setLines] = useState(9);
  const [winAmount, setWinAmount] = useState(0);
  const [winningLines, setWinningLines] = useState<WinLine[]>([]);
  const [freeSpins, setFreeSpins] = useState(0);
  const [autoFreeSpins, setAutoFreeSpins] = useState(true);
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [sessionApplied, setSessionApplied] = useState(false);

  const [showGamble, setShowGamble] = useState(false);
  const [gambleModalOpen, setGambleModalOpen] = useState(false);
  const [gambleCard, setGambleCard] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);
  const [message, setMessage] = useState('Welcome to the Scam-O-Matic!');

  const SARCASTIC_LOSS_MESSAGES = [
    'lol, u lose!',
    'Thanks for the donation!',
    'The house always wins.',
    'Try again, surely next time!',
    'Your money is gone.',
    'Should have bought groceries.',
    'Math is hard, isn\'t it?',
    'Another one bites the dust.',
    'We appreciate your business.',
    'Just one more spin...',
    'Your kids didn\'t need college anyway.',
    '99% of gamblers quit right before they win big!',
    'Have you considered a second mortgage?',
    'We\'re building a new casino wing with your money.',
    'Skill issue.',
    'That was a near miss! (Not really)',
    'Don\'t worry, the ATM is just outside.',
    'Your landlord called, he\'s laughing.',
    'Ramen noodles for dinner again!',
    'You\'re paying for the CEO\'s new yacht.',
    'Just borrow some from a friend.',
    'It\'s not an addiction, it\'s a hobby.',
    'Chasing losses is a valid financial strategy.',
    'Imagine what you could have bought with that.',
    'Oops! There goes the car payment.'
  ];

  const SARCASTIC_WIN_MESSAGES = [
    'A temporary setback for the house.',
    'Don\'t worry, we\'ll get it back.',
    'Enjoy it while it lasts.',
    'Beginner\'s luck.',
    'You actually won? Must be a glitch.',
    'Gamble it, you coward.',
    'Wow, you\'re only down $5,000 now!',
    'Put it all back in, you\'re on a hot streak!',
    'This changes nothing.',
    'False hope activated.',
    'We let you win so you stay longer.',
    'Congratulations! Now double it.',
    'The algorithm made a mistake.',
    'Your dopamine receptors are firing!',
    'Quick, tell your friends you\'re a professional.'
  ];

  // Important: initialize once per minigame open.
  // Do not re-sync with live main-game cash ticks, or the slot UI will keep resetting.
  useEffect(() => {
    const bankroll = Math.max(0, Math.floor(money));
    const freshGrid: SymbolType[][] = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => '!' as SymbolType));
    setSessionStartCredits(bankroll);
    setCredits(bankroll);
    setBetPerLine(1);
    setLines(9);
    setWinAmount(0);
    setWinningLines([]);
    setFreeSpins(0);
    setAutoFreeSpins(true);
    setSpinsUsed(0);
    setSessionApplied(false);
    setShowGamble(false);
    setGambleModalOpen(false);
    setGambleCard(null);
    setMessage('Welcome to the Scam-O-Matic!');
    setGrid(freshGrid);
    setDisplayGrid(freshGrid);
  }, []);

  useEffect(() => {
    if (autoFreeSpins && freeSpins > 0 && !isSpinning && winAmount === 0 && !gambleModalOpen && spinsUsed < SPIN_LIMIT) {
      const timer = setTimeout(() => {
        void spin();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoFreeSpins, freeSpins, isSpinning, winAmount, gambleModalOpen, spinsUsed]);

  const spin = async () => {
    if (isSpinning || sessionApplied) return;
    if (spinsUsed >= SPIN_LIMIT) {
      setMessage('Session spin limit reached. Compliance auto-closes the machine.');
      applyBalanceToMainGame('Spin Limit Reached');
      return;
    }

    let currentCredits = credits;
    if (winAmount > 0) {
      currentCredits += winAmount;
      setCredits(currentCredits);
      setWinAmount(0);
      setShowGamble(false);
    }

    const totalBet = betPerLine * lines;
    if (currentCredits < totalBet && freeSpins === 0) {
      alert('Not enough credits!');
      return;
    }

    setIsSpinning(true);
    setWinningLines([]);

    if (freeSpins === 0) {
      setCredits(currentCredits - totalBet);
    } else {
      setFreeSpins((fs) => fs - 1);
    }

    const spinMask = [true, true, true, true, true];
    setSpinningCols([...spinMask]);
    setMessage('Spinning your money away...');

    const spinInterval = setInterval(() => {
      setDisplayGrid((prev) => prev.map((col, i) => (
        spinMask[i] ? [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()] : col
      )));
    }, 80);

    const newGrid: SymbolType[][] = [];
    for (let col = 0; col < 5; col += 1) {
      newGrid.push([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
    }

    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 300 + (i * 150)));
      spinMask[i] = false;
      setSpinningCols([...spinMask]);
      setDisplayGrid((prev) => {
        const next = [...prev];
        next[i] = newGrid[i];
        return next;
      });
    }
    clearInterval(spinInterval);
    setSpinningCols([false, false, false, false, false]);
    // Ensure displayed symbols always match the calculated payout grid.
    setDisplayGrid(newGrid);

    const { wins, totalWin, loserSpins } = calculateWins(newGrid, betPerLine, lines);

    if (totalWin > 0) {
      const grossWin = freeSpins > 0 ? totalWin * 3 : totalWin;
      const houseCut = Math.floor(grossWin * HOUSE_EDGE_RATE);
      const finalWin = Math.max(1, grossWin - houseCut);
      setWinAmount(finalWin);
      setWinningLines(wins);
      setMessage(SARCASTIC_WIN_MESSAGES[Math.floor(Math.random() * SARCASTIC_WIN_MESSAGES.length)]);

      if (freeSpins === 0) {
        setShowGamble(true);
      } else {
        setTimeout(() => {
          setCredits((c) => c + finalWin);
          setWinAmount(0);
        }, 1500);
      }
    } else {
      setMessage(SARCASTIC_LOSS_MESSAGES[Math.floor(Math.random() * SARCASTIC_LOSS_MESSAGES.length)]);
    }

    const scatterCount = newGrid.flat().filter((s) => s === 'THEFT').length;
    const totalFreeSpinsWon = (scatterCount >= 3 ? 15 : 0) + loserSpins;

    if (totalFreeSpinsWon > 0) {
      setTimeout(() => {
        alert(`You won ${totalFreeSpinsWon} Free Spins! ${loserSpins > 0 ? '(L-O-S-E-R Combo!)' : ''}`);
        setFreeSpins((fs) => fs + totalFreeSpinsWon);
      }, 500);
    }

    setGrid(newGrid);
    setSpinsUsed((prev) => {
      const next = prev + 1;
      if (next >= SPIN_LIMIT) {
        setTimeout(() => {
          applyBalanceToMainGame('Spin Limit Reached');
        }, 300);
      }
      return next;
    });
    setIsSpinning(false);
  };

  const takeWin = () => {
    setCredits((c) => c + winAmount);
    setWinAmount(0);
    setShowGamble(false);
    setGambleModalOpen(false);
  };

  const handleGamble = (choice: 'red' | 'black' | 'hearts' | 'diamonds' | 'clubs' | 'spades') => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const actualSuit = suits[Math.floor(Math.random() * suits.length)];
    const isRed = actualSuit === 'hearts' || actualSuit === 'diamonds';
    const isBlack = actualSuit === 'clubs' || actualSuit === 'spades';

    setGambleCard(actualSuit);

    let won = false;
    let multiplier = 0;

    if (choice === 'red' && isRed) { won = true; multiplier = 2; }
    else if (choice === 'black' && isBlack) { won = true; multiplier = 2; }
    else if (choice === actualSuit) { won = true; multiplier = 4; }

    if (won) {
      setWinAmount((w) => w * multiplier);
      setTimeout(() => setGambleCard(null), 1500);
    } else {
      setWinAmount(0);
      setTimeout(() => {
        setGambleModalOpen(false);
        setShowGamble(false);
        setGambleCard(null);
      }, 1500);
    }
  };

  const applyBalanceToMainGame = (reason = 'Session Closed') => {
    if (isSpinning || sessionApplied) return;
    setSessionApplied(true);
    const finalCredits = credits + winAmount;
    const delta = Math.floor(finalCredits - sessionStartCredits);
    const baseBet = Math.max(1, Math.floor(betPerLine * lines));
    onFinish({
      resource: 'money',
      bet: baseBet,
      multiplier: sessionStartCredits > 0 ? finalCredits / sessionStartCredits : 1,
      delta,
      label: `${reason}: ${delta >= 0 ? 'Session Profit' : 'Session Loss'}`
    });
  };

  return (
    <div className="w-full bg-zinc-900 text-white font-sans p-2 md:p-4 max-h-[74vh] overflow-y-auto">
      <div className="bg-zinc-800 p-4 md:p-5 rounded-3xl shadow-2xl border-4 border-zinc-700 max-w-5xl w-full mx-auto">
        <div className="text-center mb-6 relative">
          <h1 className="text-3xl md:text-5xl font-black text-red-500 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
            SCAM-O-MATIC 3000
          </h1>
          <p className="text-xl text-zinc-400 mt-2 italic font-serif">"The house always wins."</p>
          <div className="mt-4 bg-black border-2 border-red-900 rounded-lg p-3 mx-auto max-w-2xl">
            <p className="text-2xl text-yellow-400 font-mono font-bold animate-pulse">{message}</p>
          </div>
          <div className="mt-2 mx-auto max-w-3xl rounded-lg border border-amber-400/35 bg-amber-500/10 p-2">
            <p className="text-xs md:text-sm text-amber-200">
              This machine is engineered for an 85% payout return. The missing 15% goes to executive yacht maintenance.
              You will feel like you are winning while the math quietly disagrees.
            </p>
          </div>
          <button
            onClick={() => setShowPaytable(true)}
            className="absolute right-0 top-0 p-2 bg-zinc-700 hover:bg-zinc-600 rounded-full text-zinc-300 transition-colors"
          >
            <Info size={24} />
          </button>
          {freeSpins > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <div className="text-xl text-purple-400 font-bold animate-pulse">FREE SPINS: {freeSpins}</div>
              <button
                onClick={() => setAutoFreeSpins((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  autoFreeSpins
                    ? 'border-purple-300 bg-purple-500/20 text-purple-100'
                    : 'border-zinc-500 bg-zinc-700 text-zinc-200'
                }`}
              >
                Auto {autoFreeSpins ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          <div className="mt-2">
            <span className={`text-sm font-bold ${spinsUsed >= SPIN_LIMIT ? 'text-rose-300' : 'text-slate-300'}`}>
              Spins: {spinsUsed}/{SPIN_LIMIT}
            </span>
          </div>
        </div>

        <div className="relative bg-zinc-950 p-4 rounded-xl border-4 border-yellow-600/50 shadow-inner mb-6">
          <div className="flex justify-between gap-2">
            {displayGrid.map((col, colIndex) => (
              <div key={colIndex} className="flex-1 flex flex-col gap-2 bg-zinc-100 rounded-lg p-2 shadow-inner overflow-hidden relative">
                {col.map((symbol, rowIndex) => {
                  const isWinningSymbol = winningLines.some((line) =>
                    line.positions.some((pos) => pos.col === colIndex && pos.row === rowIndex)
                  );

                  return (
                    <div
                      key={rowIndex}
                      className={`
                        h-16 md:h-24 flex flex-col items-center justify-center rounded-md
                        ${SYMBOLS[symbol].color}
                        ${isWinningSymbol ? 'ring-4 ring-yellow-400 animate-pulse z-10 scale-105' : ''}
                        ${spinningCols[colIndex] ? 'blur-[2px] translate-y-1' : 'transition-all duration-300'}
                        shadow-md overflow-hidden
                      `}
                    >
                      {['L', 'O', 'S', 'E', 'R', '!'].includes(symbol) ? (
                        <span className="text-4xl md:text-6xl font-black drop-shadow-[0_0_10px_currentColor]">{SYMBOLS[symbol].label}</span>
                      ) : (
                        <>
                          <span className="text-2xl md:text-4xl mb-1">{SYMBOLS[symbol].emoji}</span>
                          <span className="text-xs md:text-sm font-bold tracking-wider">{SYMBOLS[symbol].label}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {winAmount > 0 && !isSpinning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="bg-black/80 text-yellow-400 px-8 py-4 rounded-full border-4 border-yellow-400 text-4xl md:text-6xl font-black drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-bounce">
                WIN ${winAmount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-center font-mono">
          <div className="bg-black p-4 rounded-xl border-2 border-green-900 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <div className="text-zinc-400 text-sm mb-1 font-bold tracking-widest">CREDIT</div>
            <div className="text-3xl md:text-5xl text-green-400 font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">${credits.toFixed(2)}</div>
          </div>
          <div className="bg-black p-4 rounded-xl border-2 border-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <div className="text-zinc-400 text-sm mb-1 font-bold tracking-widest">BET</div>
            <div className="text-3xl md:text-5xl text-blue-400 font-black drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">${(betPerLine * lines).toFixed(2)}</div>
          </div>
          <div className="bg-black p-4 rounded-xl border-2 border-yellow-900 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <div className="text-zinc-400 text-sm mb-1 font-bold tracking-widest">WIN</div>
            <div className="text-3xl md:text-5xl text-yellow-400 font-black drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">${winAmount.toFixed(2)}</div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-black/40 p-3 text-xs text-zinc-300">
          Session Bankroll: <span className="font-mono text-emerald-300">${sessionStartCredits.toFixed(2)}</span> · Current Total: <span className="font-mono text-amber-300">${(credits + winAmount).toFixed(2)}</span> · Net: <span className={`font-mono ${(credits + winAmount - sessionStartCredits) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{(credits + winAmount - sessionStartCredits) >= 0 ? '+' : ''}${(credits + winAmount - sessionStartCredits).toFixed(2)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-700">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-400 mb-1">LINES</span>
              <div className="flex items-center gap-2 bg-black rounded-lg p-1">
                <button onClick={() => setLines((l) => Math.max(1, l - 1))} disabled={isSpinning || spinsUsed >= SPIN_LIMIT} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold">{lines}</span>
                <button onClick={() => setLines((l) => Math.min(9, l + 1))} disabled={isSpinning || spinsUsed >= SPIN_LIMIT} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"><Plus size={16} /></button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-400 mb-1">BET/LINE</span>
              <div className="flex items-center gap-2 bg-black rounded-lg p-1">
                <button onClick={() => setBetPerLine((b) => Math.max(1, b - (b > 100 ? 50 : b > 20 ? 10 : 1)))} disabled={isSpinning || spinsUsed >= SPIN_LIMIT} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold">{betPerLine}</span>
                <button onClick={() => setBetPerLine((b) => Math.min(MAX_BET_PER_LINE, b + (b >= 100 ? 50 : b >= 20 ? 10 : 1)))} disabled={isSpinning || spinsUsed >= SPIN_LIMIT} className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"><Plus size={16} /></button>
              </div>
              <div className="mt-1 flex gap-1">
                {[10, 100, 500, 1000].map((value) => (
                  <button
                    key={`quick-bet-${value}`}
                    onClick={() => setBetPerLine(value)}
                    disabled={isSpinning || spinsUsed >= SPIN_LIMIT}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${betPerLine === value ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-200'} disabled:opacity-50`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => { setLines(9); setBetPerLine(MAX_BET_PER_LINE); }}
                disabled={isSpinning || spinsUsed >= SPIN_LIMIT}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 h-full"
              >
                MAX BET
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {showGamble && (
              <>
                <button
                  onClick={() => setGambleModalOpen(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)] transition-all"
                >
                  GAMBLE
                </button>
                <button
                  onClick={takeWin}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(202,138,4,0.5)] transition-all"
                >
                  TAKE WIN
                </button>
              </>
            )}

            <button
              onClick={() => { void spin(); }}
              disabled={isSpinning || spinsUsed >= SPIN_LIMIT || ((credits < (betPerLine * lines)) && freeSpins === 0)}
              className={`
                px-8 py-4 rounded-xl font-black text-2xl tracking-wider transition-all
                ${isSpinning
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95'
                }
              `}
            >
              {spinsUsed >= SPIN_LIMIT ? 'LIMIT REACHED' : (freeSpins > 0 ? 'AUTO SPIN' : 'SPIN')}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={applyBalanceToMainGame}
            disabled={isSpinning || sessionApplied}
            className="px-5 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg disabled:opacity-50"
          >
            {sessionApplied ? 'BALANCE APPLIED' : 'APPLY BALANCE TO NEUROFORGE'}
          </button>
        </div>
      </div>

      {gambleModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-green-900 border-4 border-yellow-500 rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl">
            <h2 className="text-3xl font-black text-yellow-400 mb-6">GAMBLE</h2>

            <div className="text-2xl text-white mb-8">
              Current Win: <span className="text-yellow-400 font-bold">${winAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-center mb-8 h-48">
              {gambleCard ? (
                <div className="w-32 h-48 bg-white rounded-xl flex items-center justify-center text-6xl border-2 border-zinc-300 shadow-lg">
                  {gambleCard === 'hearts' && <span className="text-red-500">♥</span>}
                  {gambleCard === 'diamonds' && <span className="text-red-500">♦</span>}
                  {gambleCard === 'clubs' && <span className="text-black">♣</span>}
                  {gambleCard === 'spades' && <span className="text-black">♠</span>}
                </div>
              ) : (
                <div className="w-32 h-48 bg-blue-800 rounded-xl flex items-center justify-center border-2 border-blue-400 shadow-lg bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGwxMC0xMEgwem0wIDBsMTAgMTBIMHoiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]">
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-300">DOUBLE (x2)</h3>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => handleGamble('red')} disabled={gambleCard !== null} className="w-20 h-16 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold text-2xl shadow-lg disabled:opacity-50">RED</button>
                  <button onClick={() => handleGamble('black')} disabled={gambleCard !== null} className="w-20 h-16 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-white font-bold text-2xl shadow-lg disabled:opacity-50 border border-zinc-700">BLACK</button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-300">QUADRUPLE (x4)</h3>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => handleGamble('hearts')} disabled={gambleCard !== null} className="w-14 h-16 bg-white hover:bg-zinc-200 rounded-lg text-red-500 font-bold text-3xl shadow-lg disabled:opacity-50">♥</button>
                  <button onClick={() => handleGamble('diamonds')} disabled={gambleCard !== null} className="w-14 h-16 bg-white hover:bg-zinc-200 rounded-lg text-red-500 font-bold text-3xl shadow-lg disabled:opacity-50">♦</button>
                  <button onClick={() => handleGamble('clubs')} disabled={gambleCard !== null} className="w-14 h-16 bg-white hover:bg-zinc-200 rounded-lg text-black font-bold text-3xl shadow-lg disabled:opacity-50">♣</button>
                  <button onClick={() => handleGamble('spades')} disabled={gambleCard !== null} className="w-14 h-16 bg-white hover:bg-zinc-200 rounded-lg text-black font-bold text-3xl shadow-lg disabled:opacity-50">♠</button>
                </div>
              </div>
            </div>

            <button onClick={takeWin} disabled={gambleCard !== null} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-xl shadow-lg disabled:opacity-50">
              TAKE WIN
            </button>
          </div>
        </div>
      )}

      {showPaytable && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-6 max-w-4xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-yellow-400">PAYTABLE & RULES</h2>
              <button onClick={() => setShowPaytable(false)} className="text-zinc-400 hover:text-white">
                <X size={32} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Object.entries(PAYTABLE).map(([symbol, payouts]) => (
                <div key={symbol} className="bg-zinc-800 p-3 rounded-lg flex flex-col items-center">
                  <div className={`w-16 h-16 flex flex-col items-center justify-center rounded-md mb-2 ${SYMBOLS[symbol as SymbolType].color}`}>
                    <span className="text-2xl">{SYMBOLS[symbol as SymbolType].emoji}</span>
                    <span className="text-[10px] font-bold">{SYMBOLS[symbol as SymbolType].label}</span>
                  </div>
                  <div className="text-xs text-zinc-300 w-full">
                    {payouts[3] > 0 && <div className="flex justify-between"><span>5:</span> <span className="text-yellow-400">{payouts[3]}</span></div>}
                    {payouts[2] > 0 && <div className="flex justify-between"><span>4:</span> <span className="text-yellow-400">{payouts[2]}</span></div>}
                    {payouts[1] > 0 && <div className="flex justify-between"><span>3:</span> <span className="text-yellow-400">{payouts[1]}</span></div>}
                    {payouts[0] > 0 && <div className="flex justify-between"><span>2:</span> <span className="text-yellow-400">{payouts[0]}</span></div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-800 p-4 rounded-lg text-sm text-zinc-300 space-y-2">
              <p><strong className="text-red-500">HOUSE:</strong> Substitutes for all symbols except THEFT. The house always wins.</p>
              <p><strong className="text-green-500">THEFT:</strong> 3 or more triggers 15 Free Spins. The government takes its cut, but you get to spin again!</p>
              <p><strong className="text-yellow-400">L-O-S-E-R COMBO:</strong> Spell L-O-S-E-R across any active payline to win 1000x your line bet AND 15 Free Spins!</p>
              <p><strong className="text-yellow-400">GAMBLE:</strong> Press GAMBLE after a win to risk it all. You\'ll probably lose it anyway.</p>
              <p><strong className="text-amber-300">HOUSE EDGE:</strong> After each win, an automatic 15% "operational efficiency fee" is removed. Your effective return target is 85%.</p>
              <p>All wins pay left to right on active paylines, except THEFT which pay anywhere. Good luck, you\'ll need it.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
