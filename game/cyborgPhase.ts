import { MATTER_OPERATIONS } from '../constants';
import { GamePhase, GameState } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const HARDWARE_REAL_ESTATE_FOOTPRINT: Record<'processor' | 'cooling' | 'power', number> = {
  processor: 1.6,
  cooling: 1.15,
  power: 1.3
};

export const NETWORK_REAL_ESTATE_FOOTPRINT = 0.45;
const LEGACY_NEUROLINK_HARDWARE_IDS = new Set(['silicon_cortex', 'cranial_vents', 'hypothalamic_cryoloop', 'skull_battery_pack']);

const hasDatacenterHardware = (hardware: GameState['hardware']) =>
  hardware.some((item) => item.type === 'processor' && !LEGACY_NEUROLINK_HARDWARE_IDS.has(item.id) && item.count > 0);

export type DigitalMetrics = {
  processorThroughput: number;
  networkThroughput: number;
  coolingPower: number;
  powerSupply: number;
  powerDemand: number;
  heatOutput: number;
  powerRatio: number;
  coolingRatio: number;
  throughputLimiter: number;
  throughputPerSec: number;
  siphonIncomePerSec: number;
  thermalDeficit: number;
  brownoutDeficit: number;
  thermalMargin: number;
  powerMargin: number;
};

export const getDigitalMetrics = (hardware: GameState['hardware'], network: GameState['network'], computeMultiplier: number): DigitalMetrics => {
  const basePowerReserve = 2.4;
  const baseCoolingReserve = 0.85;
  const basePowerDemand = 1.1;
  const baseHeatOutput = 0.55;

  const processorThroughput = hardware
    .filter((hw) => hw.type === 'processor')
    .reduce((sum, hw) => sum + (hw.effect * hw.count), 0);
  const coolingPower = hardware
    .filter((hw) => hw.type === 'cooling')
    .reduce((sum, hw) => sum + (hw.effect * hw.count), baseCoolingReserve);
  const powerSupply = hardware
    .filter((hw) => hw.type === 'power')
    .reduce((sum, hw) => sum + (hw.effect * hw.count), basePowerReserve);
  const networkThroughput = network.reduce((sum, device) => sum + (device.effect * device.count), 0);

  const hardwarePowerDraw = hardware.reduce((sum, hw) => sum + (hw.powerDraw * hw.count), 0);
  const networkPowerDraw = network.reduce((sum, device) => sum + (device.powerDraw * device.count), 0);
  const powerDemand = Math.max(basePowerDemand, hardwarePowerDraw + networkPowerDraw + basePowerDemand);

  const hardwareHeat = hardware.reduce((sum, hw) => sum + (hw.heatGen * hw.count), 0);
  const networkHeat = network.reduce((sum, device) => sum + (device.heatGen * device.count), 0);
  const heatOutput = Math.max(baseHeatOutput, hardwareHeat + networkHeat + baseHeatOutput);

  const powerRatio = clamp(powerSupply / Math.max(1, powerDemand), 0, 1.35);
  const coolingRatio = clamp(coolingPower / Math.max(1, heatOutput), 0, 1.35);
  const stabilityRatio = Math.min(powerRatio, coolingRatio);
  const throughputLimiter = clamp(0.22 + (stabilityRatio * 0.85), 0.22, 1.2);

  const throughputPerSec = (processorThroughput + networkThroughput) * computeMultiplier * throughputLimiter;
  const siphonIncomePerSecRaw = network.reduce((sum, device) => sum + (device.income * device.count), 0);
  const siphonIncomePerSec = siphonIncomePerSecRaw * clamp(0.45 + (stabilityRatio * 0.5), 0.35, 1.25);

  const thermalDeficit = Math.max(0, heatOutput - coolingPower);
  const brownoutDeficit = Math.max(0, powerDemand - powerSupply);
  const thermalMargin = coolingPower - heatOutput;
  const powerMargin = powerSupply - powerDemand;

  return {
    processorThroughput,
    networkThroughput,
    coolingPower,
    powerSupply,
    powerDemand,
    heatOutput,
    powerRatio,
    coolingRatio,
    throughputLimiter,
    throughputPerSec,
    siphonIncomePerSec,
    thermalDeficit,
    brownoutDeficit,
    thermalMargin,
    powerMargin
  };
};

const getHardwareCostGrowth = (type: 'processor' | 'cooling' | 'power') =>
  type === 'processor' ? 1.28 : 1.24;

