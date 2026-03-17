import { MarketScenario, Stock, StockPersonality, StockRegime, StockSector } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const STOCK_REGIMES: StockRegime[] = ['calm', 'hype', 'panic', 'dead'];
const STOCK_SECTOR_BY_ID: Record<string, StockSector> = {
  python_grind: 'study',
  meal_prep_discipline: 'health',
  gym_arc: 'health',
  doomscroll_quant: 'chaos',
  side_hustle_alchemy: 'creator',
  lucid_daytrade: 'creator',
  thesis_leverage: 'study',
  metagoogle_omninet: 'megacorp',
  elonx_gravity_io: 'megacorp',
  blacksky_defensecloud: 'infrastructure',
  bunkerlife_reit: 'infrastructure',
  waterwars_futures: 'chaos'
};

const getRiskScale = (risk: Stock['riskLevel']) =>
  risk === 'Extreme' ? 1.9 : risk === 'High' ? 1.45 : risk === 'Medium' ? 1.1 : 0.8;

const hashSeed = (input: string) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
};

const chooseBySeed = <T,>(items: T[], seed: number) => items[seed % items.length];

const getDefaultSector = (stock: Stock): StockSector => {
  if (stock.sector) return stock.sector;
  const known = STOCK_SECTOR_BY_ID[stock.id];
  if (known) return known;
  return chooseBySeed(['study', 'health', 'creator', 'chaos', 'infrastructure', 'megacorp'] as StockSector[], hashSeed(stock.id));
};

const getDefaultPersonality = (stock: Stock): StockPersonality => {
  if (stock.personality) return stock.personality;
  if (stock.riskLevel === 'Low') return 'defensive';
  if (stock.riskLevel === 'Medium') return chooseBySeed(['mean_reversion', 'defensive'], hashSeed(stock.id));
  if (stock.riskLevel === 'High') return chooseBySeed(['momentum', 'boom_bust', 'mean_reversion'], hashSeed(stock.id));
  return chooseBySeed(['boom_bust', 'chaos', 'momentum'], hashSeed(stock.id));
};

const getBaseSignalReliability = (stock: Stock, personality: StockPersonality) => {
  const riskPenalty = stock.riskLevel === 'Extreme' ? 0.18 : stock.riskLevel === 'High' ? 0.12 : stock.riskLevel === 'Medium' ? 0.07 : 0.03;
  const personalityPenalty = personality === 'chaos' ? 0.12 : personality === 'boom_bust' ? 0.08 : 0;
  return clamp(0.82 - riskPenalty - personalityPenalty, 0.28, 0.92);
};

export const ensureStockRuntime = (stock: Stock): Stock => {
  const personality = getDefaultPersonality(stock);
  const seed = hashSeed(stock.id);
  const regime = stock.regime && STOCK_REGIMES.includes(stock.regime) ? stock.regime : 'calm';
  const regimeTicksLeft = Math.max(4, Math.floor(stock.regimeTicksLeft ?? (7 + (seed % 15))));
  const reliability = clamp(stock.signalReliability ?? getBaseSignalReliability(stock, personality), 0.25, 0.96);
  const volatilityCluster = clamp(
    stock.volatilityCluster ?? stock.volatility * (0.85 + ((seed % 19) / 100)),
    stock.volatility * 0.35,
    stock.volatility * 2.8
  );

  return {
    ...stock,
    sector: getDefaultSector(stock),
    personality,
    regime,
    regimeTicksLeft,
    volatilityCluster,
    signalReliability: reliability,
    momentumSignal: clamp(stock.momentumSignal ?? 0, -1, 1),
    sentimentSignal: clamp(stock.sentimentSignal ?? 0, -1, 1),
    fundamentalSignal: clamp(stock.fundamentalSignal ?? 0, -1, 1),
    lastEventImpact: clamp(stock.lastEventImpact ?? 0, -1, 1)
  };
};

