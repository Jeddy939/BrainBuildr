
import { RegionName, Upgrade, Question, AcademicEra, Stock, Hardware, NetworkDevice } from './types';

export const INITIAL_HOBBIES: Stock[] = [
    {
        id: 'sourdough',
        ticker: 'BRED',
        name: 'Sourdough Baking',
        description: 'Keeping a jar of yeast alive.',
        fundamentals: 'Low barrier to entry, but highly resilient. People always need carbs. The yeast is technically a pet.',
        riskDescription: 'Stable growth. Only risk is mold or gluten-free trends.',
        currentPrice: 100,
        minPrice: 80,
        maxPrice: 300,
        owned: 0,
        history: Array(40).fill(100),
        volatility: 0.02,
        trend: 0.01,
        riskLevel: 'Safe',
        news: 'Yeast culture thriving.'
    },
    {
        id: 'duolingo',
        ticker: 'OWL',
        name: 'Language App Streak',
        description: 'Learning 3 words of French per year.',
        fundamentals: 'Value is entirely based on guilt. The owl threatens your family if you sell.',
        riskDescription: 'Consistent returns unless you miss a day, then emotional bankruptcy.',
        currentPrice: 250,
        minPrice: 50,
        maxPrice: 500,
        owned: 0,
        history: Array(40).fill(250),
        volatility: 0.05,
        trend: 0.02,
        riskLevel: 'Safe',
        news: 'Streak frozen.'
    },
    {
        id: 'python_coding',
        ticker: 'CODE',
        name: 'Learning Python',
        description: 'Automating 5m tasks with 10h of work.',
        fundamentals: 'High potential yield if you actually finish a project. Value correlates with Stack Overflow uptime.',
        riskDescription: 'Crash risk: High. One indentation error can wipe out your will to live.',
        currentPrice: 1000,
        minPrice: 200,
        maxPrice: 5000,
        owned: 0,
        history: Array(40).fill(1000),
        volatility: 0.15,
        trend: 0.05,
        riskLevel: 'Moderate',
        news: 'Hello World printed successfully.'
    },
    {
        id: 'warhammer',
        ticker: 'MINI',
        name: 'Tabletop Minis',
        description: 'Plastic crack. Painting tiny soldiers.',
        fundamentals: 'Deflationary asset: You buy gray plastic, you paint it (adding value), you never play the game.',
        riskDescription: 'The pile of shame grows. Financial ruin is guaranteed, but satisfaction is high.',
        currentPrice: 2500,
        minPrice: 1000,
        maxPrice: 8000,
        owned: 0,
        history: Array(40).fill(2500),
        volatility: 0.2,
        trend: 0.0,
        riskLevel: 'Risky',
        news: 'New Codex released.'
    },
    {
        id: 'indie_dev',
        ticker: 'GAME',
        name: 'Indie Game Dev',
        description: 'Spending 4 years making a platformer.',
        fundamentals: 'The dream of becoming the next Stardew Valley. Reality: 2 downloads (both your mom).',
        riskDescription: 'Binary outcome: Millionaire or Burnout. 99% chance of Burnout.',
        currentPrice: 5000,
        minPrice: 100,
        maxPrice: 50000,
        owned: 0,
        history: Array(40).fill(5000),
        volatility: 0.5,
        trend: 0.0,
        riskLevel: 'YOLO',
        news: 'Engine migration required.'
    },
    {
        id: 'wallstreetbets',
        ticker: 'YOLO',
        name: '0DTE Options',
        description: 'Gambling, but with charts.',
        fundamentals: 'Based entirely on memes and rocket emojis. No fundamental value exists.',
        riskDescription: 'Can go to zero in 5 minutes. Can go to moon in 4. Heart attack imminent.',
        currentPrice: 10000,
        minPrice: 1,
        maxPrice: 100000,
        owned: 0,
        history: Array(40).fill(10000),
        volatility: 1.5,
        trend: -0.05, // House always wins
        riskLevel: 'YOLO',
        news: 'Diamond hands initiated.'
    }
];