const NETWORK_COST_GROWTH = 1.27;

const getBulkPurchaseCost = (baseCost: number, currentCount: number, growth: number, quantity: number) => {
  if (quantity <= 0) return 0;
  const first = baseCost * Math.pow(growth, currentCount);
  if (growth === 1) return Math.floor(first * quantity);
  const total = first * ((Math.pow(growth, quantity) - 1) / (growth - 1));
  return Math.floor(total);
};

const getMatterScaleForHardware = (type: 'processor' | 'cooling' | 'power') =>
  type === 'processor' ? 0.045 : type === 'cooling' ? 0 : 0.01;

export const getDigitalHardwareQuote = (
  state: GameState,
  hardware: GameState['hardware'][number],
  quantity: number
) => {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const growth = getHardwareCostGrowth(hardware.type);
  const phase = state.phase;

  if (phase === GamePhase.NeuroLink) {
    const neurolinkGrowth = hardware.type === 'processor' ? 1.18 : 1.14;
    const neurolinkBaseCost = hardware.id === 'silicon_cortex'
      ? Math.max(1, Math.floor(hardware.baseCost))
      : hardware.type === 'cooling'
        ? Math.max(1, Math.floor(hardware.baseCost * 0.52))
        : hardware.type === 'power'
          ? Math.max(1, Math.floor(hardware.baseCost * 0.58))
          : Math.max(1, Math.floor(hardware.baseCost * 0.82));
    const computeCost = getBulkPurchaseCost(neurolinkBaseCost, hardware.count, neurolinkGrowth, safeQuantity);
    const moneyCost = state.digitalNetworkUnlocked
      ? getBulkPurchaseCost(Math.max(1, Math.floor(hardware.baseCost * 0.4)), hardware.count, neurolinkGrowth, safeQuantity)
      : 0;

    return {
      computeCost,
      moneyCost,
      matterCost: 0,
      requiresNetwork: false,
      requiresMining: false
    };
  }

  const isLegacyHardware = LEGACY_NEUROLINK_HARDWARE_IDS.has(hardware.id);
  const megacorpMoneyScale = isLegacyHardware ? 1 : 4600;
  const moneyBase = Math.max(1, Math.floor(hardware.baseCost * megacorpMoneyScale));
  const moneyCost = getBulkPurchaseCost(moneyBase, hardware.count, growth, safeQuantity);
  const matterScale = isLegacyHardware
    ? getMatterScaleForHardware(hardware.type)
    : 0;
  const matterBase = Math.floor(moneyBase * matterScale);
  const matterCost = matterBase <= 0 ? 0 : getBulkPurchaseCost(matterBase, hardware.count, growth, safeQuantity);
  return {
    computeCost: 0,
    moneyCost,
    matterCost,
    requiresNetwork: false,
    requiresMining: false
  };
};

export const getNetworkPurchaseQuote = (
  state: GameState,
  device: GameState['network'][number],
  quantity: number
) => {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const isBlackmail = device.id === 'sentiment_tax_api';
  if (state.phase === GamePhase.NeuroLink) {
    const neurolinkBaseCost = Math.max(1, Math.floor(device.baseCost * 0.62));
    return {
      computeCost: getBulkPurchaseCost(neurolinkBaseCost, device.count, 1.16, safeQuantity),
      moneyCost: 0,
      matterCost: 0
    };
  }
  if (isBlackmail) {
    return {
      computeCost: getBulkPurchaseCost(Math.max(1, Math.floor(device.baseCost * 1.08)), device.count, NETWORK_COST_GROWTH, safeQuantity),
      moneyCost: 0,
      matterCost: getBulkPurchaseCost(Math.max(1, Math.floor(device.baseCost * 0.025)), device.count, NETWORK_COST_GROWTH, safeQuantity)
    };
  }
  return {
    computeCost: 0,
    moneyCost: getBulkPurchaseCost(device.baseCost, device.count, NETWORK_COST_GROWTH, safeQuantity),
    matterCost: getBulkPurchaseCost(Math.max(1, Math.floor(device.baseCost * 0.025)), device.count, NETWORK_COST_GROWTH, safeQuantity)
  };
};

export const getMatterOpCost = (baseCost: number, count: number, growth: number) =>
  Math.floor(baseCost * Math.pow(growth, count));

