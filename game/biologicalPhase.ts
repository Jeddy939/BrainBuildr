import { NEUROLINK } from '../constants';
import { GameState } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export type BiologicalTickResult = {
  passiveGain: number;
  anxietyDelta: number;
};

export const simulateBiologicalPhaseTick = (prev: GameState, tickRate: number): BiologicalTickResult => {
  const passiveMultiplier = prev.digitalBrainUnlocked ? NEUROLINK.passiveMultiplier : 1;
  const biologicalDrag = clamp(1 / Math.pow(1 + prev.totalNeurons / 220000, 0.35), 0.42, 1);
  const passiveGain = (prev.passiveGen * passiveMultiplier * biologicalDrag) / (1000 / tickRate);
  const anxietyDelta = 0.02 + (prev.academicEra * 0.05) - (0.09 / Math.max(0.2, prev.anxietyResist));
  return { passiveGain, anxietyDelta };
};

