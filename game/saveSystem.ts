import { BONUS_STOCKS, MATTER_OPERATIONS } from '../constants';
import { GamePhase, GameState, RegionName, Stock, Upgrade } from '../types';
import { ensureStockRuntime } from './marketEngine';

type SaveData = {
  version: number;
  state: GameState;
  upgrades: Upgrade[];
  savedAt: number;
};

type LoadGameConfig = {
  saveKey: string;
  earthMatterTotal: number;
  earthRealEstateTotal: number;
  megacorpStarterMatter: number;
  megacorpStarterRealEstate: number;
  buildDefaultState: () => GameState;
  buildDefaultUpgrades: () => Upgrade[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const loadGame = ({
  saveKey,
  earthMatterTotal,
  earthRealEstateTotal,
  megacorpStarterMatter,
  megacorpStarterRealEstate,
  buildDefaultState,
  buildDefaultUpgrades
}: LoadGameConfig): { state: GameState; upgrades: Upgrade[] } => {
  const defaultState = buildDefaultState();
  const defaultUpgrades = buildDefaultUpgrades();

  if (typeof window === 'undefined') {
    return { state: defaultState, upgrades: defaultUpgrades };
  }

  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return { state: defaultState, upgrades: defaultUpgrades };
    const parsed = JSON.parse(raw) as SaveData;

    if (!parsed.state || !Array.isArray(parsed.upgrades)) {
      return { state: defaultState, upgrades: defaultUpgrades };
    }

    const savedState = parsed.state;
    const mergedRegions = Object.fromEntries(
      (Object.values(RegionName) as RegionName[]).map((regionId) => {
        const baseRegion = defaultState.regions[regionId];
        const savedRegion = savedState.regions?.[regionId];
        return [regionId, {
          ...baseRegion,
          ...savedRegion,
          unlockCost: Math.max(baseRegion.unlockCost, savedRegion?.unlockCost ?? 0),
          examPassesRequired: Math.max(baseRegion.examPassesRequired, savedRegion?.examPassesRequired ?? 0)
        }];
      })
    ) as GameState['regions'];

    const mergedBaseStocks = defaultState.stocks.map((defaultStock) => {
      const savedStock = savedState.stocks?.find((stock) => stock.id === defaultStock.id);
      if (!savedStock) return ensureStockRuntime(defaultStock);

      const owned = Math.max(0, Math.floor(savedStock.owned || 0));
      const normalizedPrice = clamp(savedStock.currentPrice || defaultStock.currentPrice, defaultStock.minPrice, defaultStock.maxPrice);
      const inferredCostBasis = owned > 0 ? normalizedPrice * owned : 0;
      const totalCostBasis = Math.max(0, savedStock.totalCostBasis ?? inferredCostBasis);
      const realizedPnl = Number.isFinite(savedStock.realizedPnl) ? (savedStock.realizedPnl as number) : 0;

      return {
        ...ensureStockRuntime({
          ...defaultStock,
          ...savedStock,
          owned,
          currentPrice: normalizedPrice,
          totalCostBasis,
          realizedPnl,
          history: Array.isArray(savedStock.history) && savedStock.history.length > 0
            ? savedStock.history.slice(-20).map((v) => clamp(v, defaultStock.minPrice, defaultStock.maxPrice))
            : [...defaultStock.history]
        })
      };
    });

    const mergedUnlockedBonusStocks = BONUS_STOCKS.map((bonusStock) => {
      const savedStock = savedState.stocks?.find((stock) => stock.id === bonusStock.id);
      if (!savedStock) return null;

      const owned = Math.max(0, Math.floor(savedStock.owned || 0));
      const normalizedPrice = clamp(savedStock.currentPrice || bonusStock.currentPrice, bonusStock.minPrice, bonusStock.maxPrice);
      const inferredCostBasis = owned > 0 ? normalizedPrice * owned : 0;
      const totalCostBasis = Math.max(0, savedStock.totalCostBasis ?? inferredCostBasis);
      const realizedPnl = Number.isFinite(savedStock.realizedPnl) ? (savedStock.realizedPnl as number) : 0;

      return {
        ...ensureStockRuntime({
          ...bonusStock,
          ...savedStock,
          owned,
          currentPrice: normalizedPrice,
          totalCostBasis,
          realizedPnl,
          history: Array.isArray(savedStock.history) && savedStock.history.length > 0
            ? savedStock.history.slice(-20).map((v) => clamp(v, bonusStock.minPrice, bonusStock.maxPrice))
            : [...bonusStock.history]
        })
      };
    }).filter((stock): stock is Stock => !!stock);

    const mergedStocks = [...mergedBaseStocks, ...mergedUnlockedBonusStocks];

    const mergedUpgrades = defaultUpgrades.map((defaultUpgrade) => {
      const savedUpgrade = parsed.upgrades.find((upgrade) => upgrade.id === defaultUpgrade.id);
      if (!savedUpgrade) return defaultUpgrade;
      const count = Math.max(0, Math.floor(savedUpgrade.count || 0));
      return {
        ...defaultUpgrade,
        count,
        purchased: count >= (defaultUpgrade.maxPurchases || 1)
      };
    });

    const mergedHardware = defaultState.hardware.map((base) => {
      const saved = savedState.hardware?.find((h) => h.id === base.id);
      if (!saved) return base;
      return {
        ...base,
        count: Math.max(0, Math.floor(saved.count || 0))
      };
    });

    const mergedNetwork = defaultState.network.map((base) => {
      const saved = savedState.network?.find((n) => n.id === base.id);
      if (!saved) return base;
      return {
        ...base,
        count: Math.max(0, Math.floor(saved.count || 0))
      };
    });
    const mergedMatterOps = Object.fromEntries(
      MATTER_OPERATIONS.map((op) => [op.id, Math.max(0, Math.floor((savedState.matterOps?.[op.id] || 0)))])
    ) as GameState['matterOps'];
    const hasDigitalInfrastructure =
      mergedHardware.some((hw) => hw.count > 0)
      || mergedNetwork.some((device) => device.count > 0);

    const inferredPhase =
      savedState.phase
      || (savedState.digitalBrainUnlocked || savedState.isCyborg ? GamePhase.Megacorp : GamePhase.Biological);

    return {
      state: {
        ...defaultState,
        ...savedState,
        neurons: Math.max(0, savedState.neurons || 0),
        dopamine: Math.max(0, savedState.dopamine || 0),
        serotonin: Math.max(0, savedState.serotonin || 0),
        money: Math.max(0, savedState.money || 0),
        totalNeurons: Math.max(0, savedState.totalNeurons || 0),
        clickPower: Math.max(1, savedState.clickPower || 1),
        passiveGen: Math.max(0, savedState.passiveGen || 0),
        dopamineGainChance: clamp(savedState.dopamineGainChance || defaultState.dopamineGainChance, 0, 0.95),
        serotoninPerCorrect: Math.max(1, savedState.serotoninPerCorrect || defaultState.serotoninPerCorrect),
        critChance: clamp(savedState.critChance || defaultState.critChance, 0.05, 0.95),
        critMultiplier: Math.max(1.25, savedState.critMultiplier || defaultState.critMultiplier),
        streakBoost: clamp(savedState.streakBoost || defaultState.streakBoost, 0.005, 0.25),
        clickStreak: Math.max(0, Math.floor(savedState.clickStreak || 0)),
        lastManualClick: Math.max(0, Math.floor(savedState.lastManualClick || 0)),
        clickFxLevel: Math.max(0, Math.floor(savedState.clickFxLevel || 0)),
        anxiety: clamp(savedState.anxiety || 0, 0, Math.max(60, savedState.anxietyCap || defaultState.anxietyCap)),
        anxietyCap: Math.max(60, savedState.anxietyCap || defaultState.anxietyCap),
        anxietyResist: clamp(savedState.anxietyResist || defaultState.anxietyResist, 0.05, 2),
        breakdownActive: false,
        breakdownTimer: 0,
        regions: mergedRegions,
        stocks: mergedStocks,
        hardware: mergedHardware,
        network: mergedNetwork,
        minigames: {
          ...defaultState.minigames,
          ...savedState.minigames
        },
        digitalBrainUnlocked: !!savedState.digitalBrainUnlocked,
        digitalNetworkUnlocked: !!(savedState as Partial<GameState>).digitalNetworkUnlocked,
        digitalMiningUnlocked: !!(savedState as Partial<GameState>).digitalMiningUnlocked,
        neuroLinkStartedAt: (() => {
          const rawNeuroLinkStart = Number((savedState as Partial<GameState>).neuroLinkStartedAt ?? 0);
          if (Number.isFinite(rawNeuroLinkStart) && rawNeuroLinkStart > 0) return rawNeuroLinkStart;
          return savedState.isCyborg ? Date.now() - (10 * 60 * 1000) : 0;
        })(),
        isCyborg: !!savedState.isCyborg,
        phase: inferredPhase,
        computeMultiplier: 1,
        earthMatterTotal: Math.max(1, (savedState as Partial<GameState>).earthMatterTotal ?? earthMatterTotal),
        earthMatterRemaining: clamp(
          Math.max(0, (savedState as Partial<GameState>).earthMatterRemaining ?? earthMatterTotal),
          0,
          Math.max(1, (savedState as Partial<GameState>).earthMatterTotal ?? earthMatterTotal)
        ),
        spaceProgressUnlocked: !!(savedState as Partial<GameState>).spaceProgressUnlocked,
        spaceSectorsTotal: Math.max(200, Math.floor((savedState as Partial<GameState>).spaceSectorsTotal ?? defaultState.spaceSectorsTotal)),
        spaceSectorsScanned: Math.max(
          0,
          Math.floor(
            Math.min(
              (savedState as Partial<GameState>).spaceSectorsScanned ?? 0,
              Math.max(200, Math.floor((savedState as Partial<GameState>).spaceSectorsTotal ?? defaultState.spaceSectorsTotal))
            )
          )
        ),
        spaceGalaxiesDiscovered: (() => {
          const discovered = Math.max(0, Math.floor((savedState as Partial<GameState>).spaceGalaxiesDiscovered ?? 0));
          const claimed = Math.max(0, Math.floor((savedState as Partial<GameState>).spaceGalaxiesClaimed ?? 0));
          return Math.max(discovered, claimed);
        })(),
        spaceGalaxiesClaimed: Math.max(0, Math.floor((savedState as Partial<GameState>).spaceGalaxiesClaimed ?? 0)),
        spaceRelays: Math.max(0, Math.floor((savedState as Partial<GameState>).spaceRelays ?? 0)),
        spaceHostileSignals: clamp((savedState as Partial<GameState>).spaceHostileSignals ?? 0, 0, 100),
        spaceSurveyMissions: Math.max(0, Math.floor((savedState as Partial<GameState>).spaceSurveyMissions ?? 0)),
        spaceRaidCooldown: Math.max(0, (savedState as Partial<GameState>).spaceRaidCooldown ?? 0),
        spaceMatterExtracted: Math.max(0, (savedState as Partial<GameState>).spaceMatterExtracted ?? 0),
        bleatFeed: Array.isArray((savedState as Partial<GameState>).bleatFeed)
          ? (savedState as Partial<GameState>).bleatFeed!
            .filter((entry): entry is string => typeof entry === 'string')
            .slice(0, 10)
          : [],
        bleatTickerMs: Math.max(0, (savedState as Partial<GameState>).bleatTickerMs ?? 5000),
        revoltPending: !!(savedState as Partial<GameState>).revoltPending,
        matterOps: mergedMatterOps,
        compute: Math.max(0, (savedState as Partial<GameState>).compute ?? (savedState.isCyborg ? (savedState.totalNeurons || 0) * 0.15 : 0)),
        matter: (() => {
          const loadedMatter = Math.max(0, (savedState as Partial<GameState>).matter ?? 0);
          if (savedState.isCyborg && !hasDigitalInfrastructure) {
            return Math.max(loadedMatter, megacorpStarterMatter);
          }
          return loadedMatter;
        })(),
        waterCapacity: Math.max(120, (savedState as Partial<GameState>).waterCapacity ?? 160),
        water: (() => {
          const loadedWater = Math.max(0, (savedState as Partial<GameState>).water ?? (savedState.isCyborg ? 90 : 0));
          const cap = Math.max(120, (savedState as Partial<GameState>).waterCapacity ?? 160);
          return Math.min(loadedWater, cap);
        })(),
        energy: Math.max(0, (savedState as Partial<GameState>).energy ?? (savedState.isCyborg ? 25 : 0)),
        heat: Math.max(0, (savedState as Partial<GameState>).heat ?? 0),
        heatCapacity: Math.max(40, (savedState as Partial<GameState>).heatCapacity ?? 60),
        prLevel: clamp((savedState as Partial<GameState>).prLevel ?? 100, 0, 100),
        globalAnxiety: clamp((savedState as Partial<GameState>).globalAnxiety ?? 0, 0, 100),
        nudges: Math.max(
          0,
          Math.floor(
            (savedState as Partial<GameState>).nudges
            ?? (savedState as Partial<GameState>).behavioralNudges
            ?? 0
          )
        ),
        corporateTaxDrain: Math.max(0, (savedState as Partial<GameState>).corporateTaxDrain ?? 40),
        prUpgrades: Array.isArray((savedState as Partial<GameState>).prUpgrades)
          ? Array.from(new Set((savedState as Partial<GameState>).prUpgrades!.filter((entry): entry is string => typeof entry === 'string')))
          : [],
        activeDistractions: (() => {
          const src = (savedState as Partial<GameState>).activeDistractions;
          if (!src || typeof src !== 'object') return {};
          return Object.fromEntries(
            Object.entries(src).map(([key, value]) => [key, Math.max(0, Number(value) || 0)])
          ) as Record<string, number>;
        })(),
        behavioralNudges: Math.max(0, Math.floor((savedState as Partial<GameState>).behavioralNudges ?? 0)),
        realEstate: Math.max(
          0,
          Math.min(
            earthRealEstateTotal,
            Math.floor((savedState as Partial<GameState>).realEstate ?? (savedState.isCyborg ? megacorpStarterRealEstate : 0))
          )
        ),
        megacorpBaselineRealEstate: (() => {
          const baseline = Math.max(
            0,
            Math.floor(
              (savedState as Partial<GameState>).megacorpBaselineRealEstate
              ?? (savedState.isCyborg ? megacorpStarterRealEstate : 0)
            )
          );
          const realEstate = Math.max(
            0,
            Math.min(
              earthRealEstateTotal,
              Math.floor((savedState as Partial<GameState>).realEstate ?? (savedState.isCyborg ? megacorpStarterRealEstate : 0))
            )
          );
          return Math.min(baseline, realEstate);
        })(),
        earthSubjugatedPercent: clamp(
          (savedState as Partial<GameState>).earthSubjugatedPercent
          ?? (
            savedState.isCyborg
              ? (1 - (((savedState as Partial<GameState>).earthMatterRemaining ?? earthMatterTotal) / Math.max(1, ((savedState as Partial<GameState>).earthMatterTotal ?? earthMatterTotal)))) * 100
              : 0
          ),
          0,
          100
        ),
        antitrustCooldown: Math.max(0, (savedState as Partial<GameState>).antitrustCooldown ?? 0),
        senateBaffleProgress: Math.max(0, Math.floor((savedState as Partial<GameState>).senateBaffleProgress ?? 0)),
        operantCampaigns: Math.max(0, Math.floor((savedState as Partial<GameState>).operantCampaigns ?? 0)),
        dissonanceCampaigns: Math.max(0, Math.floor((savedState as Partial<GameState>).dissonanceCampaigns ?? 0)),
        lobbyingLevel: Math.max(0, Math.floor((savedState as Partial<GameState>).lobbyingLevel ?? 0)),
        cyborgResearchPoints: Math.max(
          0,
          Math.floor(
            (savedState as Partial<GameState>).cyborgResearchPoints
            ?? (savedState.isCyborg ? Math.min(12, Math.floor((savedState.correctQuizAnswers || 0) / 8)) : 0)
          )
        ),
        psychBucks: Math.max(0, Math.floor((savedState as Partial<GameState>).psychBucks ?? 0)),
        claimedMilestoneIqs: Array.isArray((savedState as Partial<GameState>).claimedMilestoneIqs)
          ? Array.from(new Set((savedState as Partial<GameState>).claimedMilestoneIqs!.filter((entry): entry is number => Number.isFinite(entry))))
          : [],
        shopOwnedIds: Array.isArray((savedState as Partial<GameState>).shopOwnedIds)
          ? Array.from(new Set((savedState as Partial<GameState>).shopOwnedIds!.filter((entry): entry is string => typeof entry === 'string')))
          : [],
        activeCosmeticId: (() => {
          const candidate = (savedState as Partial<GameState>).activeCosmeticId;
          const owned = Array.isArray((savedState as Partial<GameState>).shopOwnedIds) ? (savedState as Partial<GameState>).shopOwnedIds! : [];
          return typeof candidate === 'string' && owned.includes(candidate) ? candidate : null;
        })(),
        lastStockUpdate: Date.now(),
        lastTick: Date.now()
      },
      upgrades: mergedUpgrades
    };
  } catch {
    return { state: defaultState, upgrades: defaultUpgrades };
  }
};

export const saveGame = (
  saveKey: string,
  saveVersion: number,
  state: GameState,
  upgrades: Upgrade[]
) => {
  if (typeof window === 'undefined') return;

  const payload: SaveData = {
    version: saveVersion,
    state,
    upgrades,
    savedAt: Date.now()
  };

  window.localStorage.setItem(saveKey, JSON.stringify(payload));
};
