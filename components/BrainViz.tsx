import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GamePhase, RegionName } from '../types';

type DigitalInfrastructureSnapshot = {
  processorCount: number;
  coolingCount: number;
  powerCount: number;
  siliconCount: number;
  ventCount: number;
  batteryCount: number;
  dataCenterCount: number;
  powerPlantCount: number;
  networkCount: number;
  matterOpsCount: number;
  totalStructures: number;
};

interface BrainVizProps {
  unlockedRegions: Record<RegionName, boolean>;
  anxiety: number;
  isBreakdown: boolean;
  totalNeurons: number;
  isCyborg: boolean;
  phase: GamePhase;
  clickFxLevel: number;
  upgradeIntensity: number;
  intelligenceScore: number;
  infrastructure: DigitalInfrastructureSnapshot;
}

type RegionDiagram = {
  id: RegionName;
  path: string;
  color: string;
  sulci: string[];
  labelLines: string[];
  labelPos: [number, number];
  labelAnchor?: 'start' | 'end' | 'middle';
  callout: string;
  dot: [number, number];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const cerebrumOutline =
  'M148 302 C136 214 166 154 226 118 C302 72 418 56 532 72 C650 88 746 132 798 206 C836 262 838 336 806 392 C766 462 676 520 548 548 C420 576 286 564 206 516 C162 490 154 424 148 302 Z';

const cerebellumOutline =
  'M640 404 C718 390 808 416 846 470 C846 524 798 566 716 576 C630 578 558 542 544 486 C546 438 586 412 640 404 Z';

const stemOutline =
  'M500 452 C530 460 552 484 560 514 C570 566 554 624 522 658 C492 666 470 654 454 630 C436 600 430 562 438 528 C446 492 470 464 500 452 Z';
const neuroLinkProfilePath =
  'M640 654 L538 654 C526 598 520 548 488 548 L398 548 C356 548 324 532 316 498 C308 464 322 438 324 414 C326 392 312 378 292 370 C274 362 266 346 268 330 C270 312 286 298 294 284 C300 272 296 258 282 248 C264 236 256 220 260 204 C264 186 282 170 302 146 C342 100 406 82 494 84 C602 86 684 150 714 244 C744 338 720 442 662 512 C640 540 632 590 640 654 Z';

const regions: RegionDiagram[] = [
  {
    id: RegionName.Frontal,
    path: 'M172 334 C164 266 186 210 236 170 C292 126 358 112 426 120 C412 170 414 228 424 280 C374 308 328 344 302 386 C246 382 200 362 176 342 Z',
    color: '#15b8ec',
    sulci: [
      'M206 246 C232 220 264 208 300 210 C332 212 356 228 368 248',
      'M188 282 C222 260 262 250 306 252 C340 254 362 268 374 286',
      'M214 320 C246 300 290 292 332 294 C358 296 376 306 388 324',
      'M240 356 C268 340 304 334 336 336 C352 338 366 346 374 356',
      'M224 226 C210 238 204 254 208 270',
      'M280 208 C298 220 306 236 304 252',
      'M320 232 C340 246 350 264 348 280',
      'M256 336 C270 348 278 360 276 374'
    ],
    labelLines: ['FRONTAL', 'LOBE'],
    labelPos: [34, 208],
    callout: 'M292 206 L216 206 L152 206',
    dot: [292, 206]
  },
  {
    id: RegionName.Parietal,
    path: 'M426 120 C514 102 606 110 680 150 C724 178 746 206 750 246 C708 260 670 286 640 316 C572 294 500 286 424 290 C414 232 412 170 426 120 Z',
    color: '#f4df59',
    sulci: [
      'M446 170 C488 150 540 146 588 154 C626 160 662 174 686 196',
      'M444 208 C492 184 550 182 608 192 C648 200 678 214 698 236',
      'M454 246 C510 226 568 226 622 236 C658 244 686 256 706 276',
      'M480 282 C528 270 578 270 622 278 C652 284 676 296 692 314',
      'M512 162 C506 182 510 204 528 224',
      'M560 170 C560 196 574 218 598 236',
      'M610 186 C618 206 636 226 660 240',
      'M540 260 C554 276 562 294 560 314'
    ],
    labelLines: ['PARIETAL', 'LOBE'],
    labelPos: [756, 156],
    callout: 'M594 222 L676 158 L746 158',
    dot: [594, 222]
  },
  {
    id: RegionName.Occipital,
    path: 'M750 246 C790 278 806 312 806 350 C798 394 770 434 714 458 C684 438 660 404 640 366 C650 344 648 330 640 316 C670 286 708 260 750 246 Z',
    color: '#ff6156',
    sulci: [
      'M662 286 C694 288 724 302 744 324 C758 338 766 356 766 374',
      'M656 320 C694 324 728 340 750 364 C762 378 768 394 766 410',
      'M654 354 C690 360 722 374 742 396 C754 410 760 424 758 438',
      'M682 274 C674 296 676 318 688 338',
      'M720 302 C716 322 722 344 738 360',
      'M700 386 C706 404 718 418 736 428'
    ],
    labelLines: ['OCCIPITAL', 'LOBE'],
    labelPos: [870, 300],
    callout: 'M716 304 L786 304 L860 304',
    dot: [716, 304]
  },
  {
    id: RegionName.Temporal,
    path: 'M302 386 C330 344 374 308 424 280 C500 286 572 294 640 316 C650 350 652 380 640 410 C584 450 498 474 416 472 C370 460 330 434 302 386 Z',
    color: '#f3a9cd',
    sulci: [
      'M332 392 C366 372 414 366 462 368 C500 370 534 382 558 402',
      'M334 420 C378 404 432 400 486 404 C522 406 552 416 576 432',
      'M360 446 C406 434 458 430 510 432 C544 434 570 442 590 454',
      'M394 468 C432 460 476 458 522 460 C550 462 574 470 592 480',
      'M318 404 C316 424 322 442 336 456',
      'M366 374 C372 394 386 410 404 420',
      'M452 370 C454 392 468 410 492 424',
      'M530 390 C536 408 548 422 566 434'
    ],
    labelLines: ['TEMPORAL', 'LOBE'],
    labelPos: [52, 434],
    callout: 'M382 432 L256 432 L176 432',
    dot: [382, 432]
  },
  {
    id: RegionName.Limbic,
    path: 'M426 286 C474 262 540 262 596 286 C596 322 578 352 548 376 C494 382 452 366 422 338 C416 314 416 298 426 286 Z',
    color: '#9ad467',
    sulci: [
      'M434 306 C468 292 508 294 548 310',
      'M438 330 C470 322 508 324 542 336',
      'M452 352 C482 350 514 354 540 366',
      'M468 296 C462 316 468 334 484 348',
      'M520 300 C524 318 518 338 504 352'
    ],
    labelLines: ['LIMBIC', 'SYSTEM'],
    labelPos: [760, 360],
    callout: 'M464 352 L600 352 L748 352',
    dot: [464, 352]
  },
  {
    id: RegionName.Cerebellum,
    path: cerebellumOutline,
    color: '#cf8a44',
    sulci: [
      'M572 452 C626 430 706 434 780 462',
      'M562 474 C622 450 706 454 784 486',
      'M560 498 C620 482 702 486 776 512',
      'M562 522 C620 512 694 516 760 538',
      'M576 546 C626 542 688 546 742 562',
      'M616 448 C600 462 596 478 604 494',
      'M666 442 C654 458 654 476 666 492',
      'M716 448 C706 464 708 482 722 496',
      'M758 462 C750 478 754 496 770 510'
    ],
    labelLines: ['CEREBELLUM'],
    labelPos: [872, 548],
    callout: 'M716 544 L790 544 L862 544',
    dot: [716, 544]
  },
  {
    id: RegionName.Brainstem,
    path: stemOutline,
    color: '#b87434',
    sulci: [
      'M458 542 C478 548 498 560 514 576',
      'M454 570 C474 580 492 594 506 612',
      'M470 526 C484 534 498 546 510 560',
      'M482 598 C494 610 500 624 500 638',
      'M506 544 C520 554 530 568 534 584'
    ],
    labelLines: ['BRAINSTEM'],
    labelPos: [336, 604],
    callout: 'M566 512 L520 566 L446 598',
    dot: [566, 512]
  }
];

const getOrbitPoint = (centerX: number, centerY: number, radius: number, index: number, total: number, phase = 0) => {
  const angle = ((Math.PI * 2) / Math.max(1, total)) * index + phase;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
};

export default function BrainViz({
  unlockedRegions,
  anxiety,
  isBreakdown,
  totalNeurons,
  isCyborg,
  phase,
  clickFxLevel,
  upgradeIntensity,
  intelligenceScore,
  infrastructure
}: BrainVizProps) {
  const unlockedCount = Object.values(unlockedRegions).filter(Boolean).length;
  const pulseScale = clamp(1.007 + upgradeIntensity * 0.024 + clickFxLevel * 0.0015, 1.008, 1.05);
  const pulseDuration = clamp(3.2 - (upgradeIntensity * 1.2) - (clickFxLevel * 0.05), 1.45, 3.2);
  const sulciOpacity = clamp(0.75 + (upgradeIntensity * 0.25), 0.75, 1);
  const power = Math.max(0, Math.log10(totalNeurons + 1));
  const fxNodes = Math.min(10, 2 + Math.floor(clickFxLevel / 2));

  const chipScale = clamp(1 + (infrastructure.totalStructures / 80), 1, 1.9);
  const dataCenterNodes = Math.min(42, infrastructure.dataCenterCount);
  const powerPlantNodes = Math.min(30, infrastructure.powerPlantCount);
  const siliconNodes = Math.min(38, infrastructure.siliconCount);
  const ventNodes = Math.min(26, infrastructure.ventCount);
  const batteryNodes = Math.min(26, infrastructure.batteryCount);
  const neuroLinkCoreScale = clamp(0.72 + ((infrastructure.siliconCount + infrastructure.ventCount + infrastructure.batteryCount) / 90), 0.72, 1.5);
  const neurolinkCoreTotal = infrastructure.siliconCount + infrastructure.coolingCount + infrastructure.batteryCount;
  const neuroLinkReplacementProgress = clamp(neurolinkCoreTotal / 200, 0, 1);
  const biologicalLayerOpacity = clamp(1 - (neuroLinkReplacementProgress * 0.9), 0.06, 1);
  const digitalLayerOpacity = clamp(0.12 + (neuroLinkReplacementProgress * 0.88), 0.12, 1);
  const neuroLinkBrainScale = 0.92;
  const neuroLinkOffsetX = 500 * (1 - neuroLinkBrainScale);
  const neuroLinkOffsetY = 360 * (1 - neuroLinkBrainScale);
  const nodePulseDuration = clamp(2.8 - (chipScale - 1), 1.4, 2.8);

  return (
    <div className="relative h-full w-full overflow-hidden select-none pointer-events-none">
      <style>
        {`
          @keyframes organicThrob {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(var(--pulse-scale, 1.018)); }
          }
          @keyframes scanSweep {
            0% { transform: translateX(-280px); opacity: 0; }
            30% { opacity: 0.55; }
            100% { transform: translateX(280px); opacity: 0; }
          }
        `}
      </style>

      {!isCyborg ? (
        <svg
          viewBox="0 0 1000 720"
          className="relative z-10 mx-auto h-[94%] w-[94%] max-h-[540px] max-w-[860px]"
          aria-label="Brain region diagram"
        >
          <defs>
            <pattern id="locked-region-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#414b59" />
              <path d="M0 8 L8 0" stroke="#5c6879" strokeWidth="1.1" />
            </pattern>
            <filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.22" />
            </filter>
            <radialGradient id="live-core-glow" cx="48%" cy="42%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.27)" />
              <stop offset="58%" stopColor="rgba(56,189,248,0.04)" />
              <stop offset="100%" stopColor="rgba(11,13,18,0)" />
            </radialGradient>
          </defs>

          <ellipse cx="500" cy="350" rx="370" ry="238" fill="url(#live-core-glow)" />

          <g
            className="organic-brain"
            style={{
              animationName: 'organicThrob',
              animationDuration: `${pulseDuration}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              transformOrigin: '500px 360px',
              ['--pulse-scale' as string]: pulseScale
            }}
            filter="url(#diagram-shadow)"
          >
            <path d={cerebrumOutline} fill="none" stroke="#0b0d12" strokeWidth="6.5" strokeLinejoin="round" />
            <path d={cerebellumOutline} fill="none" stroke="#0b0d12" strokeWidth="6.5" strokeLinejoin="round" />
            <path d={stemOutline} fill="none" stroke="#0b0d12" strokeWidth="6.5" strokeLinejoin="round" />

            {regions.map((region) => {
              const unlocked = unlockedRegions[region.id];
              const fill = unlocked ? (isBreakdown ? '#6d1f1f' : region.color) : 'url(#locked-region-pattern)';

              return (
                <g key={region.id}>
                  <path d={region.path} fill={fill} stroke="#0b0d12" strokeWidth="4.4" strokeLinejoin="round">
                    {unlocked && clickFxLevel > 0 && (
                      <animate
                        attributeName="opacity"
                        values={`0.88;${clamp(0.95 + upgradeIntensity * 0.08, 0.92, 1)};0.88`}
                        dur={`${clamp(3.1 - clickFxLevel * 0.06, 1.35, 3.1)}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  {region.sulci.map((line, index) => (
                    <path
                      key={`${region.id}-${line}`}
                      d={line}
                      stroke="#0b0d12"
                      strokeWidth={index % 3 === 0 ? 2.9 : 2.3}
                      fill="none"
                      strokeLinecap="round"
                      opacity={unlocked ? sulciOpacity : 0.3}
                    />
                  ))}

                  {unlocked && (
                    <g>
                      <path d={region.callout} stroke="#0b0d12" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                      <circle cx={region.dot[0]} cy={region.dot[1]} r="4.8" fill="#0b0d12" />
                      <text
                        x={region.labelPos[0]}
                        y={region.labelPos[1]}
                        fill="#f8fafc"
                        stroke="#0b0d12"
                        strokeWidth="1.1"
                        paintOrder="stroke"
                        fontFamily="'Trebuchet MS','Segoe UI',sans-serif"
                        fontSize="14"
                        fontWeight={900}
                        letterSpacing="0.55px"
                        textAnchor={region.labelAnchor ?? 'start'}
                      >
                        {region.labelLines.map((line, index) => (
                          <tspan key={`${region.id}-${line}`} x={region.labelPos[0]} dy={index === 0 ? 0 : 17}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {!isBreakdown && clickFxLevel > 0 && Array.from({ length: fxNodes }).map((_, index) => {
            const point = getOrbitPoint(500, 354, 180 + ((index % 3) * 38), index, fxNodes, Math.PI / 5);
            return (
              <circle key={`fx-${index}`} cx={point.x} cy={point.y} r={3 + (index % 3)} fill={index % 2 === 0 ? '#38bdf8' : '#fbbf24'}>
                <animate attributeName="opacity" values="0;0.85;0" dur={`${2.4 + (index * 0.2)}s`} begin={`${index * 0.18}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          <g transform="translate(26,22)">
            <rect width="204" height="56" rx="8" fill="rgba(11,13,18,0.76)" />
            <text x="12" y="22" fill="#d6e2ee" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="12" fontWeight={700} letterSpacing="0.8px">
              REGIONS ACTIVE
            </text>
            <text x="12" y="43" fill="#ffffff" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="17" fontWeight={800}>
              {unlockedCount}/7
            </text>
          </g>
          <g transform="translate(770,22)">
            <rect width="206" height="56" rx="8" fill="rgba(11,13,18,0.76)" />
            <text x="12" y="22" fill="#d6e2ee" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="12" fontWeight={700} letterSpacing="0.8px">
              COGNITIVE LOAD
            </text>
            <text x="12" y="43" fill="#ffffff" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="17" fontWeight={800}>
              LV {power.toFixed(1)} · IQ {intelligenceScore}
            </text>
          </g>
        </svg>
      ) : phase === GamePhase.NeuroLink ? (
        <svg
          viewBox="0 0 1000 720"
          className="relative z-10 mx-auto h-[94%] w-[94%] max-h-[540px] max-w-[860px]"
          aria-label="NeuroLink replacement map"
        >
          <defs>
            <radialGradient id="neuro-transition-bg" cx="50%" cy="44%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
              <stop offset="58%" stopColor="rgba(17,24,39,0.92)" />
              <stop offset="100%" stopColor="rgba(3,7,18,0.96)" />
            </radialGradient>
            <pattern id="digital-grid-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="rgba(2,6,23,0.88)" />
              <path d="M0 0 H16 M0 0 V16" stroke="rgba(56,189,248,0.16)" strokeWidth="0.7" />
            </pattern>
            <radialGradient id="replacement-glow" cx="48%" cy="42%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.42)" />
              <stop offset="66%" stopColor="rgba(34,211,238,0.08)" />
              <stop offset="100%" stopColor="rgba(10,13,19,0)" />
            </radialGradient>
            <clipPath id="neurolink-brain-clip">
              <path d={cerebrumOutline} />
              <path d={cerebellumOutline} />
              <path d={stemOutline} />
            </clipPath>
            <filter id="replacement-glow-filter" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5.5" floodColor="#22d3ee" floodOpacity="0.4" />
            </filter>
            <filter id="diagram-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.22" />
            </filter>
          </defs>

          <image
            href="assets/human-profile-silhouette.jpg?v=20260311b"
            x="0"
            y="0"
            width="1000"
            height="720"
            preserveAspectRatio="none"
          />
          <rect x="0" y="0" width="1000" height="720" fill="rgba(2,6,23,0.34)" />
          <ellipse cx="500" cy="350" rx="350" ry="230" fill="url(#neuro-transition-bg)" />
          <ellipse cx="500" cy="350" rx="332" ry="218" fill="url(#replacement-glow)" opacity={digitalLayerOpacity} />

          <g transform={`translate(${neuroLinkOffsetX} ${neuroLinkOffsetY}) scale(${neuroLinkBrainScale})`}>
            <g
              style={{
                animationName: 'organicThrob',
                animationDuration: `${pulseDuration}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                transformOrigin: '500px 360px',
                ['--pulse-scale' as string]: pulseScale
              }}
              filter="url(#diagram-shadow)"
            >
              {regions.map((region) => {
                const unlocked = unlockedRegions[region.id];
                const baseFill = unlocked ? region.color : '#39475b';
                return (
                  <g key={`neurolink-${region.id}`}>
                    <path
                      d={region.path}
                      fill={baseFill}
                      opacity={biologicalLayerOpacity * (unlocked ? 1 : 0.75)}
                      stroke="#0b0d12"
                      strokeWidth="4"
                      strokeLinejoin="round"
                    />
                    <path
                      d={region.path}
                      fill="#091222"
                      opacity={unlocked ? digitalLayerOpacity : digitalLayerOpacity * 0.55}
                      stroke="rgba(56,189,248,0.24)"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    {region.sulci.map((line, index) => (
                      <path
                        key={`neurolink-sulci-${region.id}-${index}`}
                        d={line}
                        stroke={unlocked ? 'rgba(186,230,253,0.75)' : 'rgba(148,163,184,0.34)'}
                        strokeWidth={index % 3 === 0 ? 2.2 : 1.7}
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.38 + (digitalLayerOpacity * 0.55)}
                      />
                    ))}
                  </g>
                );
              })}

              <path d={cerebrumOutline} fill="none" stroke="#0b0d12" strokeWidth="6" strokeLinejoin="round" />
              <path d={cerebellumOutline} fill="none" stroke="#0b0d12" strokeWidth="6" strokeLinejoin="round" />
              <path d={stemOutline} fill="none" stroke="#0b0d12" strokeWidth="6" strokeLinejoin="round" />
            </g>

            <g clipPath="url(#neurolink-brain-clip)" opacity={digitalLayerOpacity} filter="url(#replacement-glow-filter)">
              <rect x="120" y="108" width="760" height="560" fill="url(#digital-grid-pattern)" />
              {Array.from({ length: 13 }).map((_, index) => {
                const y = 164 + (index * 32);
                const wave = (index % 2 === 0 ? 1 : -1) * 16;
                return (
                  <path
                    key={`trace-${index}`}
                    d={`M148 ${y} C260 ${y - 20} 356 ${y + wave} 488 ${y - 8} C608 ${y - 18} 722 ${y + 14} 848 ${y}`}
                    stroke="rgba(56,189,248,0.5)"
                    strokeWidth="1.4"
                    fill="none"
                  />
                );
              })}

              {Array.from({ length: siliconNodes }).map((_, index) => {
                const point = getOrbitPoint(504, 340, 86 + ((index % 4) * 16), index, Math.max(1, siliconNodes), Math.PI / 7);
                return (
                  <g key={`chip-${index}`}>
                    <rect x={point.x - 5.2} y={point.y - 5.2} width="10.4" height="10.4" rx="2" fill="#f43f5e" />
                    <rect x={point.x - 3.2} y={point.y - 1.2} width="6.4" height="1.3" fill="#fee2e2" />
                  </g>
                );
              })}

              {Array.from({ length: ventNodes }).map((_, index) => {
                const point = getOrbitPoint(504, 340, 146 + ((index % 3) * 12), index, Math.max(1, ventNodes), -Math.PI / 6);
                return (
                  <path
                    key={`vent-${index}`}
                    d={`M${point.x - 5.5} ${point.y + 4.5} L${point.x} ${point.y - 4.5} L${point.x + 5.5} ${point.y + 4.5}`}
                    fill="#38bdf8"
                    opacity="0.88"
                  />
                );
              })}

              {Array.from({ length: batteryNodes }).map((_, index) => {
                const point = getOrbitPoint(504, 340, 198 + ((index % 3) * 11), index, Math.max(1, batteryNodes), Math.PI / 10);
                return (
                  <g key={`battery-${index}`}>
                    <rect x={point.x - 4.8} y={point.y - 6.4} width="9.6" height="12.8" rx="2" fill="#fbbf24" stroke="#92400e" strokeWidth="0.8" />
                    <rect x={point.x - 1.4} y={point.y - 8} width="2.8" height="1.8" rx="0.7" fill="#fde68a" />
                  </g>
                );
              })}
            </g>
          </g>

          <g transform="translate(26,22)">
            <rect width="286" height="106" rx="8" fill="rgba(11,13,18,0.8)" />
            <text x="12" y="24" fill="#e2e8f0" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="12" fontWeight={700} letterSpacing="0.7px">
              BIO-TO-DIGITAL REPLACEMENT
            </text>
            <text x="12" y="46" fill="#f8fafc" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="13" fontWeight={700}>
              Replacement {Math.round(neuroLinkReplacementProgress * 100)}%
            </text>
            <text x="12" y="68" fill="#67e8f9" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="12" fontWeight={700}>
              Neurochips {infrastructure.siliconCount} - Cooling {infrastructure.coolingCount} - Batteries {infrastructure.batteryCount}
            </text>
            <text x="12" y="89" fill="#cbd5e1" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="11" fontWeight={700}>
              Full replacement at 200 core upgrades
            </text>
          </g>
        </svg>
      ) : (
        <svg
          viewBox="0 0 1000 720"
          className="relative z-10 mx-auto h-[94%] w-[94%] max-h-[540px] max-w-[860px]"
          aria-label="NeuroLink infrastructure map"
        >
          <defs>
            <radialGradient id="neuro-globe" cx="48%" cy="45%">
              <stop offset="0%" stopColor="#72b8f5" />
              <stop offset="58%" stopColor="#1f4c8a" />
              <stop offset="100%" stopColor="#0e2440" />
            </radialGradient>
            <radialGradient id="neuro-halo" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.4)" />
              <stop offset="60%" stopColor="rgba(56,189,248,0.08)" />
              <stop offset="100%" stopColor="rgba(10,13,19,0)" />
            </radialGradient>
            <filter id="chip-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.2" floodColor="#38bdf8" floodOpacity="0.52" />
            </filter>
          </defs>

          <rect x="0" y="0" width="1000" height="720" fill="rgba(8,13,22,0.72)" />
          <ellipse cx="500" cy="360" rx="280" ry="220" fill="url(#neuro-halo)" />
          <circle cx="500" cy="360" r="194" fill="url(#neuro-globe)" stroke="#111827" strokeWidth="5" />
          <g opacity="0.5" fill="#84cc16" stroke="#0f172a" strokeWidth="1.2">
            <path d="M422 258 C448 236 494 230 532 242 C560 252 564 272 548 290 C522 316 458 326 426 304 C410 294 410 272 422 258 Z" />
            <path d="M586 286 C612 268 644 268 668 282 C690 296 694 326 676 346 C654 370 614 376 592 360 C568 344 566 306 586 286 Z" />
            <path d="M378 348 C402 332 438 336 458 356 C474 374 466 402 440 416 C412 430 376 426 360 404 C346 384 356 360 378 348 Z" />
            <path d="M540 386 C564 372 596 372 620 386 C644 400 650 430 632 452 C610 478 568 486 544 470 C520 454 518 412 540 386 Z" />
          </g>
          <g opacity="0.32" stroke="#fecaca" strokeWidth="1.5" fill="none">
            <ellipse cx="500" cy="360" rx="176" ry="58" />
            <ellipse cx="500" cy="360" rx="176" ry="126" />
            <ellipse cx="500" cy="360" rx="102" ry="186" />
            <path d="M306 360 H694" />
            <path d="M500 166 V554" />
          </g>

          <g style={{ animation: `scanSweep ${clamp(3.5 - chipScale, 1.5, 3.5)}s linear infinite` }}>
            <rect x="420" y="202" width="16" height="316" fill="rgba(56,189,248,0.22)" />
          </g>

          {Array.from({ length: dataCenterNodes }).map((_, index) => {
            const point = getOrbitPoint(500, 360, 82 + ((index % 4) * 19), index, Math.max(1, dataCenterNodes), Math.PI / 7);
            return (
              <g key={`datacenter-${index}`}>
                <rect x={point.x - 5} y={point.y - 5} width="10" height="10" rx="1.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
                <rect x={point.x - 3.2} y={point.y - 1} width="6.4" height="1.3" fill="#38bdf8" />
                <rect x={point.x - 3.2} y={point.y + 1.6} width="6.4" height="1.3" fill="#38bdf8" />
              </g>
            );
          })}
          {Array.from({ length: powerPlantNodes }).map((_, index) => {
            const point = getOrbitPoint(500, 360, 104 + ((index % 3) * 24), index, Math.max(1, powerPlantNodes), -Math.PI / 9);
            return (
              <g key={`powerplant-${index}`}>
                <path d={`M${point.x - 4} ${point.y + 4} L${point.x} ${point.y - 6} L${point.x + 4} ${point.y + 4} Z`} fill="#f59e0b" stroke="#422006" strokeWidth="0.8" />
                <rect x={point.x - 3} y={point.y + 3.8} width="6" height="2.8" fill="#78350f" />
              </g>
            );
          })}

          <g filter="url(#chip-glow)">
            <rect
              x={500 - (66 * chipScale)}
              y={360 - (40 * chipScale)}
              width={132 * chipScale}
              height={80 * chipScale}
              rx={11}
              fill="#111827"
              stroke="#f87171"
              strokeWidth={3.5}
            >
              <animate attributeName="opacity" values="0.86;1;0.86" dur={`${nodePulseDuration}s`} repeatCount="indefinite" />
            </rect>
            <text
              x="500"
              y="356"
              textAnchor="middle"
              fill="#fecaca"
              fontFamily="'Trebuchet MS','Segoe UI',sans-serif"
              fontSize={14 + chipScale * 2.5}
              fontWeight={800}
              letterSpacing="0.7px"
            >
              NEUROLINK CORE
            </text>
            <text
              x="500"
              y="380"
              textAnchor="middle"
              fill="#fef2f2"
              fontFamily="'Trebuchet MS','Segoe UI',sans-serif"
              fontSize={12 + chipScale}
              fontWeight={700}
            >
              IQ {intelligenceScore}
            </text>
          </g>

          <g transform="translate(26,22)">
            <rect width="236" height="114" rx="8" fill="rgba(11,13,18,0.78)" />
            <text x="12" y="24" fill="#e2e8f0" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="12" fontWeight={700} letterSpacing="0.7px">
              INFRASTRUCTURE SCALE
            </text>
            <text x="12" y="46" fill="#f8fafc" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="15" fontWeight={800}>
              Total Sites: {infrastructure.totalStructures}
            </text>
            <text x="12" y="66" fill="#fecaca" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="11" fontWeight={700}>
              Proc {infrastructure.processorCount} · Net {infrastructure.networkCount}
            </text>
            <text x="12" y="84" fill="#bae6fd" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="11" fontWeight={700}>
              Cool {infrastructure.coolingCount} · Power {infrastructure.powerCount}
            </text>
            <text x="12" y="102" fill="#fef08a" fontFamily="'Trebuchet MS','Segoe UI',sans-serif" fontSize="11" fontWeight={700}>
              DC {infrastructure.dataCenterCount} · Plants {infrastructure.powerPlantCount}
            </text>
          </g>
        </svg>
      )}

      {isBreakdown && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/66 backdrop-blur-sm">
          <div className="rounded-xl border-4 border-red-600 bg-black p-6 text-center font-mono text-2xl font-bold text-red-500 shadow-[0_0_55px_rgba(220,38,38,0.55)]">
            <AlertTriangle size={48} className="mx-auto mb-2" />
            {isCyborg ? 'THERMAL CRITICAL' : 'SYSTEM FAILURE'}
            <br />
            <span className="text-sm">REBOOTING...</span>
          </div>
        </div>
      )}

      {anxiety > 80 && !isBreakdown && !isCyborg && <div className="absolute inset-0 bg-red-600/8" />}
    </div>
  );
}
