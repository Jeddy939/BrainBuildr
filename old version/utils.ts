
import { AcademicEra } from './types';

const SMOOTH_PHRASES = [
    "Head empty. Only vibes.",
    "Thinking hurts.",
    "Why is the sun loud?",
    "I require snack.",
    "Blinking manually now."
];

const SKIMMER_PHRASES = [
    "I read a headline about this once.",
    "My horoscope says I shouldn't work today.",
    "Is mercury in retrograde?",
    "I feel like I'm forgetting something important.",
    "Does caffeine count as a meal?"
];

const UNDERGRAD_PHRASES = [
    "Correlation does not equal causation.",
    "Technically, that's a logical fallacy.",
    "I'm diagnosing my friends with disorders.",
    "Sleep is for the weak (and the sane).",
    "Just one more citation..."
];

const ASCENDED_PHRASES = [
    "Time is a flat circle of billable hours.",
    "We are all just electrified meat.",
    "The economy is a collective hallucination.",
    "I have gazed into the abyss, and it sent me a calendar invite.",
    "Consciousness was a mistake."
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
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}