export const getSpreadRate = (stock: Stock) => {
  const history = stock.history.length > 1 ? stock.history : [stock.currentPrice, stock.currentPrice];
  const last = history[history.length - 1] || stock.currentPrice;
  const prev = history[history.length - 2] || last;
  const recentMove = Math.abs(last - prev) / Math.max(1, prev);
  const liquidityPenalty = (1 - stock.liquidity) * 0.03;
  return clamp(0.004 + liquidityPenalty + recentMove * 0.5 + stock.volatility * 0.12, 0.004, 0.24);
};

export const getBuyPrice = (stock: Stock) => {
  const spread = getSpreadRate(stock);
  return Math.max(0, stock.currentPrice * (1 + spread + stock.transactionFee));
};

export const getSellPrice = (stock: Stock) => {
  const spread = getSpreadRate(stock);
  return Math.max(0, stock.currentPrice * Math.max(0.02, 1 - spread - stock.transactionFee));
};

export const getScenarioLabel = (scenario: MarketScenario) => {
  if (scenario === 'bull_week') return 'Bull Week';
  if (scenario === 'panic_week') return 'Panic Week';
  return 'Fake-News Week';
};

export const getScenarioSummary = (scenario: MarketScenario) => {
  if (scenario === 'bull_week') return 'Trend is favorable. Crashes are less frequent, but overconfidence is expensive.';
  if (scenario === 'panic_week') return 'Volatility and downside pressure are elevated. Cash management matters.';
  return 'Signals are noisy and contradictory. Short-term reversals are common.';
};

export const getPersonalityLabel = (personality?: StockPersonality) => {
  if (personality === 'momentum') return 'Momentum';
  if (personality === 'mean_reversion') return 'Mean Reversion';
  if (personality === 'boom_bust') return 'Boom/Bust';
  if (personality === 'defensive') return 'Defensive';
  return 'Chaos';
};

export const getPersonalityHint = (personality?: StockPersonality) => {
  if (personality === 'momentum') return 'Tends to continue direction. Chasing too late can hurt.';
  if (personality === 'mean_reversion') return 'Often snaps back toward fair value after extremes.';
  if (personality === 'boom_bust') return 'Strong upside punctuated by brutal drops.';
  if (personality === 'defensive') return 'Lower volatility. Usually slower but steadier moves.';
  return 'Unstable signal quality. Expect random spikes and fakeouts.';
};

type ScenarioModifiers = {
  trendBias: number;
  volatilityScale: number;
  crashScale: number;
  moonScale: number;
};

const SCENARIO_MODIFIERS: Record<MarketScenario, ScenarioModifiers> = {
  bull_week: { trendBias: 0.012, volatilityScale: 0.92, crashScale: 0.78, moonScale: 1.18 },
  panic_week: { trendBias: -0.012, volatilityScale: 1.25, crashScale: 1.45, moonScale: 0.84 },
  fake_news_week: { trendBias: 0, volatilityScale: 1.18, crashScale: 1.08, moonScale: 1.04 }
};

type NewsTemplate = {
  title: string;
  sector: StockSector | 'all';
  bias: number;
  severity: number;
};

