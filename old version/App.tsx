
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Brain, Zap, BookOpen, Activity, ShoppingCart, Lock, AlertTriangle, Timer, GraduationCap, ArrowRight, TrendingUp, TrendingDown, DollarSign, Fingerprint, Smartphone, Hand, Cpu, HardDrive, Thermometer, Fan, Flame, Snowflake, Globe, Server, Rocket, Skull, Sparkles, X, Palette, Briefcase, Monitor, CloudRain, Sun, Moon, PenTool, BarChart3, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrainViz from './components/BrainViz';
import { INITIAL_STATE, GameState, Upgrade, LogMessage, RegionName, AcademicEra, Region, Stock } from './types';
import { UPGRADES_DATA, QUESTIONS, INITIAL_HOBBIES, INITIAL_CRYPTO, INITIAL_HARDWARE, INITIAL_NETWORK_DEVICES } from './constants';
import { getFlavorText, formatNumber } from './utils';

// --- VISUAL COMPONENTS ---

const ClickFeedback = ({ x, y, text, color }: { x: number, y: number, text: string, color: string }) => (
    <motion.div
        initial={{ opacity: 1, y: y, x: x, scale: 0.5 }}
        animate={{ opacity: 0, y: y - 100, x: x + (Math.random() * 40 - 20), scale: 1.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed z-50 pointer-events-none font-bold font-mono text-xl ${color}`}
        style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
    >
        {text}
    </motion.div>
);

type ColorTheme = 'light' | 'dark';

export default function App() {
  const [state, setState] = useState<GameState>({
    ...INITIAL_STATE,
    stocks: INITIAL_HOBBIES 
  });
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES_DATA);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activeTab, setActiveTab] = useState<RegionName | 'market' | 'hardware' | 'network'>(RegionName.Brainstem);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('dark');
  
  // UI FX State
  const [clickEffects, setClickEffects] = useState<{id: number, x: number, y: number, text: string, color: string}[]>([]);
  
  // Quiz & Modal States
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState<'unlock' | 'grind'>('unlock'); // New state to track quiz type
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [activeExamRegion, setActiveExamRegion] = useState<RegionName | null>(null);
  
  // Market Details State
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- Theme Generator ---
  const getTheme = (mode: ColorTheme) => {
      if (mode === 'light') {
          return {
              panel: "bg-white border-2 border-slate-300 shadow-sm",
              bg: "bg-slate-100",
              bgGrid: "bg-slate-200",
              textMain: "text-slate-900 font-sans font-bold",
              textMuted: "text-slate-700 font-semibold",
              accent: "text-blue-800",
              border: "border-slate-400",
              button: "bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-900 font-bold shadow-sm",
              buttonDisabled: "bg-slate-100 border-2 border-slate-300 text-slate-500 cursor-not-allowed",
              highlight: "text-blue-800 font-black",
              clickColor: "text-slate-900",
              critColor: "text-blue-700",
              barColor: "bg-blue-600"
          };
      } else {
          // Dark Mode (Protocol)
          return {
              panel: "glass-panel",
              bg: "bg-slate-950",
              bgGrid: "bg-slate-950",
              textMain: "text-sky-100 font-sans",
              textMuted: "text-slate-400",
              accent: "text-sky-400",
              border: "border-sky-500/30",
              button: "bg-sky-900/30 border border-sky-500/50 hover:bg-sky-500/20 text-sky-200 shadow-sm backdrop-blur-sm",
              buttonDisabled: "bg-slate-800/50 border border-slate-700 text-slate-600 cursor-not-allowed",
              highlight: "text-sky-300 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]",
              clickColor: "text-sky-400",
              critColor: "text-white",
              barColor: "bg-sky-500"
          };
      }
  };

  const theme = getTheme(colorTheme);

  // --- Logging System ---
  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, text, timestamp: Date.now(), type }, ...prev].slice(25));
  }, []);

  // --- Game Loop ---
  useEffect(() => {
    const tickRate = 100; // 10 ticks per second
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();

        // --- 1. STATUS CHECK (Breakdown/Overheat) ---
        if (prev.breakdownActive) {
            const decay = tickRate / 1000; // Seconds elapsed
            const newTimer = Math.max(0, prev.breakdownTimer - decay);
            
            if (newTimer <= 0) {
                 // RECOVERY
                 return {
                    ...prev,
                    breakdownActive: false,
                    breakdownTimer: 0,
                    anxiety: prev.isCyborg ? 0 : 50, 
                    lastTick: now
                };
            }
            return {
                ...prev,
                neurons: prev.isCyborg ? prev.neurons : 0, 
                breakdownTimer: newTimer,
                lastTick: now
            };
        }

        // --- 2. TRIGGER BREAKDOWN / OVERHEAT ---
        if (prev.anxiety >= 100) {
             return {
                 ...prev,
                 breakdownActive: true,
                 breakdownTimer: prev.isCyborg ? 5 : 30, 
                 lastTick: now
             };
        }

        // --- 3. PASSIVE GENERATION ---
        let passiveGain = 0;
        let hardwareHeatGen = 0;
        let hardwareCooling = 0;

        if (prev.isCyborg) {
            prev.hardware.forEach(hw => {
                if (hw.type === 'processor') {
                    passiveGain += (hw.effect * hw.count);
                    hardwareHeatGen += (hw.heatGen * hw.count);
                } else if (hw.type === 'cooling') {
                    hardwareCooling += (hw.effect * hw.count);
                }
            });
            prev.network.forEach(net => {
                passiveGain += (net.effect * net.count);
            });
            passiveGain = (passiveGain * prev.computeMultiplier) / (1000 / tickRate);
        } else {
            const basePassive = prev.passiveGen / (1000 / tickRate);
            passiveGain = basePassive * prev.computeMultiplier;
        }
        
        // --- 4. ANXIETY / HEAT LOGIC ---
        let anxietyChange = 0;
        if (prev.isCyborg) {
            const naturalCooling = 2.0;
            const netHeat = hardwareHeatGen - hardwareCooling - naturalCooling;
            anxietyChange = netHeat; 
        } else {
            anxietyChange = -0.02; 
        }

        // --- 5. STOCK MARKET UPDATE ---
        let updatedStocks = prev.stocks;
        let newLastStockUpdate = prev.lastStockUpdate;
        let currentSentiment = prev.marketSentiment;
        
        // Random Market Shifts
        if (Math.random() < 0.001) {
            const sentiments: ('bear' | 'bull' | 'crab')[] = ['bear', 'bull', 'crab'];
            const nextSentiment = sentiments[Math.floor(Math.random() * 3)];
            if (nextSentiment !== currentSentiment) currentSentiment = nextSentiment;
        }

        if (now - prev.lastStockUpdate >= 1000) {
            newLastStockUpdate = now;
            updatedStocks = prev.stocks.map(stock => {
                // Determine volatility based on risk level
                let riskMod = 1;
                if (stock.riskLevel === 'Safe') riskMod = 0.5;
                if (stock.riskLevel === 'Risky') riskMod = 2;
                if (stock.riskLevel === 'YOLO') riskMod = 4;

                let sentimentBias = 0;
                if (currentSentiment === 'bull') sentimentBias = 0.02;
                if (currentSentiment === 'bear') sentimentBias = -0.02;

                // Random Walk
                let move = (Math.random() - 0.5) * 2; 
                
                // Occasional "Event"
                if (Math.random() < (0.01 * riskMod)) {
                    move = Math.random() > 0.5 ? 8.0 : -6.0; 
                }

                move += stock.trend + sentimentBias;
                let changePercent = stock.volatility * move * 0.1 * riskMod; 
                
                // Boundaries Logic (Rubber Band)
                const range = stock.maxPrice - stock.minPrice;
                const currentPos = (stock.currentPrice - stock.minPrice) / range;
                if (currentPos > 0.9) changePercent -= 0.05 * riskMod; 
                else if (currentPos < 0.1) changePercent += 0.05 * riskMod; 

                let newPrice = stock.currentPrice * (1 + changePercent);
                newPrice = Math.max(stock.minPrice, Math.min(stock.maxPrice, newPrice));

                const newHistory = [...stock.history, newPrice];
                if (newHistory.length > 40) newHistory.shift(); // Keep 40 ticks

                return { ...stock, currentPrice: newPrice, history: newHistory };
            });
        }
        
        // Sync selected stock for modal live updates
        if (selectedStock) {
            const liveStock = updatedStocks.find(s => s.id === selectedStock.id);
            if (liveStock) setSelectedStock(liveStock);
        }

        const newAnxiety = Math.max(0, Math.min(100, prev.anxiety + anxietyChange));

        return {
          ...prev,
          neurons: prev.neurons + passiveGain,
          totalNeurons: prev.totalNeurons + passiveGain,
          anxiety: newAnxiety,
          stocks: updatedStocks,
          lastStockUpdate: newLastStockUpdate,
          marketSentiment: currentSentiment,
          lastTick: now
        };
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [selectedStock]); // Added selectedStock dep to ensure modal updates? No, interval closes over state

  // --- LOG TRIGGERS ---
  useEffect(() => {
      if (state.marketSentiment === 'bull') addLog("MARKET: BULL RUN. LINE GO UP.", 'market');
      if (state.marketSentiment === 'bear') addLog("MARKET: BEARS EATING PROFIT. PANIC.", 'market');
      if (state.marketSentiment === 'crab') addLog("MARKET: CRAB. PINCH PINCH.", 'market');
  }, [state.marketSentiment, addLog]);

  useEffect(() => {
      if (!state.isCyborg) {
        if (state.breakdownActive && Math.floor(state.breakdownTimer) === 29) {
            addLog("MENTAL BREAKDOWN INITIATED. SCREAMING INTERNALLY.", 'panic');
        }
        if (!state.breakdownActive && state.anxiety === 50 && state.lastTick > 0) {
            addLog("Reboot. Therapy copay processed.", 'info');
        }
      } else {
        if (state.breakdownActive && Math.floor(state.breakdownTimer) === 4) {
            addLog("CRITICAL OVERHEAT. FANS FAILED.", 'panic');
        }
        if (!state.breakdownActive && state.anxiety === 0 && state.lastTick > 0) {
            addLog("Core Temp Nominal. Resume calculations.", 'system');
        }
      }
  }, [state.breakdownActive, state.isCyborg, addLog]); 

  // Flavor Text
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.breakdownActive && Math.random() > 0.8) {
          if (state.isCyborg) {
              const cyborgPhrases = ["Flesh is weak.", "Analyzing vectors.", "Emotions deleted.", "Humanity deprecated."];
              addLog(cyborgPhrases[Math.floor(Math.random() * cyborgPhrases.length)], 'system');
          } else {
              addLog(getFlavorText(state.academicEra), 'info');
          }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [state.academicEra, state.breakdownActive, state.isCyborg, addLog]);


  // --- Actions ---

  const handleManualClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (state.breakdownActive) return;

    const crit = Math.random() < 0.05;
    const amount = (state.clickPower * (crit ? 5 : 1)) * state.computeMultiplier;
    
    // VISUAL FX
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const newEffect = { 
        id: Date.now() + Math.random(), 
        x: clientX, 
        y: clientY, 
        text: crit ? `CRIT! +${formatNumber(amount)}` : `+${formatNumber(amount)}`,
        color: crit ? theme.critColor : theme.clickColor
    };
    setClickEffects(prev => [...prev, newEffect]);
    setTimeout(() => setClickEffects(prev => prev.filter(ef => ef.id !== newEffect.id)), 800);

    let heatOrAnxietyGain = state.isCyborg ? 4 : (state.academicEra >= AcademicEra.Undergrad ? 1.2 : 0.5) * Math.max(0.1, state.anxietyResist);
    let dopamineDrop = (!state.isCyborg && state.regions[RegionName.Limbic].unlocked && Math.random() > 0.8) ? 1 : 0;

    setState(prev => ({
        ...prev,
        neurons: prev.neurons + amount,
        totalNeurons: prev.totalNeurons + amount,
        dopamine: prev.dopamine + dopamineDrop,
        anxiety: Math.min(100, prev.anxiety + heatOrAnxietyGain)
    }));

    if (dopamineDrop > 0) addLog(state.isCyborg ? "Efficiency bonus." : "Dopamine hit.", 'epiphany');
  };

  const ascendToCyborg = () => {
      const multiplierBonus = Math.floor(state.totalNeurons / 100000);
      const newMultiplier = 1 + multiplierBonus;
      setState(prev => ({
          ...INITIAL_STATE,
          regions: INITIAL_STATE.regions, 
          hardware: INITIAL_HARDWARE, 
          network: INITIAL_NETWORK_DEVICES, 
          stocks: INITIAL_CRYPTO, // Load the new Phase 2 Market
          totalNeurons: 0, 
          computeMultiplier: newMultiplier,
          isCyborg: true,
          anxiety: 0
      }));
      setUpgrades(UPGRADES_DATA.map(u => ({ ...u, purchased: false, count: 0 })));
      setActiveTab('hardware');
      setLogs([]); 
      addLog("INITIATING CRANIAL UPLOAD...", 'system');
      setColorTheme('dark'); // Auto-switch theme on ascend
  };

  const handleDebugCheat = () => {
      setState(prev => ({ ...prev, neurons: 2000000, dopamine: 5000, serotonin: 5000 }));
      addLog("DEBUG: GOD MODE.", 'system');
  };

  const buyUpgrade = (upgradeId: string) => {
    if (upgradeId === 'cranial_interface') {
        if (state.neurons < 1000000) { addLog("NEED MORE POWER.", 'alert'); return; }
        ascendToCyborg();
        return;
    }
    const idx = upgrades.findIndex(u => u.id === upgradeId);
    const u = upgrades[idx];
    if (!u) return;
    const cost = Math.floor(u.cost * Math.pow(1.5, u.count || 0));
    
    if ((u.currency === 'neurons' && state.neurons < cost) || 
        (u.currency === 'dopamine' && state.dopamine < cost) || 
        (u.currency === 'serotonin' && state.serotonin < cost)) return;

    setState(prev => {
        let ns = { ...prev };
        if (u.currency === 'neurons') ns.neurons -= cost;
        if (u.currency === 'dopamine') ns.dopamine -= cost;
        if (u.currency === 'serotonin') ns.serotonin -= cost;
        if (u.effectType === 'click') ns.clickPower += u.value;
        if (u.effectType === 'passive') ns.passiveGen += u.value;
        if (u.effectType === 'anxiety_resist') ns.anxietyResist *= u.value;
        return ns;
    });

    const newUpgrades = [...upgrades];
    newUpgrades[idx] = { ...u, count: (u.count || 0) + 1, purchased: (u.count || 0) + 1 >= (u.maxPurchases || 1) };
    setUpgrades(newUpgrades);
    addLog(`Acquired: ${u.name}`, 'info');
  };

  const buyHardware = (hardwareId: string) => {
      setState(prev => {
          const idx = prev.hardware.findIndex(h => h.id === hardwareId);
          const hw = prev.hardware[idx];
          const cost = Math.floor(hw.baseCost * Math.pow(1.5, hw.count));
          if (prev.neurons < cost) return prev;
          const newHw = [...prev.hardware];
          newHw[idx] = { ...hw, count: hw.count + 1 };
          return { ...prev, neurons: prev.neurons - cost, hardware: newHw };
      });
  };

  const buyNetworkDevice = (deviceId: string) => {
      setState(prev => {
          const idx = prev.network.findIndex(n => n.id === deviceId);
          const dev = prev.network[idx];
          const cost = Math.floor(dev.baseCost * Math.pow(1.5, dev.count));
          if (prev.neurons < cost) return prev;
          const newNet = [...prev.network];
          newNet[idx] = { ...dev, count: dev.count + 1 };
          return { ...prev, neurons: prev.neurons - cost, network: newNet };
      });
  };

  const buyStock = (id: string) => {
      setState(prev => {
          const idx = prev.stocks.findIndex(s => s.id === id);
          const stock = prev.stocks[idx];
          if (prev.neurons < stock.currentPrice) return prev;
          const newStocks = [...prev.stocks];
          newStocks[idx] = { ...stock, owned: stock.owned + 1 };
          // Don't log every buy, gets spammy. Only if mass buying? No, let's keep log clean.
          // addLog(`Bought ${stock.ticker}`, 'market'); 
          return { ...prev, neurons: prev.neurons - stock.currentPrice, stocks: newStocks };
      });
  };

  const sellStock = (id: string) => {
      setState(prev => {
          const idx = prev.stocks.findIndex(s => s.id === id);
          const stock = prev.stocks[idx];
          if (stock.owned <= 0) return prev;
          const newStocks = [...prev.stocks];
          newStocks[idx] = { ...stock, owned: stock.owned - 1 };
          // addLog(`Sold ${stock.ticker}`, 'market');
          return { ...prev, neurons: prev.neurons + stock.currentPrice, stocks: newStocks };
      });
  };

  const attemptUnlockRegion = (regionId: RegionName) => {
      if (state.neurons < state.regions[regionId].unlockCost) { addLog("Too dumb. Need neurons.", 'alert'); return; }
      setActiveExamRegion(regionId);
      setQuizMode('unlock');
      setShowQuiz(true);
      setCurrentQuestionIdx(0);
      setQuizFeedback(null);
  };
  
  const startGrindQuiz = () => {
      setQuizMode('grind');
      setShowQuiz(true);
      // Pick a random starting point to keep it fresh
      setCurrentQuestionIdx(Math.floor(Math.random() * QUESTIONS.length));
      setQuizFeedback(null);
  };

  const handleAnswer = (optionIndex: number) => {
      const relevantQuestions = QUESTIONS; // Simplified for now to use full QCAA pool
      const q = relevantQuestions[currentQuestionIdx % relevantQuestions.length];
      const isCorrect = optionIndex === q.correctIndex;
      setQuizFeedback({ isCorrect, text: q.explanation });
      
      if (isCorrect) {
          if (quizMode === 'grind') {
              // Resource Reward for Grinding
              const dopamineReward = 50;
              const serotoninReward = 50;
              setState(prev => ({ 
                  ...prev, 
                  dopamine: prev.dopamine + dopamineReward,
                  serotonin: prev.serotonin + serotoninReward,
                  correctQuizAnswers: prev.correctQuizAnswers + 1, 
                  anxiety: Math.max(0, prev.anxiety - 5) 
              }));
              addLog(`Exam Passed. Gained ${dopamineReward} Dopamine & ${serotoninReward} Serotonin.`, 'epiphany');
          } else {
              // Unlock Logic
              setState(prev => ({ ...prev, serotonin: prev.serotonin + 5, correctQuizAnswers: prev.correctQuizAnswers + 1, anxiety: Math.max(0, prev.anxiety - 10) }));
              addLog("Correct. Ego boosted.", 'epiphany');
          }
      } else {
          setState(prev => ({ ...prev, anxiety: Math.min(100, prev.anxiety + 15) }));
          addLog("Wrong. Shame detected.", 'alert');
      }
  };

  const nextQuestion = () => {
      setQuizFeedback(null);
      
      if (quizMode === 'grind') {
          setShowQuiz(false);
      } else {
          // Unlock Mode: Check if passed enough
          setCurrentQuestionIdx(currentQuestionIdx + 1);
          if (activeExamRegion && state.correctQuizAnswers >= state.regions[activeExamRegion].examPassesRequired) completeUnlock(activeExamRegion);
      }
  };

  const completeUnlock = (regionId: RegionName) => {
      setState(prev => ({ ...prev, neurons: prev.neurons - prev.regions[regionId].unlockCost, regions: { ...prev.regions, [regionId]: { ...prev.regions[regionId], unlocked: true } }, academicEra: prev.academicEra + 1 }));
      addLog(`UNLOCKED: ${state.regions[regionId].name}`, 'epiphany');
      setActiveExamRegion(null);
      setShowQuiz(false);
  };

  // --- Rendering Helpers ---
  const portfolioValue = state.stocks.reduce((acc, s) => acc + (s.owned * s.currentPrice), 0);
  const currentTabUpgrades = upgrades.filter(u => u.region === activeTab);
  const totalProcessorHeat = state.hardware.filter(h => h.type === 'processor').reduce((acc, h) => acc + (h.heatGen * h.count), 0);
  const totalCooling = state.hardware.filter(h => h.type === 'cooling').reduce((acc, h) => acc + (h.effect * h.count), 0);
  const netHeatChange = totalProcessorHeat - totalCooling - 2.0;
  const totalDevices = state.network.reduce((acc, n) => acc + n.count, 0);

  // Prepare a strictly boolean map for BrainViz to avoid object complexity and re-renders
  const unlockedRegionMap = useMemo(() => {
    return Object.fromEntries(
        (Object.values(state.regions) as Region[]).map(r => [r.id, r.unlocked])
    ) as Record<string, boolean>;
  }, [state.regions]);

  const isTabSpecial = (tab: string): tab is 'market' | 'hardware' | 'network' => {
      return ['market', 'hardware', 'network'].includes(tab);
  };

  // --- SVG Helper for Chart ---
  const renderChart = (history: number[], width: number, height: number, color: string) => {
      if (history.length < 2) return null;
      const min = Math.min(...history);
      const max = Math.max(...history);
      const range = max - min || 1;
      
      const points = history.map((val, i) => {
          const x = (i / (history.length - 1)) * width;
          const y = height - ((val - min) / range) * height;
          return `${x},${y}`;
      }).join(' ');

      // Area fill path
      const areaPoints = `0,${height} ${points} ${width},${height}`;

      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            {/* Grid Lines */}
            <line x1="0" y1={height*0.25} x2={width} y2={height*0.25} stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={height*0.5} x2={width} y2={height*0.5} stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={height*0.75} x2={width} y2={height*0.75} stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />

            {/* Gradient Defs */}
            <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Area Fill */}
            <polygon points={areaPoints} fill={`url(#grad-${color})`} />

            {/* Line */}
            <polyline 
                points={points} 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </svg>
      );
  };

  return (
    <>
    {colorTheme === 'dark' && <div className="scanlines" />}
    {colorTheme === 'dark' && <div className="vignette" />}
    {colorTheme === 'dark' && <div className="noise-bg" />}
    
    <div className={`min-h-screen flex flex-col md:flex-row overflow-hidden grid-bg transition-colors duration-500 ${theme.bgGrid}`}>
      
      {/* --- CLICK EFFECTS LAYER --- */}
      <AnimatePresence>
          {clickEffects.map(effect => (
              <ClickFeedback key={effect.id} {...effect} />
          ))}
      </AnimatePresence>

      {/* --- LEFT: DASHBOARD --- */}
      <div className={`w-full md:w-[350px] p-4 flex flex-col border-r relative z-20 transition-colors duration-500 ${theme.bg} ${theme.border}`}>
            {/* Header */}
            <div className="mb-6 border-b pb-4 border-dashed border-opacity-30" style={{borderColor: 'currentColor'}}>
                <button onClick={handleDebugCheat} className="opacity-0 hover:opacity-100 absolute top-0 right-0 text-[10px] text-red-500 font-mono">DEBUG</button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className={`text-2xl font-black italic tracking-tighter ${theme.textMain}`}>
                            {state.isCyborg ? "SYSTEM_ASCEND" : "BRAINBUILDR"}
                        </h1>
                        <p className={`text-xs font-mono mt-1 ${theme.textMuted}`}>
                            <span>VER: {state.isCyborg ? "2.0.4 [STABLE]" : "1.0.0 [BETA]"}</span>
                            <span className="ml-2">{state.breakdownActive ? "CRITICAL" : "ONLINE"}</span>
                        </p>
                    </div>
                    {/* THEME TOGGLE */}
                    <button 
                        onClick={() => setColorTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                        className={`p-2 rounded-full transition-colors ${colorTheme === 'light' ? 'bg-slate-200 text-yellow-600 hover:bg-slate-300' : 'bg-slate-800 text-sky-400 hover:bg-slate-700'}`}
                    >
                        {colorTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>

            {/* Resources */}
            <div className="space-y-3 mb-6">
                <div className={`${theme.panel} p-4 rounded-xl flex justify-between items-center group relative overflow-hidden transition-all duration-300`}>
                     <div className={`absolute top-0 right-0 p-4 opacity-10 ${theme.accent}`}><Brain size={48} /></div>
                     <div>
                         <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>{state.isCyborg ? "COMPUTE POWER" : "NEURONS"}</div>
                         <div className={`text-2xl font-mono font-bold ${theme.highlight}`}>{formatNumber(state.neurons)}</div>
                     </div>
                </div>
                
                {state.regions[RegionName.Limbic].unlocked && !state.isCyborg && (
                    <div className="grid grid-cols-2 gap-3">
                         <div className={`${theme.panel} p-3 rounded-lg`}>
                            <div className="text-[10px] font-bold text-yellow-600 mb-1 flex items-center gap-1"><Zap size={10} /> DOPAMINE</div>
                            <div className={`text-xl font-mono font-bold ${colorTheme === 'light' ? 'text-yellow-700' : 'text-yellow-300'}`}>{formatNumber(state.dopamine)}</div>
                         </div>
                         <div className={`${theme.panel} p-3 rounded-lg`}>
                            <div className="text-[10px] font-bold text-purple-600 mb-1 flex items-center gap-1"><Activity size={10} /> SEROTONIN</div>
                            <div className={`text-xl font-mono font-bold ${colorTheme === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>{formatNumber(state.serotonin)}</div>
                         </div>
                    </div>
                )}
            </div>

            {/* MAIN INTERACTION BUTTON */}
            <div className="flex-1 flex flex-col items-center justify-start py-4">
                 <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95, rotate: Math.random() * 4 - 2 }}
                    onClick={handleManualClick}
                    disabled={state.breakdownActive}
                    className={`
                        w-64 h-64 rounded-full shadow-2xl flex flex-col items-center justify-center
                        border-[8px] transition-all duration-300 relative overflow-hidden group
                        ${state.breakdownActive 
                            ? 'bg-red-950 border-red-600 grayscale animate-pulse' 
                            : colorTheme === 'light' ? 'bg-white border-slate-200 hover:border-blue-400 shadow-lg'
                            : 'bg-gradient-to-br from-slate-900 to-indigo-950 border-sky-500 hover:border-pink-500 shadow-[0_0_30px_rgba(56,189,248,0.2)]'
                        }
                    `}
                >
                    {colorTheme === 'dark' && (
                         <div className="absolute inset-0 opacity-20 pointer-events-none" 
                         style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, #000 120%)' }} />
                    )}
                    
                    {state.breakdownActive ? (
                         <AlertTriangle size={80} className="text-red-500 mb-2 animate-ping" />
                    ) : (
                         state.isCyborg 
                         ? <Cpu size={80} className={`${theme.accent} mb-2 animate-pulse`} /> 
                         : <Brain size={80} className={`${theme.accent} group-hover:text-pink-400 transition-colors mb-2 animate-float`} />
                    )}
                    
                    <span className={`font-mono font-bold text-lg z-10 ${state.breakdownActive ? 'text-red-500' : theme.textMain}`}>
                        {state.breakdownActive ? "FAILURE" : (state.isCyborg ? "COMPUTE" : "THINK")}
                    </span>

                    {/* FILL LEVEL */}
                    <div className={`absolute bottom-0 left-0 w-full transition-all duration-300 opacity-30 ${theme.barColor}`}
                        style={{ height: `${state.anxiety}%`, filter: colorTheme === 'dark' ? 'blur(20px)' : 'none' }} />
                 </motion.button>

                 <div className="w-full mt-6 px-4">
                     <div className="flex justify-between text-xs font-mono font-bold mb-1">
                         <span className={theme.accent}>{state.isCyborg ? "CORE TEMP" : "ANXIETY LEVEL"}</span>
                         <span className={state.anxiety > 80 ? "text-red-600 animate-pulse font-black" : theme.textMain}>{Math.floor(state.anxiety)}%</span>
                     </div>
                     <div className={`h-3 w-full rounded-full border ${colorTheme === 'light' ? 'bg-slate-200 border-slate-300' : 'bg-black/50 border-white/10'} overflow-hidden relative`}>
                         <motion.div 
                            className={`h-full ${theme.barColor}`}
                            animate={{ width: `${state.anxiety}%` }}
                         />
                         {/* Tick marks */}
                         <div className="absolute inset-0 flex justify-between px-2">
                             {[...Array(10)].map((_,i) => <div key={i} className="w-[1px] h-full bg-black/20" />)}
                         </div>
                     </div>
                     {state.isCyborg && (
                        <div className={`text-[10px] font-mono mt-1 text-center ${netHeatChange > 0 ? 'text-red-500' : theme.accent}`}>
                             THERMAL FLUX: {netHeatChange > 0 ? '+' : ''}{netHeatChange.toFixed(1)} / tick
                        </div>
                     )}
                 </div>
            </div>

            {/* LOGS - TERMINAL STYLE */}
            <div className={`h-40 mt-auto rounded-lg border p-2 overflow-hidden relative ${colorTheme === 'light' ? 'bg-white border-slate-300 shadow-inner' : 'bg-black/50 border-white/10'}`}>
                <div className="absolute top-2 right-2 text-[10px] opacity-50 font-mono">/VAR/LOG/SYS.LOG</div>
                <div ref={logContainerRef} className="flex flex-col-reverse h-full overflow-y-auto font-mono text-[10px] leading-relaxed custom-scrollbar pl-1">
                    {logs.map(log => (
                        <div key={log.id} className="hover:font-bold transition-all">
                            <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={`ml-2 ${
                                log.type === 'panic' ? 'text-red-600 font-bold' :
                                log.type === 'system' ? (colorTheme === 'light' ? 'text-green-700' : 'text-green-600') :
                                log.type === 'epiphany' ? (colorTheme === 'light' ? 'text-pink-700' : 'text-pink-600') :
                                log.type === 'market' ? (colorTheme === 'light' ? 'text-yellow-700' : 'text-yellow-600') :
                                log.type === 'alert' ? (colorTheme === 'light' ? 'text-orange-700' : 'text-orange-600') :
                                colorTheme === 'light' ? 'text-slate-900' : 'text-slate-300'
                            }`}>
                                {log.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
      </div>

      {/* --- CENTER: VISUALIZATION --- */}
      <div className={`hidden md:flex flex-1 items-center justify-center relative overflow-hidden transition-colors duration-500 ${colorTheme === 'light' ? 'bg-slate-200' : 'bg-black'}`}>
           {colorTheme === 'dark' && (
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
           )}
           
           <div className="absolute top-6 left-6 z-10 max-w-[200px] pointer-events-none">
               <div className={`text-[10px] ${theme.textMuted} font-mono uppercase tracking-widest mb-3 border-b border-opacity-20 pb-1`} style={{borderColor: 'currentColor'}}>Cortical Map</div>
               {(Object.values(state.regions) as Region[]).map(r => (
                   <div key={r.id} className={`flex items-center justify-between mb-1 p-1 rounded ${r.unlocked ? (colorTheme === 'light' ? 'bg-white/40' : 'bg-white/5') : 'opacity-50'}`}>
                       <span className={`text-[10px] font-mono font-bold ${r.unlocked ? theme.accent : 'text-gray-500'}`}>{r.name.split(' ')[0]}</span>
                       <div className={`w-1.5 h-1.5 rounded-full ${r.unlocked ? `${theme.barColor} animate-pulse` : 'bg-gray-800'}`} />
                   </div>
               ))}
           </div>
           
           <div className="w-full h-full flex items-center justify-center">
                <BrainViz 
                    unlockedRegions={unlockedRegionMap} 
                    anxiety={state.anxiety} 
                    isBreakdown={state.breakdownActive}
                    totalNeurons={state.totalNeurons}
                    isCyborg={state.isCyborg}
                    themeMode={colorTheme}
                />
           </div>
      </div>

      {/* --- RIGHT: CONTROL PANEL --- */}
      <div className={`w-full md:w-[450px] lg:w-[600px] flex flex-col h-screen relative z-20 border-l transition-colors duration-500 ${theme.bg} ${theme.border}`}>
           {/* TABS */}
           <div className={`flex flex-wrap border-b ${theme.border} ${colorTheme === 'light' ? 'bg-slate-100' : 'bg-black/5'}`}>
               {state.isCyborg ? (
                   <>
                    {['hardware', 'network', 'market'].filter(t => t !== 'network' || totalDevices > 0 || state.totalNeurons > 50000).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} 
                            className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 
                            ${activeTab === tab ? `border-current ${theme.accent} ${colorTheme === 'light' ? 'bg-white' : 'bg-white/5'}` : 'border-transparent opacity-60 hover:opacity-100'}`}>
                            {tab}
                        </button>
                    ))}
                   </>
               ) : (
                   <>
                       {(Object.values(state.regions) as Region[]).map(region => (
                           <button key={region.id} onClick={() => setActiveTab(region.id)}
                                className={`flex-1 min-w-[60px] p-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all
                                ${activeTab === region.id ? `border-current ${theme.accent} ${colorTheme === 'light' ? 'bg-white' : 'bg-white/5'}` : `border-transparent ${theme.textMuted} hover:opacity-100`}
                                ${!region.unlocked && 'opacity-60 grayscale'}`}>
                               {region.id.substring(0,3)}
                           </button>
                       ))}
                       {state.regions[RegionName.Limbic].unlocked && (
                           <button onClick={() => setActiveTab('market')} className={`px-3 border-b-2 ${activeTab === 'market' ? `border-current ${theme.accent} ${colorTheme === 'light' ? 'bg-white' : ''}` : `border-transparent ${theme.textMuted}`}`}>
                               <Briefcase size={14} />
                           </button>
                       )}
                       <button onClick={() => { setQuizMode('grind'); setShowQuiz(true); }} className={`px-3 ${theme.textMuted} hover:text-red-500`} title="Study / Exam"><GraduationCap size={14} /></button>
                   </>
               )}
           </div>

           {/* CONTENT AREA */}
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                {/* --- HARDWARE / NETWORK / MARKET --- */}
                {isTabSpecial(activeTab) ? (
                    <div className="space-y-4">
                        {/* HEADER CARD */}
                        <div className={`p-4 rounded-lg border ${theme.panel}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.textMain}`}>
                                    {activeTab === 'hardware' ? <Cpu /> : activeTab === 'network' ? <Globe /> : <Briefcase />}
                                    {activeTab === 'market' ? (state.isCyborg ? 'POST-HUMAN FUTURES' : 'HOBBY INVESTMENT') : activeTab.toUpperCase()}
                                </h2>
                                {activeTab === 'market' && (
                                    <div className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                                        state.marketSentiment === 'bull' ? 'bg-green-100 text-green-700' :
                                        state.marketSentiment === 'bear' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                                    }`}>{state.marketSentiment}</div>
                                )}
                            </div>
                            {activeTab === 'hardware' && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                    <div className="text-red-500 font-bold">HEAT: +{totalProcessorHeat.toFixed(1)}</div>
                                    <div className="text-blue-500 font-bold">COOL: -{totalCooling.toFixed(1)}</div>
                                </div>
                            )}
                            {activeTab === 'network' && (
                                <div className="text-xs font-mono text-green-600 font-bold">INFECTED NODES: {formatNumber(totalDevices)}</div>
                            )}
                            {activeTab === 'market' && (
                                <div className="flex justify-between text-xs font-mono">
                                    <div className="text-yellow-600 font-bold">PORTFOLIO: {formatNumber(portfolioValue)}</div>
                                    <div className={theme.textMuted}>LIQUID: {formatNumber(state.neurons)}</div>
                                </div>
                            )}
                        </div>

                        {/* ITEMS LIST */}
                        <div className={`grid ${activeTab === 'market' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
                            {activeTab === 'market' ? (
                                state.stocks.map(item => {
                                    const isUp = item.history[item.history.length-1] > item.history[item.history.length-2];
                                    return (
                                        <motion.div 
                                            key={item.id} 
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setSelectedStock(item)}
                                            className={`${theme.panel} p-3 rounded-lg hover:border-opacity-50 transition-colors cursor-pointer group`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-xs ${theme.textMain}`}>{item.name}</span>
                                                    <span className={`text-[10px] font-mono ${theme.textMuted}`}>{item.ticker}</span>
                                                </div>
                                                <div className={`text-xs font-mono font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                                    {formatNumber(item.currentPrice)}
                                                </div>
                                            </div>
                                            
                                            {/* Mini Chart */}
                                            <div className="h-12 w-full bg-black/5 rounded mb-2 overflow-hidden relative">
                                                {renderChart(item.history, 100, 50, isUp ? '#22c55e' : '#ef4444')}
                                            </div>

                                            <div className="flex justify-between text-[10px] font-bold">
                                                 <span className={`${
                                                     item.riskLevel === 'Safe' ? 'text-green-600' :
                                                     item.riskLevel === 'Moderate' ? 'text-yellow-600' :
                                                     item.riskLevel === 'Risky' ? 'text-orange-600' : 'text-red-600'
                                                 }`}>{item.riskLevel}</span>
                                                 <span className={theme.textMuted}>Owned: {item.owned}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                (activeTab === 'hardware' ? state.hardware : state.network).map(item => {
                                    const cost = Math.floor(item.baseCost * Math.pow(1.5, item.count));
                                    const canAfford = state.neurons >= cost;
                                    const isCooling = 'type' in item && item.type === 'cooling';
                                    
                                    return (
                                        <button 
                                            key={item.id} 
                                            onClick={() => activeTab === 'hardware' ? buyHardware(item.id) : buyNetworkDevice(item.id)}
                                            disabled={!canAfford}
                                            className={`
                                                relative w-full text-left p-4 rounded-lg border transition-all overflow-hidden group
                                                ${canAfford ? `${theme.panel} hover:border-gray-400` : `opacity-60 grayscale bg-gray-100`}
                                            `}
                                        >
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <div className={`font-bold text-xs uppercase ${isCooling ? 'text-blue-600' : theme.accent}`}>{item.name}</div>
                                                    <div className={`text-[10px] ${theme.textMuted} font-mono mt-1`}>LVL {item.count}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xs font-mono font-bold ${canAfford ? theme.highlight : 'text-gray-400'}`}>{formatNumber(cost)}</div>
                                                    <div className="text-[10px] text-gray-500">+{item.effect} /t</div>
                                                </div>
                                            </div>
                                            {/* Progress Bar BG */}
                                            {canAfford && (
                                                <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full" style={{ color: isCooling ? '#2563eb' : '#16a34a' }} />
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    // --- UPGRADES / REGION ---
                    state.regions[activeTab as RegionName]?.unlocked ? (
                        <>
                            <div className={`${theme.panel} p-4 rounded-lg mb-4`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`text-sm font-bold uppercase mb-2 ${theme.textMain}`}>{state.regions[activeTab as RegionName].name}</h3>
                                        <p className={`text-xs italic ${theme.textMuted} font-serif`}>"{state.regions[activeTab as RegionName].description}"</p>
                                    </div>
                                    {/* EXAM GRIND BUTTON (Specifically for Limbic or generally available if region unlocked) */}
                                    {activeTab === RegionName.Limbic && (
                                        <button 
                                            onClick={startGrindQuiz}
                                            className="ml-4 flex items-center flex-col justify-center p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transform transition-transform hover:scale-105"
                                            title="Take Exam to earn Chemicals"
                                        >
                                            <PenTool size={16} className="mb-1" />
                                            <span className="text-[10px] font-bold">EXAM</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* EXAM PROMPT CARD (Visible in Limbic only) */}
                            {activeTab === RegionName.Limbic && (
                                <div className="mb-4 p-3 border-2 border-dashed border-indigo-400/50 rounded-lg flex items-center justify-between">
                                    <div className="text-xs">
                                        <div className={`font-bold ${theme.accent}`}>COGNITIVE ASSESSMENT CENTER</div>
                                        <div className={`${theme.textMuted}`}>Pass QCAA exams to synthesize chemicals.</div>
                                    </div>
                                    <button 
                                        onClick={startGrindQuiz}
                                        className={`px-4 py-2 rounded font-bold text-xs uppercase ${colorTheme === 'light' ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}
                                    >
                                        START (+50 Each)
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {currentTabUpgrades.map(u => {
                                     const cost = Math.floor(u.cost * Math.pow(1.5, u.count || 0));
                                     let canAfford = false;
                                     if (u.currency === 'neurons') canAfford = state.neurons >= cost;
                                     if (u.currency === 'dopamine') canAfford = state.dopamine >= cost;
                                     if (u.currency === 'serotonin') canAfford = state.serotonin >= cost;
                                     const isMaxed = u.maxPurchases && (u.count || 0) >= u.maxPurchases;
                                     const isPrestige = u.id === 'cranial_interface';

                                     return (
                                        <button 
                                            key={u.id}
                                            onClick={() => buyUpgrade(u.id)}
                                            disabled={(!canAfford || isMaxed) && !isPrestige}
                                            className={`
                                                relative w-full text-left p-3 rounded border transition-all group overflow-hidden
                                                ${isPrestige 
                                                    ? 'bg-gradient-to-r from-red-900 to-black border-red-500 text-white' 
                                                    : isMaxed 
                                                        ? 'opacity-50 grayscale' 
                                                        : canAfford 
                                                            ? `${theme.button}` 
                                                            : `${theme.buttonDisabled}`
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-1 relative z-10">
                                                <span className={`font-bold text-xs uppercase ${isPrestige ? 'text-red-200' : theme.textMain}`}>{u.name}</span>
                                                {!isMaxed && (
                                                    <span className={`text-[10px] font-mono font-bold ${canAfford ? theme.highlight : 'text-gray-400'}`}>
                                                        {formatNumber(cost)} {u.currency.substring(0,3).toUpperCase()}
                                                    </span>
                                                )}
                                                {isMaxed && <span className="text-[10px] text-green-600 font-bold">MAX</span>}
                                            </div>
                                            <div className={`text-[10px] leading-tight ${theme.textMuted}`}>{u.description}</div>
                                        </button>
                                     );
                                })}
                            </div>
                        </>
                    ) : (
                        // LOCKED REGION
                        <div className={`h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed ${theme.border} rounded-xl ${colorTheme === 'light' ? 'bg-slate-100' : 'opacity-50'}`}>
                            <Lock size={48} className={`mb-4 ${colorTheme === 'light' ? 'text-slate-400' : 'opacity-50 text-gray-400'}`} />
                            <h3 className={`font-bold mb-2 ${theme.textMain}`}>RESTRICTED AREA</h3>
                            <p className={`text-xs mb-6 ${colorTheme === 'light' ? 'text-slate-600 font-bold' : 'opacity-70'}`}>Insufficient cognitive clearance.</p>
                            <button
                                onClick={() => attemptUnlockRegion(activeTab as RegionName)}
                                disabled={state.neurons < state.regions[activeTab as RegionName].unlockCost}
                                className={`
                                    w-full py-3 px-4 rounded font-bold text-xs uppercase tracking-wider
                                    ${state.neurons >= state.regions[activeTab as RegionName].unlockCost 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                Unlock ({formatNumber(state.regions[activeTab as RegionName].unlockCost)})
                            </button>
                        </div>
                    )
                )}
           </div>
      </div>

      {/* --- MODAL: STOCK DETAILS --- */}
      <AnimatePresence>
          {selectedStock && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={(e) => {
                    // Close if clicking outside
                    if (e.target === e.currentTarget) setSelectedStock(null);
                }}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
                    className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border ${theme.panel}`}
                >
                    <div className={`p-4 border-b flex justify-between items-start ${colorTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-gray-800'}`}>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h2 className={`text-2xl font-black italic tracking-tighter ${theme.textMain}`}>{selectedStock.name}</h2>
                                <span className="font-mono text-xs opacity-50">{selectedStock.ticker}</span>
                            </div>
                            <div className={`text-xs ${theme.textMuted} mt-1`}>{selectedStock.description}</div>
                        </div>
                        <button onClick={() => setSelectedStock(null)} className={`${theme.textMuted} hover:text-red-500`}><X size={24} /></button>
                    </div>

                    <div className="p-6">
                        {/* MAIN CHART AREA */}
                        <div className="h-48 w-full bg-black/10 rounded-lg mb-6 border border-current border-opacity-10 relative">
                             {renderChart(
                                 selectedStock.history, 
                                 400, 
                                 200, 
                                 selectedStock.history[selectedStock.history.length-1] > selectedStock.history[selectedStock.history.length-2] ? '#22c55e' : '#ef4444'
                             )}
                             <div className="absolute top-2 left-2 font-mono font-bold text-xl">
                                 {formatNumber(selectedStock.currentPrice)}
                             </div>
                             <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] font-mono bg-black/50 px-2 py-1 rounded">
                                 <span className="text-white">LATEST NEWS:</span>
                                 <span className="text-yellow-400 animate-pulse">{selectedStock.news}</span>
                             </div>
                        </div>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-black/5 rounded">
                                <h4 className={`text-[10px] font-bold uppercase mb-1 ${theme.accent}`}>FUNDAMENTALS</h4>
                                <p className={`text-xs leading-relaxed ${theme.textMain}`}>{selectedStock.fundamentals}</p>
                            </div>
                            <div className="p-3 bg-black/5 rounded">
                                <h4 className={`text-[10px] font-bold uppercase mb-1 ${theme.accent}`}>RISK ANALYSIS</h4>
                                <p className={`text-xs leading-relaxed ${theme.textMain}`}>{selectedStock.riskDescription}</p>
                                <div className={`mt-2 text-[10px] font-bold uppercase px-2 py-1 inline-block rounded ${
                                    selectedStock.riskLevel === 'Safe' ? 'bg-green-100 text-green-800' :
                                    selectedStock.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedStock.riskLevel === 'Risky' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    RATING: {selectedStock.riskLevel}
                                </div>
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="text-[10px] text-center mb-1 opacity-50 font-mono">OWNED: {selectedStock.owned}</div>
                                <button 
                                    onClick={() => sellStock(selectedStock.id)} 
                                    disabled={selectedStock.owned <= 0}
                                    className={`w-full py-4 rounded font-bold uppercase tracking-wider text-sm transition-all ${
                                        selectedStock.owned > 0 ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    DUMP ASSET
                                </button>
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] text-center mb-1 opacity-50 font-mono">COST: {formatNumber(selectedStock.currentPrice)}</div>
                                <button 
                                    onClick={() => buyStock(selectedStock.id)}
                                    disabled={state.neurons < selectedStock.currentPrice}
                                    className={`w-full py-4 rounded font-bold uppercase tracking-wider text-sm transition-all ${
                                        state.neurons >= selectedStock.currentPrice ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    ACQUIRE FUTURES
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* --- MODAL: QUIZ --- */}
      <AnimatePresence>
        {showQuiz && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border ${theme.panel}`}
                >
                    <div className={`p-4 border-b flex justify-between items-center ${colorTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-gray-800'}`}>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold font-mono ${theme.textMain}`}>
                                {quizMode === 'grind' ? 'QCAA EXAM SIMULATOR' : 'ASSESSMENT MODULE'}
                            </span>
                            {quizMode === 'grind' && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded">REWARD: CHEM</span>}
                        </div>
                        <button onClick={() => setShowQuiz(false)} className={`${theme.textMuted} hover:text-red-500`}><X size={20} /></button>
                    </div>

                    <div className="p-8">
                        {!quizFeedback ? (
                            <>
                                <h3 className={`text-lg font-bold mb-6 text-center ${theme.textMain} leading-snug`}>
                                    {QUESTIONS[currentQuestionIdx % QUESTIONS.length].text}
                                </h3>
                                <div className="grid gap-3">
                                    {QUESTIONS[currentQuestionIdx % QUESTIONS.length].options.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={`p-4 text-left rounded border-2 transition-all text-sm font-bold ${
                                                colorTheme === 'light'
                                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-sky-900/30 hover:border-sky-500 hover:text-white'
                                            }`}
                                        >
                                            <span className="opacity-50 mr-2">{String.fromCharCode(65+idx)}.</span> {opt}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`text-5xl mb-4 flex justify-center ${quizFeedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {quizFeedback.isCorrect ? <Sparkles /> : <Skull />}
                                </motion.div>
                                <h3 className={`text-xl font-bold mb-2 ${quizFeedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{quizFeedback.isCorrect ? "CORRECT" : "FAILURE"}</h3>
                                <p className={`text-sm mb-8 p-4 rounded border ${theme.textMuted} ${colorTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-gray-700'}`}>{quizFeedback.text}</p>
                                <button 
                                    onClick={nextQuestion}
                                    className={`py-3 px-10 rounded-full font-bold tracking-wide shadow-lg transform hover:scale-105 transition-all ${
                                        state.isCyborg ? "bg-green-600 text-black hover:bg-green-500" : "bg-blue-600 text-white hover:bg-blue-500"
                                    }`}
                                >
                                    {quizMode === 'grind' ? 'CLOSE' : 'CONTINUE'}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
    </>
  );
}