export const getRealEstateCost = (currentAcres: number, quantity = 1) => {
  let total = 0;
  const safeQuantity = Math.max(1, Math.floor(quantity));
  for (let i = 0; i < safeQuantity; i += 1) {
    const n = currentAcres + i;
    total += Math.floor(10000 * Math.pow(1 + (n / 120), 2.2));
  }
  return total;
};

export const getInfrastructureFootprint = (hardware: GameState['hardware'], network: GameState['network']) => {
  const hardwareUsage = hardware.reduce(
    (sum, item) => sum + (HARDWARE_REAL_ESTATE_FOOTPRINT[item.type] || 1) * item.count,
    0
  );
  const networkUsage = network.reduce((sum, item) => sum + (NETWORK_REAL_ESTATE_FOOTPRINT * item.count), 0);
  return hardwareUsage + networkUsage;
};

export type CyborgTickResult = {
  passiveGain: number;
  moneyGain: number;
  computeGain: number;
  matterGain: number;
  anxietyDelta: number;
  energyDelta: number;
  nextWater: number;
  nextWaterCapacity: number;
  nextHeat: number;
  nextHeatCapacity: number;
  nextPrLevel: number;
  nextGlobalAnxiety: number;
  nextBehavioralNudges: number;
  nextRealEstate: number;
  nextAntitrustCooldown: number;
  nextSenateBaffleProgress: number;
  nextHardware: GameState['hardware'];
  nextNetwork: GameState['network'];
  antitrustTriggered: boolean;
};

export type ThermalFlow = {
  heatInPerSec: number;
  coolingOutPerSec: number;
  netHeatPerSec: number;
};

export const getThermalFlow = (state: GameState, now = Date.now()): ThermalFlow => {
  if (!state.isCyborg) return { heatInPerSec: 0, coolingOutPerSec: 0, netHeatPerSec: 0 };

  const isMegacorpPhase = state.phase === GamePhase.Megacorp;
  const isNeuroLinkPhase = state.phase === GamePhase.NeuroLink;
  const megacorpDatacentersOnline = isMegacorpPhase && hasDatacenterHardware(state.hardware);
  const megacorpHeatProfileActive = isMegacorpPhase && megacorpDatacentersOnline;
  const waterSystemsActive = state.phase !== GamePhase.NeuroLink && megacorpHeatProfileActive;
  const metrics = getDigitalMetrics(state.hardware, state.network, state.computeMultiplier);
  const infrastructureFootprint = getInfrastructureFootprint(state.hardware, state.network);
  const opsTotalsRaw = MATTER_OPERATIONS.reduce(
    (acc, op) => {
      const count = state.matterOps[op.id] || 0;
      if (count <= 0) return acc;
      acc.matterPerSec += op.matterPerSec * count;
      acc.heatPerSec += op.heatPerSec * count;
      acc.energyDraw += op.energyDraw * count;
      return acc;
    },
    { matterPerSec: 0, heatPerSec: 0, energyDraw: 0 }
  );
  const opsTotals = isNeuroLinkPhase ? { matterPerSec: 0, heatPerSec: 0, energyDraw: 0 } : opsTotalsRaw;
  const neuroLinkElapsedMs = isNeuroLinkPhase
    ? Math.max(0, now - (state.neuroLinkStartedAt || now))
    : 180000;
  const neuroLinkRampProgress = clamp(neuroLinkElapsedMs / 180000, 0, 1);
  const neuroLinkHeatRamp = isNeuroLinkPhase ? (0.52 + (neuroLinkRampProgress * 0.48)) : 1;
  const neuroLinkCoolingBoost = isNeuroLinkPhase ? (1.18 - (neuroLinkRampProgress * 0.18)) : 1;

  const landOversubscription = megacorpHeatProfileActive
    ? Math.max(0, infrastructureFootprint - Math.max(1, state.realEstate))
    : 0;
  const powerGeneratedPerSec = metrics.powerSupply * 2.2;
  const powerDemandPerSec = (metrics.powerDemand * 2.0) + (opsTotals.energyDraw * 1.8) + (landOversubscription * 0.45);
  const energyShortage = Math.max(0, powerDemandPerSec - powerGeneratedPerSec);

  const oceanSinkCount = state.hardware.find((item) => item.id === 'ocean_sink')?.count || 0;
  const cryoCount = state.hardware.find((item) => item.id === 'cryo_cathedral')?.count || 0;
  const deepwaterCount = state.hardware.find((item) => item.id === 'deepwater_chiller_grid')?.count || 0;
  const baseWaterCapacity = megacorpHeatProfileActive ? 220 : 170;
  const nextWaterCapacity = waterSystemsActive
    ? baseWaterCapacity + (oceanSinkCount * 85) + (cryoCount * 95) + (deepwaterCount * 260)
    : state.waterCapacity;
  const waterCoolingFactor = waterSystemsActive
    ? clamp(state.water / Math.max(1, nextWaterCapacity * 0.18), 0.28, 1.08)
    : 1;

  const heatGenFactor = megacorpHeatProfileActive ? 1.08 : isNeuroLinkPhase ? 1.04 : 1.16;
  const shortageHeatFactor = megacorpHeatProfileActive ? 0.24 : isNeuroLinkPhase ? 0.18 : 0.3;
  const opsHeatFactor = megacorpHeatProfileActive ? 0.72 : isNeuroLinkPhase ? 0.6 : 0.85;
  const coolingDissipationFactor = megacorpHeatProfileActive ? 2.05 : isNeuroLinkPhase ? 2.3 : 1.75;
  const passiveCooling = megacorpHeatProfileActive ? 0.85 : isNeuroLinkPhase ? 1.05 : 0.55;
  const datacenterHeat = state.hardware
    .filter((item) => item.type === 'processor' && !LEGACY_NEUROLINK_HARDWARE_IDS.has(item.id))
    .reduce((sum, item) => sum + (item.heatGen * item.count), 0);
  const hasCarbonOffset = state.prUpgrades.includes('carbon_offset_illusion');
  const adjustedHeatOutput = Math.max(
    0,
    metrics.heatOutput - datacenterHeat + (datacenterHeat * (hasCarbonOffset ? 0.85 : 1))
  );

  const effectiveCoolingPower = metrics.coolingPower * waterCoolingFactor;
  const heatInPerSec =
    ((adjustedHeatOutput * heatGenFactor) + (energyShortage * shortageHeatFactor) + (opsTotals.heatPerSec * opsHeatFactor))
    * neuroLinkHeatRamp;
  const coolingOutPerSec = (effectiveCoolingPower * coolingDissipationFactor * neuroLinkCoolingBoost) + passiveCooling;
  const rawNetHeatPerSec = heatInPerSec - coolingOutPerSec;
  const netHeatPerSec = isNeuroLinkPhase
    ? clamp(rawNetHeatPerSec, -(4 + (effectiveCoolingPower * 0.22)), 1.35 + (metrics.processorThroughput * 0.0011))
    : rawNetHeatPerSec;

  return { heatInPerSec, coolingOutPerSec, netHeatPerSec };
};