const NEWS_BY_SCENARIO: Record<MarketScenario, NewsTemplate[]> = {
  bull_week: [
    { title: 'Campus productivity app reports miracle gains.', sector: 'study', bias: 0.13, severity: 0.16 },
    { title: 'Wellness challenge goes viral. Defensive stocks bid up.', sector: 'health', bias: 0.11, severity: 0.13 },
    { title: 'Mega-cap merger rumors ignite optimism spiral.', sector: 'megacorp', bias: 0.16, severity: 0.18 },
    { title: 'Broad risk-on rally as everyone pretends this is sustainable.', sector: 'all', bias: 0.08, severity: 0.1 }
  ],
  panic_week: [
    { title: 'Regulatory taskforce announces immediate audit blitz.', sector: 'megacorp', bias: -0.18, severity: 0.2 },
    { title: 'Cloud outage narrative triggers infrastructure liquidation.', sector: 'infrastructure', bias: -0.16, severity: 0.18 },
    { title: 'Creator ad revenue collapses on policy change.', sector: 'creator', bias: -0.14, severity: 0.16 },
    { title: 'Market-wide de-risking event. Spreads widen aggressively.', sector: 'all', bias: -0.1, severity: 0.13 }
  ],
  fake_news_week: [
    { title: 'Conflicting leak claims sector moonshot; later denied.', sector: 'chaos', bias: 0.17, severity: 0.2 },
    { title: 'Synthetic report predicts recession and boom simultaneously.', sector: 'all', bias: -0.02, severity: 0.18 },
    { title: 'Viral rumor pumps creator names before hard reversal.', sector: 'creator', bias: 0.12, severity: 0.16 },
    { title: 'Anonymous thread claims infrastructure insolvency. Source: anonymous thread.', sector: 'infrastructure', bias: -0.1, severity: 0.15 }
  ]
};

const getWeekKey = (timestamp: number) => {
  const d = new Date(timestamp);
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const day = Math.floor((timestamp - start) / 86400000) + 1;
  const week = Math.ceil(day / 7);
  return `${year}-W${week}`;
};

const getScenarioForWeek = (weekKey: string): MarketScenario => {
  const seed = hashSeed(weekKey);
  const options: MarketScenario[] = ['bull_week', 'panic_week', 'fake_news_week'];
  return options[seed % options.length];
};

const pickNews = (scenario: MarketScenario, now: number): NewsTemplate => {
  const pool = NEWS_BY_SCENARIO[scenario];
  const idx = hashSeed(`${scenario}-${Math.floor(now / 17000)}`) % pool.length;
  return pool[idx];
};

type TickStocksInput = {
  stocks: Stock[];
  now: number;
  lastStockUpdate: number;
  tickMs: number;
  marketScenario: MarketScenario;
  marketScenarioWeekKey: string;
  marketMood: number;
  marketHeadline: string;
  marketHeadlineUntil: number;
  marketEventSector: StockSector | 'all' | null;
  marketEventBias: number;
  marketEventSeverity: number;
};

type TickStocksResult = {
  stocks: Stock[];
  lastStockUpdate: number;
  marketScenario: MarketScenario;
  marketScenarioWeekKey: string;
  marketMood: number;
  marketHeadline: string;
  marketHeadlineUntil: number;
  marketEventSector: StockSector | 'all' | null;
  marketEventBias: number;
  marketEventSeverity: number;
};

