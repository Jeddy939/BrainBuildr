import { GamePhase, GameState } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type SpaceMetrics = {
  mappedPercent: number;
  routeLoad: number;
  relayCapacity: number;
  latencyRatio: number;
  throughputMultiplier: number;
  matterPerSec: number;
  computePerSec: number;
  moneyPerSec: number;
  heatPerSec: number;
  hostilityDriftPerSec: number;
};

const EMPTY_METRICS: SpaceMetrics = {
  mappedPercent: 0,
  routeLoad: 0,
  relayCapacity: 1,
  latencyRatio: 1,
  throughputMultiplier: 0,
  matterPerSec: 0,
  computePerSec: 0,
  moneyPerSec: 0,
  heatPerSec: 0,
  hostilityDriftPerSec: 0
};

export const getSpaceMetrics = (state: GameState): SpaceMetrics => {
  if (!state.isCyborg || (state.phase !== GamePhase.Space && state.phase !== GamePhase.Rival)) return EMPTY_METRICS;

  const mappedPercent = clamp((state.spaceSectorsScanned / Math.max(1, state.spaceSectorsTotal)) * 100, 0, 100);
  const routeLoad = state.spaceGalaxiesClaimed * 1.2;
  const relayCapacity = 3 + (state.spaceRelays * 2.6);
  const latencyRatio = clamp(routeLoad / Math.max(1, relayCapacity), 0.35, 3.8);
  const latencyPenalty = 1 / Math.max(0.35, latencyRatio);
  const hostilityPenalty = clamp(1 - (state.spaceHostileSignals / 165), 0.25, 1);
  const rivalPressure = state.phase === GamePhase.Rival ? 1.18 : 1;

  const baseMatterPerSec = state.spaceGalaxiesClaimed * (5 + (state.spaceRelays * 0.24));
  const throughputMultiplier = latencyPenalty * hostilityPenalty;
  const matterPerSec = baseMatterPerSec * throughputMultiplier * rivalPressure;
  const computePerSec = matterPerSec * (2.8 + Math.log10(state.spaceGalaxiesClaimed + 1));
  const moneyPerSec = matterPerSec * (4.6 + (state.spaceRelays * 0.06));
  const heatPerSec = (state.spaceGalaxiesClaimed * 0.16) + (state.spaceRelays * 0.11) + Math.max(0, latencyRatio - 1) * 0.9;
  const hostilityDriftPerSec =
    (0.08 + (state.spaceGalaxiesClaimed * 0.007) + Math.max(0, latencyRatio - 1.05) * 0.75)
    - (state.spaceRelays * 0.018)
    + (state.phase === GamePhase.Rival ? 0.25 : 0);

  return {
    mappedPercent,
    routeLoad,
    relayCapacity,
    latencyRatio,
    throughputMultiplier,
    matterPerSec,
    computePerSec,
    moneyPerSec,
    heatPerSec,
    hostilityDriftPerSec
  };
};

export type SpaceTickResult = {
  computeGain: number;
  moneyGain: number;
  matterGain: number;
  heatDelta: number;
  nextHostileSignals: number;
  nextRaidCooldown: number;
  nextGalaxiesClaimed: number;
  spaceRaidTriggered: boolean;
};

export const simulateSpacePhaseTick = (prev: GameState, dt: number): SpaceTickResult => {
  if (!prev.isCyborg || (prev.phase !== GamePhase.Space && prev.phase !== GamePhase.Rival)) {
    return {
      computeGain: 0,
      moneyGain: 0,
      matterGain: 0,
      heatDelta: 0,
      nextHostileSignals: prev.spaceHostileSignals,
      nextRaidCooldown: prev.spaceRaidCooldown,
      nextGalaxiesClaimed: prev.spaceGalaxiesClaimed,
      spaceRaidTriggered: false
    };
  }

  const metrics = getSpaceMetrics(prev);
  const computeGain = metrics.computePerSec * dt;
  const moneyGain = metrics.moneyPerSec * dt;
  const matterGain = metrics.matterPerSec * dt;
  const heatDelta = metrics.heatPerSec * dt;

  let nextRaidCooldown = Math.max(0, prev.spaceRaidCooldown - dt);
  let nextHostileSignals = clamp(prev.spaceHostileSignals + (metrics.hostilityDriftPerSec * dt), 0, 100);
  let nextGalaxiesClaimed = prev.spaceGalaxiesClaimed;
  let spaceRaidTriggered = false;

  if (nextHostileSignals >= 100 && nextRaidCooldown <= 0) {
    spaceRaidTriggered = true;
    nextHostileSignals = 64;
    nextRaidCooldown = 140;
    nextGalaxiesClaimed = Math.max(0, prev.spaceGalaxiesClaimed - Math.max(1, Math.floor(prev.spaceGalaxiesClaimed * 0.1)));
  }

  return {
    computeGain,
    moneyGain,
    matterGain,
    heatDelta,
    nextHostileSignals,
    nextRaidCooldown,
    nextGalaxiesClaimed,
    spaceRaidTriggered
  };
};