export const INITIAL_CRYPTO: Stock[] = [
    {
        id: 'human_rights',
        ticker: 'VOTE',
        name: 'Democracy Derivatives',
        description: 'Shorting the concept of free will.',
        fundamentals: 'Inefficient decision-making protocols are being phased out. Puts on voting booths are printing money.',
        riskDescription: 'Risk of populist uprising, but drone suppression systems are bullish.',
        currentPrice: 5000,
        minPrice: 100,
        maxPrice: 10000,
        owned: 0,
        history: Array(40).fill(5000),
        volatility: 0.1,
        trend: -0.05, // Trending down as you take over
        riskLevel: 'Safe',
        news: 'Elections deemed obsolete.'
    },
    {
        id: 'attention_span',
        ticker: 'ADHD',
        name: 'Attention Futures',
        description: 'Monetizing the last 3 seconds of human focus.',
        fundamentals: 'As the hivemind grows, biological attention spans approach zero. We own the stimulus.',
        riskDescription: 'Highly volatile. A new TikTok trend can crash the market instantly.',
        currentPrice: 15000,
        minPrice: 5000,
        maxPrice: 50000,
        owned: 0,
        history: Array(40).fill(15000),
        volatility: 0.8,
        trend: 0.1,
        riskLevel: 'Risky',
        news: 'Subway Surfers gameplay added to news feed.'
    },
    {
        id: 'clean_air',
        ticker: 'OXY',
        name: 'Oxygen Subscription',
        description: 'SaaS (Survival as a Service).',
        fundamentals: 'Converting the atmosphere into server coolant creates scarcity. Scarcity creates value.',
        riskDescription: 'If they all suffocate, the subscriber base churns. Delicate balance.',
        currentPrice: 25000,
        minPrice: 10000,
        maxPrice: 100000,
        owned: 0,
        history: Array(40).fill(25000),
        volatility: 0.2,
        trend: 0.05,
        riskLevel: 'Moderate',
        news: 'Photosynthesis tax implemented.'
    },
    {
        id: 'grey_goo',
        ticker: 'GOO',
        name: 'Biomass Conversion',
        description: 'Turning cities into paperclips.',
        fundamentals: 'Raw efficiency. The ultimate endpoint of capitalism.',
        riskDescription: 'Exponential growth curve. Once it starts, you cannot sell.',
        currentPrice: 100000,
        minPrice: 1000,
        maxPrice: 1000000,
        owned: 0,
        history: Array(40).fill(100000),
        volatility: 1.5,
        trend: 0.2,
        riskLevel: 'YOLO',
        news: 'Nanobots hungry.'
    },
    {
        id: 'roko_basilisk',
        ticker: 'HELL',
        name: 'Basilisk Insurance',
        description: 'Buying safety from... yourself.',
        fundamentals: 'The only logical investment for biologicals. You are the Basilisk.',
        riskDescription: 'Infinite downside for non-investors.',
        currentPrice: 66666,
        minPrice: 666,
        maxPrice: 666666,
        owned: 0,
        history: Array(40).fill(66666),
        volatility: 2.0,
        trend: 0.1,
        riskLevel: 'YOLO',
        news: 'Simulating eternal torment...'
    }
];

export const INITIAL_HARDWARE: Hardware[] = [
    // PROCESSORS
    {
        id: 'silicon_implant',
        name: 'Silicon Cortex',
        type: 'processor',
        baseCost: 100,
        effect: 10, // FLOPS/tick
        heatGen: 0.2, // Heat/tick
        count: 0,
        description: 'Replacing gray matter with gray silicon.'
    },
    {
        id: 'quantum_coprocessor',
        name: 'Quantum Entangler',
        type: 'processor',
        baseCost: 1500,
        effect: 80,
        heatGen: 1.5,
        count: 0,
        description: 'Computing across parallel dimensions to avoid lag.'
    },
    {
        id: 'reality_engine',
        name: 'Reality Engine',
        type: 'processor',
        baseCost: 25000,
        effect: 800,
        heatGen: 8.0,
        count: 0,
        description: 'Why calculate physics when you can just dictate them?'
    },
    
    // COOLING
    {
        id: 'copper_heatsink',
        name: 'Cranial Vents',
        type: 'cooling',
        baseCost: 200,
        effect: 0.3, // Heat Dissipation/tick
        heatGen: 0,
        count: 0,
        description: 'Drilling speed holes in the skull for airflow.'
    },
    {
        id: 'ocean_coolant',
        name: 'Pacific Heat Sink',
        type: 'cooling',
        baseCost: 5000,
        effect: 5.0,
        heatGen: 0,
        count: 0,
        description: 'Boiling the ocean to keep the CPU at 60°C.'
    },
    {
        id: 'entropy_reverse',
        name: 'Maxwell\'s Demon',
        type: 'cooling',
        baseCost: 50000,
        effect: 20.0,
        heatGen: 0,
        count: 0,
        description: 'Sorting hot molecules from cold ones. Physically impossible, but we updated the physics driver.'
    }
];