export const tickStocks = ({
  stocks,
  now,
  lastStockUpdate,
  tickMs,
  marketScenario,
  marketScenarioWeekKey,
  marketMood,
  marketHeadline,
  marketHeadlineUntil,
  marketEventSector,
  marketEventBias,
  marketEventSeverity
}: TickStocksInput): TickStocksResult => {
  if (now - lastStockUpdate < tickMs) {
    return {
      stocks,
      lastStockUpdate,
      marketScenario,
      marketScenarioWeekKey,
      marketMood,
      marketHeadline,
      marketHeadlineUntil,
      marketEventSector,
      marketEventBias,
      marketEventSeverity
    };
  }

  let nextScenario = marketScenario;
  let nextScenarioWeekKey = marketScenarioWeekKey;
  let nextHeadline = marketHeadline;
  let nextHeadlineUntil = marketHeadlineUntil;
  let nextEventSector = marketEventSector;
  let nextEventBias = marketEventBias;
  let nextEventSeverity = marketEventSeverity;
  let nextMood = marketMood * 0.92;

  const weekKey = getWeekKey(now);
  if (weekKey !== marketScenarioWeekKey) {
    nextScenarioWeekKey = weekKey;
    nextScenario = getScenarioForWeek(weekKey);
    nextHeadline = `Weekly scenario active: ${getScenarioLabel(nextScenario)}. ${getScenarioSummary(nextScenario)}`;
    nextHeadlineUntil = now + 15000;
    nextEventSector = null;
    nextEventBias = 0;
    nextEventSeverity = 0;
    nextMood = nextScenario === 'bull_week' ? 0.12 : nextScenario === 'panic_week' ? -0.12 : 0;
  }

  const eventExpired = nextHeadlineUntil > 0 && now >= nextHeadlineUntil;
  if (eventExpired) {
    nextEventSector = null;
    nextEventBias = 0;
    nextEventSeverity = 0;
  }

  const hasActiveEvent = nextEventSector !== null && now < nextHeadlineUntil;
  if (!hasActiveEvent && Math.random() < 0.06) {
    const event = pickNews(nextScenario, now);
    const durationMs = (30 + Math.floor(Math.random() * 61)) * 1000;
    nextHeadline = `${event.title} (${event.sector === 'all' ? 'All sectors' : `${event.sector} sector`})`;
    nextHeadlineUntil = now + durationMs;
    nextEventSector = event.sector;
    nextEventBias = event.bias;
    nextEventSeverity = event.severity;
    nextMood = clamp(nextMood + (event.bias * event.severity), -1, 1);
  }

  const scenarioMods = SCENARIO_MODIFIERS[nextScenario];
  const eventActive = nextEventSector !== null && now < nextHeadlineUntil;
  const updatedStocks = stocks.map((stock) => {
    const riskScale = getRiskScale(stock.riskLevel);
    const anchor = (stock.maxPrice + stock.minPrice) / 2;
    const valueDistance = (stock.currentPrice - anchor) / Math.max(1, anchor);
    const meanReversion = -valueDistance * 0.08;
    const eventApplies = eventActive && (nextEventSector === 'all' || stock.sector === nextEventSector);
    const eventBias = eventApplies ? nextEventBias * nextEventSeverity : 0;
    const heavyNoise =
      ((Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2)
      * stock.volatility
      * riskScale
      * scenarioMods.volatilityScale
      * (nextScenario === 'fake_news_week' ? 1.12 : 1);
    const trendMove = (stock.trend + scenarioMods.trendBias + (nextMood * 0.02)) * (0.6 + Math.random());
    const cyclical = Math.sin(now / 15000 + stock.currentPrice * 0.0008) * stock.volatility * 0.35;

    let multiplier = 1 + trendMove + meanReversion + heavyNoise + cyclical + eventBias;

    if (stock.currentPrice <= Math.max(1, stock.minPrice + 1) && Math.random() < stock.recoveryChance) {
      multiplier += 0.22 + Math.random() * 0.4;
    }

    const overextended = valueDistance > 0.28 ? 1.7 : 1;
    const crashRoll = Math.random();
    if (crashRoll < stock.crashChance * overextended * scenarioMods.crashScale) {
      multiplier *= (0.06 + Math.random() * 0.2);
    } else if (Math.random() < stock.moonChance * scenarioMods.moonScale * Math.max(0.35, 1 - Math.max(0, valueDistance))) {
      multiplier *= (1.12 + Math.random() * 0.35);
    }

    let price = stock.currentPrice * multiplier;
    if (!Number.isFinite(price)) price = stock.currentPrice;
    price = clamp(price, stock.minPrice, stock.maxPrice);
    if (price < 0.5 && stock.minPrice <= 0) price = Math.max(0, price);

    const history = [...stock.history, price].slice(-20);
    return {
      ...stock,
      currentPrice: price,
      history,
      lastEventImpact: clamp(eventBias, -1, 1)
    };
  });

  return {
    stocks: updatedStocks,
    lastStockUpdate: now,
    marketScenario: nextScenario,
    marketScenarioWeekKey: nextScenarioWeekKey,
    marketMood: clamp(nextMood, -1, 1),
    marketHeadline: nextHeadline,
    marketHeadlineUntil: nextHeadlineUntil,
    marketEventSector: nextEventSector,
    marketEventBias: nextEventBias,
    marketEventSeverity: nextEventSeverity
  };
};
