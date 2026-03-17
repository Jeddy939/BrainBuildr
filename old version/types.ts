
export enum RegionName {
    Brainstem = 'brainstem',
    Cerebellum = 'cerebellum',
    Limbic = 'limbic',
    Temporal = 'temporal',
    Parietal = 'parietal',
    Frontal = 'frontal',
    Occipital = 'occipital'
}

export interface Region {
    id: RegionName;
    name: string;
    description: string;
    level: number;
    unlocked: boolean;
    unlockCost: number; // Neurons
    examPassesRequired: number; // Number of correct quiz answers needed to unlock
}

export interface Upgrade {
    id: string;
    region: RegionName;
    name: string;
    description: string;
    cost: number;
    currency: 'neurons' | 'dopamine' | 'serotonin';
    effectType: 'click' | 'passive' | 'anxiety_cap' | 'anxiety_resist' | 'dopamine_gain' | 'serotonin_gain' | 'prestige';
    value: number;
    purchased: boolean;
    reqRegionLevel: number;
    maxPurchases?: number;
    count?: number;
}

export interface Hardware {
    id: string;
    name: string;
    type: 'processor' | 'cooling';
    baseCost: number;
    effect: number; // FLOPS for processor, Cooling amount for cooling
    heatGen: number; // Heat generated per tick (only for processors)
    count: number;
    description: string;
}

export interface NetworkDevice {
    id: string;
    name: string;
    baseCost: number;
    effect: number; // FLOPS per tick
    count: number;
    description: string;
}

export interface Stock {
    id: string;
    ticker: string;
    name: string;
    description: string;
    fundamentals: string; // Detailed satire
    riskDescription: string; // Why is this risky?
    currentPrice: number;
    minPrice: number;
    maxPrice: number;
    owned: number;
    history: number[]; // Last 50 price points for graph
    volatility: number; // How wildly it swings
    trend: number; // Bias towards up or down
    riskLevel: 'Safe' | 'Moderate' | 'Risky' | 'YOLO';
    news: string; // Latest flavor text affecting price
}

export enum AcademicEra {
    SmoothBrain = 0,   // Proto
    WikiSkimmer = 1,   // Basic
    Undergrad = 2,     // Theory
    Ascended = 3       // Meta/Horror
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    era: AcademicEra;
    explanation: string;
}

export interface LogMessage {
    id: string;
    text: string;
    timestamp: number;
    type: 'info' | 'alert' | 'epiphany' | 'panic' | 'breakdown' | 'market' | 'system';
}

export interface GameState {
    // Currencies
    neurons: number;
    dopamine: number; // Spendable currency now
    serotonin: number; // Spendable currency now
    
    // Stats
    totalNeurons: number;
    clickPower: number;
    passiveGen: number;
    computeMultiplier: number; // Phase 2 multiplier
    isCyborg: boolean; // Phase 2 flag
    
    // Mental Health
    anxiety: number; // 0-100 (Becomes Heat in Phase 2)
    anxietyResist: number; // Multiplier (lower is better)
    breakdownActive: boolean;
    breakdownTimer: number; // Seconds remaining
    
    // Progression
    regions: Record<RegionName, Region>;
    hardware: Hardware[]; // Phase 2 Buildings
    network: NetworkDevice[]; // Phase 2 Hive Mind
    academicEra: AcademicEra;
    correctQuizAnswers: number; // Lifetime correct answers (for gating)
    
    // Market
    stocks: Stock[];
    lastStockUpdate: number;
    marketSentiment: 'bear' | 'bull' | 'crab';
    
    lastTick: number;
}

export const INITIAL_STATE: GameState = {
    neurons: 0,
    dopamine: 0,
    serotonin: 0,
    totalNeurons: 0,
    clickPower: 1,
    passiveGen: 0,
    computeMultiplier: 1,
    isCyborg: false,
    anxiety: 0,
    anxietyResist: 1,
    breakdownActive: false,
    breakdownTimer: 0,
    regions: {
        [RegionName.Brainstem]: { 
            id: RegionName.Brainstem, 
            name: 'Brainstem', 
            description: 'Basic survival functions. Try not to die.', 
            level: 1, 
            unlocked: true, 
            unlockCost: 0, 
            examPassesRequired: 0 
        },
        [RegionName.Cerebellum]: { 
            id: RegionName.Cerebellum, 
            name: 'Cerebellum', 
            description: 'Motor control and procedural memory. It is like riding a bike.', 
            level: 0, 
            unlocked: false, 
            unlockCost: 250, 
            examPassesRequired: 1 
        },
        [RegionName.Limbic]: { 
            id: RegionName.Limbic, 
            name: 'Limbic System', 
            description: 'Emotions and hormones. Welcome to crying.', 
            level: 0, 
            unlocked: false, 
            unlockCost: 1000, 
            examPassesRequired: 3 
        },
        [RegionName.Temporal]: {
            id: RegionName.Temporal,
            name: 'Temporal Lobe',
            description: 'Memory and Audio. You can now hold a grudge forever.',
            level: 0,
            unlocked: false,
            unlockCost: 2500, 
            examPassesRequired: 5
        },
        [RegionName.Parietal]: {
            id: RegionName.Parietal,
            name: 'Parietal Lobe',
            description: 'Sensory and Spatial. You now know where your limbs are.',
            level: 0, 
            unlocked: false, 
            unlockCost: 5000, 
            examPassesRequired: 8
        },
        [RegionName.Occipital]: { 
            id: RegionName.Occipital, 
            name: 'Occipital Lobe', 
            description: 'Visual processing. You can now see your failures clearly.', 
            level: 0, 
            unlocked: false, 
            unlockCost: 10000, 
            examPassesRequired: 12 
        },
        [RegionName.Frontal]: { 
            id: RegionName.Frontal, 
            name: 'Frontal Cortex', 
            description: 'Executive function. Anxiety is now a feature.', 
            level: 0, 
            unlocked: false, 
            unlockCost: 25000, 
            examPassesRequired: 15 
        }
    },
    hardware: [],
    network: [],
    academicEra: AcademicEra.SmoothBrain,
    correctQuizAnswers: 0,
    stocks: [], // Will be populated from constants
    lastStockUpdate: Date.now(),
    marketSentiment: 'crab',
    lastTick: Date.now(),
};
