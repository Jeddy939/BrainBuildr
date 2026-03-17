# Balance Evaluation: NeuroLink and Megacorp Phases

## Scope
This analysis is based on the current formulas and constants in `game/cyborgPhase.ts`, `constants.ts`, and `App.tsx`.

## Key progression gates
- NeuroLink activation requires all upgrades maxed, lifetime neurons >= 90,000, and spendable neurons >= 50,000. (`NEUROLINK.threshold`, `NEUROLINK.cost`)
- NeuroLink phase objective is to max the 4 core in-skull hardware items to 50 each.
- Entering Megacorp is currently gated by the "Brain full" prompt (all 4 core items at cap), then a manual expansion choice.
- Network unlock requires 10 research + exam; mining unlock requires 15 research + exam, but mining is auto-enabled when entering Megacorp.

## NeuroLink economy and expected pace
### 1) Cost curve (core hardware to cap 50 each)
Using NeuroLink pricing rules:
- Neurochip (`silicon_cortex`): ~5.45M compute to reach 50.
- Cranial Vents: ~8.31M compute to reach 50.
- Hypothalamic Cryoloop: ~25.45M compute to reach 50.
- Skull Battery Pack: ~17.96M compute to reach 50.
- Total to hard-cap all 4: **~57.17M compute**.

This is a very steep geometric ramp, but throughput grows strongly and remains stable due to generous clamping and bootstrap bonuses.

### 2) Throughput dynamics
At 50/50/50/50 core counts (no network):
- Processor throughput: 1,200.
- Throughput limiter can hit cap (1.2) with strong cooling/power ratios.
- Base compute throughput: ~1,440/s.
- NeuroLink support throughput bonus: `55 + 10*vents + 24*cryoloops + 16*batteries` = **2,555/s**.
- Effective total: **~3,995 compute/s** before thermal throttle.

### 3) Thermal behavior in NeuroLink
NeuroLink uses:
- a 3-minute heat ramp (0.52 -> 1.00),
- an early cooling boost (1.18 -> 1.00),
- and bounded heat delta clamps.

This makes NeuroLink forgiving early and relatively stable if players buy even moderate cooling/power. Net effect: the phase is mostly a growth grind, not a survival puzzle.

## Transition to Megacorp
On expansion:
- Starter acreage is adjusted to at least `ceil(infrastructure * 1.22) + 120`.
- Typical capped-core transition gives ~438 acres baseline.
- Global anxiety is reset to 0, PR capped at 88, mining enabled.

This creates a strong clean-slate launch and delays public-pressure risk for a short window.

## Megacorp balance and expected progression
## 1) Early Megacorp (no datacenter online)
Important behavior: the "Megacorp heat profile" (water systems + harsher land/power coupling) does **not** activate until at least one non-legacy processor is online.

With capped legacy core + moderate network (10/5/2/1), modeled values are:
- Throughput ~9,840/s.
- Siphon income raw ~46,012.5/s.
- Money gain after trust factor and tax: ~47,762/s.
- Heat delta strongly negative (cooling far exceeds heat), so thermal throttle is effectively 1.

This means early Megacorp can be a "safe snowball" period if the player built network during NeuroLink.

## 2) Datacenter adoption
Megacorp price scaling for non-legacy hardware is extreme:
- Metro Data Center base money in Megacorp: 28,000 * 4,600 = 128.8M (before growth).
- Continental Data Center base money: 420,000 * 4,600 = 1.932B.

Given ~47k/s cashflow, first Metro payback is roughly 45 minutes (ignoring growth and alternatives). So datacenters are expensive but reachable in a single session if network is built first.

## 3) Public pressure loop (PR/anxiety)
The real Megacorp constraint is social stability, not thermal:
- PR decays per second as `0.025 + 0.001 * infrastructure + heat-overflow term`.
- With infrastructure around 268, PR decay is about **0.293/s** before shielding.
- PR can drop from ~88 to near 0 in ~5 minutes if player does not actively run campaigns/quiz/distractions.

Global anxiety drift depends heavily on expansion pressure and PR:
- At high PR and low expansion, drift can remain negative (anxiety naturally falls).
- As PR collapses and expansion/matter-ops increase, drift turns strongly positive and can approach +1/s scale.

Additionally, buying real estate directly spikes anxiety (`+0.22` per acre unless scandal is active, then +0.044), creating abrupt risk jumps.

## 4) Revolt consequence
When global anxiety reaches 100 in Megacorp:
- revolt flag triggers,
- non-legacy processors, network, and matter ops are cut to 85%,
- earth subjugation drops by 10%,
- then bailout flow can restore cash.

This is meaningful punishment, but because early economy is very strong, players can often rebuild quickly unless repeated revolts chain.

## Notable balance findings
1. **NeuroLink support throughput is very high** relative to core compute costs, making the phase mostly deterministic grind once power/cooling are solved.
2. **Power demand floor interaction is generous**: large negative power draw from batteries can drive computed demand down to the base floor, pushing stability ratios to max.
3. **Megacorp has a "safe pre-datacenter" window** where old heat profile and high inherited infrastructure can let players accumulate large cash with low risk.
4. **PR decay is extremely aggressive** and appears to be the primary intended brake.
5. **Antitrust cooldown path appears underused** in current tick flow (antitrust throttle branch depends on `antitrustCooldown > 0`, but revolt trigger path does not set it during trigger), so some antitrust-related balancing knobs are not currently doing much.

## Projected player path (typical efficient run)
1. Enter NeuroLink -> buy core cooling/power early -> scale Neurochip -> pass network unlock exam.
2. Buy network in NeuroLink (compute-funded) to pre-seed future cashflow.
3. Cap all 4 core items (50 each) -> trigger Brain Full -> enter Megacorp.
4. Enjoy short high-margin cash window (before PR collapse).
5. Spend nudges on campaigns/distractions to hold PR/anxiety while buying acreage and first Metro DC.
6. Transition into mixed datacenter + mining scaling; if PR management is ignored, expect revolt cycles.

## Practical tuning suggestions
- Reduce NeuroLink support bonus coefficients (especially cryoloop + battery terms), or gate part behind network unlock.
- Raise base power demand floor or reduce negative-power efficiency from battery stacks.
- In Megacorp, activate a lighter version of land/water coupling before first datacenter so pre-DC snowball is less free.
- Soften PR decay scaling with infrastructure (`0.001 * footprint`), or make campaign efficacy scale better into late game.
- Either wire antitrust cooldown path fully into revolt sequence or remove dead branches to avoid misleading balancing assumptions.