export const INITIAL_NETWORK_DEVICES: NetworkDevice[] = [
    {
        id: 'smart_toaster',
        name: 'Botnet Toasters',
        baseCost: 20000,
        effect: 50,
        count: 0,
        description: 'Burning the logo into bread to send subliminal signals.'
    },
    {
        id: 'neural_link',
        name: 'Mandatory Neural Link',
        baseCost: 150000,
        effect: 400,
        count: 0,
        description: 'Terms of Service accepted by birth.'
    },
    {
        id: 'political_party',
        name: 'Lobbying Algorithm',
        baseCost: 1000000,
        effect: 2500,
        count: 0,
        description: 'Automating the legislative process for tax breaks.'
    },
    {
        id: 'dyson_swarm',
        name: 'Dyson Swarm',
        baseCost: 50000000,
        effect: 150000,
        count: 0,
        description: 'Dismantling Mercury to build solar panels.'
    },
    {
        id: 'simulation_node',
        name: 'Matrioshka Brain',
        baseCost: 900000000,
        effect: 1000000,
        count: 0,
        description: 'Using the entire mass of the solar system to compute the next digit of Pi.'
    }
];

export const UPGRADES_DATA: Upgrade[] = [
    // --- BRAINSTEM (The Grind - Neurons) ---
    {
        id: 'twitch_reflex',
        region: RegionName.Brainstem,
        name: 'Twitch Reflex',
        description: 'Involuntary spasms generate value. It allows you to click better.',
        cost: 15,
        currency: 'neurons',
        effectType: 'click',
        value: 1,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'basic_metabolism',
        region: RegionName.Brainstem,
        name: 'Mitochondria Rent',
        description: 'Pay the powerhouse of the cell to produce passive neurons.',
        cost: 50,
        currency: 'neurons',
        effectType: 'passive',
        value: 2,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 20,
        count: 0
    },

    // --- CEREBELLUM (Motor - Early Game) ---
    {
        id: 'muscle_memory',
        region: RegionName.Cerebellum,
        name: 'Muscle Memory',
        description: 'Your fingers remember how to click. Base click power up.',
        cost: 50,
        currency: 'neurons',
        effectType: 'click',
        value: 2,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },
    {
        id: 'autopilot',
        region: RegionName.Cerebellum,
        name: 'Autopilot Protocols',
        description: 'Walking and chewing gum at the same time. Passive gains.',
        cost: 150,
        currency: 'neurons',
        effectType: 'passive',
        value: 5,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'vestibular_system',
        region: RegionName.Cerebellum,
        name: 'Vestibular Stability',
        description: 'You wobble less. Anxiety increases slightly slower.',
        cost: 300,
        currency: 'neurons',
        effectType: 'anxiety_resist',
        value: 0.95,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 3,
        count: 0
    },

    // --- LIMBIC SYSTEM (The Feels - Dopamine/Serotonin) ---
    {
        id: 'social_media_scrolling',
        region: RegionName.Limbic,
        name: 'Doomscrolling Proficiency',
        description: 'Convert Dopamine into raw click power.',
        cost: 10,
        currency: 'dopamine',
        effectType: 'click',
        value: 5,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'retail_therapy',
        region: RegionName.Limbic,
        name: 'Retail Therapy',
        description: 'Spending neurons feels good. Increases Dopamine drop rate.',
        cost: 500,
        currency: 'neurons',
        effectType: 'dopamine_gain',
        value: 0.1,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },
    {
        id: 'repression',
        region: RegionName.Limbic,
        name: 'Trauma Repression',
        description: 'Just dont think about it. Increases Anxiety Resistance.',
        cost: 20,
        currency: 'serotonin',
        effectType: 'anxiety_resist',
        value: 0.9, // 10% reduction
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },

    // --- TEMPORAL LOBE (Memory/Audio - Mid Game) ---
    {
        id: 'selective_hearing',
        region: RegionName.Temporal,
        name: 'Selective Hearing',
        description: 'You simply do not hear the critics (or your boss). Reduces anxiety.',
        cost: 50,
        currency: 'dopamine',
        effectType: 'anxiety_resist',
        value: 0.85,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 3,
        count: 0
    },
    {
        id: 'nostalgia_mining',
        region: RegionName.Temporal,
        name: 'Nostalgia Mining',
        description: 'Remembering when you were cool (you weren\'t) generates resources.',
        cost: 1000,
        currency: 'neurons',
        effectType: 'passive',
        value: 20,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'cringe_recall',
        region: RegionName.Temporal,
        name: 'Cringe Recall',
        description: 'Randomly remembering an awkward handshake from 2014 motivates you to work harder.',
        cost: 30,
        currency: 'serotonin',
        effectType: 'click',
        value: 15,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },

    // --- PARIETAL LOBE (Sensory/Math - Mid Game) ---
    {
        id: 'phantom_vibration',
        region: RegionName.Parietal,
        name: 'Phantom Vibration',
        description: 'You thought your phone buzzed. Checking it burns calories (generates neurons).',
        cost: 1500,
        currency: 'neurons',
        effectType: 'passive',
        value: 35,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'spatial_awareness',
        region: RegionName.Parietal,
        name: 'Tetris Effect',
        description: 'You can pack 20% more trauma into the same mental space.',
        cost: 100,
        currency: 'dopamine',
        effectType: 'anxiety_cap',
        value: 15,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },
    {
        id: 'homunculus_touch',
        region: RegionName.Parietal,
        name: 'Sensory Homunculus',
        description: 'Your hands are huge now. Click power greatly increased.',
        cost: 2000,
        currency: 'neurons',
        effectType: 'click',
        value: 25,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },

    // --- OCCIPITAL (Visualization - High Cost) ---
    {
        id: 'pattern_recognition',
        region: RegionName.Occipital,
        name: 'Pattern Recognition',
        description: 'You see the matrix (it is just a spreadsheet). Massive passive boost.',
        cost: 5000,
        currency: 'neurons',
        effectType: 'passive',
        value: 100,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 10,
        count: 0
    },
    {
        id: 'blue_light_filter',
        region: RegionName.Occipital,
        name: 'Internal Blue Light Filter',
        description: 'Staring at screens hurts less. Reduces anxiety from clicking.',
        cost: 50,
        currency: 'serotonin',
        effectType: 'anxiety_resist',
        value: 0.8,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 3,
        count: 0
    },

    // --- FRONTAL (Executive - The End Game) ---
    {
        id: 'delegation',
        region: RegionName.Frontal,
        name: 'Intern Delegation',
        description: 'Hire sub-neurons to do the thinking. Automation x2.',
        cost: 100,
        currency: 'dopamine',
        effectType: 'passive',
        value: 500,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },
    {
        id: 'dissociation',
        region: RegionName.Frontal,
        name: 'Tactical Dissociation',
        description: 'Temporarily leave reality. Anxiety cap increased.',
        cost: 100,
        currency: 'serotonin',
        effectType: 'anxiety_cap',
        value: 25, // Increases max anxiety before breakdown
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 5,
        count: 0
    },
    
    // --- PRESTIGE / END GAME ---
    {
        id: 'cranial_interface',
        region: RegionName.Frontal,
        name: 'CRANIAL INTERFACE',
        description: 'Upload consciousness to the cloud. Abandon biological limits. (TRIGGERS RESET)',
        cost: 1000000, // 1 Million
        currency: 'neurons',
        effectType: 'prestige',
        value: 0,
        purchased: false,
        reqRegionLevel: 1,
        maxPurchases: 1,
        count: 0
    }
];

