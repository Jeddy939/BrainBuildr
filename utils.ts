
import { AcademicEra } from './types';

const SMOOTH_PHRASES = [
    "Set a baseline: one concept, one example.",
    "Small steps build stable memory traces.",
    "Repeat the definition out loud once.",
    "Link the term to a practical scenario.",
    "Learning starts with retrieval, not rereading."
];

const SKIMMER_PHRASES = [
    "Check variable definitions before answering.",
    "Distinguish correlation from causation early.",
    "Name the design before critiquing results.",
    "Use one study to anchor each topic.",
    "Turn key terms into quick flash prompts."
];

const UNDERGRAD_PHRASES = [
    "State the IV and DV before interpretation.",
    "Reliability and validity are not interchangeable.",
    "Control confounds, then evaluate conclusions.",
    "Explain findings with evidence, not intuition.",
    "Use retrieval practice under timed conditions."
];

const ASCENDED_PHRASES = [
    "Compare methods by internal and external validity.",
    "Evaluate claims through design quality first.",
    "High quality evidence survives replication.",
    "Strong answers justify every inference.",
    "Think like an examiner: define, apply, evaluate."
];

export function getFlavorText(era: AcademicEra): string {
    const phraseGroups = [
        SMOOTH_PHRASES,
        SKIMMER_PHRASES,
        UNDERGRAD_PHRASES,
        ASCENDED_PHRASES
    ];
    
    // Clamp era to the last available index to prevent undefined errors if era exceeds 3
    const safeEra = Math.min(Math.max(0, era), phraseGroups.length - 1);
    const phrases = phraseGroups[safeEra] || ASCENDED_PHRASES;
    
    return phrases[Math.floor(Math.random() * phrases.length)];
}

export function formatNumber(num: number): string {
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    if (abs >= 1000000) return sign + (abs / 1000000).toFixed(2) + 'M';
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + 'k';
    return sign + Math.floor(abs).toString();
}