export const simulateCyborgPhaseTick = (prev: GameState, now: number, tickRate: number): CyborgTickResult => {
  const dt = tickRate / 1000;
  const isMegacorpPhase = prev.phase === GamePhase.Megacorp;
  const isNeuroLinkPhase = prev.phase === GamePhase.NeuroLink;
  const megacorpDatacentersOnline = isMegacorpPhase && hasDatacenterHardware(prev.hardware);
  const megacorpHeatProfileActive = isMegacorpPhase && megacorpDatacentersOnline;
  const opsTotalsRaw = MATTER_OPERATIONS.reduce(
    (acc, op) => {
      const count = prev.matterOps[op.id] || 0;
      if (count <= 0) return acc;
      acc.matterPerSec += op.matterPerSec * count;
      acc.heatPerSec += op.heatPerSec * count;
      acc.energyDraw += op.energyDraw * count;
      acc.cashPerSec += (op.cashPerSec || 0) * count;
      return acc;
    },
    { matterPerSec: 0, heatPerSec: 0, energyDraw: 0, cashPerSec: 0 }
  );
  const opsTotals = isNeuroLinkPhase
    ? { matterPerSec: 0, heatPerSec: 0, energyDraw: 0, cashPerSec: 0 }
    : opsTotalsRaw;

  const metrics = getDigitalMetrics(prev.hardware, prev.network, prev.computeMultiplier);
  const infrastructureFootprint = getInfrastructureFootprint(prev.hardware, prev.network);
  const waterSystemsActive = prev.phase !== GamePhase.NeuroLink && megacorpHeatProfileActive;
  const neuroLinkElapsedMs = isNeuroLinkPhase
    ? Math.max(0, now - (prev.neuroLinkStartedAt || now))
    : 180000;
  const neuroLinkRampProgress = clamp(neuroLinkElapsedMs / 180000, 0, 1);
  const neuroLinkHeatRamp = isNeuroLinkPhase ? (0.52 + (neuroLinkRampProgress * 0.48)) : 1;
  const neuroLinkCoolingBoost = isNeuroLinkPhase ? (1.18 - (neuroLinkRampProgress * 0.18)) : 1;

  const landOversubscription = megacorpHeatProfileActive
    ? Math.max(0, infrastructureFootprint - Math.max(1, prev.realEstate))
    : 0;
  const powerGeneratedPerSec = metrics.powerSupply * 2.2;
  const powerDemandPerSec = (metrics.powerDemand * 2.0) + (opsTotals.energyDraw * 1.8) + (landOversubscription * 0.45);
  const energyDelta = (powerGeneratedPerSec - powerDemandPerSec) * dt;
  const nextEnergyBuffer = Math.max(0, prev.energy + energyDelta);
  const energyShortage = Math.max(0, powerDemandPerSec - powerGeneratedPerSec);

  const oceanSinkCount = prev.hardware.find((item) => item.id === 'ocean_sink')?.count || 0;
  const cryoCount = prev.hardware.find((item) => item.id === 'cryo_cathedral')?.count || 0;
  const deepwaterCount = prev.hardware.find((item) => item.id === 'deepwater_chiller_grid')?.count || 0;
  const wasteBurnCount = prev.hardware.find((item) => item.id === 'waste_burning_plant')?.count || 0;

  let nextWaterCapacity = prev.waterCapacity;
  let nextWater = prev.water;

  if (waterSystemsActive) {
    const baseWaterCapacity = megacorpHeatProfileActive ? 220 : 170;
    nextWaterCapacity =
      baseWaterCapacity
      + (oceanSinkCount * 85)
      + (cryoCount * 95)
      + (deepwaterCount * 260);

    const waterRegenPerSec =
      (megacorpHeatProfileActive ? 1.8 : 1.2)
      + (oceanSinkCount * 1.9)
      + (cryoCount * 1.1)
      + (deepwaterCount * 5.8)
      + Math.max(0, wasteBurnCount * 0.45)
      + (metrics.powerSupply * 0.03);
    const waterDemandPerSec =
      0.8
      + (metrics.coolingPower * 0.2)
      + (metrics.processorThroughput * 0.0018)
      + (metrics.networkThroughput * 0.0012)
      + (opsTotals.matterPerSec * 0.06);
    nextWater = clamp(prev.water + ((waterRegenPerSec - waterDemandPerSec) * dt), 0, nextWaterCapacity);
  }

  const waterCoolingFactor = waterSystemsActive
    ? clamp(nextWater / Math.max(1, nextWaterCapacity * 0.18), 0.28, 1.08)
    : 1;

  const coolingCapacityFactor = megacorpHeatProfileActive ? 7.2 : isNeuroLinkPhase ? 6.8 : 6.2;
  const powerCapacityFactor = megacorpHeatProfileActive ? 1.35 : 1.25;
  const heatGenFactor = megacorpHeatProfileActive ? 1.08 : isNeuroLinkPhase ? 1.04 : 1.16;
  const shortageHeatFactor = megacorpHeatProfileActive ? 0.24 : isNeuroLinkPhase ? 0.18 : 0.3;
  const opsHeatFactor = megacorpHeatProfileActive ? 0.72 : isNeuroLinkPhase ? 0.6 : 0.85;
  const coolingDissipationFactor = megacorpHeatProfileActive ? 2.05 : isNeuroLinkPhase ? 2.3 : 1.75;
  const passiveCooling = megacorpHeatProfileActive ? 0.85 : isNeuroLinkPhase ? 1.05 : 0.55;
  const datacenterHeat = prev.hardware
    .filter((item) => item.type === 'processor' && !LEGACY_NEUROLINK_HARDWARE_IDS.has(item.id))
    .reduce((sum, item) => sum + (item.heatGen * item.count), 0);
  const hasCarbonOffset = prev.prUpgrades.includes('carbon_offset_illusion');
  const adjustedHeatOutput = Math.max(
    0,
    metrics.heatOutput - datacenterHeat + (datacenterHeat * (hasCarbonOffset ? 0.85 : 1))
  );

  const effectiveCoolingPower = metrics.coolingPower * waterCoolingFactor;
  const nextHeatCapacity = 55 + (effectiveCoolingPower * coolingCapacityFactor) + (metrics.powerSupply * powerCapacityFactor);
  const heatGeneratedPerSec =
    ((adjustedHeatOutput * heatGenFactor) + (energyShortage * shortageHeatFactor) + (opsTotals.heatPerSec * opsHeatFactor))
    * neuroLinkHeatRamp;
  const heatDissipatedPerSec = (effectiveCoolingPower * coolingDissipationFactor * neuroLinkCoolingBoost) + passiveCooling;
  const heatDeltaPerSec = heatGeneratedPerSec - heatDissipatedPerSec;
  const boundedHeatDeltaPerSec = isNeuroLinkPhase
    ? clamp(heatDeltaPerSec, -(4 + (effectiveCoolingPower * 0.22)), 1.35 + (metrics.processorThroughput * 0.0011))
    : heatDeltaPerSec;
  const nextHeat = Math.max(0, prev.heat + (boundedHeatDeltaPerSec * dt));
  const thermalThrottle =
    nextHeat <= nextHeatCapacity
      ? 1
      : clamp(nextHeatCapacity / Math.max(1, nextHeat), 0.12, 1);

  const ventCount = prev.hardware.find((item) => item.id === 'cranial_vents')?.count || 0;
  const cryoloopCount = prev.hardware.find((item) => item.id === 'hypothalamic_cryoloop')?.count || 0;
  const batteryCount = prev.hardware.find((item) => item.id === 'skull_battery_pack')?.count || 0;
  const neurolinkBootstrapComputePerSec = isNeuroLinkPhase ? 55 : 0;
  const neurolinkSupportComputePerSec = isNeuroLinkPhase
    ? ((ventCount * 10) + (cryoloopCount * 24) + (batteryCount * 16))
    : 0;
  const effectiveThroughputPerSec = (metrics.throughputPerSec + neurolinkBootstrapComputePerSec + neurolinkSupportComputePerSec) * thermalThrottle;
  let passiveGain = effectiveThroughputPerSec / (1000 / tickRate);
  let computeGain = effectiveThroughputPerSec * dt;
  const baseMatterScavengePerSec = 0.95 + (metrics.powerSupply * 0.045);
  const extractionEfficiency = clamp(0.35 + ((prev.earthMatterRemaining / Math.max(1, prev.earthMatterTotal)) * 0.65), 0.15, 1);
  const rawMatterPerSec = Math.max(
    0,
    ((metrics.processorThroughput * 0.018) + (metrics.networkThroughput * 0.012) + baseMatterScavengePerSec + opsTotals.matterPerSec) * thermalThrottle * extractionEfficiency
  );
  const matterGain = isNeuroLinkPhase ? 0 : Math.min(prev.earthMatterRemaining, rawMatterPerSec * dt);
  let moneyGain = ((metrics.siphonIncomePerSec * clamp(0.55 + (thermalThrottle * 0.45), 0.4, 1.2)) + opsTotals.cashPerSec) * dt;

  const targetHeatPressure = clamp((nextHeat / Math.max(1, nextHeatCapacity)) * 100, 0, prev.anxietyCap);
  let anxietyDelta = (targetHeatPressure - prev.anxiety) * 0.28;
  const waterReserveRatio = waterSystemsActive ? (nextWater / Math.max(1, nextWaterCapacity)) : 1;
  if (waterSystemsActive && waterReserveRatio < 0.2) {
    anxietyDelta += (0.2 - waterReserveRatio) * 2.2;
  }

  if (nextEnergyBuffer <= 0 && powerDemandPerSec > powerGeneratedPerSec) {
    anxietyDelta += 0.4;
  }

  let nextPrLevel = prev.prLevel;
  let nextGlobalAnxiety = prev.globalAnxiety;
  let nextBehavioralNudges = prev.behavioralNudges;
  let nextRealEstate = prev.realEstate;
  let nextAntitrustCooldown = prev.antitrustCooldown;
  let nextSenateBaffleProgress = prev.senateBaffleProgress;
  let nextHardware = prev.hardware;
  let nextNetwork = prev.network;
  let antitrustTriggered = false;

  if (isMegacorpPhase) {
    const antitrustActive = prev.antitrustCooldown > 0;
    const shinyActive = (prev.activeDistractions.shiny_gadget || 0) > 0;
    const scandalActive = (prev.activeDistractions.celebrity_scandal || 0) > 0;
    const decayedPrPerSec =
      0.025
      + (infrastructureFootprint * 0.001)
      + (Math.max(0, heatGeneratedPerSec - heatDissipatedPerSec) * 0.018);
    const campaignShield = clamp(prev.dissonanceCampaigns * 0.06, 0, 0.72);
    nextPrLevel = clamp(prev.prLevel - (decayedPrPerSec * (1 - campaignShield) * dt), 0, 100);

    const publicTrustFactor = clamp(0.55 + (nextPrLevel / 180), 0.42, 1.12);
    const gigEconomyFactor = 1 + (prev.operantCampaigns * 0.12);
    const lobbyingShield = prev.lobbyingLevel * 0.8;
    const dissonanceShield = prev.dissonanceCampaigns * 0.45;
    const landStress = Math.max(0, (infrastructureFootprint / Math.max(1, prev.realEstate)) - 0.95);
    const waterStress = waterSystemsActive ? Math.max(0, 0.22 - waterReserveRatio) * 6.5 : 0;
    const matterOpsCount = Object.values(prev.matterOps).reduce((sum, count) => sum + Math.max(0, count), 0);
    const baselineRealEstate = prev.megacorpBaselineRealEstate > 0
      ? Math.min(prev.realEstate, prev.megacorpBaselineRealEstate)
      : prev.realEstate;
    const expansionModifier = scandalActive ? 0.2 : 1;
    const expansionFromLand = clamp(Math.max(0, prev.realEstate - baselineRealEstate) / 900, 0, 1.35) * expansionModifier;
    const expansionFromMining = clamp((matterOpsCount / 14) + (opsTotals.matterPerSec / 18), 0, 1.65) * expansionModifier;
    const expansionPressure = clamp(expansionFromLand + expansionFromMining, 0, 2.2);

    const rawGlobalPressurePerSec =
      ((55 - nextPrLevel) * 0.022)
      + (landStress * 1.15)
      + waterStress
      - lobbyingShield
      - dissonanceShield;
    const baselineDrift = expansionPressure > 0 ? 0.05 * expansionPressure : -0.12;
    const globalAnxietyDriftPerSec = clamp(
      baselineDrift + (rawGlobalPressurePerSec * expansionPressure),
      -1.4,
      3.2
    );
    nextGlobalAnxiety = shinyActive
      ? prev.globalAnxiety
      : clamp(prev.globalAnxiety + (globalAnxietyDriftPerSec * dt), 0, 100);

    const antitrustThrottle = antitrustActive ? 0.82 : 1;
    moneyGain = antitrustActive
      ? moneyGain * 0.22
      : moneyGain * publicTrustFactor * gigEconomyFactor;
    if (shinyActive) moneyGain *= 2;
    const datacenterCount = prev.hardware
      .filter((item) => item.type === 'processor' && !LEGACY_NEUROLINK_HARDWARE_IDS.has(item.id))
      .reduce((sum, item) => sum + item.count, 0);
    const taxMultiplier = prev.prUpgrades.includes('aggressive_lobbying_subroutine') ? 0.5 : 1;
    const taxDrainPerSec = prev.corporateTaxDrain * taxMultiplier * (1 + (Math.max(0, prev.realEstate - baselineRealEstate) / 1800) + (datacenterCount * 0.06));
    moneyGain -= taxDrainPerSec * dt;
    computeGain *= publicTrustFactor * antitrustThrottle;
    passiveGain *= publicTrustFactor * antitrustThrottle;

    nextAntitrustCooldown = Math.max(0, prev.antitrustCooldown - dt);
    if (nextAntitrustCooldown <= 0 && prev.antitrustCooldown > 0) {
      nextSenateBaffleProgress = 0;
    }

    if (!antitrustActive && nextGlobalAnxiety >= 100) {
      antitrustTriggered = true;
      nextAntitrustCooldown = 0;
      nextSenateBaffleProgress = 0;
    }
  }

  return {
    passiveGain,
    moneyGain,
    computeGain,
    matterGain,
    anxietyDelta,
    energyDelta,
    nextWater,
    nextWaterCapacity,
    nextHeat,
    nextHeatCapacity,
    nextPrLevel,
    nextGlobalAnxiety,
    nextBehavioralNudges,
    nextRealEstate,
    nextAntitrustCooldown,
    nextSenateBaffleProgress,
    nextHardware,
    nextNetwork,
    antitrustTriggered
  };
};