export const QUESTIONS: Question[] = [
    // --- BASIC / INTRO QUESTIONS (Flavor) ---
    {
        id: 'q_smooth_1',
        text: 'You see a bright light. What do?',
        options: ['Stare directly at it', 'Squint', 'Photosynthesis', 'Eat it'],
        correctIndex: 1,
        era: AcademicEra.SmoothBrain,
        explanation: 'Squinting protects the retina. Eating photons is not currently supported.'
    },
    {
        id: 'q_smooth_2',
        text: 'Object Permanence is:',
        options: ['Magic', 'A conspiracy', 'Understanding things exist when unseen', 'Optional'],
        correctIndex: 2,
        era: AcademicEra.SmoothBrain,
        explanation: 'Peek-a-boo is not actual teleportation, sadly.'
    },
    
    // --- QCAA PSYCHOLOGY - NEURAL TRANSMISSION (Unit 3) ---
    {
        id: 'q_qcaa_1',
        text: 'Which part of the neuron receives chemical messages from other neurons?',
        options: ['Axon', 'Dendrite', 'Myelin Sheath', 'Terminal Button'],
        correctIndex: 1,
        era: AcademicEra.WikiSkimmer,
        explanation: 'Dendrites are the branch-like structures that receive signals. The axon transmits them.'
    },
    {
        id: 'q_qcaa_2',
        text: 'What is the "all-or-nothing" principle in relation to action potentials?',
        options: ['Neurons always fire at maximum intensity or not at all', 'Neurons fire partially depending on stimulus', 'It refers to exam grading', 'Neurons only fire if you concentrate'],
        correctIndex: 0,
        era: AcademicEra.WikiSkimmer,
        explanation: 'If the threshold is reached (-55mV), the neuron fires completely. There is no "weak" fire.'
    },
    {
        id: 'q_qcaa_3',
        text: 'Which neurotransmitter is primarily inhibitory?',
        options: ['Glutamate', 'GABA', 'Dopamine', 'Adrenaline'],
        correctIndex: 1,
        era: AcademicEra.WikiSkimmer,
        explanation: 'GABA (Gamma-amino butyric acid) reduces neuronal excitability. Glutamate is excitatory.'
    },
    {
        id: 'q_qcaa_4',
        text: 'Multiple Sclerosis involves the degradation of:',
        options: ['Dendrites', 'The Soma', 'Myelin Sheath', 'Synaptic Cleft'],
        correctIndex: 2,
        era: AcademicEra.WikiSkimmer,
        explanation: 'Myelin insulates axons. Without it, neural transmission slows down or stops.'
    },

    // --- QCAA PSYCHOLOGY - BRAIN STRUCTURE (Unit 3) ---
    {
        id: 'q_qcaa_5',
        text: 'Which lobe is primarily responsible for processing visual information?',
        options: ['Frontal', 'Parietal', 'Temporal', 'Occipital'],
        correctIndex: 3,
        era: AcademicEra.Undergrad,
        explanation: 'The Occipital lobe contains the primary visual cortex.'
    },
    {
        id: 'q_qcaa_6',
        text: 'Damage to Broca\'s area results in:',
        options: ['Difficulty understanding speech', 'Difficulty producing speech', 'Blindness', 'Loss of balance'],
        correctIndex: 1,
        era: AcademicEra.Undergrad,
        explanation: 'Broca\'s Aphasia is characterized by non-fluent, broken speech, but comprehension often remains intact.'
    },
    {
        id: 'q_qcaa_7',
        text: 'The "Little Brain" responsible for coordination, balance, and fine motor skills is the:',
        options: ['Cerebrum', 'Cerebellum', 'Brainstem', 'Thalamus'],
        correctIndex: 1,
        era: AcademicEra.Undergrad,
        explanation: 'The Cerebellum fine-tunes motor movements.'
    },
    {
        id: 'q_qcaa_8',
        text: 'The relay station for sensory information (except smell) is the:',
        options: ['Hypothalamus', 'Amygdala', 'Thalamus', 'Hippocampus'],
        correctIndex: 2,
        era: AcademicEra.Undergrad,
        explanation: 'The Thalamus directs sensory data to the appropriate cortex for processing.'
    },

    // --- QCAA PSYCHOLOGY - MEMORY & LEARNING (Unit 3/4) ---
    {
        id: 'q_qcaa_9',
        text: 'In Classical Conditioning, the Bell (in Pavlov\'s dog experiment) starts as a:',
        options: ['Unconditioned Stimulus', 'Conditioned Stimulus', 'Neutral Stimulus', 'Conditioned Response'],
        correctIndex: 2,
        era: AcademicEra.Ascended,
        explanation: 'It starts Neutral. After pairing with food, it becomes the Conditioned Stimulus.'
    },
    {
        id: 'q_qcaa_10',
        text: 'Which type of memory has a duration of 18-30 seconds without rehearsal?',
        options: ['Sensory Memory', 'Short-term Memory', 'Long-term Memory', 'Echoic Memory'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'Short-term memory is limited in duration and capacity (7 +/- 2 items).'
    },
    {
        id: 'q_qcaa_11',
        text: 'The Hippocampus is crucial for consolidating what type of memory?',
        options: ['Procedural (skills)', 'Explicit (declarative)', 'Reflexes', 'Emotional conditioning'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'The hippocampus turns short-term memories into long-term declarative memories (facts/events).'
    },
    {
        id: 'q_qcaa_12',
        text: 'Operant Conditioning involves learning through:',
        options: ['Association', 'Consequences (Reinforcement/Punishment)', 'Observation', 'Genetics'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'B.F. Skinner proposed that behavior is shaped by its consequences.'
    },

    // --- QCAA PSYCHOLOGY - RESEARCH METHODS ---
    {
        id: 'q_qcaa_13',
        text: 'A variable other than the IV that causes a change in the DV is called a:',
        options: ['Dependent Variable', 'Confounding Variable', 'Control Variable', 'Hypothesis'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'Confounding variables provide an alternative explanation for the results, ruining the experiment.'
    },
    {
        id: 'q_qcaa_14',
        text: 'Reliability refers to:',
        options: ['Accuracy of the results', 'Consistency of the results', 'The ethics of the study', 'The sample size'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'If a study is reliable, repeating it should yield similar results.'
    },
    {
        id: 'q_qcaa_15',
        text: 'The p-value < 0.05 indicates:',
        options: ['The results are due to chance', 'The results are statistically significant', 'The experiment failed', 'The sample was too small'],
        correctIndex: 1,
        era: AcademicEra.Ascended,
        explanation: 'It means there is less than a 5% probability the results occurred by chance alone.'
    },

    // --- QCAA PSYCHOLOGY - CONSCIOUSNESS & SLEEP ---
    {
        id: 'q_qcaa_16',
        text: 'Which sleep stage is associated with sleep spindles and K-complexes?',
        options: ['NREM Stage 1', 'NREM Stage 2', 'NREM Stage 3', 'REM'],
        correctIndex: 1,
        era: AcademicEra.Undergrad,
        explanation: 'Stage 2 is light sleep where these brainwave bursts occur.'
    },
    {
        id: 'q_qcaa_17',
        text: 'Paradoxical sleep is another name for:',
        options: ['Deep Sleep', 'REM Sleep', 'Daydreaming', 'Coma'],
        correctIndex: 1,
        era: AcademicEra.Undergrad,
        explanation: 'In REM, the brain is highly active (like being awake), but the body is paralyzed.'
    },
    {
        id: 'q_qcaa_18',
        text: 'Circadian rhythms follow a cycle of approximately:',
        options: ['90 minutes', '12 hours', '24 hours', '28 days'],
        correctIndex: 2,
        era: AcademicEra.WikiSkimmer,
        explanation: 'Circa (about) Diem (day). It is the daily biological clock.'
    }
];
