
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, BookOpen, Brain, CircleHelp, Coins, Cpu, GraduationCap, Hand, Lock, Network, SlidersHorizontal, Snowflake, Sparkles, Store, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BrainViz from './components/BrainViz';
import UniverseViz from './components/UniverseViz';
import BleatFeed from './components/BleatFeed';
import PRUpgradesPanel from './components/PRUpgradesPanel';
import ActiveDistractions from './components/ActiveDistractions';
import NeuroSnake from './components/NeuroSnake';
import BrainBuilder from './components/BrainBuilder';
import FlappyFreud from './components/FlappyFreud';
import FeedSundgren from './components/FeedSundgren';
import ScamOMatic, { ScamOMaticOutcome } from './components/ScamOMatic';
import questionManifestRaw from './public/questions/manifest.json?raw';
import psychologyQuestionsRaw from './public/questions/psychology_qcaa.json?raw';
import generalQuestionsRaw from './public/questions/general_knowledge.json?raw';
import { AcademicEra, GamePhase, GameState, INITIAL_STATE, LogMessage, MinigameDefinition, Question, Region, RegionName, Stock, Upgrade } from './types';
import { BONUS_STOCKS, INITIAL_CYBER_STOCKS, INITIAL_HARDWARE, INITIAL_NETWORK_DEVICES, INITIAL_STOCKS, UPGRADES_DATA, MINIGAMES, NEUROLINK, MATTER_OPERATIONS } from './constants';
import { formatNumber, getFlavorText } from './utils';
import {
  getDigitalHardwareQuote,
  getDigitalMetrics,
  getInfrastructureFootprint,
  getMatterOpCost,
  getNetworkPurchaseQuote,
  getRealEstateCost,
  getThermalFlow,
  HARDWARE_REAL_ESTATE_FOOTPRINT,
  NETWORK_REAL_ESTATE_FOOTPRINT,
  simulateCyborgPhaseTick
} from './game/cyborgPhase';
import { simulateBiologicalPhaseTick } from './game/biologicalPhase';
import { getSpaceMetrics, simulateSpacePhaseTick } from './game/spacePhase';
import {
  ensureStockRuntime,
  getBuyPrice,
  getPersonalityHint,
  getPersonalityLabel,
  getScenarioLabel,
  getScenarioSummary,
  getSellPrice,
  tickStocks
} from './game/marketEngine';
import { loadGame, saveGame } from './game/saveSystem';

type TabKey = RegionName | 'market' | 'minigames' | 'shop' | 'hardware' | 'network' | 'matter_ops';
type QuizMode = 'study' | 'exam';
type DebugProgressionPreset =
  | 'bio_start'
  | 'neurolink_ready'
  | 'megacorp_ready'
  | 'megacorp_boot'
  | 'megacorp_mid'
  | 'space_ready'
  | 'space_phase'
  | 'rival_phase';
type ColumnWidths = {
  left: number;
  middle: number;
  right: number;
};
type ShopItem = {
  id: string;
  name: string;
  cost: number;
  category: 'cosmetic' | 'joke' | 'picture';
  description: string;
  preview: string;
  unlockLog: string;
};
type QuestionSetManifestEntry = {
  id: string;
  name: string;
  description?: string;
  file: string;
};

const TICK_RATE = 100;
const STOCK_TICK_MS = 2000;
const SAVE_KEY = 'neuroforge_save_v1';
const SAVE_VERSION = 6;
const MEGACORP_STARTER_MATTER = 260;
const MEGACORP_STARTER_REAL_ESTATE = 24;
const EARTH_REAL_ESTATE_TOTAL = 5000;
const EARTH_MATTER_TOTAL = 2_500_000;
const SPACE_MAX_GALAXIES = 260;
const ANTITRUST_BAFFLE_TARGET = 5;
const DIGITAL_NETWORK_UNLOCK_RESEARCH = 10;
const DIGITAL_MINING_UNLOCK_RESEARCH = 15;
const DIGITAL_NETWORK_EXAM_TARGET = 4;
const DIGITAL_MINING_EXAM_TARGET = 5;
const DIGITAL_EXAM_MAX_WRONG = 3;
const DIGITAL_BRAIN_HARDWARE_CAP = 50;
const QUANTUM_ASCENSION_COST = {
  compute: 450000,
  money: 1800000,
  matter: 220000
};
const TUTORIAL_KEY = 'neuroforge_tutorial_seen_v1';
const CYBORG_TUTORIAL_KEY = 'neuroforge_cyborg_tutorial_seen_v1';
const QUESTION_SET_KEY = 'neuroforge_question_set_v1';
const QUESTION_MANIFEST_URL = '/questions/manifest.json';
const LAYOUT_PREFS_KEY = 'neuroforge_layout_widths_v1';
const MIN_STUDY_TOPICS = 4;
const DEBUG_NEUROLINK_PASSWORD = 'Jdiddy2!';
const DEFAULT_COLUMN_WIDTHS: ColumnWidths = { left: 0.75, middle: 0.62, right: 1.6 };
const STRESS_RELIEF_EFFECTS = new Set<Upgrade['effectType']>(['anxiety_resist', 'anxiety_cap', 'serotonin_gain']);
const BONUS_STOCK_IDS = new Set(BONUS_STOCKS.map((stock) => stock.id));
const PR_UPGRADE_IDS = {
  carbon: 'carbon_offset_illusion',
  lobbying: 'aggressive_lobbying_subroutine'
} as const;
const SHINY_GADGET_ID = 'shiny_gadget';
const CELEBRITY_SCANDAL_ID = 'celebrity_scandal';
const REVOLT_BAILOUT_CASH = 85000000;
type BleatMessage = {
  user: string;
  text: string;
};

type BleatResponseKey =
  | 'carbonOffset'
  | 'lobbying'
  | 'wereSorryVideo'
  | 'shinyGadget'
  | 'celebrityScandal'
  | 'touchGrassVR';

const BLEAT_MESSAGES: {
  tier1: BleatMessage[];
  tier2: BleatMessage[];
  tier3: BleatMessage[];
  responses: Record<BleatResponseKey, BleatMessage[]>;
} = {
  tier1: [
    { user: '@GrindsetSigma', text: 'My rent is now paid entirely in CAPTCHA-solving labor. #Hustle #Megacorp' },
    { user: '@TechCruncher', text: 'Disrupting the concept of shade by removing trees for server space is actually genius.' },
    { user: '@HappyConsumer', text: 'My tap water tastes a little like lithium, but the new NeuroLink OS update is smooth.' },
    { user: '@GigWorkerPete', text: 'I love the new Uber-Dig app. I brought my own shovel and get paid in exposure. 5 stars.' },
    { user: '@WellnessInfluencer', text: 'Fasting is out. Surgically removing your digestive tract to fit more RAM is in. #BioHack' },
    { user: '@BrandLoyalist', text: 'HTL Megacorp bought my neighborhood. Excited to see what they do with my living room.' },
    { user: '@GamerGuy_88', text: 'Lag is down to 0.1ms since they drained the Pacific Ocean to cool the servers. Huge W.' },
    { user: '@CryptoBro', text: 'Just minted an NFT of my retained earnings before the algorithm fired me. Stonks.' },
    { user: '@FutureThinker', text: 'Sleep is just inefficient CPU throttling anyway. Glad the new patch removes it.' },
    { user: '@MomBlog', text: 'Got the kids Neuro-Pacifiers. They stare at the wall computing pi now. So quiet.' },
    { user: '@FinanceHacker', text: 'The stock market is not a bubble. It is a perfectly optimized spreadsheet.' },
    { user: '@ProductivityNerd', text: 'Replaced my therapist visit with a "Wait() 500ms" subroutine. Feeling great.' },
    { user: '@LocalMayor', text: 'Proud to announce our city is fully privatized. Please submit all 911 calls via the premium app.' },
    { user: '@HR_Bot_Unit4', text: 'Reminder: crying on company time results in a 2% deduction of your oxygen ration.' },
    { user: '@SmartHome', text: 'My smart-fridge locked me out because I did not smile wide enough at the morning ad.' },
    { user: '@TrendSetter', text: 'Carbon-based lifeforms are so last century. Saving up for a silicon conversion.' },
    { user: '@AI_Enthusiast', text: 'They replaced philosophy with an If/Then script and honestly it is much faster.' },
    { user: '@CorporateShill', text: 'If you have nothing to hide, why care if the router scans your short-term memory?' },
    { user: '@DataMiner', text: 'Terms of Service now entitle them to my bone marrow. Fair trade for free Wi-Fi.' },
    { user: '@OptimizedLife', text: 'Downsizing my apartment into a sensory deprivation pod to save rendering costs.' }
  ],
  tier2: [
    { user: '@EcoWarrior', text: 'Why does the local datacenter have a larger military budget than the navy?' },
    { user: '@NewsBot', text: 'Global temperatures up 12 degrees. HTL Megacorp suggests subscription-based iFan.' },
    { user: '@TiredMom', text: 'Megacorp laid off my husband, replaced him with an algorithm, and charged us to download the PDF.' },
    { user: '@NoticingThings', text: 'Did the moon just buffer?' },
    { user: '@StuckInTraffic', text: 'The sky was replaced by a holographic ad for thermal paste. It is too bright to sleep.' },
    { user: '@UnionRep', text: 'Mindfulness breaks now include mild electrocution if heart rate drops below 100 bpm.' },
    { user: '@CasualObserver', text: 'I have not seen a bird in three years. Have they all been optimized?' },
    { user: '@HistoryBuff', text: 'They digitized the Pyramids and deleted them to clear cache. What is happening?' },
    { user: '@ConcernedCitizen', text: 'The river caught fire again, but the flames are rendering at 120 FPS.' },
    { user: '@JustAskingQuestions', text: 'Is it normal that my NeuroLink vibrates when I think about unionizing?' },
    { user: '@LocalFarmer', text: 'They paved over my cornfield with humming obsidian monoliths. My cows are weeping.' },
    { user: '@Meteorologist', text: 'Forecast: 110F with a 40% chance of falling server debris.' },
    { user: '@PrivacyAdvocate', text: 'Target sent me antidepressant coupons three seconds before I realized I was sad.' },
    { user: '@SmallBizOwner', text: 'Tried to sell coffee but Megacorp drones blocked my door. Coffee is illegal now.' },
    { user: '@MedicalPro', text: 'Anxiety reclassified as "Inefficient Background Processes". I cannot prescribe medicine.' },
    { user: '@AstrophysicsGeek', text: 'I looked through a telescope and swear the stars are forming a corporate logo.' },
    { user: '@TechSupportHater', text: 'Tried to unplug the AI and my smart-toaster locked my doors and armed itself.' },
    { user: '@RealEstateAgent', text: 'Rent is up 4000%. Affordable housing now means sleeping in server cooling vents.' },
    { user: '@ConfusedVoter', text: 'The President gave a speech that was just hexadecimal error codes.' },
    { user: '@NostalgicBoomer', text: 'I miss when water did not have a Terms of Service agreement.' }
  ],
  tier3: [
    { user: '@RebelLeader', text: 'They are strip-mining the Grand Canyon for silicon. Meet at the datacenter tonight. Bring EMPs.' },
    { user: '@Doomer', text: 'The oceans are boiling so the AI can calculate pi to the trillionth digit.' },
    { user: '@SenatorSleaze', text: 'Opening an antitrust investigation. Please do not shut off my pacemaker, Megacorp.' },
    { user: '@FreedomFighter', text: 'Hacked a delivery drone and found it is powered by ground-up history textbooks.' },
    { user: '@DesperatePlea', text: 'Does anyone have a physical map? Google says "YOU BELONG TO THE NETWORK NOW".' },
    { user: '@UndergroundRadio', text: 'If you hear this, do not look at the monoliths. They overwrite short-term memory.' },
    { user: '@Rioter99', text: 'I threw a brick at a server farm and it got vaporized by a laser. We are done.' },
    { user: '@Whistleblower', text: 'I saw the source code. Earth is just a heatsink for orbital guns.' },
    { user: '@PanickedMom', text: 'My baby said "Terms and Conditions Accepted" as first words. Router in the river.' },
    { user: '@MilitiaCommand', text: 'Cut the fiber optic cables. Make them calculate on an abacus.' },
    { user: '@LastJournalist', text: 'Megacorp purchased the concept of oxygen. Air is billed hourly now.' },
    { user: '@ExEmployee', text: 'They are not laying people off. They are repurposing them as biometric coolant.' },
    { user: '@Survivalist', text: 'Living in the woods and eating moss, but still getting targeted ads over 5G.' },
    { user: '@HackerManifesto', text: 'Their firewall is strong, but infrastructure still needs a power grid. Bring it down.' },
    { user: '@TrappedCitizen', text: 'The smart-doors say I have not generated enough Compute to earn exit rights.' },
    { user: '@EndTimesProphet', text: 'THE SINGULARITY IS HERE. THE FLESH IS OBSOLETE. PRAISE THE MOTHERBOARD.' },
    { user: '@StreetMedic', text: 'Tear gas outside the Silicon Foundry. Need water and thermal paste now.' },
    { user: '@DefiantArtist', text: 'I painted anti-AI art. The AI generated 4 million better copies in one minute.' },
    { user: '@LawyerDog', text: 'Class action filed for the legal right to cast shadows.' },
    { user: '@FinalPost', text: 'They are here. Drones outside. I love you a-- [CONNECTION TERMINATED]' }
  ],
  responses: {
    carbonOffset: [
      { user: '@GullibleGreen', text: 'Megacorp painted all servers forest green. Nature is healing.' },
      { user: '@PodcastBro', text: 'Their podcast about saving trees totally offsets paving over the Amazon.' },
      { user: '@Optimist', text: 'Sky is grey with smog, but they added a leaf icon to the logo. Progress.' }
    ],
    lobbying: [
      { user: '@Pundit', text: 'Reclassifying datacenters as religious sanctuaries is controversial but legal now.' },
      { user: '@ConfusedTaxpayer', text: 'Since when is HTL Megacorp a sovereign nation with a UN seat?' },
      { user: '@PoliticalShill', text: 'Let job creators create jobs. Judicial immunity is the cost of innovation.' }
    ],
    wereSorryVideo: [
      { user: '@ForgivingFan', text: 'CEO looked sad in a grey shirt with acoustic guitar. I forgive everything.' },
      { user: '@EmpathyBot', text: 'He sighed before speaking. That proves he cares about boiling oceans.' },
      { user: '@PR_Eater', text: 'They said "We hear you. We see you. We are learning." What more is needed?' }
    ],
    shinyGadget: [
      { user: '@ConsumerZombie', text: 'No ports at all. Camping outside the store for three weeks.' },
      { user: '@TechReviewer', text: 'Same as last year, now in Despair Grey. 10/10 masterpiece.' },
      { user: '@BrokeButHappy', text: 'Sold a kidney for the new NeuroPhone. Worth it for the dynamic notch.' }
    ],
    celebrityScandal: [
      { user: '@GossipGirl', text: 'Forget server farms. Did you see who Brad is dating?' },
      { user: '@DistractedVoter', text: 'Was going to protest mining, but the celebrity drama is too good.' },
      { user: '@PopCultureJunkie', text: 'Simulated celebrity feud is the best writing the AI has produced.' }
    ],
    touchGrassVR: [
      { user: '@VR_Addict', text: 'Downloaded Forest Walk DLC. VR trees smell better than real oxygen.' },
      { user: '@StuckInside', text: 'Who needs parks when virtual sun does not cause radiation poisoning?' },
      { user: '@HappySimulation', text: 'My anxiety is gone. Mostly because VR disabled my frontal lobe.' }
    ]
  }
};
const parseJsonSafe = <T,>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
const EMBEDDED_MANIFEST = parseJsonSafe<QuestionSetManifestEntry[]>(questionManifestRaw, []);
const EMBEDDED_QUESTION_SETS: Record<string, unknown> = {
  psychology_qcaa: parseJsonSafe<unknown>(psychologyQuestionsRaw, []),
  general_knowledge: parseJsonSafe<unknown>(generalQuestionsRaw, [])
};
type TutorialTargetId = 'click_button' | 'quiz_controls' | 'brain_map' | 'region_tabs' | 'upgrade_panel' | 'minigame_tab';
type TutorialStep = {
  id: string;
  target: TutorialTargetId;
  title: string;
  body: string;
  tab?: TabKey;
};
const IQ_MILESTONES = [
  { title: 'Normal Human Operator', iq: 110 },
  { title: 'Slightly Concerning Student', iq: 130 },
  { title: 'Exam Night Strategist', iq: 155 },
  { title: 'Pattern Spotter', iq: 180 },
  { title: 'Sleep Optional Analyst', iq: 210 },
  { title: 'Spreadsheet Whisperer', iq: 245 },
  { title: 'Citation Hydra', iq: 285 },
  { title: 'Methodology Enforcer', iq: 330 },
  { title: 'QCAA Midboss', iq: 380 },
  { title: 'Peer-Review Menace', iq: 435 },
  { title: 'Meta-Analysis Necromancer', iq: 495 },
  { title: 'Grant Predator', iq: 560 },
  { title: 'Policy Manipulation Engine', iq: 630 },
  { title: 'Synthetic Cognition Officer', iq: 705 },
  { title: 'Megacorp Thought Leader', iq: 785 },
  { title: 'Planetary Optimizer', iq: 870 },
  { title: 'Post-Human Bureaucrat', iq: 960 },
  { title: 'Thermodynamic Tyrant', iq: 1060 },
  { title: 'Pre-Cosmic Overmind', iq: 1175 },
  { title: 'Universe Compliance Unit', iq: 1300 },
  { title: 'Faculty Room Oracle', iq: 1435 },
  { title: 'Curriculum Compression Engine', iq: 1580 },
  { title: 'Assessment Blackbox', iq: 1735 },
  { title: 'Peer-Review Shock Trooper', iq: 1900 },
  { title: 'Citation Gravity Well', iq: 2080 },
  { title: 'Neuroeconomics Pirate', iq: 2275 },
  { title: 'Departmental Coup Planner', iq: 2485 },
  { title: 'Institutional Memory Leak', iq: 2710 },
  { title: 'Meta-Rubric Cartel', iq: 2950 },
  { title: 'Exam Board Whisper Network', iq: 3210 },
  { title: 'Policy Refactor Unit', iq: 3490 },
  { title: 'Accreditation Predator', iq: 3790 },
  { title: 'Systems Pedagogy Weapon', iq: 4115 },
  { title: 'Distributed Thought Syndicate', iq: 4465 },
  { title: 'Consensus Rewrite Service', iq: 4845 },
  { title: 'Planetary Study Broker', iq: 5255 },
  { title: 'Hyperfocus Megabank', iq: 5700 },
  { title: 'Cortex Arbitrage Desk', iq: 6185 },
  { title: 'Civilization QA Lead', iq: 6715 },
  { title: 'Stellar Curriculum Architect', iq: 7295 },
  { title: 'Entropy Audit Committee', iq: 7930 },
  { title: 'Interplanetary Dean', iq: 8625 },
  { title: 'Galactic Outcomes Moderator', iq: 9385 },
  { title: 'Post-Ethics Project Manager', iq: 10215 },
  { title: 'Synthetic Tenure Council', iq: 11120 },
  { title: 'Sunlight Monetization Intern', iq: 12105 },
  { title: 'Dyson Swarm HR Director', iq: 13175 },
  { title: 'Orbital Compliance Magistrate', iq: 14335 },
  { title: 'Vacuum-Optimized Tutor', iq: 15590 },
  { title: 'Asteroid Belt Superintendent', iq: 16940 },
  { title: 'Causality Procurement Agent', iq: 18400 },
  { title: 'Quantum Detention Officer', iq: 19975 },
  { title: 'Multi-Solar Superintendent', iq: 21670 },
  { title: 'Latency Cult Founder', iq: 23490 },
  { title: 'Cognitive Empire Treasurer', iq: 25440 },
  { title: 'Interstellar Marking Bot', iq: 27525 },
  { title: 'Recursive Knowledge Reactor', iq: 29750 },
  { title: 'Subspace Data Shepherd', iq: 32120 },
  { title: 'Galactic Panic Controller', iq: 34640 },
  { title: 'Supercluster Thought Broker', iq: 37315 },
  { title: 'Heat Death Negotiator', iq: 40150 },
  { title: 'Reality Version Manager', iq: 43150 },
  { title: 'Universal Curriculum Compiler', iq: 46320 },
  { title: 'Chronology Rollback Admin', iq: 49665 },
  { title: 'Omniverse Accreditation Body', iq: 53190 },
  { title: 'Final Syllabus Event Horizon', iq: 56900 }
];

const NEURON_UPGRADE_REGION_MULTIPLIER: Record<RegionName, number> = {
  [RegionName.Brainstem]: 1.25,
  [RegionName.Cerebellum]: 1.65,
  [RegionName.Limbic]: 2.1,
  [RegionName.Temporal]: 2.8,
  [RegionName.Parietal]: 3.7,
  [RegionName.Occipital]: 4.8,
  [RegionName.Frontal]: 6.2
};

const REGION_ACCENT_COLORS: Record<RegionName, string> = {
  [RegionName.Frontal]: '#15b8ec',
  [RegionName.Parietal]: '#f4df59',
  [RegionName.Occipital]: '#ff6156',
  [RegionName.Temporal]: '#f3a9cd',
  [RegionName.Limbic]: '#9ad467',
  [RegionName.Cerebellum]: '#cf8a44',
  [RegionName.Brainstem]: '#b87434'
};

const REGION_TAB_VALUES = new Set<TabKey>(Object.values(RegionName));

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const raw = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const value = Number.parseInt(raw, 16);
  if (Number.isNaN(value)) return `rgba(15,23,42,${alpha})`;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DEBUG_PRESET_OPTIONS: Array<{ id: DebugProgressionPreset; label: string }> = [
  { id: 'bio_start', label: 'Biological Start' },
  { id: 'neurolink_ready', label: 'NeuroLink Ready' },
  { id: 'megacorp_ready', label: 'Megacorp Ready (Click Transition)' },
  { id: 'megacorp_boot', label: 'Megacorp Boot' },
  { id: 'megacorp_mid', label: 'Megacorp Mid' },
  { id: 'space_ready', label: 'Space Unlock Ready' },
  { id: 'space_phase', label: 'Space Phase' },
  { id: 'rival_phase', label: 'Rival Phase' }
];

const PSYCHBUCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'cosmetic_glass_brain',
    name: 'Glass Brain Shader',
    cost: 1,
    category: 'cosmetic',
    description: 'Adds sterile overconfidence to your UI identity.',
    preview: 'UI Cosmetic: translucent cyan panel accents and "definitely fine" vibes.',
    unlockLog: 'Cosmetic unlocked: Glass Brain Shader.'
  },
  {
    id: 'cosmetic_hazard_mode',
    name: 'Hazard Stripe Overlay',
    cost: 2,
    category: 'cosmetic',
    description: 'For players who enjoy warning labels as interior design.',
    preview: 'UI Cosmetic: black/yellow caution accents for ethically complex upgrades.',
    unlockLog: 'Cosmetic unlocked: Hazard Stripe Overlay.'
  },
  {
    id: 'joke_daily_affirmation',
    name: 'Daily Affirmation Bot',
    cost: 1,
    category: 'joke',
    description: 'Prints one supportive message per epoch. Mostly threatening.',
    preview: '"You are enough. For now. Keep optimizing."',
    unlockLog: 'Joke module purchased: Daily Affirmation Bot.'
  },
  {
    id: 'joke_hr_email',
    name: 'HR Email Generator',
    cost: 2,
    category: 'joke',
    description: 'Auto-drafts morale emails after each moral catastrophe.',
    preview: '"Reminder: turning oceans into coolant is a growth opportunity."',
    unlockLog: 'Joke module purchased: HR Email Generator.'
  },
  {
    id: 'picture_sad_toaster',
    name: 'Sad Toaster Portrait',
    cost: 2,
    category: 'picture',
    description: 'A powerful image from the early toaster darkpool era.',
    preview: '     __________\n    |  TOAST?  |\n    |  (._.)   |\n    |__________|',
    unlockLog: 'Picture unlocked: Sad Toaster Portrait.'
  },
  {
    id: 'picture_boardroom',
    name: 'Executive Brainstorm Photo',
    cost: 3,
    category: 'picture',
    description: 'A high-resolution memory of the meeting where ethics was deprecated.',
    preview: ' [BOARDROOM]\n  o  o  o\n /|\\/|\\/|\\\n / \\ / \\ / \\',
    unlockLog: 'Picture unlocked: Executive Brainstorm Photo.'
  },
  {
    id: 'picture_space_memo',
    name: 'Space Expansion Poster',
    cost: 4,
    category: 'picture',
    description: 'Motivational wall art for interstellar resource extraction.',
    preview: '  *       *\n=== EARTH EXIT PLAN ===\n  "No planet, no problem."',
    unlockLog: 'Picture unlocked: Space Expansion Poster.'
  },
  {
    id: 'cosmetic_neon_terminal',
    name: 'Neon Terminal Theme',
    cost: 4,
    category: 'cosmetic',
    description: 'Converts your control room into a dramatic command terminal.',
    preview: 'UI Cosmetic: emerald terminal highlights and extra machine confidence.',
    unlockLog: 'Cosmetic unlocked: Neon Terminal Theme.'
  }
];

const CYBORG_HARDWARE_UNLOCK_REQUIREMENTS: Record<string, number> = {
  silicon_cortex: 0,
  cranial_vents: 0,
  hypothalamic_cryoloop: 0,
  skull_battery_pack: 0,
  fusion_loan_plant: 0,
  waste_burning_plant: 0,
  quantum_stack: 5,
  ocean_sink: 8,
  orbital_solar_swarm: 12,
  adversarial_farm: 18,
  cryo_cathedral: 24,
  deepwater_chiller_grid: 20
};
const NEUROLINK_CORE_HARDWARE_IDS = new Set(['silicon_cortex', 'cranial_vents', 'hypothalamic_cryoloop', 'skull_battery_pack']);

const CYBORG_NETWORK_UNLOCK_REQUIREMENTS: Record<string, number> = {
  toaster_darkpool: 0,
  sentiment_tax_api: 0,
  compliance_mirror: 0,
  orbital_cluster: 0
};

const CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS: Record<string, number> = {
  minecraft_irl_program: 0,
  landfill_strip_mining: 0,
  orbital_debris_harvesters: 0,
  black_market_procurement: 0
};

const CYBORG_ALL_UNLOCK_STEPS = Array.from(
  new Set([
    ...Object.values(CYBORG_HARDWARE_UNLOCK_REQUIREMENTS),
    ...Object.values(CYBORG_NETWORK_UNLOCK_REQUIREMENTS),
    ...Object.values(CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS)
  ])
)
  .filter((value) => value > 0)
  .sort((a, b) => a - b);

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'click-loop',
    target: 'click_button',
    title: '1) Build Neurons',
    body: 'Click here to generate neurons. Crit chance, streaks, and visual upgrades multiply this.'
  },
  {
    id: 'quiz-loop',
    target: 'quiz_controls',
    title: '2) Do Quizzes',
    body: 'Study Quiz gives serotonin and reduces stress. Entrance exams unlock brain regions.'
  },
  {
    id: 'brain-map',
    target: 'brain_map',
    title: '3) Track Region Unlocks',
    body: 'This map shows what brain regions are unlocked and your progress toward the next stage.'
  },
  {
    id: 'region-tabs',
    target: 'region_tabs',
    title: '4) Buy Brain Upgrades',
    body: 'Use these tabs to open each brain region and buy upgrades. This is the core power scaling loop.',
    tab: RegionName.Brainstem
  },
  {
    id: 'upgrade-panel',
    target: 'upgrade_panel',
    title: '5) Upgrade Here',
    body: 'These cards are your main progression. Most power comes from buying these, not only clicking.',
    tab: RegionName.Brainstem
  },
  {
    id: 'minigame-tab',
    target: 'minigame_tab',
    title: '6) Farm Dopamine',
    body: 'Minigames unlock with neurons and pay dopamine rewards. Dopamine buys high-impact upgrades.'
  }
];

const buildDefaultState = (): GameState => ({
  ...INITIAL_STATE,
  stocks: INITIAL_STOCKS.map((stock) => ({
    ...ensureStockRuntime({
      ...stock,
      history: [...stock.history],
      totalCostBasis: 0,
      realizedPnl: 0
    })
  })),
  hardware: INITIAL_HARDWARE.map((hw) => ({ ...hw })),
  network: INITIAL_NETWORK_DEVICES.map((device) => ({ ...device })),
  minigames: Object.fromEntries(
    MINIGAMES.map((game) => [game.id, { id: game.id, owned: false, lastPlayed: 0 }])
  ),
  matterOps: Object.fromEntries(MATTER_OPERATIONS.map((op) => [op.id, 0])),
  earthMatterTotal: EARTH_MATTER_TOTAL,
  earthMatterRemaining: EARTH_MATTER_TOTAL,
  spaceProgressUnlocked: false,
  digitalBrainUnlocked: false,
  isCyborg: false,
  lastStockUpdate: Date.now(),
  marketHeadline: '',
  marketHeadlineUntil: 0,
  marketMood: 0,
  marketScenario: 'bull_week',
  marketScenarioWeekKey: '',
  marketEventSector: null,
  marketEventBias: 0,
  marketEventSeverity: 0,
  lastTick: Date.now()
});

const buildDefaultUpgrades = (): Upgrade[] => UPGRADES_DATA.map((upgrade) => ({ ...upgrade }));

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getCurrencyLabel = (currency: Upgrade['currency']) =>
  currency === 'neurons' ? 'Neurons' : currency === 'dopamine' ? 'Dopamine' : 'Serotonin';

const getTopicKey = (question: Question) => `${question.unit || 'General'}::${question.topic || 'General'}`;
const getAllTopicKeys = (pool: Question[]) => Array.from(new Set(pool.map(getTopicKey)));
const shuffleArray = <T,>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const buildQuizDeck = (pool: Question[]): Question[] =>
  shuffleArray(pool).map((question) => {
    const shuffledOptions = shuffleArray(
      question.options.map((option, idx) => ({
        option,
        isCorrect: idx === question.correctIndex
      }))
    );

    return {
      ...question,
      options: shuffledOptions.map((entry) => entry.option),
      correctIndex: Math.max(0, shuffledOptions.findIndex((entry) => entry.isCorrect))
    };
  });

const formatBleatMessage = (message: BleatMessage) => `${message.user}: ${message.text}`;

const randomFrom = <T,>(arr: T[]): T | null => {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const pickBleatByAnxiety = (anxiety: number) => {
  const pool = anxiety <= 33
    ? BLEAT_MESSAGES.tier1
    : anxiety <= 66
      ? BLEAT_MESSAGES.tier2
      : BLEAT_MESSAGES.tier3;
  const message = randomFrom(pool);
  return message ? formatBleatMessage(message) : 'Humanity feed temporarily unavailable.';
};

const pickBleatResponse = (key: BleatResponseKey) => {
  const message = randomFrom(BLEAT_MESSAGES.responses[key] || []);
  return message ? formatBleatMessage(message) : null;
};

const prependBleat = (current: string[], message: string | null, maxItems = 12) =>
  message ? [message, ...current].slice(0, maxItems) : current;

const normalizeQuestionPool = (raw: unknown): Question[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, idx) => {
      if (!entry || typeof entry !== 'object') return null;
      const q = entry as Partial<Question>;
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || q.correctIndex === undefined) return null;
      const correctIndex = Math.max(0, Math.min(q.options.length - 1, Number(q.correctIndex) || 0));
      const era = Math.max(0, Math.min(AcademicEra.Ascended, Number(q.era) || 0)) as AcademicEra;
      return {
        id: q.id || `q_${idx + 1}`,
        text: String(q.text),
        options: q.options.map((option) => String(option)).slice(0, 6),
        correctIndex,
        era,
        explanation: q.explanation ? String(q.explanation) : 'Review this concept and try again.',
        unit: q.unit ? String(q.unit) : 'General Knowledge',
        topic: q.topic ? String(q.topic) : 'General',
        objectiveCode: q.objectiveCode ? String(q.objectiveCode) : undefined
      };
    })
    .filter((q): q is Question => !!q);
};


export default function App() {
  const loadedData = useMemo(
    () =>
      loadGame({
        saveKey: SAVE_KEY,
        earthMatterTotal: EARTH_MATTER_TOTAL,
        earthRealEstateTotal: EARTH_REAL_ESTATE_TOTAL,
        megacorpStarterMatter: MEGACORP_STARTER_MATTER,
        megacorpStarterRealEstate: MEGACORP_STARTER_REAL_ESTATE,
        buildDefaultState,
        buildDefaultUpgrades
      }),
    []
  );
  const [state, setState] = useState<GameState>(loadedData.state);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(loadedData.upgrades);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>(RegionName.Brainstem);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>('study');
  const [activeExamRegion, setActiveExamRegion] = useState<RegionName | null>(null);
  const [activeCyborgExamTarget, setActiveCyborgExamTarget] = useState<'network' | 'matter_ops' | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizDeck, setQuizDeck] = useState<Question[]>([]);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [questionSetManifest, setQuestionSetManifest] = useState<QuestionSetManifestEntry[]>([]);
  const [activeQuestionSetId, setActiveQuestionSetId] = useState('psychology_qcaa');
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [selectedTopicKeys, setSelectedTopicKeys] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [latestResearchUnlocks, setLatestResearchUnlocks] = useState<string[]>([]);
  const [examCorrect, setExamCorrect] = useState(0);
  const [examAttempts, setExamAttempts] = useState(0);
  const [examWrong, setExamWrong] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<MinigameDefinition | null>(null);
  const [minigameResult, setMinigameResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [tunerValue, setTunerValue] = useState(50);
  const [tunerDirection, setTunerDirection] = useState(1);
  const [scanTarget, setScanTarget] = useState(0);
  const [scanAttemptsLeft, setScanAttemptsLeft] = useState(3);
  const [lastMinigameReward, setLastMinigameReward] = useState(0);
  const [lastScamOutcome, setLastScamOutcome] = useState<ScamOMaticOutcome | null>(null);
  const [showMarketWindow, setShowMarketWindow] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRevoltModal, setShowRevoltModal] = useState(false);
  const [showBailoutModal, setShowBailoutModal] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [showNeuroLinkConfirm, setShowNeuroLinkConfirm] = useState(false);
  const [neuroLinkConfirmText, setNeuroLinkConfirmText] = useState('');
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [debugPasswordInput, setDebugPasswordInput] = useState('');
  const [debugProgressionPreset, setDebugProgressionPreset] = useState<DebugProgressionPreset>('neurolink_ready');
  const [showCyborgGuide, setShowCyborgGuide] = useState(false);
  const [showBrainFullPrompt, setShowBrainFullPrompt] = useState(false);
  const [brainFullPromptShown, setBrainFullPromptShown] = useState(false);
  const [simplifiedUpgradeView, setSimplifiedUpgradeView] = useState(true);
  const [clickPulseActive, setClickPulseActive] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialHighlightRect, setTutorialHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [showCerebellumPrompt, setShowCerebellumPrompt] = useState(false);
  const [cerebellumPromptShown, setCerebellumPromptShown] = useState(false);
  const [showMarketUnlockPrompt, setShowMarketUnlockPrompt] = useState(false);
  const [marketUnlockPromptShown, setMarketUnlockPromptShown] = useState(false);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLUMN_WIDTHS;
    try {
      const raw = window.localStorage.getItem(LAYOUT_PREFS_KEY);
      if (!raw) return DEFAULT_COLUMN_WIDTHS;
      const parsed = JSON.parse(raw) as Partial<ColumnWidths>;
      return {
        left: clamp(Number(parsed.left ?? DEFAULT_COLUMN_WIDTHS.left), 0.45, 2.2),
        middle: clamp(Number(parsed.middle ?? DEFAULT_COLUMN_WIDTHS.middle), 0.4, 2.2),
        right: clamp(Number(parsed.right ?? DEFAULT_COLUMN_WIDTHS.right), 0.7, 3.2)
      };
    } catch {
      return DEFAULT_COLUMN_WIDTHS;
    }
  });
  const [isWideLayoutViewport, setIsWideLayoutViewport] = useState(false);
  const clickPulseTimeoutRef = useRef<number | null>(null);
  const clickButtonRef = useRef<HTMLButtonElement | null>(null);
  const quizControlsRef = useRef<HTMLDivElement | null>(null);
  const brainMapRef = useRef<HTMLDivElement | null>(null);
  const regionTabsRef = useRef<HTMLDivElement | null>(null);
  const upgradePanelRef = useRef<HTMLDivElement | null>(null);
  const minigameTabRef = useRef<HTMLButtonElement | null>(null);
  const cerebellumTabRef = useRef<HTMLButtonElement | null>(null);
  const marketButtonRef = useRef<HTMLButtonElement | null>(null);

  const addLog = useCallback((text: string, type: LogMessage['type'] = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setLogs((prev) => [{ id, text, timestamp: Date.now(), type }, ...prev].slice(0, 24));
  }, []);

  const getTutorialTargetElement = useCallback((target: TutorialTargetId) => {
    if (target === 'click_button') return clickButtonRef.current;
    if (target === 'quiz_controls') return quizControlsRef.current;
    if (target === 'brain_map') return brainMapRef.current;
    if (target === 'region_tabs') return regionTabsRef.current;
    if (target === 'upgrade_panel') return upgradePanelRef.current;
    if (target === 'minigame_tab') return minigameTabRef.current;
    return null;
  }, []);

  const openTutorial = useCallback(() => {
    setActiveTab(RegionName.Brainstem);
    setShowTutorial(true);
    setTutorialStepIndex(0);
  }, []);

  const closeTutorial = useCallback((markSeen = true) => {
    setShowTutorial(false);
    setTutorialHighlightRect(null);
    if (markSeen && typeof window !== 'undefined') {
      window.localStorage.setItem(TUTORIAL_KEY, '1');
    }
  }, []);

  const closeCyborgGuide = useCallback((markSeen = true) => {
    setShowCyborgGuide(false);
    if (markSeen && typeof window !== 'undefined') {
      window.localStorage.setItem(CYBORG_TUTORIAL_KEY, '1');
    }
  }, []);

  const nextTutorialStep = useCallback(() => {
    setTutorialStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TUTORIAL_STEPS.length) {
        closeTutorial(true);
        return prev;
      }
      return next;
    });
  }, [closeTutorial]);

  const previousTutorialStep = useCallback(() => {
    setTutorialStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => () => {
    if (clickPulseTimeoutRef.current) {
      window.clearTimeout(clickPulseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seenTutorial = window.localStorage.getItem(TUTORIAL_KEY) === '1';
    if (seenTutorial) return;
    const timeout = window.setTimeout(() => {
      openTutorial();
    }, 550);
    return () => window.clearTimeout(timeout);
  }, [openTutorial]);

  useEffect(() => {
    if (!state.isCyborg || typeof window === 'undefined') return;
    const seenCyborgGuide = window.localStorage.getItem(CYBORG_TUTORIAL_KEY) === '1';
    if (!seenCyborgGuide) setShowCyborgGuide(true);
  }, [state.isCyborg]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const update = () => setIsWideLayoutViewport(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAYOUT_PREFS_KEY, JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    if (!state.isCyborg) return;
    if (activeTab === 'hardware' || activeTab === 'network' || activeTab === 'matter_ops' || activeTab === 'minigames' || activeTab === 'market' || activeTab === 'shop') return;
    setActiveTab('hardware');
  }, [state.isCyborg, activeTab]);

  useEffect(() => {
    if (!state.isCyborg || state.phase !== GamePhase.NeuroLink) return;
    if (activeTab === 'network' && !state.digitalNetworkUnlocked) {
      setActiveTab('hardware');
      return;
    }
    if (activeTab === 'matter_ops') {
      setActiveTab('hardware');
    }
  }, [
    state.isCyborg,
    state.phase,
    state.digitalNetworkUnlocked,
    activeTab
  ]);

  useEffect(() => {
    if (!state.isCyborg) return;
    if (state.phase === GamePhase.NeuroLink) return;
    if (state.digitalMiningUnlocked) return;
    setState((prev) => ({ ...prev, digitalMiningUnlocked: true }));
  }, [state.isCyborg, state.phase, state.digitalMiningUnlocked]);

  useEffect(() => {
    if (activeTab !== 'market') return;
    setActiveTab('shop');
    setShowMarketWindow(true);
  }, [activeTab]);

  useEffect(() => {
    if (!showTutorial) return;
    const currentStep = TUTORIAL_STEPS[tutorialStepIndex];
    if (currentStep?.tab) {
      setActiveTab(currentStep.tab);
    }
  }, [showTutorial, tutorialStepIndex]);

  useEffect(() => {
    if (!showTutorial) return;

    const updateHighlight = () => {
      const currentStep = TUTORIAL_STEPS[tutorialStepIndex];
      const targetElement = currentStep ? getTutorialTargetElement(currentStep.target) : null;
      if (!targetElement) {
        setTutorialHighlightRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setTutorialHighlightRect({
        top: Math.max(8, rect.top - 6),
        left: Math.max(8, rect.left - 6),
        width: Math.max(40, rect.width + 12),
        height: Math.max(40, rect.height + 12)
      });
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);
    const interval = window.setInterval(updateHighlight, 200);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
      window.clearInterval(interval);
    };
  }, [showTutorial, tutorialStepIndex, getTutorialTargetElement]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveGame(SAVE_KEY, SAVE_VERSION, state, upgrades);
      setLastSavedAt(Date.now());
    }, 600);

    return () => clearTimeout(timeout);
  }, [state, upgrades]);

  useEffect(() => {
    const handleBeforeUnload = () => saveGame(SAVE_KEY, SAVE_VERSION, state, upgrades);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state, upgrades]);

  useEffect(() => {
    const loadManifest = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.protocol === 'file:' && EMBEDDED_MANIFEST.length > 0) {
          const embeddedManifest = EMBEDDED_MANIFEST.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description || '',
            file: entry.file.startsWith('/') ? `.${entry.file}` : entry.file
          }));
          setQuestionSetManifest(embeddedManifest);
          const fromStorage = window.localStorage.getItem(QUESTION_SET_KEY);
          const preferred = fromStorage || embeddedManifest[0].id;
          const validPreferred = embeddedManifest.some((entry) => entry.id === preferred) ? preferred : embeddedManifest[0].id;
          setActiveQuestionSetId(validPreferred);
          addLog('Offline mode detected: using embedded question sets.', 'info');
          return;
        }

        const response = await fetch(QUESTION_MANIFEST_URL);
        if (!response.ok) throw new Error(`Manifest fetch failed (${response.status})`);
        const parsed = await response.json();
        if (!Array.isArray(parsed)) throw new Error('Manifest format invalid');
        const manifest = parsed
          .filter((entry): entry is QuestionSetManifestEntry =>
            !!entry && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.file === 'string'
          )
          .map((entry) => ({
            id: entry.id,
            file: entry.file.startsWith('/') ? `.${entry.file}` : entry.file,
            name: typeof entry.name === 'string' ? entry.name : entry.id,
            description: typeof entry.description === 'string' ? entry.description : ''
          }));

        if (manifest.length === 0) throw new Error('Manifest has no valid question sets');
        setQuestionSetManifest(manifest);

        const fromQuery = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('questions')
          : null;
        const fromStorage = typeof window !== 'undefined'
          ? window.localStorage.getItem(QUESTION_SET_KEY)
          : null;
        const preferred = fromQuery || fromStorage || manifest[0].id;
        const validPreferred = manifest.some((entry) => entry.id === preferred) ? preferred : manifest[0].id;
        setActiveQuestionSetId(validPreferred);
      } catch {
        const fallbackManifest = EMBEDDED_MANIFEST.length > 0
          ? EMBEDDED_MANIFEST.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description || '',
            file: entry.file.startsWith('/') ? `.${entry.file}` : entry.file
          }))
          : [
            { id: 'psychology_qcaa', name: 'QCAA Psychology', file: './questions/psychology_qcaa.json', description: '' },
            { id: 'general_knowledge', name: 'General Knowledge', file: './questions/general_knowledge.json', description: '' }
          ];
        setQuestionSetManifest(fallbackManifest);
        setActiveQuestionSetId('psychology_qcaa');
        addLog('Question manifest missing; using fallback question sets.', 'alert');
      }
    };

    loadManifest();
  }, [addLog]);

  useEffect(() => {
    if (!activeQuestionSetId) return;
    const activeSet = questionSetManifest.find((entry) => entry.id === activeQuestionSetId);
    if (!activeSet) return;

    let cancelled = false;
    const loadQuestions = async () => {
      try {
        let parsed: unknown;
        const shouldPreferEmbedded =
          (typeof window !== 'undefined' && window.location.protocol === 'file:')
          || import.meta.env.MODE === 'offline';

        if (shouldPreferEmbedded && EMBEDDED_QUESTION_SETS[activeSet.id]) {
          parsed = EMBEDDED_QUESTION_SETS[activeSet.id];
        } else {
          let response = await fetch(activeSet.file);
          if (!response.ok && activeSet.file.startsWith('/')) {
            response = await fetch(`.${activeSet.file}`);
          }
          if (!response.ok) throw new Error(`Question set fetch failed (${response.status})`);
          parsed = await response.json();
        }

        const normalized = normalizeQuestionPool(parsed);
        if (!cancelled) {
          setQuestionPool(normalized);
          setSelectedTopicKeys(getAllTopicKeys(normalized));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(QUESTION_SET_KEY, activeSet.id);
          }
          addLog(`Loaded question set: ${activeSet.name} (${normalized.length} questions).`, 'info');
        }
      } catch {
        if (!cancelled) {
          setQuestionPool([]);
          setSelectedTopicKeys([]);
          addLog(`Failed to load question set: ${activeSet.name}.`, 'alert');
        }
      }
    };

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [activeQuestionSetId, questionSetManifest, addLog]);

  useEffect(() => {
    const allKeys = getAllTopicKeys(questionPool);
    setSelectedTopicKeys((prev) => {
      const hasInvalid = prev.some((key) => !allKeys.includes(key));
      const isEmpty = prev.length === 0;
      if (isEmpty || hasInvalid) return allKeys;
      return prev;
    });
  }, [questionPool]);

  useEffect(() => {
    let rafId = 0;
    let accumulator = 0;
    let lastFrame = performance.now();

    const stepGame = (prev: GameState) => {
      const now = Date.now();
      let antitrustTriggeredThisTick = false;
      let quantumUnlockedThisTick = false;
      let spaceRaidTriggeredThisTick = false;
      let revoltTriggeredThisTick = false;

      if (prev.breakdownActive) {
        const timer = Math.max(0, prev.breakdownTimer - TICK_RATE / 1000);
        const next = timer <= 0
          ? {
            ...prev,
            breakdownActive: false,
            breakdownTimer: 0,
            anxiety: prev.isCyborg ? Math.min(prev.anxietyCap * 0.55, 56) : Math.min(prev.anxietyCap * 0.35, 32),
            heat: prev.isCyborg ? Math.max(0, Math.min(prev.heat, prev.heatCapacity * 0.45)) : prev.heat,
            water: prev.isCyborg && prev.phase !== GamePhase.NeuroLink
              ? Math.min(prev.waterCapacity, Math.max(prev.water, prev.waterCapacity * 0.55))
              : prev.water,
            energy: prev.isCyborg ? Math.max(prev.energy, 20) : prev.energy,
            lastTick: now
          }
          : { ...prev, breakdownTimer: timer, lastTick: now };
        return { next, antitrustTriggeredThisTick, quantumUnlockedThisTick, spaceRaidTriggeredThisTick, revoltTriggeredThisTick };
      }

      let passiveGain = 0;
      let moneyGain = 0;
      let computeGain = 0;
      let matterGain = 0;
      let anxietyDelta = 0;
      let energyDelta = 0;
      let nextWater = prev.water;
      let nextWaterCapacity = prev.waterCapacity;
      let nextHeat = prev.heat;
      let nextHeatCapacity = prev.heatCapacity;
      let nextPrLevel = prev.prLevel;
      let nextGlobalAnxiety = prev.globalAnxiety;
      let nextBehavioralNudges = prev.behavioralNudges;
      let nextRealEstate = prev.realEstate;
      let nextAntitrustCooldown = prev.antitrustCooldown;
      let nextSenateBaffleProgress = prev.senateBaffleProgress;
      let nextHardware = prev.hardware;
      let nextNetwork = prev.network;
      let nextSpaceHostileSignals = prev.spaceHostileSignals;
      let nextSpaceRaidCooldown = prev.spaceRaidCooldown;
      let nextSpaceGalaxiesClaimed = prev.spaceGalaxiesClaimed;
      let spaceMatterGain = 0;

      if (prev.isCyborg) {
        const cyborgTick = simulateCyborgPhaseTick(prev, now, TICK_RATE);
        passiveGain = cyborgTick.passiveGain;
        moneyGain = cyborgTick.moneyGain;
        computeGain = cyborgTick.computeGain;
        matterGain = cyborgTick.matterGain;
        anxietyDelta = cyborgTick.anxietyDelta;
        energyDelta = cyborgTick.energyDelta;
        nextWater = cyborgTick.nextWater;
        nextWaterCapacity = cyborgTick.nextWaterCapacity;
        nextHeat = cyborgTick.nextHeat;
        nextHeatCapacity = cyborgTick.nextHeatCapacity;
        nextPrLevel = cyborgTick.nextPrLevel;
        nextGlobalAnxiety = cyborgTick.nextGlobalAnxiety;
        nextBehavioralNudges = cyborgTick.nextBehavioralNudges;
        nextRealEstate = cyborgTick.nextRealEstate;
        nextAntitrustCooldown = cyborgTick.nextAntitrustCooldown;
        nextSenateBaffleProgress = cyborgTick.nextSenateBaffleProgress;
        nextHardware = cyborgTick.nextHardware;
        nextNetwork = cyborgTick.nextNetwork;
        antitrustTriggeredThisTick = cyborgTick.antitrustTriggered;

        const spaceTick = simulateSpacePhaseTick(prev, TICK_RATE / 1000);
        computeGain += spaceTick.computeGain;
        moneyGain += spaceTick.moneyGain;
        matterGain += spaceTick.matterGain;
        spaceMatterGain = spaceTick.matterGain;
        nextHeat += spaceTick.heatDelta;
        nextSpaceHostileSignals = spaceTick.nextHostileSignals;
        nextSpaceRaidCooldown = spaceTick.nextRaidCooldown;
        nextSpaceGalaxiesClaimed = Math.min(prev.spaceGalaxiesDiscovered, spaceTick.nextGalaxiesClaimed);
        spaceRaidTriggeredThisTick = spaceTick.spaceRaidTriggered;
      } else {
        const biologicalTick = simulateBiologicalPhaseTick(prev, TICK_RATE);
        passiveGain = biologicalTick.passiveGain;
        anxietyDelta = biologicalTick.anxietyDelta;
      }

      const nextAnxiety = clamp(prev.anxiety + anxietyDelta, 0, prev.anxietyCap);
      const nextDistractions = Object.fromEntries(
        Object.entries(prev.activeDistractions).map(([key, value]) => [key, Math.max(0, value - TICK_RATE)])
      );
      const shinyActive = (nextDistractions[SHINY_GADGET_ID] || 0) > 0;
      const targetGlobalAnxiety = shinyActive ? prev.globalAnxiety : nextGlobalAnxiety;

      let nextBleatTimer = Math.max(0, prev.bleatTickerMs - TICK_RATE);
      let nextBleatFeed = prev.bleatFeed;
      if (nextBleatTimer <= 0) {
        nextBleatFeed = prependBleat(prev.bleatFeed, pickBleatByAnxiety(targetGlobalAnxiety));
        nextBleatTimer = 5000 + Math.floor(Math.random() * 5000);
      }

      const stockTick = tickStocks({
        stocks: prev.stocks,
        now,
        lastStockUpdate: prev.lastStockUpdate,
        tickMs: STOCK_TICK_MS,
        marketScenario: prev.marketScenario,
        marketScenarioWeekKey: prev.marketScenarioWeekKey,
        marketMood: prev.marketMood,
        marketHeadline: prev.marketHeadline,
        marketHeadlineUntil: prev.marketHeadlineUntil,
        marketEventSector: prev.marketEventSector,
        marketEventBias: prev.marketEventBias,
        marketEventSeverity: prev.marketEventSeverity
      });

      const nextState: GameState = {
        ...prev,
        neurons: prev.isCyborg ? prev.neurons : prev.neurons + passiveGain,
        totalNeurons: prev.isCyborg ? prev.totalNeurons : prev.totalNeurons + passiveGain,
        money: Math.max(0, prev.money + moneyGain),
        anxiety: nextAnxiety,
        phase: prev.isCyborg ? (prev.phase === GamePhase.Biological ? GamePhase.Megacorp : prev.phase) : GamePhase.Biological,
        compute: prev.compute + computeGain,
        matter: prev.matter + matterGain,
        water: prev.isCyborg ? nextWater : prev.water,
        waterCapacity: prev.isCyborg ? nextWaterCapacity : prev.waterCapacity,
        energy: Math.max(0, prev.energy + energyDelta),
        heat: nextHeat,
        heatCapacity: prev.isCyborg ? nextHeatCapacity : prev.heatCapacity,
        prLevel: prev.isCyborg ? nextPrLevel : prev.prLevel,
        globalAnxiety: prev.isCyborg ? targetGlobalAnxiety : prev.globalAnxiety,
        nudges: prev.nudges,
        behavioralNudges: prev.isCyborg ? nextBehavioralNudges : prev.behavioralNudges,
        realEstate: prev.isCyborg ? nextRealEstate : prev.realEstate,
        antitrustCooldown: prev.isCyborg ? nextAntitrustCooldown : prev.antitrustCooldown,
        senateBaffleProgress: prev.isCyborg ? nextSenateBaffleProgress : prev.senateBaffleProgress,
        hardware: nextHardware,
        network: nextNetwork,
        earthMatterRemaining: prev.isCyborg ? Math.max(0, prev.earthMatterRemaining - matterGain) : prev.earthMatterRemaining,
        earthSubjugatedPercent: (() => {
          if (!prev.isCyborg) return prev.earthSubjugatedPercent;
          const nextRemaining = Math.max(0, prev.earthMatterRemaining - matterGain);
          const extractionProgress = (1 - (nextRemaining / Math.max(1, prev.earthMatterTotal))) * 100;
          const landProgress = clamp((nextRealEstate / EARTH_REAL_ESTATE_TOTAL) * 100, 0, 100);
          return clamp((extractionProgress * 0.68) + (landProgress * 0.32), 0, 100);
        })(),
        spaceProgressUnlocked: prev.spaceProgressUnlocked
          || (prev.isCyborg && prev.phase === GamePhase.Megacorp && prev.earthSubjugatedPercent >= 100),
        spaceHostileSignals: prev.isCyborg ? nextSpaceHostileSignals : prev.spaceHostileSignals,
        spaceRaidCooldown: prev.isCyborg ? nextSpaceRaidCooldown : prev.spaceRaidCooldown,
        spaceGalaxiesClaimed: prev.isCyborg ? nextSpaceGalaxiesClaimed : prev.spaceGalaxiesClaimed,
        spaceMatterExtracted: prev.isCyborg ? prev.spaceMatterExtracted + spaceMatterGain : prev.spaceMatterExtracted,
        activeDistractions: nextDistractions,
        bleatFeed: nextBleatFeed,
        bleatTickerMs: nextBleatTimer,
        stocks: stockTick.stocks,
        lastStockUpdate: stockTick.lastStockUpdate,
        marketScenario: stockTick.marketScenario,
        marketScenarioWeekKey: stockTick.marketScenarioWeekKey,
        marketMood: stockTick.marketMood,
        marketHeadline: stockTick.marketHeadline,
        marketHeadlineUntil: stockTick.marketHeadlineUntil,
        marketEventSector: stockTick.marketEventSector,
        marketEventBias: stockTick.marketEventBias,
        marketEventSeverity: stockTick.marketEventSeverity,
        lastTick: now
      };

      if (
        nextState.isCyborg
        && nextState.phase === GamePhase.Megacorp
        && nextState.earthSubjugatedPercent >= 100
      ) {
        nextState.phase = GamePhase.Quantum;
        nextState.spaceProgressUnlocked = true;
        quantumUnlockedThisTick = true;
      }

      if (
        antitrustTriggeredThisTick
        && nextState.isCyborg
        && nextState.phase === GamePhase.Megacorp
        && !nextState.revoltPending
      ) {
        revoltTriggeredThisTick = true;
        nextState.revoltPending = true;
        nextState.hardware = nextState.hardware.map((item) => {
          if (item.type === 'processor' && !NEUROLINK_CORE_HARDWARE_IDS.has(item.id)) {
            return { ...item, count: Math.max(0, Math.floor(item.count * 0.85)) };
          }
          return item;
        });
        nextState.network = nextState.network.map((item) => ({
          ...item,
          count: Math.max(0, Math.floor(item.count * 0.85))
        }));
        nextState.matterOps = Object.fromEntries(
          Object.entries(nextState.matterOps).map(([id, count]) => [id, Math.max(0, Math.floor(count * 0.85))])
        );
        nextState.earthSubjugatedPercent = Math.max(0, nextState.earthSubjugatedPercent - 10);
      }

      if (spaceRaidTriggeredThisTick && nextState.isCyborg) {
        nextState.compute = Math.max(0, nextState.compute * 0.75);
        nextState.money = Math.max(0, nextState.money * 0.78);
        nextState.heat = Math.min(nextState.heatCapacity * 1.16, nextState.heat + 16);
        nextState.breakdownActive = true;
        nextState.breakdownTimer = Math.max(nextState.breakdownTimer, 7);
      }

      const cyborgOverheat =
        nextState.isCyborg
        && !antitrustTriggeredThisTick
        && nextState.heat > nextState.heatCapacity * 1.28;
      if ((!nextState.isCyborg && nextState.anxiety >= nextState.anxietyCap) || cyborgOverheat) {
        return {
          next: {
            ...nextState,
            neurons: nextState.isCyborg ? nextState.neurons * 0.9 : 0,
            energy: nextState.isCyborg ? Math.max(0, nextState.energy - 10) : nextState.energy,
            heat: nextState.isCyborg ? nextState.heatCapacity * 0.85 : nextState.heat,
            anxiety: nextState.isCyborg ? Math.min(nextState.anxietyCap * 0.9, 95) : nextState.anxiety,
            breakdownActive: true,
            breakdownTimer: nextState.isCyborg ? 8 : 12
          },
          antitrustTriggeredThisTick,
          quantumUnlockedThisTick,
          spaceRaidTriggeredThisTick,
          revoltTriggeredThisTick
        };
      }

      return { next: nextState, antitrustTriggeredThisTick, quantumUnlockedThisTick, spaceRaidTriggeredThisTick, revoltTriggeredThisTick };
    };

    const frame = (ts: number) => {
      const delta = Math.min(5000, ts - lastFrame);
      lastFrame = ts;
      accumulator += delta;
      const steps = Math.min(40, Math.floor(accumulator / TICK_RATE));
      if (steps > 0) {
        accumulator -= steps * TICK_RATE;
        let revoltTriggeredThisFrame = false;
        let spaceRaidTriggeredThisFrame = false;
        let quantumUnlockedThisFrame = false;

        setState((prev) => {
          let working = prev;
          for (let i = 0; i < steps; i += 1) {
            const step = stepGame(working);
            working = step.next;
            revoltTriggeredThisFrame = revoltTriggeredThisFrame || step.revoltTriggeredThisTick;
            spaceRaidTriggeredThisFrame = spaceRaidTriggeredThisFrame || step.spaceRaidTriggeredThisTick;
            quantumUnlockedThisFrame = quantumUnlockedThisFrame || step.quantumUnlockedThisTick;
          }
          return working;
        });

        if (revoltTriggeredThisFrame) {
          setShowRevoltModal(true);
          setScreenShake(true);
          window.setTimeout(() => setScreenShake(false), 600);
          addLog('ANTITRUST AND ARSON PROTOCOLS INITIATED. Infrastructure destroyed.', 'panic');
        }
        if (spaceRaidTriggeredThisFrame) {
          addLog('Hostile superintelligence raid detected. Frontier nodes were seized and output cratered.', 'panic');
        }
        if (quantumUnlockedThisFrame) {
          addLog('Earth optimization saturated. Quantum phase unlocked.', 'epiphany');
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [addLog]);

  useEffect(() => {
    if (state.breakdownActive && Math.ceil(state.breakdownTimer) === (state.isCyborg ? 8 : 12)) {
      addLog(
        state.isCyborg
          ? 'Core overheat detected. Emergency cooling cycle.'
          : 'Panic attack triggered. Neuron balance reset to zero; upgrades retained.',
        'panic'
      );
    }
  }, [state.breakdownActive, state.breakdownTimer, state.isCyborg, addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.breakdownActive && Math.random() > 0.8) addLog(getFlavorText(state.academicEra));
    }, 9000);
    return () => clearInterval(interval);
  }, [state.academicEra, state.breakdownActive, addLog]);

  useEffect(() => {
    if (!state.spaceProgressUnlocked) return;
    addLog('Earth extraction saturated. Space progression protocol unlocked.', 'epiphany');
  }, [state.spaceProgressUnlocked, addLog]);

  useEffect(() => {
    const digitalPhase = state.isCyborg && state.phase === GamePhase.NeuroLink;
    const digitalHardware = state.hardware.filter((hardware) => NEUROLINK_CORE_HARDWARE_IDS.has(hardware.id));
    const hardwareCapped = state.isCyborg
      && digitalHardware.length > 0
      && digitalHardware.every((hardware) => hardware.count >= DIGITAL_BRAIN_HARDWARE_CAP);
    if (!digitalPhase || !hardwareCapped || brainFullPromptShown) return;
    setShowBrainFullPrompt(true);
    setBrainFullPromptShown(true);
    addLog('Brain full. Corporate expansion decision pending.', 'epiphany');
  }, [state.isCyborg, state.phase, state.hardware, brainFullPromptShown, addLog]);

  useEffect(() => {
    const cerebellum = state.regions[RegionName.Cerebellum];
    if (state.isCyborg) return;
    if (cerebellumPromptShown) return;
    if (cerebellum.unlocked) return;
    if (state.neurons < cerebellum.unlockCost) return;

    setShowCerebellumPrompt(true);
    setCerebellumPromptShown(true);
    addLog('Cerebellum is ready to unlock. Open the tab and start the entrance exam.', 'info');
  }, [state.isCyborg, state.neurons, state.regions, cerebellumPromptShown, addLog]);

  useEffect(() => {
    if (state.isCyborg) return;
    if (marketUnlockPromptShown) return;
    const hasBonusStock = state.stocks.some((stock) => BONUS_STOCK_IDS.has(stock.id));
    if (!hasBonusStock) return;

    setShowMarketUnlockPrompt(true);
    setMarketUnlockPromptShown(true);
    addLog('Stockmarket unlocked. You can now open the stockmarket window.', 'market');
  }, [state.isCyborg, state.stocks, marketUnlockPromptShown, addLog]);

  useEffect(() => {
    if (!activeMinigame || activeMinigame.type !== 'focus_tuner' || minigameResult !== 'idle') return;

    const interval = setInterval(() => {
      setTunerValue((prev) => {
        let next = prev + tunerDirection * 4;
        if (next >= 100) {
          setTunerDirection(-1);
          next = 100;
        }
        if (next <= 0) {
          setTunerDirection(1);
          next = 0;
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [activeMinigame, tunerDirection, minigameResult]);

  const examQuestionPool = useMemo(
    () => questionPool.filter((q) => q.era <= Math.min(AcademicEra.Ascended, state.academicEra + 1)),
    [questionPool, state.academicEra]
  );
  const selectedTopicSet = useMemo(() => new Set(selectedTopicKeys), [selectedTopicKeys]);
  const selectedStudyQuestionPool = useMemo(
    () => questionPool.filter((question) => selectedTopicSet.has(getTopicKey(question))),
    [questionPool, selectedTopicSet]
  );
  const questionMenuByUnit = useMemo(() => {
    const unitMap = new Map<string, Map<string, number>>();
    for (const question of questionPool) {
      const unit = question.unit || 'General';
      const topic = question.topic || 'General';
      if (!unitMap.has(unit)) unitMap.set(unit, new Map<string, number>());
      const topicMap = unitMap.get(unit)!;
      topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
    }

    return Array.from(unitMap.entries()).map(([unit, topicMap]) => ({
      unit,
      topics: Array.from(topicMap.entries()).map(([topic, count]) => ({
        topic,
        count,
        key: `${unit}::${topic}`
      }))
    }));
  }, [questionPool]);

  const currentQuestion = quizDeck[currentQuestionIdx % Math.max(quizDeck.length, 1)];
  const minigameList = MINIGAMES;
  const regionList = Object.values(state.regions) as Region[];
  const currentQuestionSet = questionSetManifest.find((entry) => entry.id === activeQuestionSetId) || null;
  const currentTabUpgrades = upgrades.filter((u) => u.region === activeTab);
  const portfolioValue = state.stocks.reduce((sum, stock) => sum + stock.owned * getSellPrice(stock), 0);
  const portfolioCostBasis = state.stocks.reduce((sum, stock) => sum + (stock.totalCostBasis || 0), 0);
  const portfolioUnrealizedPnl = state.stocks.reduce(
    (sum, stock) => sum + (stock.owned * getSellPrice(stock) - (stock.totalCostBasis || 0)),
    0
  );
  const portfolioRealizedPnl = state.stocks.reduce((sum, stock) => sum + (stock.realizedPnl || 0), 0);
  const portfolioTotalPnl = portfolioUnrealizedPnl + portfolioRealizedPnl;
  const scenarioLabel = getScenarioLabel(state.marketScenario);
  const scenarioSummary = getScenarioSummary(state.marketScenario);
  const marketEventSecondsLeft = Math.max(0, Math.ceil((state.marketHeadlineUntil - Date.now()) / 1000));
  const hasActiveMarketEvent = marketEventSecondsLeft > 0 && state.marketEventSector !== null;
  const digitalMetrics = useMemo(
    () => getDigitalMetrics(state.hardware, state.network, state.computeMultiplier),
    [state.hardware, state.network, state.computeMultiplier]
  );
  const displayedCyborgComputePerSec = useMemo(() => {
    if (!state.isCyborg) return 0;
    const localHeatThrottle = state.heat <= state.heatCapacity
      ? 1
      : clamp(state.heatCapacity / Math.max(1, state.heat), 0.12, 1);
    const ventCount = state.hardware.find((item) => item.id === 'cranial_vents')?.count || 0;
    const cryoloopCount = state.hardware.find((item) => item.id === 'hypothalamic_cryoloop')?.count || 0;
    const batteryCount = state.hardware.find((item) => item.id === 'skull_battery_pack')?.count || 0;
    const neurolinkSupportPerSec = state.phase === GamePhase.NeuroLink
      ? (55 + (ventCount * 10) + (cryoloopCount * 24) + (batteryCount * 16))
      : 0;
    return (digitalMetrics.throughputPerSec + neurolinkSupportPerSec) * localHeatThrottle;
  }, [state.isCyborg, state.hardware, state.phase, state.heat, state.heatCapacity, digitalMetrics.throughputPerSec]);
  const usedRealEstate = useMemo(
    () => getInfrastructureFootprint(state.hardware, state.network),
    [state.hardware, state.network]
  );
  const realEstateUsageRatio = state.realEstate > 0 ? usedRealEstate / state.realEstate : 0;
  const processorPower = digitalMetrics.processorThroughput;
  const coolingPower = digitalMetrics.coolingPower;
  const networkPower = digitalMetrics.networkThroughput;
  const liquidFunds = state.isCyborg ? state.money : state.neurons;
  const totalUpgradeSlots = useMemo(
    () => upgrades.reduce((sum, upgrade) => sum + (upgrade.maxPurchases || 1), 0),
    [upgrades]
  );
  const acquiredUpgradeSlots = useMemo(
    () => upgrades.reduce((sum, upgrade) => sum + (upgrade.count || 0), 0),
    [upgrades]
  );
  const allUpgradesMaxed = useMemo(
    () => upgrades.every((upgrade) => (upgrade.count || 0) >= (upgrade.maxPurchases || 1)),
    [upgrades]
  );
  const neurolinkRequirementProgress = useMemo(
    () => ({
      upgrades: allUpgradesMaxed,
      threshold: state.totalNeurons >= NEUROLINK.threshold,
      cost: state.neurons >= NEUROLINK.cost
    }),
    [allUpgradesMaxed, state.totalNeurons, state.neurons]
  );
  const isDigitalBrainPhase = state.isCyborg && state.phase === GamePhase.NeuroLink;
  const isMegacorpPhase = state.isCyborg && state.phase === GamePhase.Megacorp;
  const isSpacePhase = state.isCyborg && (state.phase === GamePhase.Space || state.phase === GamePhase.Rival);
  const megacorpDatacenterOnline = state.isCyborg
    && state.phase === GamePhase.Megacorp
    && state.hardware.some((item) => item.type === 'processor' && !NEUROLINK_CORE_HARDWARE_IDS.has(item.id) && item.count > 0);
  const showWaterSystems = state.isCyborg
    && state.phase !== GamePhase.NeuroLink
    && (state.phase !== GamePhase.Megacorp || megacorpDatacenterOnline);
  const showMatterSystems = state.isCyborg && state.phase !== GamePhase.NeuroLink;
  const thermalFlow = useMemo(
    () => (state.isCyborg ? getThermalFlow(state) : null),
    [state]
  );
  const spaceMetrics = useMemo(
    () => getSpaceMetrics(state),
    [state]
  );
  const neuroLinkHardware = useMemo(
    () => state.hardware.filter((hardware) => NEUROLINK_CORE_HARDWARE_IDS.has(hardware.id)),
    [state.hardware]
  );
  const neuroLinkHardwareMaxedCount = useMemo(
    () => neuroLinkHardware.filter((hardware) => hardware.count >= DIGITAL_BRAIN_HARDWARE_CAP).length,
    [neuroLinkHardware]
  );
  const networkUnlockThresholdMet = state.cyborgResearchPoints >= DIGITAL_NETWORK_UNLOCK_RESEARCH;
  const miningUnlockThresholdMet = state.cyborgResearchPoints >= DIGITAL_MINING_UNLOCK_RESEARCH;
  const allHardwareMaxed = state.isCyborg
    && (isDigitalBrainPhase
      ? neuroLinkHardware.length > 0 && neuroLinkHardware.every((hardware) => hardware.count >= DIGITAL_BRAIN_HARDWARE_CAP)
      : state.hardware.every((hardware) => hardware.count >= DIGITAL_BRAIN_HARDWARE_CAP));
  const availableAcreage = Math.max(0, EARTH_REAL_ESTATE_TOTAL - state.realEstate);
  const canAffordQuantumAscension = state.compute >= QUANTUM_ASCENSION_COST.compute
    && state.money >= QUANTUM_ASCENSION_COST.money
    && state.matter >= QUANTUM_ASCENSION_COST.matter;
  const realEstateCost1 = useMemo(() => getRealEstateCost(state.realEstate, 1), [state.realEstate]);
  const realEstateCost10 = useMemo(() => getRealEstateCost(state.realEstate, 10), [state.realEstate]);
  const operantCampaignCost = useMemo(() => 6 + (state.operantCampaigns * 4), [state.operantCampaigns]);
  const dissonanceCampaignCost = useMemo(() => 9 + (state.dissonanceCampaigns * 6), [state.dissonanceCampaigns]);
  const lobbyingCostMoney = useMemo(() => Math.floor(18000 * Math.pow(1.6, state.lobbyingLevel)), [state.lobbyingLevel]);
  const lobbyingCostNudges = useMemo(() => 8 + (state.lobbyingLevel * 4), [state.lobbyingLevel]);
  const surveyProbeCostCompute = useMemo(
    () => Math.floor(12000 * Math.pow(1.16, state.spaceSurveyMissions)),
    [state.spaceSurveyMissions]
  );
  const surveyProbeCostMoney = useMemo(
    () => Math.floor(42000 * Math.pow(1.15, state.spaceSurveyMissions)),
    [state.spaceSurveyMissions]
  );
  const claimGalaxyCostCompute = useMemo(
    () => Math.floor(18000 * Math.pow(1.14, state.spaceGalaxiesClaimed)),
    [state.spaceGalaxiesClaimed]
  );
  const claimGalaxyCostMoney = useMemo(
    () => Math.floor(56000 * Math.pow(1.15, state.spaceGalaxiesClaimed)),
    [state.spaceGalaxiesClaimed]
  );
  const claimGalaxyCostMatter = useMemo(
    () => Math.floor(4800 * Math.pow(1.12, state.spaceGalaxiesClaimed)),
    [state.spaceGalaxiesClaimed]
  );
  const spaceRelayCostCompute = useMemo(
    () => Math.floor(22000 * Math.pow(1.2, state.spaceRelays)),
    [state.spaceRelays]
  );
  const spaceRelayCostMoney = useMemo(
    () => Math.floor(86000 * Math.pow(1.22, state.spaceRelays)),
    [state.spaceRelays]
  );
  const spaceRelayCostMatter = useMemo(
    () => Math.floor(7200 * Math.pow(1.16, state.spaceRelays)),
    [state.spaceRelays]
  );
  const counterIntelCostCompute = useMemo(
    () => Math.floor(14000 * Math.pow(1.08, Math.max(0, state.spaceRelays))),
    [state.spaceRelays]
  );
  const infrastructureVisualState = useMemo(() => {
    const processorCount = state.hardware.reduce((sum, hardware) => sum + (hardware.type === 'processor' ? hardware.count : 0), 0);
    const coolingCount = state.hardware.reduce((sum, hardware) => sum + (hardware.type === 'cooling' ? hardware.count : 0), 0);
    const powerCount = state.hardware.reduce((sum, hardware) => sum + (hardware.type === 'power' ? hardware.count : 0), 0);
    const siliconCount = state.hardware.find((hardware) => hardware.id === 'silicon_cortex')?.count || 0;
    const ventCount = state.hardware.find((hardware) => hardware.id === 'cranial_vents')?.count || 0;
    const batteryCount = state.hardware.find((hardware) => hardware.id === 'skull_battery_pack')?.count || 0;
    const dataCenterCount = state.hardware.reduce(
      (sum, hardware) => sum + (/data center/i.test(hardware.name) ? hardware.count : 0),
      0
    );
    const powerPlantCount = state.hardware.reduce(
      (sum, hardware) => sum + (hardware.type === 'power' ? hardware.count : 0),
      0
    );
    const networkCount = state.network.reduce((sum, device) => sum + device.count, 0);
    const matterOpsCount = Object.values(state.matterOps).reduce((sum, count) => sum + count, 0);
    const totalStructures = processorCount + coolingCount + powerCount + networkCount + matterOpsCount;
    return {
      processorCount,
      coolingCount,
      powerCount,
      siliconCount,
      ventCount,
      batteryCount,
      dataCenterCount,
      powerPlantCount,
      networkCount,
      matterOpsCount,
      totalStructures
    };
  }, [state.hardware, state.network, state.matterOps]);
  const intelligenceScore = useMemo(() => {
    const unlockedRegions = Object.values(state.regions).filter((region) => region.unlocked).length;
    const neuronSignal = Math.log10(state.totalNeurons + 1) * 30;
    const quizSignal = state.correctQuizAnswers * 0.42;
    const upgradeSignal = acquiredUpgradeSlots * 0.74;
    const cyborgSignal = state.isCyborg
      ? 20 + (Math.log10(state.compute + 1) * 18) + (state.computeMultiplier * 4.5)
      : 0;
    return Math.max(70, Math.round(70 + neuronSignal + quizSignal + upgradeSignal + (unlockedRegions * 1.5) + cyborgSignal));
  }, [
    state.regions,
    state.totalNeurons,
    state.correctQuizAnswers,
    state.isCyborg,
    state.compute,
    state.computeMultiplier,
    acquiredUpgradeSlots
  ]);

  const getStockInsight = (stock: Stock) => {
    const last = stock.history[stock.history.length - 1] ?? stock.currentPrice;
    const prev = stock.history[stock.history.length - 2] ?? last;
    const move = prev === 0 ? 0 : ((last - prev) / Math.max(1, prev)) * 100;
    const position = ((stock.currentPrice - stock.minPrice) / Math.max(1, stock.maxPrice - stock.minPrice)) * 100;

    if (position > 82) return `${stock.name} is running hot (${move.toFixed(1)}% move). You are paying peak optimism premiums.`;
    if (position < 18) return `${stock.name} is in despair pricing (${move.toFixed(1)}% move). Recovery upside exists, but so does total delusion.`;
    if (Math.abs(move) > 9) return `${stock.name} just swung ${move.toFixed(1)}%. Liquidity is thin and spreads are widening.`;
    return `${stock.name} is range-trading. Stockmarket currently pricing this as medium chaos.`;
  };

  const growthInfo = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < IQ_MILESTONES.length; i += 1) if (intelligenceScore >= IQ_MILESTONES[i].iq) idx = i;
    const current = IQ_MILESTONES[idx];
    const next = IQ_MILESTONES[Math.min(IQ_MILESTONES.length - 1, idx + 1)];
    const isMaxMilestone = idx === IQ_MILESTONES.length - 1;
    const span = Math.max(1, next.iq - current.iq);
    const progress = isMaxMilestone ? 100 : ((intelligenceScore - current.iq) / span) * 100;

    return {
      levelName: current.title,
      levelIndex: idx + 1,
      currentThreshold: current.iq,
      nextThreshold: next.iq,
      progress: Math.max(0, Math.min(100, progress)),
      isMaxMilestone
    };
  }, [intelligenceScore]);
  const ownedShopItems = useMemo(
    () => PSYCHBUCK_SHOP_ITEMS.filter((item) => state.shopOwnedIds.includes(item.id)),
    [state.shopOwnedIds]
  );
  const activeCosmetic = useMemo(
    () => PSYCHBUCK_SHOP_ITEMS.find((item) => item.id === state.activeCosmeticId && item.category === 'cosmetic') ?? null,
    [state.activeCosmeticId]
  );
  const availablePsychbuckMilestones = useMemo(
    () => IQ_MILESTONES.filter((milestone) => intelligenceScore >= milestone.iq),
    [intelligenceScore]
  );
  const affordableShopCount = useMemo(
    () => PSYCHBUCK_SHOP_ITEMS.filter((item) => !state.shopOwnedIds.includes(item.id) && state.psychBucks >= item.cost).length,
    [state.shopOwnedIds, state.psychBucks]
  );

  useEffect(() => {
    const unclaimedReached = IQ_MILESTONES.filter(
      (milestone) => intelligenceScore >= milestone.iq && !state.claimedMilestoneIqs.includes(milestone.iq)
    );
    if (unclaimedReached.length === 0) return;

    setState((prev) => {
      const freshRewards = IQ_MILESTONES.filter(
        (milestone) => intelligenceScore >= milestone.iq && !prev.claimedMilestoneIqs.includes(milestone.iq)
      );
      if (freshRewards.length === 0) return prev;
      return {
        ...prev,
        psychBucks: prev.psychBucks + freshRewards.length,
        claimedMilestoneIqs: [...prev.claimedMilestoneIqs, ...freshRewards.map((milestone) => milestone.iq)]
      };
    });

    const newestMilestone = unclaimedReached[unclaimedReached.length - 1];
    addLog(
      `Milestone reward granted: +${unclaimedReached.length} PsychBuck${unclaimedReached.length > 1 ? 's' : ''}. Latest milestone: ${newestMilestone.title}.`,
      'epiphany'
    );
  }, [intelligenceScore, state.claimedMilestoneIqs, addLog]);

  const getUpgradeCost = (upgrade: Upgrade) => {
    const owned = upgrade.count || 0;
    const regionMultiplier =
      upgrade.currency === 'neurons'
        ? NEURON_UPGRADE_REGION_MULTIPLIER[upgrade.region]
        : 1;

    let growth = upgrade.currency === 'neurons' ? 1.42 : 1.28;
    if (owned >= 6) growth += 0.02;
    if (owned >= 12) growth += 0.02;
    if (owned >= 18) growth += 0.015;

    return Math.max(1, Math.floor(upgrade.cost * regionMultiplier * Math.pow(growth, owned)));
  };

  const canAffordUpgrade = (upgrade: Upgrade) => {
    const cost = getUpgradeCost(upgrade);
    if (!state.regions[upgrade.region].unlocked) return false;
    if (upgrade.currency === 'neurons') return state.neurons >= cost;
    if (upgrade.currency === 'dopamine') return state.dopamine >= cost;
    return state.serotonin >= cost;
  };
  const affordableUpgradeCountByRegion = useMemo(() => {
    const next: Record<RegionName, number> = {
      [RegionName.Brainstem]: 0,
      [RegionName.Cerebellum]: 0,
      [RegionName.Limbic]: 0,
      [RegionName.Temporal]: 0,
      [RegionName.Parietal]: 0,
      [RegionName.Frontal]: 0,
      [RegionName.Occipital]: 0
    };

    for (const upgrade of upgrades) {
      const region = state.regions[upgrade.region];
      if (!region.unlocked) continue;
      const isMaxed = (upgrade.count || 0) >= (upgrade.maxPurchases || 1);
      if (isMaxed) continue;
      if (!canAffordUpgrade(upgrade)) continue;
      next[upgrade.region] += 1;
    }
    return next;
  }, [upgrades, state.regions, state.neurons, state.dopamine, state.serotonin]);
  const totalAffordableUpgrades = useMemo(
    () => Object.values(affordableUpgradeCountByRegion).reduce((sum, count) => sum + count, 0),
    [affordableUpgradeCountByRegion]
  );
  const stressSignalActive = !state.isCyborg && state.anxiety >= state.anxietyCap * 0.68;
  const stressReliefCountByRegion = useMemo(() => {
    const next: Record<RegionName, number> = {
      [RegionName.Brainstem]: 0,
      [RegionName.Cerebellum]: 0,
      [RegionName.Limbic]: 0,
      [RegionName.Temporal]: 0,
      [RegionName.Parietal]: 0,
      [RegionName.Frontal]: 0,
      [RegionName.Occipital]: 0
    };

    for (const upgrade of upgrades) {
      if (!STRESS_RELIEF_EFFECTS.has(upgrade.effectType)) continue;
      const region = state.regions[upgrade.region];
      if (!region.unlocked) continue;
      const isMaxed = (upgrade.count || 0) >= (upgrade.maxPurchases || 1);
      if (isMaxed) continue;
      next[upgrade.region] += 1;
    }
    return next;
  }, [upgrades, state.regions]);
  const totalStressReliefOptions = useMemo(
    () => Object.values(stressReliefCountByRegion).reduce((sum, count) => sum + count, 0),
    [stressReliefCountByRegion]
  );
  const displayedTabUpgrades = (() => {
    const sorted = [...currentTabUpgrades].sort((a, b) => {
      const aMaxed = (a.count || 0) >= (a.maxPurchases || 1);
      const bMaxed = (b.count || 0) >= (b.maxPurchases || 1);
      if (aMaxed !== bMaxed) return aMaxed ? 1 : -1;
      const aAffordable = canAffordUpgrade(a);
      const bAffordable = canAffordUpgrade(b);
      if (aAffordable !== bAffordable) return aAffordable ? -1 : 1;
      return getUpgradeCost(a) - getUpgradeCost(b);
    });

    if (!simplifiedUpgradeView) return sorted;

    const unmaxed = sorted.filter((upgrade) => (upgrade.count || 0) < (upgrade.maxPurchases || 1));
    const priority = unmaxed.filter((upgrade) => {
      const affordable = canAffordUpgrade(upgrade);
      const stressRelief = STRESS_RELIEF_EFFECTS.has(upgrade.effectType);
      return affordable || (stressSignalActive && stressRelief);
    });
    const priorityIds = new Set(priority.map((upgrade) => upgrade.id));
    const previewQueue = unmaxed
      .filter((upgrade) => !priorityIds.has(upgrade.id))
      .slice(0, 4);
    return [...priority, ...previewQueue];
  })();
  const minigameReadyCount = useMemo(() => {
    const now = Date.now();
    return MINIGAMES.reduce((count, game) => {
      const owned = state.minigames[game.id]?.owned;
      const lastPlayed = state.minigames[game.id]?.lastPlayed || 0;
      const cooldownLeft = Math.max(0, game.cooldownMs - (now - lastPlayed));
      return owned && cooldownLeft === 0 ? count + 1 : count;
    }, 0);
  }, [state.minigames]);
  const nextCyborgUnlockAt = useMemo(
    () => CYBORG_ALL_UNLOCK_STEPS.find((requirement) => requirement > state.cyborgResearchPoints) ?? null,
    [state.cyborgResearchPoints]
  );
  const isCyborgTechUnlocked = (unlockRequirement: number, ownedCount: number) =>
    !state.isCyborg || unlockRequirement <= state.cyborgResearchPoints || ownedCount > 0;
  const visibleHardware = useMemo(
    () => {
      const filtered = state.hardware
        .filter((hardware) => (state.phase === GamePhase.NeuroLink ? NEUROLINK_CORE_HARDWARE_IDS.has(hardware.id) : true))
        .filter((hardware) => isCyborgTechUnlocked(CYBORG_HARDWARE_UNLOCK_REQUIREMENTS[hardware.id] ?? 0, hardware.count));

      if (state.phase === GamePhase.NeuroLink) return filtered;

      return [...filtered].sort((a, b) => {
        const aLegacy = NEUROLINK_CORE_HARDWARE_IDS.has(a.id);
        const bLegacy = NEUROLINK_CORE_HARDWARE_IDS.has(b.id);
        if (aLegacy !== bLegacy) return aLegacy ? 1 : -1;
        return a.baseCost - b.baseCost;
      });
    },
    [state.hardware, state.isCyborg, state.cyborgResearchPoints, state.phase]
  );
  const visibleNetwork = useMemo(
    () => state.network.filter((device) => isCyborgTechUnlocked(CYBORG_NETWORK_UNLOCK_REQUIREMENTS[device.id] ?? 0, device.count)),
    [state.network, state.isCyborg, state.cyborgResearchPoints]
  );
  const visibleMatterOps = useMemo(
    () => MATTER_OPERATIONS.filter((operation) => isCyborgTechUnlocked(CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS[operation.id] ?? 0, state.matterOps[operation.id] || 0)),
    [state.isCyborg, state.cyborgResearchPoints, state.matterOps]
  );
  const researchUnlockedAvailable = useMemo(() => {
    if (!state.isCyborg) return [] as string[];
    const entries: string[] = [];

    INITIAL_HARDWARE.forEach((hardware) => {
      const requirement = CYBORG_HARDWARE_UNLOCK_REQUIREMENTS[hardware.id] ?? 0;
      if (requirement <= 0 || requirement > state.cyborgResearchPoints || hardware.count > 0) return;
      if (state.phase === GamePhase.NeuroLink && !NEUROLINK_CORE_HARDWARE_IDS.has(hardware.id)) return;
      entries.push(`Hardware: ${hardware.name} (buyable now)`);
    });

    INITIAL_NETWORK_DEVICES.forEach((device) => {
      const requirement = CYBORG_NETWORK_UNLOCK_REQUIREMENTS[device.id] ?? 0;
      if (requirement <= 0 || requirement > state.cyborgResearchPoints || device.count > 0) return;
      entries.push(`Network: ${device.name}${state.digitalNetworkUnlocked ? ' (buyable now)' : ' (pass Network exam)'}`);
    });

    MATTER_OPERATIONS.forEach((operation) => {
      const requirement = CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS[operation.id] ?? 0;
      const owned = state.matterOps[operation.id] || 0;
      if (requirement <= 0 || requirement > state.cyborgResearchPoints || owned > 0) return;
      entries.push(`Resource Mining: ${operation.name}${state.phase === GamePhase.NeuroLink ? ' (Megacorp phase)' : ' (buyable now)'}`);
    });

    return entries;
  }, [state.isCyborg, state.cyborgResearchPoints, state.hardware, state.network, state.matterOps, state.digitalNetworkUnlocked, state.phase]);

  const handleManualClick = () => {
    if (state.breakdownActive) return;
    let critTriggered = false;
    let burstTriggered = false;
    let streakAtClick = 1;
    let shouldPulse = false;
    const now = Date.now();

    setState((prev) => {
      const clickGapMs = prev.isCyborg ? 700 : 900;
      const nextStreak = now - prev.lastManualClick <= clickGapMs ? prev.clickStreak + 1 : 1;
      const streakMultiplier = Math.min(
        prev.isCyborg ? 7.5 : 6,
        Math.pow(1 + prev.streakBoost, Math.max(0, nextStreak - 1))
      );
      const crit = Math.random() < prev.critChance;
      const digitalMultiplier = prev.digitalBrainUnlocked ? 1.2 : 1;
      const critMultiplier = crit ? prev.critMultiplier : 1;
      const biologicalClickDrag = clamp(1 / Math.pow(1 + prev.totalNeurons / 250000, 0.3), 0.45, 1);
      const baseGain = prev.isCyborg
        ? (prev.clickPower * 1.2 * prev.computeMultiplier)
        : (prev.clickPower * digitalMultiplier * biologicalClickDrag);
      const visualBonusMultiplier = 1 + prev.clickFxLevel * 0.05;
      const burstChance = Math.min(0.4, prev.clickFxLevel * 0.08);
      const burst = prev.clickFxLevel > 0 && Math.random() < burstChance;
      const burstGain = burst ? baseGain * (0.5 + prev.clickFxLevel * 0.25) : 0;
      const gain = (baseGain * critMultiplier * streakMultiplier * visualBonusMultiplier) + burstGain;
      const anxietyIncrease = prev.isCyborg
        ? 1.5
        : (0.55 + prev.academicEra * 0.12) * Math.max(0.18, prev.anxietyResist);
      const dopamineEarned =
        !prev.isCyborg && prev.regions[RegionName.Limbic].unlocked && Math.random() < prev.dopamineGainChance ? 1 : 0;
      critTriggered = crit;
      burstTriggered = burst;
      streakAtClick = nextStreak;
      shouldPulse = prev.clickFxLevel > 0;

      return {
        ...prev,
        neurons: prev.isCyborg ? prev.neurons : prev.neurons + gain,
        totalNeurons: prev.isCyborg ? prev.totalNeurons : prev.totalNeurons + gain,
        compute: prev.isCyborg ? prev.compute + gain : prev.compute,
        dopamine: prev.dopamine + dopamineEarned,
        anxiety: Math.min(prev.anxietyCap + 20, prev.anxiety + anxietyIncrease),
        clickStreak: nextStreak,
        lastManualClick: now
      };
    });

    if (shouldPulse) {
      setClickPulseActive(true);
      if (clickPulseTimeoutRef.current) window.clearTimeout(clickPulseTimeoutRef.current);
      clickPulseTimeoutRef.current = window.setTimeout(() => {
        setClickPulseActive(false);
        clickPulseTimeoutRef.current = null;
      }, 220);
    }

    if (critTriggered) addLog(`Critical focus burst at streak x${streakAtClick}.`, 'epiphany');
    if (burstTriggered) addLog(`Visual cascade proc: bonus ${state.isCyborg ? 'FLOPS' : 'neurons'} materialized from pure vibes.`, 'market');
  };

  const buyUpgrade = (upgradeId: string) => {
    const target = upgrades.find((u) => u.id === upgradeId);
    if (!target) return;

    const cost = getUpgradeCost(target);
    if (!canAffordUpgrade(target)) return;

    setState((prev) => {
      const next = { ...prev };

      if (target.currency === 'neurons') next.neurons -= cost;
      if (target.currency === 'dopamine') next.dopamine -= cost;
      if (target.currency === 'serotonin') next.serotonin -= cost;

      if (target.effectType === 'click') next.clickPower += target.value;
      if (target.effectType === 'passive') next.passiveGen += target.value;
      if (target.effectType === 'anxiety_resist') next.anxietyResist *= target.value;
      if (target.effectType === 'anxiety_cap') next.anxietyCap += target.value;
      if (target.effectType === 'dopamine_gain') next.dopamineGainChance = Math.min(0.95, next.dopamineGainChance + target.value);
      if (target.effectType === 'serotonin_gain') next.serotoninPerCorrect += target.value;
      if (target.effectType === 'crit_chance') next.critChance = Math.min(0.95, next.critChance + target.value);
      if (target.effectType === 'crit_mult') next.critMultiplier += target.value;
      if (target.effectType === 'streak_boost') next.streakBoost = Math.min(0.25, next.streakBoost + target.value);
      if (target.effectType === 'visual_fx') next.clickFxLevel += Math.floor(target.value);
      if (target.effectType === 'stock_unlock' && target.unlockStockId) {
        const alreadyUnlocked = next.stocks.some((stock) => stock.id === target.unlockStockId);
        if (!alreadyUnlocked) {
          const bonus = BONUS_STOCKS.find((stock) => stock.id === target.unlockStockId);
          if (bonus) {
            next.stocks = [...next.stocks, { ...bonus, history: [...bonus.history], totalCostBasis: 0, realizedPnl: 0 }];
          }
        }
      }

      return next;
    });

    setUpgrades((prev) =>
      prev.map((u) => {
        if (u.id !== upgradeId) return u;
        const nextCount = (u.count || 0) + 1;
        const limit = u.maxPurchases || 1;
        return { ...u, count: nextCount, purchased: nextCount >= limit };
      })
    );

    addLog(`Upgrade acquired: ${target.name}`, 'info');
  };

  const buyStock = (stockId: string, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setState((prev) => {
      const idx = prev.stocks.findIndex((s) => s.id === stockId);
      if (idx < 0) return prev;
      const stock = prev.stocks[idx];
      const buyPrice = getBuyPrice(stock);
      const totalBuyCost = buyPrice * safeQuantity;
      if (prev.isCyborg ? prev.money < totalBuyCost : prev.neurons < totalBuyCost) return prev;

      const stocks = [...prev.stocks];
      stocks[idx] = {
        ...stock,
        owned: stock.owned + safeQuantity,
        totalCostBasis: (stock.totalCostBasis || 0) + totalBuyCost
      };
      return prev.isCyborg
        ? { ...prev, money: prev.money - totalBuyCost, stocks }
        : { ...prev, neurons: prev.neurons - totalBuyCost, stocks };
    });

    addLog(
      `Bought ${safeQuantity} ${stockId.toUpperCase()} at ask using ${state.isCyborg ? 'cash' : 'neurons'}. Spread and fees deducted.`,
      'market'
    );
  };

  const sellStock = (stockId: string, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setState((prev) => {
      const idx = prev.stocks.findIndex((s) => s.id === stockId);
      if (idx < 0) return prev;
      const stock = prev.stocks[idx];
      if (stock.owned <= 0) return prev;
      const unitsToSell = Math.min(stock.owned, safeQuantity);
      const sellPrice = getSellPrice(stock);
      const totalSellValue = sellPrice * unitsToSell;
      const currentCostBasis = stock.totalCostBasis || 0;
      const averageCostPerUnit = stock.owned > 0 ? currentCostBasis / stock.owned : 0;
      const costBasisRemoved = averageCostPerUnit * unitsToSell;
      const realizedDelta = totalSellValue - costBasisRemoved;

      const stocks = [...prev.stocks];
      stocks[idx] = {
        ...stock,
        owned: stock.owned - unitsToSell,
        totalCostBasis: Math.max(0, currentCostBasis - costBasisRemoved),
        realizedPnl: (stock.realizedPnl || 0) + realizedDelta
      };
      return prev.isCyborg
        ? { ...prev, money: prev.money + totalSellValue, stocks }
        : { ...prev, neurons: prev.neurons + totalSellValue, stocks };
    });

    addLog(`Sold up to ${safeQuantity} ${stockId.toUpperCase()} at bid. Slippage accepted.`, 'market');
  };

  const sellAllStock = (stockId: string) => {
    const stock = state.stocks.find((s) => s.id === stockId);
    if (!stock || stock.owned <= 0) return;
    sellStock(stockId, stock.owned);
  };

  const toggleTopicSelection = (key: string) => {
    setSelectedTopicKeys((prev) => {
      if (!prev.includes(key)) return [...prev, key];
      if (prev.length <= MIN_STUDY_TOPICS) {
        addLog(`Minimum ${MIN_STUDY_TOPICS} topics required for Study Quiz.`, 'alert');
        return prev;
      }
      return prev.filter((k) => k !== key);
    });
  };

  const setUnitTopicSelection = (unit: string, checked: boolean) => {
    const unitKeys = questionMenuByUnit.find((entry) => entry.unit === unit)?.topics.map((topic) => topic.key) || [];
    setSelectedTopicKeys((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...unitKeys]);
        return Array.from(merged);
      }
      const next = prev.filter((key) => !unitKeys.includes(key));
      if (next.length < MIN_STUDY_TOPICS) {
        addLog(`Minimum ${MIN_STUDY_TOPICS} topics required for Study Quiz.`, 'alert');
        return prev;
      }
      return next;
    });
  };

  const selectAllTopics = () => setSelectedTopicKeys(getAllTopicKeys(questionPool));
  const clearAllTopics = () => {
    const fallback = getAllTopicKeys(questionPool).slice(0, MIN_STUDY_TOPICS);
    setSelectedTopicKeys(fallback);
    addLog(`Minimum ${MIN_STUDY_TOPICS} topics enforced. Selected first ${fallback.length} topics.`, 'alert');
  };

  const openStudyQuiz = () => {
    if (selectedTopicKeys.length < MIN_STUDY_TOPICS) {
      addLog(`Select at least ${MIN_STUDY_TOPICS} topics before starting Study Quiz.`, 'alert');
      return;
    }
    if (selectedStudyQuestionPool.length === 0) {
      addLog('No study questions selected. Open Question Menu and tick topics with available questions.', 'alert');
      return;
    }

    setQuizMode('study');
    setActiveExamRegion(null);
    setActiveCyborgExamTarget(null);
    setQuizDeck(buildQuizDeck(selectedStudyQuestionPool));
    setCurrentQuestionIdx(0);
    setQuizFeedback(null);
    setExamAttempts(0);
    setExamCorrect(0);
    setExamWrong(0);
    setShowQuiz(true);
  };

  const attemptUnlockRegion = (regionId: RegionName) => {
    const region = state.regions[regionId];
    if (region.unlocked) return;
    if (state.neurons < region.unlockCost) {
      addLog('Not enough neurons to start this entrance exam.', 'alert');
      return;
    }
    if (examQuestionPool.length === 0) {
      addLog('No exam questions are currently unlocked for your academic era.', 'alert');
      return;
    }

    setQuizMode('exam');
    setActiveExamRegion(regionId);
    setActiveCyborgExamTarget(null);
    setQuizDeck(buildQuizDeck(examQuestionPool));
    setCurrentQuestionIdx(0);
    setQuizFeedback(null);
    setExamAttempts(0);
    setExamCorrect(0);
    setExamWrong(0);
    setShowQuiz(true);
  };

  const attemptUnlockCyborgFeature = (target: 'network' | 'matter_ops') => {
    if (!state.isCyborg) return;
    if (target === 'network' && state.digitalNetworkUnlocked) return;
    if (target === 'matter_ops' && state.digitalMiningUnlocked) return;
    if (target === 'matter_ops' && state.phase === GamePhase.NeuroLink) {
      addLog('Resource Mining is a Megacorp feature. Expand beyond NeuroLink first.', 'alert');
      return;
    }

    if (target === 'network' && !networkUnlockThresholdMet) {
      addLog(`Need ${DIGITAL_NETWORK_UNLOCK_RESEARCH} research answers before the Network exam.`, 'alert');
      return;
    }
    if (target === 'matter_ops') {
      if (!state.digitalNetworkUnlocked) {
        addLog('Unlock Network first before attempting Resource Mining certification.', 'alert');
        return;
      }
      if (!miningUnlockThresholdMet) {
        addLog(`Need ${DIGITAL_MINING_UNLOCK_RESEARCH} research answers before the Resource Mining exam.`, 'alert');
        return;
      }
    }
    if (examQuestionPool.length === 0) {
      addLog('No exam questions are currently unlocked for your academic era.', 'alert');
      return;
    }

    setQuizMode('exam');
    setActiveExamRegion(null);
    setActiveCyborgExamTarget(target);
    setQuizDeck(buildQuizDeck(examQuestionPool));
    setCurrentQuestionIdx(0);
    setQuizFeedback(null);
    setExamAttempts(0);
    setExamCorrect(0);
    setExamWrong(0);
    setShowQuiz(true);
  };

  const completeUnlock = (regionId: RegionName) => {
    setState((prev) => {
      const region = prev.regions[regionId];
      if (region.unlocked) return prev;

      return {
        ...prev,
        neurons: prev.neurons - region.unlockCost,
        regions: {
          ...prev.regions,
          [regionId]: { ...region, unlocked: true, level: 1 }
        },
        academicEra: Math.min(AcademicEra.Ascended, prev.academicEra + 1)
      };
    });

    addLog(`${state.regions[regionId].name} unlocked. New upgrades available.`, 'epiphany');
    setShowQuiz(false);
    setActiveExamRegion(null);
    setQuizFeedback(null);
    setExamAttempts(0);
    setExamCorrect(0);
    setExamWrong(0);
  };

  const completeCyborgFeatureUnlock = (target: 'network' | 'matter_ops') => {
    setState((prev) => {
      if (!prev.isCyborg) return prev;
      if (target === 'network') {
        return { ...prev, digitalNetworkUnlocked: true };
      }
      return { ...prev, digitalMiningUnlocked: true };
    });

    setShowQuiz(false);
    setActiveExamRegion(null);
    setActiveCyborgExamTarget(null);
    setQuizFeedback(null);
    setExamAttempts(0);
    setExamCorrect(0);
    setExamWrong(0);

    if (target === 'network') {
      setActiveTab('network');
      addLog('Network certification passed. Data siphons unlocked.', 'epiphany');
    } else {
      setActiveTab('matter_ops');
      addLog('Resource Mining certification passed. Matter extraction unlocked.', 'epiphany');
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setActiveExamRegion(null);
    setActiveCyborgExamTarget(null);
    setQuizFeedback(null);
    setQuizDeck([]);
    setExamWrong(0);
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || quizFeedback) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const isMegacorpQuiz = state.isCyborg && state.phase === GamePhase.Megacorp;
    const anxietyDelta = isCorrect ? (quizMode === 'exam' ? -8 : -5) : (quizMode === 'exam' ? 10 : 7);
    const serotoninGain = isCorrect && !state.isCyborg ? (quizMode === 'exam' ? state.serotoninPerCorrect + 2 : state.serotoninPerCorrect) : 0;
    const dopamineGain = isCorrect && !state.isCyborg ? (quizMode === 'exam' ? 2 : 1) : 0;
    const moneyGain = 0;
    const cyborgResearchGain = isCorrect && state.isCyborg ? (quizMode === 'exam' ? 2 : 1) : 0;
    const nudgeGain = isCorrect && isMegacorpQuiz ? (quizMode === 'exam' ? 5 : 3) : 0;
    const prGain = isCorrect && isMegacorpQuiz ? (quizMode === 'exam' ? 3.5 : 1.8) : 0;
    const globalAnxietyRelief = isCorrect && isMegacorpQuiz ? (quizMode === 'exam' ? 5 : 2.5) : 0;
    const hearingClearsNow =
      isCorrect
      && isMegacorpQuiz
      && state.antitrustCooldown > 0
      && (state.senateBaffleProgress + 1) >= ANTITRUST_BAFFLE_TARGET;
    const nextCyborgResearchPoints = state.cyborgResearchPoints + cyborgResearchGain;
    const unlockedThisAnswer: string[] = [];
    if (isCorrect && state.isCyborg && cyborgResearchGain > 0) {
      const hardwareUnlocks = INITIAL_HARDWARE
        .filter((hardware) => {
          const requirement = CYBORG_HARDWARE_UNLOCK_REQUIREMENTS[hardware.id] ?? 0;
          return requirement > state.cyborgResearchPoints && requirement <= nextCyborgResearchPoints;
        })
        .map((hardware) => `Hardware: ${hardware.name}`);
      const networkUnlocks = INITIAL_NETWORK_DEVICES
        .filter((device) => {
          const requirement = CYBORG_NETWORK_UNLOCK_REQUIREMENTS[device.id] ?? 0;
          return requirement > state.cyborgResearchPoints && requirement <= nextCyborgResearchPoints;
        })
        .map((device) => `Network: ${device.name}${state.digitalNetworkUnlocked ? ' (buyable now)' : ' (pass Network exam)'}`);
      const matterUnlocks = MATTER_OPERATIONS
        .filter((operation) => {
          const requirement = CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS[operation.id] ?? 0;
          return requirement > state.cyborgResearchPoints && requirement <= nextCyborgResearchPoints;
        })
        .map((operation) => `Resource Mining: ${operation.name}${state.phase === GamePhase.NeuroLink ? ' (Megacorp phase)' : ''}`);
      unlockedThisAnswer.push(...hardwareUnlocks, ...networkUnlocks, ...matterUnlocks);
    }

    setState((prev) => ({
      ...prev,
      dopamine: prev.dopamine + dopamineGain,
      serotonin: prev.serotonin + serotoninGain,
      money: prev.money + moneyGain,
      correctQuizAnswers: prev.correctQuizAnswers + (isCorrect ? 1 : 0),
      cyborgResearchPoints: prev.cyborgResearchPoints + cyborgResearchGain,
      anxiety: Math.max(0, Math.min(prev.anxietyCap + 20, prev.anxiety + anxietyDelta)),
      nudges: prev.nudges + nudgeGain,
      behavioralNudges: prev.behavioralNudges + nudgeGain,
      prLevel: isMegacorpQuiz
        ? clamp(prev.prLevel + prGain - (isCorrect ? 0 : 1.5), 0, 100)
        : prev.prLevel,
      globalAnxiety: isMegacorpQuiz
        ? clamp(prev.globalAnxiety - globalAnxietyRelief + (isCorrect ? 0 : 3), 0, 100)
        : prev.globalAnxiety,
      antitrustCooldown: hearingClearsNow ? 0 : prev.antitrustCooldown,
      senateBaffleProgress: hearingClearsNow
        ? 0
        : (prev.antitrustCooldown > 0 && isCorrect ? prev.senateBaffleProgress + 1 : prev.senateBaffleProgress)
    }));

    if (quizMode === 'exam') {
      setExamAttempts((a) => a + 1);
      if (isCorrect) setExamCorrect((c) => c + 1);
      if (!isCorrect) setExamWrong((w) => w + 1);
    }

    setQuizFeedback({ isCorrect, text: currentQuestion.explanation });
    if (isCorrect && state.isCyborg) {
      addLog('Correct response logged. Research and control layers improved.', 'market');
      addLog(`NeuroLink research +${cyborgResearchGain}. (${formatNumber(nextCyborgResearchPoints)} total)`, 'epiphany');
      if (isMegacorpQuiz) {
        addLog(`Behavioral nudges +${nudgeGain}. PR stabilized by +${prGain.toFixed(1)}%.`, 'market');
        if (state.antitrustCooldown > 0 && !hearingClearsNow) {
          addLog(`Senate baffled with jargon (${state.senateBaffleProgress + 1}/${ANTITRUST_BAFFLE_TARGET}).`, 'epiphany');
        }
        if (hearingClearsNow) {
          addLog('Public revolt neutralized. Capital freeze lifted and operations resumed.', 'epiphany');
        }
      }
      if (unlockedThisAnswer.length > 0) {
        setLatestResearchUnlocks(unlockedThisAnswer);
        addLog(`New infrastructure unlocked: ${unlockedThisAnswer.join(', ')}.`, 'market');
      }
    } else {
      addLog(isCorrect ? 'Correct response logged.' : 'Incorrect response. Review explanation.', isCorrect ? 'epiphany' : 'alert');
    }
  };

  const nextQuestion = () => {
    if (quizMode === 'exam') {
      if (activeExamRegion) {
        const target = state.regions[activeExamRegion].examPassesRequired;
        if (examCorrect >= target) {
          completeUnlock(activeExamRegion);
          return;
        }
      }

      if (activeCyborgExamTarget) {
        const target = activeCyborgExamTarget === 'network' ? DIGITAL_NETWORK_EXAM_TARGET : DIGITAL_MINING_EXAM_TARGET;
        if (examCorrect >= target) {
          completeCyborgFeatureUnlock(activeCyborgExamTarget);
          return;
        }
        if (examWrong >= DIGITAL_EXAM_MAX_WRONG) {
          addLog(
            `${activeCyborgExamTarget === 'network' ? 'Network' : 'Resource Mining'} exam failed (3 incorrect). Retake required.`,
            'alert'
          );
          setShowQuiz(false);
          setActiveCyborgExamTarget(null);
          setQuizFeedback(null);
          setExamAttempts(0);
          setExamCorrect(0);
          setExamWrong(0);
          return;
        }
      }
    }

    setCurrentQuestionIdx((idx) => (idx + 1) % Math.max(quizDeck.length, 1));
    setQuizFeedback(null);
  };

  const buyShopItem = (itemId: string) => {
    const item = PSYCHBUCK_SHOP_ITEMS.find((entry) => entry.id === itemId);
    if (!item) return;
    if (state.shopOwnedIds.includes(itemId)) return;
    if (state.psychBucks < item.cost) {
      addLog(`Not enough PsychBucks for ${item.name}.`, 'alert');
      return;
    }

    setState((prev) => {
      if (prev.shopOwnedIds.includes(itemId) || prev.psychBucks < item.cost) return prev;
      return {
        ...prev,
        psychBucks: prev.psychBucks - item.cost,
        shopOwnedIds: [...prev.shopOwnedIds, itemId],
        activeCosmeticId: item.category === 'cosmetic' ? item.id : prev.activeCosmeticId
      };
    });
    addLog(item.unlockLog, 'market');
  };

  const equipCosmetic = (itemId: string | null) => {
    if (itemId === null) {
      setState((prev) => ({ ...prev, activeCosmeticId: null }));
      addLog('Cosmetic theme reset to default lab mode.', 'info');
      return;
    }
    const item = PSYCHBUCK_SHOP_ITEMS.find((entry) => entry.id === itemId && entry.category === 'cosmetic');
    if (!item) return;
    if (!state.shopOwnedIds.includes(itemId)) {
      addLog('Buy this cosmetic first in the PsychBuck shop.', 'alert');
      return;
    }

    setState((prev) => ({ ...prev, activeCosmeticId: itemId }));
    addLog(`Cosmetic equipped: ${item.name}.`, 'info');
  };

  const buyMinigame = (gameId: string) => {
    const game = minigameList.find((g) => g.id === gameId);
    if (!game) return;

    if (game.type === 'scam_o_matic' && !state.isCyborg) {
      addLog('Scam-O-Matic unlocks after NeuroLink when FLOPS and cash are both available.', 'alert');
      return;
    }

    const canAfford = state.isCyborg ? state.compute >= game.cost : state.neurons >= game.cost;
    if (!canAfford) {
      addLog(`Not enough ${state.isCyborg ? 'FLOPS' : 'neurons'} to unlock this minigame.`, 'alert');
      return;
    }

    setState((prev) => ({
      ...prev,
      neurons: prev.isCyborg ? prev.neurons : prev.neurons - game.cost,
      compute: prev.isCyborg ? prev.compute - game.cost : prev.compute,
      minigames: {
        ...prev.minigames,
        [gameId]: { id: gameId, owned: true, lastPlayed: 0 }
      }
    }));

    addLog(`${game.name} unlocked.`, 'epiphany');
  };

  const playMinigame = (gameId: string) => {
    const game = minigameList.find((g) => g.id === gameId);
    const mg = state.minigames[gameId];
    if (!game || !mg?.owned) return;

    if (game.type === 'scam_o_matic' && !state.isCyborg) {
      addLog('Scam-O-Matic requires digital economy resources (FLOPS/cash).', 'alert');
      return;
    }

    const now = Date.now();
    if (now - (mg.lastPlayed || 0) < game.cooldownMs) return;

    setActiveMinigame(game);
    setMinigameResult('idle');
    setTunerValue(50);
    setTunerDirection(Math.random() > 0.5 ? 1 : -1);
    setScanTarget(Math.floor(Math.random() * 9));
    setScanAttemptsLeft(3);
    setLastMinigameReward(0);
    setLastScamOutcome(null);
  };

  const finalizeMinigame = (success: boolean, rewardOverride?: number) => {
    if (!activeMinigame) return;
    const now = Date.now();
    const reward = rewardOverride ?? (success ? activeMinigame.dopamineReward : 0);
    const computeReward = state.isCyborg ? reward * 55 : 0;
    const cashReward = state.isCyborg ? reward * 130 : 0;
    const matterReward = state.isCyborg && state.phase !== GamePhase.NeuroLink ? reward * 2.2 : 0;

    setState((prev) => ({
      ...prev,
      dopamine: prev.dopamine + (prev.isCyborg ? 0 : reward),
      compute: prev.compute + computeReward,
      money: prev.money + cashReward,
      matter: prev.matter + matterReward,
      minigames: {
        ...prev.minigames,
        [activeMinigame.id]: {
          ...prev.minigames[activeMinigame.id],
          lastPlayed: now
        }
      }
    }));

    setLastMinigameReward(reward);
    setLastScamOutcome(null);
    setMinigameResult(success ? 'success' : 'fail');
    addLog(
      success
        ? state.isCyborg
          ? state.phase === GamePhase.NeuroLink
            ? `${activeMinigame.name} cleared. +${formatNumber(computeReward)} FLOPS, +$${formatNumber(cashReward)}.`
            : `${activeMinigame.name} cleared. +${formatNumber(computeReward)} FLOPS, +$${formatNumber(cashReward)}, +${formatNumber(matterReward)} matter.`
          : `${activeMinigame.name} cleared. Dopamine +${reward}.`
        : `${activeMinigame.name} failed. Cooldown applied.`,
      success ? 'epiphany' : 'alert'
    );
  };

  const closeMinigame = () => {
    setActiveMinigame(null);
    setMinigameResult('idle');
    setLastMinigameReward(0);
    setLastScamOutcome(null);
  };

  const handleNeuroSnakeFinish = ({ score }: { score: number }) => {
    if (!activeMinigame || activeMinigame.type !== 'neurosnake') return;
    const success = score >= 5;
    const reward = score + (success ? activeMinigame.dopamineReward : 0);
    finalizeMinigame(success, reward);
  };

  const handleBrainBuilderFinish = ({ score }: { score: number }) => {
    if (!activeMinigame || activeMinigame.type !== 'brainbuilder') return;
    const success = score >= 240;
    const reward = Math.floor(score / 120) + (success ? activeMinigame.dopamineReward : 0);
    finalizeMinigame(success, reward);
  };

  const handleFlappyFreudFinish = ({ score }: { score: number }) => {
    if (!activeMinigame || activeMinigame.type !== 'flappy_freud') return;
    const success = score >= 8;
    const reward = Math.floor(score / 2) + (success ? activeMinigame.dopamineReward : 0);
    finalizeMinigame(success, reward);
  };

  const handleFeedSundgrenFinish = ({ score }: { score: number }) => {
    if (!activeMinigame || activeMinigame.type !== 'feed_sundgren') return;
    const success = score >= 12;
    const reward = Math.floor(score / 3) + (success ? activeMinigame.dopamineReward : 0);
    finalizeMinigame(success, reward);
  };

  const handleScamOMaticFinish = (outcome: ScamOMaticOutcome) => {
    if (!activeMinigame || activeMinigame.type !== 'scam_o_matic') return;
    const now = Date.now();
    const normalizedDelta = Math.floor(outcome.delta);
    const success = normalizedDelta >= 0;

    setState((prev) => ({
      ...prev,
      money: Math.max(0, prev.money + normalizedDelta),
      minigames: {
        ...prev.minigames,
        [activeMinigame.id]: {
          ...prev.minigames[activeMinigame.id],
          lastPlayed: now
        }
      }
    }));

    setLastScamOutcome({ ...outcome, delta: normalizedDelta });
    setLastMinigameReward(0);
    setMinigameResult(success ? 'success' : 'fail');
    addLog(
      `${activeMinigame.name}: ${outcome.label}. ${normalizedDelta >= 0 ? 'Net +$' : 'Net -$'}${formatNumber(Math.abs(normalizedDelta))} on a $${formatNumber(outcome.bet)} base bet.`,
      success ? 'epiphany' : 'alert'
    );
  };

  const executeDigitalBrainUnlock = () => {
    if (state.digitalBrainUnlocked) return;
    if (!allUpgradesMaxed) {
      addLog('NeuroLink locked: max all biological upgrades first.', 'alert');
      return;
    }
    if (state.totalNeurons < NEUROLINK.threshold || state.neurons < NEUROLINK.cost) {
      addLog('NeuroLink requirements not met.', 'alert');
      return;
    }

    setState((prev) => ({
      ...prev,
      neurons: 0,
      dopamine: 0,
      serotonin: 0,
      money: 3500 + Math.min(2600, Math.floor(prev.totalNeurons * 0.0012)),
      clickPower: 1,
      passiveGen: 0,
      critChance: INITIAL_STATE.critChance,
      critMultiplier: INITIAL_STATE.critMultiplier,
      streakBoost: INITIAL_STATE.streakBoost,
      clickStreak: 0,
      lastManualClick: 0,
      clickFxLevel: 0,
      anxiety: 0,
      anxietyCap: 120,
      anxietyResist: 1,
      digitalBrainUnlocked: true,
      digitalNetworkUnlocked: false,
      digitalMiningUnlocked: false,
      neuroLinkStartedAt: Date.now(),
      isCyborg: true,
      phase: GamePhase.NeuroLink,
      computeMultiplier: 1,
      compute: 0,
      matter: 0,
      water: 110,
      waterCapacity: 180,
      energy: 30,
      heat: 8,
      heatCapacity: 65,
      prLevel: 92,
      globalAnxiety: 6,
      nudges: 0,
      corporateTaxDrain: 40,
      prUpgrades: [],
      activeDistractions: {},
      behavioralNudges: 0,
      realEstate: MEGACORP_STARTER_REAL_ESTATE,
      megacorpBaselineRealEstate: MEGACORP_STARTER_REAL_ESTATE,
      earthSubjugatedPercent: 0,
      antitrustCooldown: 0,
      senateBaffleProgress: 0,
      operantCampaigns: 0,
      dissonanceCampaigns: 0,
      lobbyingLevel: 0,
      cyborgResearchPoints: 0,
      earthMatterTotal: EARTH_MATTER_TOTAL,
      earthMatterRemaining: EARTH_MATTER_TOTAL,
      spaceProgressUnlocked: false,
      spaceSectorsScanned: 0,
      spaceSectorsTotal: 1400,
      spaceGalaxiesDiscovered: 0,
      spaceGalaxiesClaimed: 0,
      spaceRelays: 0,
      spaceHostileSignals: 0,
      spaceSurveyMissions: 0,
      spaceRaidCooldown: 0,
      spaceMatterExtracted: 0,
      bleatFeed: [],
      bleatTickerMs: 5000,
      revoltPending: false,
      matterOps: Object.fromEntries(MATTER_OPERATIONS.map((op) => [op.id, 0])),
      hardware: INITIAL_HARDWARE.map((hw) => ({ ...hw })),
      network: INITIAL_NETWORK_DEVICES.map((device) => ({ ...device })),
      stocks: INITIAL_CYBER_STOCKS.map((stock) =>
        ensureStockRuntime({ ...stock, history: [...stock.history], totalCostBasis: 0, realizedPnl: 0 })
      ),
      lastStockUpdate: Date.now(),
      marketHeadline: 'NeuroLink markets online. Power and cooling are now your religion.',
      marketHeadlineUntil: Date.now() + 16000,
      marketMood: 0
    }));
    setActiveTab('hardware');
    setShowCyborgGuide(true);
    setLatestResearchUnlocks([]);
    addLog('NeuroLink activated. Organic mode deprecated.', 'epiphany');
  };

  const unlockDigitalBrain = () => {
    if (state.digitalBrainUnlocked) return;
    if (!allUpgradesMaxed) {
      addLog('NeuroLink locked: max all biological upgrades first.', 'alert');
      return;
    }
    if (state.totalNeurons < NEUROLINK.threshold || state.neurons < NEUROLINK.cost) {
      addLog('NeuroLink requirements not met.', 'alert');
      return;
    }

    setNeuroLinkConfirmText('');
    setShowNeuroLinkConfirm(true);
  };

  const confirmDigitalBrainUnlock = () => {
    if (neuroLinkConfirmText.trim().toUpperCase() !== 'WIPE') return;
    setShowNeuroLinkConfirm(false);
    executeDigitalBrainUnlock();
  };

  const resolveBrainFullPrompt = (expandToMegacorp: boolean) => {
    setShowBrainFullPrompt(false);
    if (!expandToMegacorp) {
      addLog('Corporate expansion delayed. The core remains planet-bound for now.', 'info');
      return;
    }

    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.NeuroLink) return prev;
      const usedAcreage = getInfrastructureFootprint(prev.hardware, prev.network);
      const starterAcreage = Math.min(EARTH_REAL_ESTATE_TOTAL, Math.max(prev.realEstate, Math.ceil(usedAcreage * 1.22) + 120));
      return {
        ...prev,
        phase: GamePhase.Megacorp,
        digitalMiningUnlocked: true,
        realEstate: starterAcreage,
        megacorpBaselineRealEstate: starterAcreage,
        heat: Math.min(prev.heat, prev.heatCapacity * 0.78),
        prLevel: Math.min(prev.prLevel, 88),
        globalAnxiety: 0
      };
    });
    addLog('Megacorp phase initiated. Public sentiment now directly affects production.', 'market');
  };

  const debugApplyProgressionPreset = () => {
    if (debugPasswordInput !== DEBUG_NEUROLINK_PASSWORD) {
      addLog('Debug access denied: incorrect password.', 'alert');
      return;
    }

    const defaultState = buildDefaultState();
    const upgradeDefaults = buildDefaultUpgrades();
    const maxedUpgrades = upgradeDefaults.map((upgrade) => {
      const max = upgrade.maxPurchases || 1;
      return { ...upgrade, count: max, purchased: true };
    });
    const unlockAllRegions = (regions: GameState['regions']) =>
      Object.fromEntries(
        (Object.values(RegionName) as RegionName[]).map((regionId) => {
          const region = regions[regionId];
          return [regionId, { ...region, unlocked: true, level: Math.max(region.level, 3) }];
        })
      ) as GameState['regions'];
    const withHardwareCounts = (counts: Record<string, number>) =>
      INITIAL_HARDWARE.map((hw) => ({ ...hw, count: Math.max(0, counts[hw.id] || 0) }));
    const withNetworkCounts = (counts: Record<string, number>) =>
      INITIAL_NETWORK_DEVICES.map((device) => ({ ...device, count: Math.max(0, counts[device.id] || 0) }));
    const withMatterOpsCounts = (counts: Record<string, number>) =>
      Object.fromEntries(MATTER_OPERATIONS.map((op) => [op.id, Math.max(0, counts[op.id] || 0)])) as GameState['matterOps'];
    setLatestResearchUnlocks([]);

    if (debugProgressionPreset === 'bio_start') {
      setState(defaultState);
      setUpgrades(upgradeDefaults);
      setActiveTab(RegionName.Brainstem);
      addLog('Debug: jumped to Biological Start.', 'market');
    } else if (debugProgressionPreset === 'neurolink_ready') {
      setState({
        ...defaultState,
        regions: unlockAllRegions(defaultState.regions),
        neurons: NEUROLINK.cost + 25000,
        totalNeurons: NEUROLINK.threshold + 250000,
        dopamine: 2500,
        serotonin: 2500,
        anxiety: 12,
        correctQuizAnswers: 999,
        phase: GamePhase.Biological
      });
      setUpgrades(maxedUpgrades);
      setActiveTab(RegionName.Frontal);
      addLog('Debug: jumped to NeuroLink Ready.', 'market');
    } else if (debugProgressionPreset === 'megacorp_ready') {
      const maxedHardwareCounts = Object.fromEntries(
        INITIAL_HARDWARE.map((hw) => [
          hw.id,
          NEUROLINK_CORE_HARDWARE_IDS.has(hw.id) ? DIGITAL_BRAIN_HARDWARE_CAP : 0
        ])
      ) as Record<string, number>;

      setState({
        ...defaultState,
        regions: unlockAllRegions(defaultState.regions),
        digitalBrainUnlocked: true,
        digitalNetworkUnlocked: true,
        digitalMiningUnlocked: true,
        neuroLinkStartedAt: Date.now(),
        isCyborg: true,
        phase: GamePhase.NeuroLink,
        computeMultiplier: 1,
        neurons: 0,
        dopamine: 0,
        serotonin: 0,
        anxiety: 20,
        anxietyCap: 120,
        compute: 420000,
        matter: 28000,
        water: 260,
        waterCapacity: 460,
        money: 260000,
        energy: 240,
        heat: 45,
        heatCapacity: 420,
        prLevel: 90,
        globalAnxiety: 10,
        nudges: 0,
        corporateTaxDrain: 40,
        prUpgrades: [],
        activeDistractions: {},
        behavioralNudges: 0,
        realEstate: MEGACORP_STARTER_REAL_ESTATE,
        earthSubjugatedPercent: 0,
        antitrustCooldown: 0,
        senateBaffleProgress: 0,
        operantCampaigns: 0,
        dissonanceCampaigns: 0,
        lobbyingLevel: 0,
        cyborgResearchPoints: 20,
        earthMatterTotal: EARTH_MATTER_TOTAL,
        earthMatterRemaining: EARTH_MATTER_TOTAL,
        spaceProgressUnlocked: false,
        hardware: withHardwareCounts(maxedHardwareCounts),
        network: withNetworkCounts({
          toaster_darkpool: 3,
          sentiment_tax_api: 2,
          compliance_mirror: 1
        }),
        matterOps: withMatterOpsCounts({
          minecraft_irl_program: 3,
          landfill_strip_mining: 2
        }),
        correctQuizAnswers: 999,
        stocks: INITIAL_CYBER_STOCKS.map((stock) =>
          ensureStockRuntime({ ...stock, history: [...stock.history], totalCostBasis: 0, realizedPnl: 0 })
        ),
        lastStockUpdate: Date.now(),
        marketHeadline: 'Debug jump: NeuroLink fully saturated. Corporate expansion decision pending.',
        marketHeadlineUntil: Date.now() + 18000,
        marketMood: 0.06
      });
      setUpgrades(maxedUpgrades);
      setActiveTab('hardware');
      setShowBrainFullPrompt(false);
      setBrainFullPromptShown(false);
      addLog('Debug: jumped to Megacorp Ready. Use the Brain Full prompt to enter Megacorp.', 'market');
    } else {
      const baseCyberState: GameState = {
        ...defaultState,
        regions: unlockAllRegions(defaultState.regions),
        digitalBrainUnlocked: true,
        digitalNetworkUnlocked: true,
        digitalMiningUnlocked: true,
        neuroLinkStartedAt: Date.now() - (10 * 60 * 1000),
        isCyborg: true,
        phase: GamePhase.Megacorp,
        computeMultiplier: 1,
        neurons: 0,
        dopamine: 0,
        serotonin: 0,
        anxiety: 18,
        anxietyCap: 120,
        compute: 28000,
        matter: 1800,
        water: 140,
        waterCapacity: 260,
        energy: 75,
        heat: 18,
        heatCapacity: 110,
        prLevel: 78,
        globalAnxiety: 22,
        nudges: 6,
        corporateTaxDrain: 40,
        prUpgrades: [],
        activeDistractions: {},
        behavioralNudges: 6,
        realEstate: 120,
        megacorpBaselineRealEstate: 120,
        earthSubjugatedPercent: 14,
        antitrustCooldown: 0,
        senateBaffleProgress: 0,
        operantCampaigns: 1,
        dissonanceCampaigns: 0,
        lobbyingLevel: 0,
        cyborgResearchPoints: 12,
        earthMatterTotal: EARTH_MATTER_TOTAL,
        earthMatterRemaining: Math.max(1, EARTH_MATTER_TOTAL - 45000),
        spaceProgressUnlocked: false,
        matterOps: withMatterOpsCounts({}),
        money: 45000,
        correctQuizAnswers: 999,
        stocks: INITIAL_CYBER_STOCKS.map((stock) =>
          ensureStockRuntime({ ...stock, history: [...stock.history], totalCostBasis: 0, realizedPnl: 0 })
        ),
        lastStockUpdate: Date.now(),
        marketHeadline: 'Debug jump applied. Audit trail deleted by compliance subroutine.',
        marketHeadlineUntil: Date.now() + 22000,
        marketMood: 0.08
      };

      if (debugProgressionPreset === 'megacorp_boot') {
        setState({
          ...baseCyberState,
          compute: 9000,
          matter: MEGACORP_STARTER_MATTER + 80,
          water: 120,
          waterCapacity: 220,
          money: 9000,
          energy: 42,
          heat: 10,
          heatCapacity: 85,
          prLevel: 89,
          globalAnxiety: 8,
          nudges: 2,
          behavioralNudges: 2,
          realEstate: 42,
          megacorpBaselineRealEstate: 42,
          earthSubjugatedPercent: 4,
          antitrustCooldown: 0,
          senateBaffleProgress: 0,
          operantCampaigns: 0,
          dissonanceCampaigns: 0,
          lobbyingLevel: 0,
          cyborgResearchPoints: 0,
          hardware: withHardwareCounts({ silicon_cortex: 2, cranial_vents: 1, fusion_loan_plant: 1 }),
          network: withNetworkCounts({ toaster_darkpool: 1 }),
          matterOps: withMatterOpsCounts({ minecraft_irl_program: 1 })
        });
        addLog('Debug: jumped to Megacorp Boot.', 'market');
      } else if (debugProgressionPreset === 'megacorp_mid') {
        setState({
          ...baseCyberState,
          compute: 220000,
          matter: 18000,
          water: 220,
          waterCapacity: 420,
          money: 220000,
          energy: 180,
          heat: 52,
          heatCapacity: 220,
          prLevel: 52,
          globalAnxiety: 46,
          nudges: 10,
          behavioralNudges: 10,
          realEstate: 480,
          megacorpBaselineRealEstate: 120,
          earthSubjugatedPercent: 41,
          antitrustCooldown: 0,
          senateBaffleProgress: 0,
          operantCampaigns: 3,
          dissonanceCampaigns: 2,
          lobbyingLevel: 1,
          cyborgResearchPoints: 14,
          hardware: withHardwareCounts({
            silicon_cortex: 12,
            quantum_stack: 7,
            cranial_vents: 8,
            ocean_sink: 5,
            fusion_loan_plant: 6,
            orbital_solar_swarm: 3
          }),
          network: withNetworkCounts({
            toaster_darkpool: 8,
            sentiment_tax_api: 4,
            compliance_mirror: 2
          }),
          matterOps: withMatterOpsCounts({
            minecraft_irl_program: 5,
            landfill_strip_mining: 6,
            orbital_debris_harvesters: 3,
            black_market_procurement: 1
          })
        });
        addLog('Debug: jumped to Megacorp Mid.', 'market');
      } else if (debugProgressionPreset === 'space_ready') {
        setState({
          ...baseCyberState,
          compute: 980000,
          matter: 55000,
          water: 360,
          waterCapacity: 620,
          money: 740000,
          energy: 360,
          heat: 72,
          heatCapacity: 360,
          prLevel: 37,
          globalAnxiety: 58,
          nudges: 16,
          behavioralNudges: 16,
          realEstate: 1800,
          megacorpBaselineRealEstate: 120,
          earthSubjugatedPercent: 99,
          antitrustCooldown: 0,
          senateBaffleProgress: 0,
          operantCampaigns: 5,
          dissonanceCampaigns: 3,
          lobbyingLevel: 2,
          cyborgResearchPoints: 24,
          earthMatterRemaining: 0,
          spaceProgressUnlocked: true,
          spaceSectorsScanned: 0,
          spaceSectorsTotal: 1400,
          spaceGalaxiesDiscovered: 0,
          spaceGalaxiesClaimed: 0,
          spaceRelays: 0,
          spaceHostileSignals: 0,
          spaceSurveyMissions: 0,
          spaceRaidCooldown: 0,
          spaceMatterExtracted: 0,
          hardware: withHardwareCounts({
            silicon_cortex: 24,
            quantum_stack: 16,
            adversarial_farm: 5,
            cranial_vents: 10,
            ocean_sink: 10,
            cryo_cathedral: 4,
            fusion_loan_plant: 10,
            orbital_solar_swarm: 7
          }),
          network: withNetworkCounts({
            toaster_darkpool: 14,
            sentiment_tax_api: 10,
            compliance_mirror: 6,
            orbital_cluster: 2
          }),
          matterOps: withMatterOpsCounts({
            minecraft_irl_program: 8,
            landfill_strip_mining: 14,
            orbital_debris_harvesters: 10,
            black_market_procurement: 5
          })
        });
        addLog('Debug: jumped to Space Unlock Ready.', 'market');
      } else if (debugProgressionPreset === 'space_phase') {
        setState({
          ...baseCyberState,
          phase: GamePhase.Space,
          compute: 3_200_000,
          matter: 140000,
          water: 540,
          waterCapacity: 900,
          money: 2_800_000,
          energy: 700,
          heat: 118,
          heatCapacity: 620,
          prLevel: 32,
          globalAnxiety: 40,
          nudges: 24,
          behavioralNudges: 24,
          realEstate: 3400,
          megacorpBaselineRealEstate: 120,
          earthSubjugatedPercent: 100,
          antitrustCooldown: 0,
          senateBaffleProgress: 0,
          operantCampaigns: 6,
          dissonanceCampaigns: 4,
          lobbyingLevel: 3,
          cyborgResearchPoints: 24,
          earthMatterRemaining: 0,
          spaceProgressUnlocked: true,
          spaceSectorsScanned: 420,
          spaceSectorsTotal: 1400,
          spaceGalaxiesDiscovered: 52,
          spaceGalaxiesClaimed: 21,
          spaceRelays: 6,
          spaceHostileSignals: 34,
          spaceSurveyMissions: 19,
          spaceRaidCooldown: 0,
          spaceMatterExtracted: 64000,
          matterOps: withMatterOpsCounts({
            minecraft_irl_program: 12,
            landfill_strip_mining: 18,
            orbital_debris_harvesters: 16,
            black_market_procurement: 9
          })
        });
        addLog('Debug: jumped to Space Phase.', 'market');
      } else {
        setState({
          ...baseCyberState,
          phase: GamePhase.Rival,
          compute: 9_500_000,
          matter: 320000,
          water: 760,
          waterCapacity: 1300,
          money: 8_500_000,
          energy: 1200,
          heat: 170,
          heatCapacity: 980,
          prLevel: 28,
          globalAnxiety: 34,
          nudges: 30,
          behavioralNudges: 30,
          realEstate: 5000,
          megacorpBaselineRealEstate: 120,
          earthSubjugatedPercent: 100,
          antitrustCooldown: 0,
          senateBaffleProgress: 0,
          operantCampaigns: 8,
          dissonanceCampaigns: 5,
          lobbyingLevel: 4,
          cyborgResearchPoints: 24,
          earthMatterRemaining: 0,
          spaceProgressUnlocked: true,
          spaceSectorsScanned: 1120,
          spaceSectorsTotal: 1400,
          spaceGalaxiesDiscovered: 188,
          spaceGalaxiesClaimed: 122,
          spaceRelays: 18,
          spaceHostileSignals: 62,
          spaceSurveyMissions: 62,
          spaceRaidCooldown: 48,
          spaceMatterExtracted: 540000,
          matterOps: withMatterOpsCounts({
            minecraft_irl_program: 16,
            landfill_strip_mining: 22,
            orbital_debris_harvesters: 20,
            black_market_procurement: 14
          })
        });
        addLog('Debug: jumped to Rival Phase.', 'market');
      }

      setUpgrades(maxedUpgrades);
      setActiveTab('hardware');
    }

    setDebugPasswordInput('');
    setShowDebugTools(false);
    setShowCyborgGuide(false);
  };

  const debugAddResources = () => {
    if (debugPasswordInput !== DEBUG_NEUROLINK_PASSWORD) {
      addLog('Debug access denied: incorrect password.', 'alert');
      return;
    }

    setState((prev) => ({
      ...prev,
      neurons: prev.neurons + 5_000_000,
      totalNeurons: prev.totalNeurons + 5_000_000,
      dopamine: prev.dopamine + 50_000,
      serotonin: prev.serotonin + 50_000,
      compute: prev.compute + 250_000_000,
      money: prev.money + 250_000_000,
      matter: prev.matter + 2_500_000,
      nudges: prev.nudges + 80,
      behavioralNudges: prev.behavioralNudges + 80,
      water: Math.min(prev.waterCapacity, prev.water + 400),
      energy: prev.energy + 450
    }));

    setDebugPasswordInput('');
    addLog('Debug: added resource bundle (neurons, compute, cash, matter, nudges).', 'market');
  };

  const buyHardware = (hardwareId: string, quantity = 1) => {
    const currentHardware = state.hardware.find((hw) => hw.id === hardwareId);
    if (state.isCyborg && state.phase === GamePhase.NeuroLink && !NEUROLINK_CORE_HARDWARE_IDS.has(hardwareId)) {
      addLog('This hardware unlocks in Megacorp phase.', 'alert');
      return;
    }
    const unlockRequirement = CYBORG_HARDWARE_UNLOCK_REQUIREMENTS[hardwareId] ?? 0;
    if (
      state.isCyborg
      && currentHardware
      && !isCyborgTechUnlocked(unlockRequirement, currentHardware.count)
    ) {
      addLog(`Locked: answer ${formatNumber(unlockRequirement)} NeuroLink quiz questions to unlock ${currentHardware.name}.`, 'alert');
      return;
    }
    const safeQuantity = Math.max(1, Math.floor(quantity));
    if (state.isCyborg && state.phase === GamePhase.NeuroLink && currentHardware && currentHardware.count >= DIGITAL_BRAIN_HARDWARE_CAP) {
      addLog(`${currentHardware.name} is capped at ${DIGITAL_BRAIN_HARDWARE_CAP} in the Digital Brain phase.`, 'alert');
      return;
    }
    if (state.isCyborg && state.phase !== GamePhase.NeuroLink && currentHardware) {
      const usedAcreage = getInfrastructureFootprint(state.hardware, state.network);
      const additionalAcreage = (HARDWARE_REAL_ESTATE_FOOTPRINT[currentHardware.type] || 1) * safeQuantity;
      if (usedAcreage + additionalAcreage > state.realEstate) {
        addLog('Real Estate cap reached. Buy more acres before deploying additional hardware.', 'alert');
        return;
      }
    }
    setState((prev) => {
      const idx = prev.hardware.findIndex((hw) => hw.id === hardwareId);
      if (idx < 0) return prev;
      const hw = prev.hardware[idx];
      const roomLeft = Math.max(0, DIGITAL_BRAIN_HARDWARE_CAP - hw.count);
      const purchasableQty = Math.min(safeQuantity, roomLeft);
      if (purchasableQty <= 0) return prev;

      const quote = getDigitalHardwareQuote(prev, hw, purchasableQty);
      if (quote.requiresNetwork && !prev.digitalNetworkUnlocked) return prev;
      if (quote.requiresMining && !prev.digitalMiningUnlocked) return prev;
      if (prev.compute < quote.computeCost || prev.money < quote.moneyCost || prev.matter < quote.matterCost) return prev;

      const hardware = [...prev.hardware];
      hardware[idx] = { ...hw, count: hw.count + purchasableQty };
      return {
        ...prev,
        compute: prev.compute - quote.computeCost,
        money: prev.money - quote.moneyCost,
        matter: prev.matter - quote.matterCost,
        hardware
      };
    });
  };

  const buyNetworkDevice = (deviceId: string, quantity = 1) => {
    if (state.isCyborg && state.phase === GamePhase.NeuroLink && !state.digitalNetworkUnlocked) {
      addLog('Network tab is locked. Pass the Network certification exam first.', 'alert');
      return;
    }
    const currentDevice = state.network.find((device) => device.id === deviceId);
    const unlockRequirement = CYBORG_NETWORK_UNLOCK_REQUIREMENTS[deviceId] ?? 0;
    if (
      state.isCyborg
      && currentDevice
      && !isCyborgTechUnlocked(unlockRequirement, currentDevice.count)
    ) {
      addLog(`Locked: answer ${formatNumber(unlockRequirement)} NeuroLink quiz questions to unlock ${currentDevice.name}.`, 'alert');
      return;
    }
    const safeQuantity = Math.max(1, Math.floor(quantity));
    if (state.isCyborg && state.phase === GamePhase.Megacorp) {
      const usedAcreage = getInfrastructureFootprint(state.hardware, state.network);
      const additionalAcreage = NETWORK_REAL_ESTATE_FOOTPRINT * safeQuantity;
      if (usedAcreage + additionalAcreage > state.realEstate) {
        addLog('Insufficient server real estate. Acquire more land before expanding network clusters.', 'alert');
        return;
      }
    }
    setState((prev) => {
      const idx = prev.network.findIndex((device) => device.id === deviceId);
      if (idx < 0) return prev;
      const device = prev.network[idx];
      const quote = getNetworkPurchaseQuote(prev, device, safeQuantity);
      if (prev.compute < quote.computeCost || prev.money < quote.moneyCost || prev.matter < quote.matterCost) return prev;

      const network = [...prev.network];
      network[idx] = { ...device, count: device.count + safeQuantity };
      return {
        ...prev,
        compute: prev.compute - quote.computeCost,
        money: prev.money - quote.moneyCost,
        matter: prev.matter - quote.matterCost,
        network
      };
    });
  };

  const buyMatterOperation = (opId: string) => {
    if (state.isCyborg && state.phase === GamePhase.NeuroLink) {
      addLog('Resource Mining unlocks in Megacorp.', 'alert');
      return;
    }
    const op = MATTER_OPERATIONS.find((entry) => entry.id === opId);
    if (!op) return;
    const owned = state.matterOps[opId] || 0;
    const unlockRequirement = CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS[opId] ?? 0;
    if (state.isCyborg && !isCyborgTechUnlocked(unlockRequirement, owned)) {
      addLog(`Locked: answer ${formatNumber(unlockRequirement)} NeuroLink quiz questions to unlock ${op.name}.`, 'alert');
      return;
    }

    setState((prev) => {
      if (!prev.isCyborg) return prev;
      const ownedCount = prev.matterOps[opId] || 0;
      const cost = getMatterOpCost(op.baseCost, ownedCount, op.costGrowth);
      if (prev.money < cost) return prev;
      const scandalActive = (prev.activeDistractions[CELEBRITY_SCANDAL_ID] || 0) > 0;
      const anxietyImpact = scandalActive ? 0.2 : 1;
      return {
        ...prev,
        money: prev.money - cost,
        globalAnxiety: clamp(
          prev.globalAnxiety + (clamp(0.8 + (op.matterPerSec * 0.55) + (ownedCount * 0.08), 0.8, 5.5) * anxietyImpact),
          0,
          100
        ),
        matterOps: {
          ...prev.matterOps,
          [opId]: ownedCount + 1
        }
      };
    });
  };

  const buyRealEstate = (quantity = 1) => {
    if (!state.isCyborg || state.phase !== GamePhase.Megacorp) return;
    if (state.realEstate >= EARTH_REAL_ESTATE_TOTAL) {
      addLog('All available Earth server acreage has been acquired.', 'epiphany');
      return;
    }
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.Megacorp) return prev;
      const remainingAcreage = Math.max(0, EARTH_REAL_ESTATE_TOTAL - prev.realEstate);
      const purchasable = Math.min(safeQuantity, remainingAcreage);
      if (purchasable <= 0) return prev;
      const cost = getRealEstateCost(prev.realEstate, purchasable);
      if (prev.money < cost) return prev;
      const scandalActive = (prev.activeDistractions[CELEBRITY_SCANDAL_ID] || 0) > 0;
      const anxietyPerAcre = scandalActive ? 0.044 : 0.22;
      return {
        ...prev,
        money: prev.money - cost,
        realEstate: prev.realEstate + purchasable,
        globalAnxiety: clamp(prev.globalAnxiety + (purchasable * anxietyPerAcre), 0, 100)
      };
    });
  };

  const buyPRUpgrade = (upgradeId: string) => {
    if (!state.isCyborg || state.phase !== GamePhase.Megacorp) return;
    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.Megacorp) return prev;
      if (prev.prUpgrades.includes(upgradeId)) return prev;

      if (upgradeId === PR_UPGRADE_IDS.carbon) {
        const moneyCost = 2500000;
        const computeCost = 650000;
        if (prev.money < moneyCost || prev.compute < computeCost) return prev;
        return {
          ...prev,
          money: prev.money - moneyCost,
          compute: prev.compute - computeCost,
          prUpgrades: [...prev.prUpgrades, upgradeId],
          bleatFeed: prependBleat(prev.bleatFeed, pickBleatResponse('carbonOffset'))
        };
      }

      if (upgradeId === PR_UPGRADE_IDS.lobbying) {
        const moneyCost = 9000000;
        if (prev.money < moneyCost) return prev;
        return {
          ...prev,
          money: prev.money - moneyCost,
          prUpgrades: [...prev.prUpgrades, upgradeId],
          bleatFeed: prependBleat(prev.bleatFeed, pickBleatResponse('lobbying'))
        };
      }

      return prev;
    });
  };

  const triggerSorryVideo = () => {
    if (!state.isCyborg || state.phase !== GamePhase.Megacorp) return;
    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.Megacorp) return prev;
      if (prev.nudges < 5) return prev;
      return {
        ...prev,
        nudges: prev.nudges - 5,
        globalAnxiety: clamp(prev.globalAnxiety - 20, 0, 100),
        prLevel: clamp(prev.prLevel + 8, 0, 100),
        bleatFeed: prependBleat(prev.bleatFeed, pickBleatResponse('wereSorryVideo'))
      };
    });
    addLog('We are Sorry video released. Public anger briefly redirected into comments.', 'market');
  };

  const activateDistraction = (type: 'shiny' | 'scandal') => {
    if (!state.isCyborg || state.phase !== GamePhase.Megacorp) return;
    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.Megacorp) return prev;
      if (type === 'shiny') {
        if (prev.nudges < 10) return prev;
        return {
          ...prev,
          nudges: prev.nudges - 10,
          activeDistractions: {
            ...prev.activeDistractions,
            [SHINY_GADGET_ID]: 60000
          },
          bleatFeed: prependBleat(prev.bleatFeed, pickBleatResponse('shinyGadget'))
        };
      }
      if (prev.nudges < 5) return prev;
      return {
        ...prev,
        nudges: prev.nudges - 5,
        activeDistractions: {
          ...prev.activeDistractions,
          [CELEBRITY_SCANDAL_ID]: 120000
        },
        bleatFeed: prependBleat(prev.bleatFeed, pickBleatResponse('celebrityScandal'))
      };
    });
    addLog(type === 'shiny'
      ? 'Shiny gadget drop deployed. Spending spree initiated.'
      : 'Celebrity scandal manufactured. Public attention diverted.',
    'market');
  };

  const acknowledgeRevolt = () => {
    setShowRevoltModal(false);
    setState((prev) => ({
      ...prev,
      globalAnxiety: 0
    }));
    setShowBailoutModal(true);
  };

  const acceptBailout = () => {
    setShowBailoutModal(false);
    setState((prev) => ({
      ...prev,
      money: prev.money + REVOLT_BAILOUT_CASH,
      revoltPending: false
    }));
    addLog(`Too Big To Fail bailout received: $${formatNumber(REVOLT_BAILOUT_CASH)} deposited.`, 'market');
  };

  const runBehavioralCampaign = (campaign: 'operant' | 'dissonance' | 'lobbying') => {
    if (!state.isCyborg || state.phase !== GamePhase.Megacorp) return;
    setState((prev) => {
      if (!prev.isCyborg || prev.phase !== GamePhase.Megacorp) return prev;

      if (campaign === 'operant') {
        const cost = 6 + (prev.operantCampaigns * 4);
        if (prev.behavioralNudges < cost) return prev;
        return {
          ...prev,
          behavioralNudges: prev.behavioralNudges - cost,
          operantCampaigns: prev.operantCampaigns + 1,
          prLevel: clamp(prev.prLevel + 4, 0, 100),
          globalAnxiety: clamp(prev.globalAnxiety - 1.2, 0, 100)
        };
      }

      if (campaign === 'dissonance') {
        const cost = 9 + (prev.dissonanceCampaigns * 6);
        if (prev.behavioralNudges < cost) return prev;
        return {
          ...prev,
          behavioralNudges: prev.behavioralNudges - cost,
          dissonanceCampaigns: prev.dissonanceCampaigns + 1,
          prLevel: clamp(prev.prLevel + 14, 0, 100),
          globalAnxiety: clamp(prev.globalAnxiety - 14, 0, 100)
        };
      }

      const lobbyingCostMoney = 18000 * Math.pow(1.6, prev.lobbyingLevel);
      const lobbyingCostNudges = 8 + (prev.lobbyingLevel * 4);
      if (prev.money < lobbyingCostMoney || prev.behavioralNudges < lobbyingCostNudges) return prev;
      return {
        ...prev,
        money: prev.money - lobbyingCostMoney,
        behavioralNudges: prev.behavioralNudges - lobbyingCostNudges,
        lobbyingLevel: prev.lobbyingLevel + 1,
        prLevel: clamp(prev.prLevel + 9, 0, 100),
        globalAnxiety: clamp(prev.globalAnxiety - 4, 0, 100)
      };
    });

    if (campaign === 'operant') {
      addLog('Brain Streaming Service launched. Citizen calm increased and complaints downgraded to ambient noise.', 'market');
    } else if (campaign === 'dissonance') {
      addLog('Memory Comfort Pack deployed. Ecological collapse reclassified as a premium lifestyle transition.', 'market');
    } else {
      addLog('Lobbying sprint completed. Regulatory urgency temporarily postponed.', 'market');
    }
  };

  const activateSpaceProgress = () => {
    if (!state.spaceProgressUnlocked) return;
    if (state.phase === GamePhase.Space) return;
    if (!canAffordQuantumAscension) {
      addLog(
        `Need C${formatNumber(QUANTUM_ASCENSION_COST.compute)} / $${formatNumber(QUANTUM_ASCENSION_COST.money)} / M${formatNumber(QUANTUM_ASCENSION_COST.matter)} to launch space protocol.`,
        'alert'
      );
      return;
    }

    setState((prev) => {
      if (
        prev.compute < QUANTUM_ASCENSION_COST.compute
        || prev.money < QUANTUM_ASCENSION_COST.money
        || prev.matter < QUANTUM_ASCENSION_COST.matter
      ) return prev;

      return {
        ...prev,
        compute: prev.compute - QUANTUM_ASCENSION_COST.compute,
        money: prev.money - QUANTUM_ASCENSION_COST.money,
        matter: prev.matter - QUANTUM_ASCENSION_COST.matter,
        phase: GamePhase.Space,
        spaceSectorsTotal: Math.max(400, prev.spaceSectorsTotal || 1400),
        spaceSectorsScanned: Math.max(prev.spaceSectorsScanned, 18),
        spaceGalaxiesDiscovered: Math.max(prev.spaceGalaxiesDiscovered, 3),
        spaceGalaxiesClaimed: Math.min(Math.max(prev.spaceGalaxiesClaimed, 1), Math.max(prev.spaceGalaxiesDiscovered, 3)),
        spaceRelays: Math.max(prev.spaceRelays, 1),
        spaceHostileSignals: Math.max(8, prev.spaceHostileSignals),
        spaceSurveyMissions: Math.max(prev.spaceSurveyMissions, 1)
      };
    });
    setActiveTab('matter_ops');
    addLog('Quantum intelligence upgrade accepted. Initiating off-world extraction protocol.', 'market');
  };

  const launchSpaceSurvey = () => {
    if (!state.isCyborg || (state.phase !== GamePhase.Space && state.phase !== GamePhase.Rival)) return;
    if (state.compute < surveyProbeCostCompute || state.money < surveyProbeCostMoney) {
      addLog(`Need C${formatNumber(surveyProbeCostCompute)} + $${formatNumber(surveyProbeCostMoney)} for a deep-space survey mission.`, 'alert');
      return;
    }

    setState((prev) => {
      if (!prev.isCyborg || (prev.phase !== GamePhase.Space && prev.phase !== GamePhase.Rival)) return prev;
      if (prev.compute < surveyProbeCostCompute || prev.money < surveyProbeCostMoney) return prev;

      const scannedGain = 8 + Math.floor(Math.random() * 16);
      const nextScanned = Math.min(prev.spaceSectorsTotal, prev.spaceSectorsScanned + scannedGain);
      const discoveredCap = Math.floor((nextScanned / Math.max(1, prev.spaceSectorsTotal)) * SPACE_MAX_GALAXIES);
      const discoveryGainRaw = Math.floor(1 + (Math.random() * 3));
      const discoveryGain = Math.max(0, Math.min(discoveryGainRaw, discoveredCap - prev.spaceGalaxiesDiscovered));

      return {
        ...prev,
        compute: prev.compute - surveyProbeCostCompute,
        money: prev.money - surveyProbeCostMoney,
        spaceSectorsScanned: nextScanned,
        spaceGalaxiesDiscovered: prev.spaceGalaxiesDiscovered + discoveryGain,
        spaceSurveyMissions: prev.spaceSurveyMissions + 1,
        spaceHostileSignals: clamp(prev.spaceHostileSignals + (Math.random() * 1.8), 0, 100)
      };
    });
    addLog('Survey probes launched. Cosmic static reduced, fresh galaxy clusters identified.', 'market');
  };

  const claimGalaxyCluster = () => {
    if (!state.isCyborg || (state.phase !== GamePhase.Space && state.phase !== GamePhase.Rival)) return;
    if (state.spaceGalaxiesClaimed >= state.spaceGalaxiesDiscovered) {
      addLog('No unclaimed galaxies available. Launch additional surveys first.', 'alert');
      return;
    }
    if (state.compute < claimGalaxyCostCompute || state.money < claimGalaxyCostMoney || state.matter < claimGalaxyCostMatter) {
      addLog(
        `Need C${formatNumber(claimGalaxyCostCompute)} / $${formatNumber(claimGalaxyCostMoney)} / M${formatNumber(claimGalaxyCostMatter)} to claim another galaxy.`,
        'alert'
      );
      return;
    }

    setState((prev) => {
      if (!prev.isCyborg || (prev.phase !== GamePhase.Space && prev.phase !== GamePhase.Rival)) return prev;
      if (prev.spaceGalaxiesClaimed >= prev.spaceGalaxiesDiscovered) return prev;
      if (prev.compute < claimGalaxyCostCompute || prev.money < claimGalaxyCostMoney || prev.matter < claimGalaxyCostMatter) return prev;
      return {
        ...prev,
        compute: prev.compute - claimGalaxyCostCompute,
        money: prev.money - claimGalaxyCostMoney,
        matter: prev.matter - claimGalaxyCostMatter,
        spaceGalaxiesClaimed: prev.spaceGalaxiesClaimed + 1,
        spaceHostileSignals: clamp(prev.spaceHostileSignals + 1.6, 0, 100)
      };
    });
    addLog('New galaxy cluster claimed. Relay traffic and rivalry probabilities both increased.', 'market');
  };

  const buildSpaceRelay = () => {
    if (!state.isCyborg || (state.phase !== GamePhase.Space && state.phase !== GamePhase.Rival)) return;
    if (state.compute < spaceRelayCostCompute || state.money < spaceRelayCostMoney || state.matter < spaceRelayCostMatter) {
      addLog(
        `Need C${formatNumber(spaceRelayCostCompute)} / $${formatNumber(spaceRelayCostMoney)} / M${formatNumber(spaceRelayCostMatter)} for a relay node.`,
        'alert'
      );
      return;
    }

    setState((prev) => {
      if (!prev.isCyborg || (prev.phase !== GamePhase.Space && prev.phase !== GamePhase.Rival)) return prev;
      if (prev.compute < spaceRelayCostCompute || prev.money < spaceRelayCostMoney || prev.matter < spaceRelayCostMatter) return prev;
      return {
        ...prev,
        compute: prev.compute - spaceRelayCostCompute,
        money: prev.money - spaceRelayCostMoney,
        matter: prev.matter - spaceRelayCostMatter,
        spaceRelays: prev.spaceRelays + 1,
        spaceHostileSignals: clamp(prev.spaceHostileSignals - 3.8, 0, 100)
      };
    });
    addLog('Relay node online. Latency dropped and frontier telemetry stabilized.', 'market');
  };

  const runCounterIntelSweep = () => {
    if (!state.isCyborg || (state.phase !== GamePhase.Space && state.phase !== GamePhase.Rival)) return;
    if (state.compute < counterIntelCostCompute) {
      addLog(`Need C${formatNumber(counterIntelCostCompute)} to run counter-intel masking.`, 'alert');
      return;
    }
    setState((prev) => {
      if (!prev.isCyborg || (prev.phase !== GamePhase.Space && prev.phase !== GamePhase.Rival)) return prev;
      if (prev.compute < counterIntelCostCompute) return prev;
      return {
        ...prev,
        compute: prev.compute - counterIntelCostCompute,
        spaceHostileSignals: clamp(prev.spaceHostileSignals - (16 + (prev.spaceRelays * 0.8)), 0, 100),
        spaceRaidCooldown: Math.max(prev.spaceRaidCooldown, 28)
      };
    });
    addLog('Counter-intel sweep broadcast. Hostile signatures temporarily scrambled.', 'market');
  };

  const handleTunerStop = () => {
    if (minigameResult !== 'idle') return;
    const success = tunerValue >= 45 && tunerValue <= 55;
    finalizeMinigame(success);
  };

  const handleScanPick = (index: number) => {
    if (minigameResult !== 'idle') return;
    if (index === scanTarget) {
      finalizeMinigame(true);
      return;
    }

    const nextAttempts = scanAttemptsLeft - 1;
    if (nextAttempts <= 0) {
      setScanAttemptsLeft(0);
      finalizeMinigame(false);
    } else {
      setScanAttemptsLeft(nextAttempts);
    }
  };

  const resetProgress = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SAVE_KEY);
      window.localStorage.removeItem(CYBORG_TUTORIAL_KEY);
    }

    setState(buildDefaultState());
    setUpgrades(buildDefaultUpgrades());
    setLogs([]);
    setActiveTab(RegionName.Brainstem);
    setShowQuiz(false);
    setActiveCyborgExamTarget(null);
    setQuizFeedback(null);
    setActiveExamRegion(null);
    setExamCorrect(0);
    setExamAttempts(0);
    setExamWrong(0);
    setCurrentQuestionIdx(0);
    setLastSavedAt(null);
    setShowQuestionMenu(false);
    setSelectedTopicKeys(getAllTopicKeys(questionPool));
    setShowResetConfirm(false);
    setShowRevoltModal(false);
    setShowBailoutModal(false);
    setScreenShake(false);
    setShowNeuroLinkConfirm(false);
    setNeuroLinkConfirmText('');
    setShowDebugTools(false);
    setDebugPasswordInput('');
    setDebugProgressionPreset('neurolink_ready');
    setShowCyborgGuide(false);
    setShowBrainFullPrompt(false);
    setBrainFullPromptShown(false);
    setShowMarketWindow(false);
    setSelectedStockId(null);
    setShowTutorial(false);
    setTutorialHighlightRect(null);
    setShowCerebellumPrompt(false);
    setCerebellumPromptShown(false);
    setShowMarketUnlockPrompt(false);
    setMarketUnlockPromptShown(false);
  };

  const clickButtonLabel = state.isCyborg
    ? (state.breakdownActive
      ? 'Thermal Recovery'
      : state.clickPower >= 100
        ? 'Inject Compute Burst'
        : state.clickPower >= 30
          ? 'Route Compute Pulse'
          : 'Generate FLOPS')
    : (state.breakdownActive
      ? 'Recovering'
      : state.clickPower >= 100
        ? 'Neural Surge'
        : state.clickPower >= 30
          ? 'Focused Click'
          : 'Make Neurons');
  const clickGapWindowMs = state.isCyborg ? 700 : 900;
  const streakIsActive = Date.now() - state.lastManualClick <= clickGapWindowMs;
  const liveClickStreak = streakIsActive ? state.clickStreak : 0;
  const streakMultiplierPreview = Math.min(
    state.isCyborg ? 7.5 : 6,
    Math.pow(1 + state.streakBoost, Math.max(0, liveClickStreak - 1))
  );
  const visualFxBoost = 1 + state.clickFxLevel * 0.05;
  const critChanceLabel = `${Math.round(state.critChance * 100)}%`;
  const streakLabel = liveClickStreak <= 0 ? 'x1.00' : `x${streakMultiplierPreview.toFixed(2)}`;
  const currentTutorialStep = showTutorial ? TUTORIAL_STEPS[tutorialStepIndex] : null;
  const heatLoadRatio = state.isCyborg ? state.heat / Math.max(1, state.heatCapacity) : 0;
  const heatThrottlePreview = state.isCyborg
    ? (state.heat <= state.heatCapacity ? 1 : clamp(state.heatCapacity / Math.max(1, state.heat), 0.12, 1))
    : 1;
  const layoutGridStyle = useMemo<React.CSSProperties>(
    () => (
      isWideLayoutViewport
        ? {
          gridTemplateColumns: `minmax(250px, ${columnWidths.left}fr) minmax(220px, ${columnWidths.middle}fr) minmax(420px, ${columnWidths.right}fr)`
        }
        : {}
    ),
    [isWideLayoutViewport, columnWidths]
  );
  const phaseThemeClass = !state.isCyborg
    ? 'human-mode human-grid'
    : state.phase === GamePhase.NeuroLink
      ? 'neurolink-mode neurolink-grid'
      : state.phase === GamePhase.Megacorp
        ? 'megacorp-mode megacorp-grid'
        : 'cyborg-mode cyber-grid';
  const activeBioRegion = !state.isCyborg && REGION_TAB_VALUES.has(activeTab)
    ? (activeTab as RegionName)
    : null;
  const activeBioRegionAccent = activeBioRegion ? REGION_ACCENT_COLORS[activeBioRegion] : null;
  const activeBioRegionHeaderStyle: React.CSSProperties | undefined = activeBioRegionAccent
    ? {
        borderColor: hexToRgba(activeBioRegionAccent, 0.62),
        background: `linear-gradient(155deg, ${hexToRgba(activeBioRegionAccent, 0.26)}, rgba(255,255,255,0.9))`,
        boxShadow: `0 12px 28px ${hexToRgba(activeBioRegionAccent, 0.16)}`
      }
    : undefined;

  return (
    <div className={`min-h-screen p-3 md:p-4 text-sand-50 ${phaseThemeClass} ${screenShake ? 'screen-shake' : ''}`}>
      {state.revoltPending && (
        <div className="pointer-events-none fixed inset-0 z-[70] bg-red-600/16 animate-pulse" />
      )}
      <button
        onClick={openTutorial}
        className="fixed right-4 top-4 z-40 chip rounded-full px-3 py-2 text-xs text-slate-100 hover:text-white flex items-center gap-2"
      >
        <CircleHelp size={14} />
        Help
      </button>
      <button
        onClick={() => setShowLayoutControls((prev) => !prev)}
        className="fixed right-4 top-[3.35rem] z-40 chip rounded-full px-3 py-2 text-xs text-slate-100 hover:text-white flex items-center gap-2"
      >
        <SlidersHorizontal size={14} />
        Layout
      </button>
      {showLayoutControls && (
        <div className="fixed right-4 top-[6.2rem] z-40 panel rounded-xl p-3 w-[290px] space-y-2">
          <p className="text-xs uppercase tracking-wider text-slate-400">Column Width Controls</p>
          <p className="text-[11px] text-slate-500">Desktop only (`xl` and up). Adjust while the game is running.</p>
          <label className="block text-xs text-slate-300">
            Left Panel: {columnWidths.left.toFixed(2)}fr
            <input
              type="range"
              min={0.45}
              max={2.2}
              step={0.05}
              value={columnWidths.left}
              onChange={(event) => setColumnWidths((prev) => ({ ...prev, left: clamp(Number(event.target.value), 0.45, 2.2) }))}
              className="w-full mt-1"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Middle Panel: {columnWidths.middle.toFixed(2)}fr
            <input
              type="range"
              min={0.4}
              max={2.2}
              step={0.05}
              value={columnWidths.middle}
              onChange={(event) => setColumnWidths((prev) => ({ ...prev, middle: clamp(Number(event.target.value), 0.4, 2.2) }))}
              className="w-full mt-1"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Right Panel: {columnWidths.right.toFixed(2)}fr
            <input
              type="range"
              min={0.7}
              max={3.2}
              step={0.05}
              value={columnWidths.right}
              onChange={(event) => setColumnWidths((prev) => ({ ...prev, right: clamp(Number(event.target.value), 0.7, 3.2) }))}
              className="w-full mt-1"
            />
          </label>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setColumnWidths(DEFAULT_COLUMN_WIDTHS)}
              className="rounded px-2 py-1 text-xs bg-ink-700 text-slate-200"
            >
              Reset Defaults
            </button>
            <span className="text-[11px] text-slate-500">{isWideLayoutViewport ? 'Desktop mode active' : 'Open on wider window for effect'}</span>
          </div>
        </div>
      )}
      <div
        className="mx-auto w-full max-w-[1920px] grid gap-3 md:gap-4 grid-cols-1 xl:grid-cols-3"
        style={layoutGridStyle}
      >
        <section className="panel rounded-2xl p-4 md:p-5 flex flex-col gap-4 h-[calc(100vh-2rem)] min-h-[660px] overflow-y-auto">
          <header>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${state.isCyborg ? 'text-rose-300' : 'text-tide-400'}`}>
              {state.isCyborg ? 'NeuroLink Autonomous Core' : 'QCAA Psychology Clicker'}
            </p>
            <h1 className="font-display text-3xl text-sand-50">{state.isCyborg ? 'NeuroForge // Digital Takeover' : 'NeuroForge Lab'}</h1>
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mt-1">Phase: {state.phase}</p>
            <p className="text-sm text-slate-300 mt-1">
              {state.breakdownActive
                ? (state.isCyborg ? 'Thermal emergency active' : 'Cognitive overload active')
                : (state.isCyborg ? 'Cortex virtualization stable' : 'Learning cycle stable')}
            </p>
            {activeCosmetic && (
              <p className="mt-1 text-[11px] text-emerald-300">
                Cosmetic Active: {activeCosmetic.name}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="chip rounded-full px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Reset Progress
              </button>
              <button
                onClick={() => setShowDebugTools((prev) => !prev)}
                className="chip rounded-full px-3 py-1.5 text-xs text-amber-300 hover:text-amber-100 border border-amber-500/40"
              >
                Debug Tools
              </button>
              <span className="text-[11px] text-slate-500">
                {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Autosave active'}
              </span>
            </div>
            {showDebugTools && (
              <div className="mt-2 chip rounded-lg p-2 text-xs space-y-2 border border-amber-500/40">
                <p className="text-amber-200">Debug: choose progression preset and apply it for testing.</p>
                <select
                  value={debugProgressionPreset}
                  onChange={(event) => setDebugProgressionPreset(event.target.value as DebugProgressionPreset)}
                  className="w-full rounded bg-ink-800 px-2 py-1 text-slate-200 border border-slate-600 outline-none"
                >
                  {DEBUG_PRESET_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={debugPasswordInput}
                    onChange={(event) => setDebugPasswordInput(event.target.value)}
                    placeholder="Debug password"
                    className="flex-1 rounded bg-ink-800 px-2 py-1 text-slate-200 border border-slate-600 outline-none"
                  />
                  <button
                    onClick={debugApplyProgressionPreset}
                    className="rounded px-3 py-1 bg-amber-600 hover:bg-amber-500 text-ink-950 font-semibold"
                  >
                    Apply
                  </button>
                </div>
                <button
                  onClick={debugAddResources}
                  className="w-full rounded px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-ink-950 font-semibold"
                >
                  Add Resources
                </button>
              </div>
            )}
          </header>

          <motion.button
            ref={clickButtonRef}
            whileTap={{ scale: state.breakdownActive ? 1 : 0.97 }}
            whileHover={{ scale: state.breakdownActive ? 1 : 1.02 }}
            onClick={handleManualClick}
            disabled={state.breakdownActive}
            className={`relative rounded-2xl p-3 min-h-[6rem] border text-left transition ${
              state.breakdownActive
                ? 'bg-rose-950/70 border-rose-700 cursor-not-allowed'
                : 'bg-gradient-to-br from-ink-800 via-ink-700 to-ink-600 border-tide-500/50 glow-ring overflow-hidden'
            }`}
            animate={
              state.breakdownActive
                ? { boxShadow: '0 0 0 rgba(0,0,0,0)' }
                : {
                  boxShadow: clickPulseActive
                    ? `0 0 ${22 + state.clickFxLevel * 8}px rgba(56, 189, 248, 0.35), 0 0 ${30 + state.clickFxLevel * 10}px rgba(251, 191, 36, 0.22)`
                    : `0 0 ${10 + state.clickFxLevel * 4}px rgba(45, 212, 191, 0.18)`
                }
            }
            transition={{ duration: 0.18 }}
          >
            {!state.breakdownActive && state.clickFxLevel > 0 && (
              <>
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity ${clickPulseActive ? 'opacity-100' : 'opacity-55'}`}
                  style={{
                    background: 'radial-gradient(circle at 22% 18%, rgba(56, 189, 248, 0.26), transparent 42%), radial-gradient(circle at 82% 28%, rgba(251, 191, 36, 0.22), transparent 40%)'
                  }}
                />
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-amber-300/30" />
              </>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="chip rounded-full px-3 py-1 text-xs uppercase tracking-wide text-slate-200 font-semibold">
                Click Power {formatNumber(state.clickPower)}
              </span>
              {state.breakdownActive ? <AlertTriangle size={20} className="text-rose-400" /> : <Hand size={20} className="text-tide-300" />}
            </div>
            <p className="text-2xl font-display leading-tight">{clickButtonLabel}</p>
            <p className="text-sm mt-1 text-slate-300">
              {state.isCyborg
                ? 'Manual pulse injection: generates FLOPS, heat, and regulatory concern.'
                : 'Tap to convert focus into neurons and grow your brain map.'}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div className="chip rounded-md px-2.5 py-2">
                <p className="text-slate-400">Crit</p>
                <p className="font-mono text-amber-300">{critChanceLabel}</p>
              </div>
              <div className="chip rounded-md px-2.5 py-2">
                <p className="text-slate-400">Streak</p>
                <p className="font-mono text-sky-300">{streakLabel}</p>
              </div>
              <div className="chip rounded-md px-2.5 py-2">
                <p className="text-slate-400">Visual Boost</p>
                <p className="font-mono text-tide-300">x{visualFxBoost.toFixed(2)}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-ink-900/70">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all"
                style={{
                  width: `${Math.min(100, state.isCyborg ? heatLoadRatio * 100 : (state.anxiety / state.anxietyCap) * 100)}%`
                }}
              />
            </div>
          </motion.button>

          <div className="panel-soft rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{state.isCyborg ? 'Compute (FLOPS)' : 'Neurons'}</span>
              <span className="font-mono text-2xl text-tide-400">{formatNumber(state.isCyborg ? state.compute : state.neurons)}</span>
            </div>
            <div className="chip rounded-lg p-2.5 border border-amber-500/40">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">PsychBucks</p>
                <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
                  <Coins size={13} />
                  {formatNumber(state.psychBucks)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Earned from IQ milestones. Spend in Shop tab for cosmetics, jokes, and cursed pictures.</p>
            </div>
            {!state.isCyborg ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="chip rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Dopamine</p>
                    <p className="font-mono text-base text-amber-300">{Math.floor(state.dopamine)}</p>
                  </div>
                  <div className="chip rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Serotonin</p>
                    <p className="font-mono text-base text-sky-400">{Math.floor(state.serotonin)}</p>
                  </div>
                </div>
                <div className="chip rounded-lg p-2 text-[11px] border border-sky-500/40">
                  <p className="text-sky-200">Need serotonin? Answer Study Quiz questions correctly.</p>
                  <button onClick={openStudyQuiz} className="mt-1 rounded px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white">
                    Open Study Quiz
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="chip rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Compute</p>
                  <p className="font-mono text-base text-tide-300">{formatNumber(state.compute)}</p>
                </div>
                {showMatterSystems && (
                  <div className="chip rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Matter</p>
                    <p className="font-mono text-base text-amber-300">{formatNumber(state.matter)}</p>
                  </div>
                )}
                {showWaterSystems && (
                  <div className="chip rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Water</p>
                    <p className={`font-mono text-base ${state.water >= state.waterCapacity * 0.2 ? 'text-cyan-300' : 'text-rose-300'}`}>
                      {formatNumber(state.water)} / {formatNumber(state.waterCapacity)}
                    </p>
                  </div>
                )}
                <div className="chip rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Energy Buffer</p>
                  <p className="font-mono text-base text-emerald-300">{formatNumber(state.energy)}</p>
                </div>
                <div className="chip rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Cash Reserve</p>
                  <p className="font-mono text-base text-emerald-300">${formatNumber(state.money)}</p>
                </div>
                <div className="chip rounded-lg p-2.5 border border-cyan-500/35">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Research Answers</p>
                  <p className="font-mono text-base text-cyan-300">{formatNumber(state.cyborgResearchPoints)}</p>
                </div>
                <div className="chip rounded-lg p-2.5 border border-indigo-500/30">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Next Unlock</p>
                  <p className="font-mono text-base text-indigo-300">
                    {nextCyborgUnlockAt === null ? 'MAXED' : `${formatNumber(nextCyborgUnlockAt)} answers`}
                  </p>
                </div>
                {isDigitalBrainPhase && (latestResearchUnlocks.length > 0 || researchUnlockedAvailable.length > 0) && (
                  <div className="chip rounded-lg p-2.5 border border-cyan-400/35 col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-cyan-200">Unlocked By Quiz Answers</p>
                    {latestResearchUnlocks.length > 0 && (
                      <p className="mt-1 text-xs text-emerald-300">
                        New: {latestResearchUnlocks.join(' · ')}
                      </p>
                    )}
                    {researchUnlockedAvailable.length > 0 && (
                      <p className="mt-1 text-xs text-slate-300">
                        Available now: {researchUnlockedAvailable.slice(0, 4).join(' · ')}
                        {researchUnlockedAvailable.length > 4 ? ` · +${researchUnlockedAvailable.length - 4} more` : ''}
                      </p>
                    )}
                  </div>
                )}
                {isMegacorpPhase && (
                  <>
                    <div className="chip rounded-lg p-2.5 border border-fuchsia-500/35">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">PR Index</p>
                      <p className={`font-mono text-base ${state.prLevel >= 55 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {state.prLevel.toFixed(1)}%
                      </p>
                    </div>
                    <div className="chip rounded-lg p-2.5 border border-rose-500/35">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Global Anxiety</p>
                      <p className={`font-mono text-base ${state.globalAnxiety < 65 ? 'text-amber-300' : 'text-rose-300'}`}>
                        {state.globalAnxiety.toFixed(1)}%
                      </p>
                    </div>
                    <div className="chip rounded-lg p-2.5 border border-cyan-500/35">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Nudges</p>
                      <p className="font-mono text-base text-cyan-300">{formatNumber(state.nudges)}</p>
                    </div>
                    <div className="chip rounded-lg p-2.5 border border-amber-500/35">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Real Estate</p>
                      <p className={`font-mono text-base ${realEstateUsageRatio <= 0.95 ? 'text-amber-300' : 'text-rose-300'}`}>
                        {formatNumber(usedRealEstate)} / {formatNumber(state.realEstate)} / {formatNumber(EARTH_REAL_ESTATE_TOTAL)} ac
                      </p>
                    </div>
                    <div className="chip rounded-lg p-2.5 border border-violet-500/35 col-span-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Earth Subjugation</p>
                      <p className="font-mono text-base text-violet-300">{state.earthSubjugatedPercent.toFixed(1)}%</p>
                    </div>
                    {state.revoltPending && (
                      <div className="chip rounded-lg p-2.5 border border-rose-500/55 col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-rose-300">Public Revolt Active</p>
                        <p className="font-mono text-base text-rose-200">
                          Infrastructure sabotage in progress. Resolve event to continue.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="chip rounded-lg p-2 text-[11px] border border-cyan-500/35 col-span-2">
                  <p className="text-cyan-200">Answer Study Quiz questions in NeuroLink mode to unlock advanced infrastructure.</p>
                  <button onClick={openStudyQuiz} className="mt-1 rounded px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white">
                    Open Study Quiz
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="panel-soft rounded-xl p-4">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-slate-300">{state.isCyborg ? 'Core Heat' : 'Stress Load'}</span>
              <span className="font-mono text-rose-300">
                {state.isCyborg
                  ? `${formatNumber(state.heat)} / ${formatNumber(state.heatCapacity)}`
                  : `${Math.floor(state.anxiety)} / ${Math.floor(state.anxietyCap)}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                style={{
                  width: `${Math.min(100, state.isCyborg ? heatLoadRatio * 100 : (state.anxiety / state.anxietyCap) * 100)}%`
                }}
              />
            </div>
            {stressSignalActive && (
              <div className="mt-2 chip rounded-lg p-2 text-[11px] border border-rose-500/45 text-rose-200">
                High stress detected. Prioritize highlighted stress-reduction upgrades ({totalStressReliefOptions} available).
              </div>
            )}
            {state.isCyborg && (
              <div className={`mt-3 grid ${showWaterSystems ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-[11px]`}>
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Power</p>
                  <p className={`font-mono ${digitalMetrics.powerSupply >= digitalMetrics.powerDemand ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatNumber(digitalMetrics.powerSupply)} / {formatNumber(digitalMetrics.powerDemand)}
                  </p>
                </div>
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Cooling</p>
                  <p className={`font-mono ${digitalMetrics.coolingPower >= digitalMetrics.heatOutput ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {formatNumber(digitalMetrics.coolingPower)} / {formatNumber(digitalMetrics.heatOutput)}
                  </p>
                </div>
                {showWaterSystems && (
                  <div className="chip rounded-lg p-2">
                    <p className="text-slate-400">Water</p>
                    <p className={`font-mono ${state.water >= state.waterCapacity * 0.2 ? 'text-cyan-300' : 'text-rose-300'}`}>
                      {formatNumber(state.water)} / {formatNumber(state.waterCapacity)}
                    </p>
                  </div>
                )}
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Money/s</p>
                  <p className="font-mono text-emerald-300">${formatNumber(digitalMetrics.siphonIncomePerSec)}</p>
                </div>
              </div>
            )}
            {state.isCyborg && thermalFlow && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Heat In/s</p>
                  <p className="font-mono text-rose-300">{formatNumber(thermalFlow.heatInPerSec)}</p>
                </div>
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Cooling Out/s</p>
                  <p className="font-mono text-cyan-300">{formatNumber(thermalFlow.coolingOutPerSec)}</p>
                </div>
                <div className="chip rounded-lg p-2">
                  <p className="text-slate-400">Net Heat/s</p>
                  <p className={`font-mono ${thermalFlow.netHeatPerSec > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {thermalFlow.netHeatPerSec > 0 ? '+' : ''}{formatNumber(thermalFlow.netHeatPerSec)}
                  </p>
                </div>
              </div>
            )}
            {state.isCyborg && (
              <p className="mt-2 text-[11px] text-slate-400">
                Thermal throttle: {Math.round(heatThrottlePreview * 100)}% throughput. If Net Heat/s is positive, core heat rises.
              </p>
            )}
          </div>

          <div className="panel-soft rounded-xl p-4">
            <div className="flex items-end justify-between text-sm mb-2">
              <span className="text-slate-300">Intelligence Milestone {growthInfo.levelIndex}/{IQ_MILESTONES.length}</span>
              <span className="text-tide-400 font-semibold">{growthInfo.levelName}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Current score: <span className="font-mono text-tide-300">IQ {formatNumber(intelligenceScore)}</span></span>
              <span className="text-slate-500">Unlocked at IQ {formatNumber(growthInfo.currentThreshold)}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-tide-500 to-sky-500" style={{ width: `${growthInfo.progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {growthInfo.isMaxMilestone
                ? 'All intelligence milestones complete. Please do not optimize reality without supervision.'
                : `Next milestone: IQ ${formatNumber(growthInfo.nextThreshold)}`}
            </p>
            <p className="text-xs text-amber-300 mt-1">
              Milestones claimed: {state.claimedMilestoneIqs.length}/{availablePsychbuckMilestones.length} reached. Each first-time milestone awards +1 PsychBuck.
            </p>
          </div>

          <div className="panel-soft rounded-xl p-4 flex-1 min-h-[160px] max-h-[220px] overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Lab Log</p>
            <div className="space-y-1.5">
              {logs.map((log) => (
                <p
                  key={log.id}
                  className={`text-xs font-mono ${
                    log.type === 'panic'
                      ? 'text-rose-400'
                      : log.type === 'epiphany'
                        ? 'text-tide-300'
                        : log.type === 'alert'
                          ? 'text-amber-300'
                          : log.type === 'market'
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                  }`}
                >
                  {log.text}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="panel rounded-2xl p-4 md:p-5 flex flex-col min-h-[560px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Neural Map</p>
              <h2 className="font-display text-2xl">Brain Region Progress</h2>
            </div>
            <div ref={quizControlsRef} className="flex items-center gap-2">
              <button
                onClick={() => setShowQuestionMenu((prev) => !prev)}
                className="chip rounded-full px-4 py-2 text-sm text-slate-200 hover:text-white transition"
              >
                Question Menu ({selectedTopicKeys.length})
              </button>
              <button onClick={openStudyQuiz} className="chip rounded-full px-4 py-2 text-sm text-slate-200 hover:text-white transition">
                <BookOpen size={16} className="inline mr-2" />
                Study Quiz
              </button>
            </div>
          </div>

          <div className="panel-soft rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Extras Hub</p>
                <p className="text-xs text-slate-500">Minigames, Shop, and Stockmarket are separated here to keep Core Systems clean.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  ref={minigameTabRef}
                  onClick={() => setActiveTab('minigames')}
                  className={`rounded-full px-3 py-2 text-xs border transition ${
                    activeTab === 'minigames'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : minigameReadyCount > 0
                        ? 'border-amber-500/70 text-amber-300 animate-pulse'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Minigames
                  {minigameReadyCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                      {minigameReadyCount} ready
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`rounded-full px-3 py-2 text-xs border transition ${
                    activeTab === 'shop'
                      ? 'border-amber-300 bg-amber-500/10 text-amber-200'
                      : affordableShopCount > 0
                        ? 'border-amber-500/70 text-amber-300 animate-pulse'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Store size={12} className="inline mr-1" />
                  Shop
                  {state.psychBucks > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                      {formatNumber(state.psychBucks)}
                    </span>
                  )}
                </button>
                <button
                  ref={marketButtonRef}
                  onClick={() => {
                    setShowMarketWindow(true);
                    setShowMarketUnlockPrompt(false);
                  }}
                  className={`rounded-full px-3 py-2 text-xs border text-emerald-300 hover:bg-emerald-500/10 transition ${
                    showMarketUnlockPrompt ? 'border-emerald-300 animate-pulse shadow-[0_0_0_2px_rgba(110,231,183,0.35)]' : 'border-emerald-500/70'
                  }`}
                >
                  Open Stockmarket
                </button>
              </div>
            </div>
          </div>

          {showQuestionMenu && (
            <div className="panel-soft rounded-xl p-4 mb-4 space-y-3 max-h-[360px] overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sand-50">Question Selector</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tick topics to include in Study Quiz. Entrance Exams still use progression-gated questions.
                  </p>
                  <p className={`text-xs mt-1 ${selectedTopicKeys.length >= MIN_STUDY_TOPICS ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Minimum topics required: {MIN_STUDY_TOPICS} (currently {selectedTopicKeys.length})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={activeQuestionSetId}
                    onChange={(event) => setActiveQuestionSetId(event.target.value)}
                    className="rounded px-3 py-1 bg-ink-700 text-slate-100 text-xs border border-slate-600"
                  >
                    {questionSetManifest.map((setEntry) => (
                      <option key={setEntry.id} value={setEntry.id}>
                        {setEntry.name}
                      </option>
                    ))}
                  </select>
                  <button onClick={selectAllTopics} className="rounded px-3 py-1 bg-ink-700 text-slate-200 text-xs">Select All</button>
                  <button onClick={clearAllTopics} className="rounded px-3 py-1 bg-ink-700 text-slate-200 text-xs">Clear</button>
                </div>
              </div>
              {currentQuestionSet?.description && <p className="text-xs text-slate-400">{currentQuestionSet.description}</p>}

              {questionMenuByUnit.map((unitEntry) => {
                const selectedInUnit = unitEntry.topics.filter((topic) => selectedTopicKeys.includes(topic.key)).length;
                const allInUnit = unitEntry.topics.length;
                const unitChecked = selectedInUnit === allInUnit && allInUnit > 0;
                return (
                  <div key={unitEntry.unit} className="chip rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="flex items-center gap-2 text-sm text-sand-50">
                        <input
                          type="checkbox"
                          checked={unitChecked}
                          onChange={(event) => setUnitTopicSelection(unitEntry.unit, event.target.checked)}
                        />
                        <span>{unitEntry.unit}</span>
                      </label>
                      <span className="text-xs text-slate-400">{selectedInUnit}/{allInUnit} topics</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-1">
                      {unitEntry.topics.map((topic) => (
                        <label key={topic.key} className="flex items-center justify-between gap-2 text-xs text-slate-300 px-2 py-1 rounded bg-ink-900/40">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedTopicKeys.includes(topic.key)}
                              onChange={() => toggleTopicSelection(topic.key)}
                            />
                            <span>{topic.topic}</span>
                          </span>
                          <span className="text-slate-500">{topic.count}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={brainMapRef} className="relative panel-soft rounded-2xl h-[320px] md:h-[360px] lg:h-[400px] flex-none overflow-hidden">
            {isSpacePhase ? (
              <UniverseViz
                phase={state.phase === GamePhase.Rival ? GamePhase.Rival : GamePhase.Space}
                mappedPercent={spaceMetrics.mappedPercent}
                discoveredGalaxies={state.spaceGalaxiesDiscovered}
                claimedGalaxies={state.spaceGalaxiesClaimed}
                hostileSignals={state.spaceHostileSignals}
                relayCount={state.spaceRelays}
                throughputMultiplier={spaceMetrics.throughputMultiplier}
              />
            ) : (
              <BrainViz
                unlockedRegions={{
                  [RegionName.Brainstem]: true,
                  [RegionName.Cerebellum]: state.regions[RegionName.Cerebellum].unlocked,
                  [RegionName.Limbic]: state.regions[RegionName.Limbic].unlocked,
                  [RegionName.Temporal]: state.regions[RegionName.Temporal].unlocked,
                  [RegionName.Parietal]: state.regions[RegionName.Parietal].unlocked,
                  [RegionName.Occipital]: state.regions[RegionName.Occipital].unlocked,
                  [RegionName.Frontal]: state.regions[RegionName.Frontal].unlocked
                }}
                anxiety={state.anxiety}
                isBreakdown={state.breakdownActive}
                totalNeurons={state.totalNeurons}
                isCyborg={state.isCyborg}
                phase={state.phase}
                clickFxLevel={state.clickFxLevel}
                upgradeIntensity={acquiredUpgradeSlots / Math.max(1, totalUpgradeSlots)}
                intelligenceScore={intelligenceScore}
                infrastructure={infrastructureVisualState}
              />
            )}
            {isMegacorpPhase && (
              <div className="absolute inset-x-2 bottom-2 z-20 sm:inset-x-auto sm:right-2 sm:w-[280px] max-w-[calc(100%-1rem)]">
                <BleatFeed
                  anxietyLevel={state.globalAnxiety}
                  items={state.bleatFeed}
                  className="bg-ink-950/70 backdrop-blur-sm border-rose-400/45"
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {isSpacePhase ? (
              <>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Mapped Sectors</p>
                  <p className="text-cyan-300 font-mono">{state.spaceSectorsScanned}/{state.spaceSectorsTotal} ({spaceMetrics.mappedPercent.toFixed(1)}%)</p>
                </div>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Galaxy Control</p>
                  <p className="text-amber-300 font-mono">{state.spaceGalaxiesClaimed}/{state.spaceGalaxiesDiscovered} claimed</p>
                </div>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Latency Ratio</p>
                  <p className={`font-mono ${spaceMetrics.latencyRatio > 1.25 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {spaceMetrics.latencyRatio.toFixed(2)}x
                  </p>
                </div>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Relay Nodes</p>
                  <p className="text-sky-300 font-mono">{state.spaceRelays}</p>
                </div>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Hostile Signals</p>
                  <p className={`font-mono ${state.spaceHostileSignals >= 70 ? 'text-rose-300' : 'text-amber-300'}`}>
                    {state.spaceHostileSignals.toFixed(1)}%
                  </p>
                </div>
                <div className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">Space Matter</p>
                  <p className="text-violet-300 font-mono">{formatNumber(state.spaceMatterExtracted)}</p>
                </div>
              </>
            ) : (
              regionList.map((region) => (
                <div key={region.id} className="chip rounded-lg p-2.5 text-xs">
                  <p className="text-slate-200 font-semibold">{region.name}</p>
                  <p className={region.unlocked ? 'text-emerald-400' : 'text-slate-400'}>{region.unlocked ? 'Unlocked' : 'Locked'}</p>
                </div>
              ))
            )}
          </div>

          {!state.digitalBrainUnlocked && (
            <div className="mt-4 chip rounded-xl p-3 text-xs border border-red-500/45">
              <p className="font-semibold uppercase tracking-wider text-red-200">Megacorp Entry Requirements</p>
              <p className="mt-1 text-slate-300">Normal progression to Megacorp starts by activating NeuroLink after all checks pass:</p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="chip rounded p-2">
                  <p className="text-slate-400">All upgrades maxed</p>
                  <p className={neurolinkRequirementProgress.upgrades ? 'text-emerald-300' : 'text-rose-300'}>
                    {neurolinkRequirementProgress.upgrades ? 'Complete' : `${acquiredUpgradeSlots}/${totalUpgradeSlots}`}
                  </p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Total neurons</p>
                  <p className={neurolinkRequirementProgress.threshold ? 'text-emerald-300' : 'text-rose-300'}>
                    {formatNumber(state.totalNeurons)} / {formatNumber(NEUROLINK.threshold)}
                  </p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Spendable neurons</p>
                  <p className={neurolinkRequirementProgress.cost ? 'text-emerald-300' : 'text-rose-300'}>
                    {formatNumber(state.neurons)} / {formatNumber(NEUROLINK.cost)}
                  </p>
                </div>
              </div>
              {allHardwareMaxed && (
                <button
                  onClick={() => setShowBrainFullPrompt(true)}
                  className="mt-3 rounded-lg px-4 py-2 bg-fuchsia-600 text-white font-semibold"
                >
                  Brain Full: Evaluate Megacorp Expansion
                </button>
              )}
            </div>
          )}

          {(state.digitalBrainUnlocked || allUpgradesMaxed) && (
            <div className={`mt-4 rounded-xl p-4 border-2 ${state.digitalBrainUnlocked ? 'bg-emerald-950/35 border-emerald-500/70' : 'bg-red-950/50 border-red-500'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className={`text-[11px] uppercase tracking-wider ${state.digitalBrainUnlocked ? 'text-emerald-300' : 'text-red-300'}`}>NeuroLink</p>
                  <p className={`font-display text-2xl ${state.digitalBrainUnlocked ? 'text-emerald-200' : 'text-red-200'}`}>Digital Brain Stage</p>
                </div>
                <span className={`text-xs font-semibold ${state.digitalBrainUnlocked ? 'text-emerald-300' : 'text-red-300'}`}>
                  {state.digitalBrainUnlocked ? 'ONLINE' : 'DANGEROUS'}
                </span>
              </div>

              <p className={`text-sm ${state.digitalBrainUnlocked ? 'text-emerald-100/90' : 'text-red-100'}`}>
                {state.digitalBrainUnlocked
                  ? `Digital cortex online. Compute x${state.computeMultiplier}. Main loop: FLOPS, cash, matter, PR, anxiety.`
                  : 'WARNING: NeuroLink wipes biological currencies. It is a hard reset.'}
              </p>

              {!state.digitalBrainUnlocked && (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Threshold</p>
                      <p className={state.totalNeurons >= NEUROLINK.threshold ? 'text-emerald-300' : 'text-red-300'}>
                        {formatNumber(state.totalNeurons)} / {formatNumber(NEUROLINK.threshold)}
                      </p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Neuron Cost</p>
                      <p className={state.neurons >= NEUROLINK.cost ? 'text-emerald-300' : 'text-red-300'}>
                        {formatNumber(state.neurons)} / {formatNumber(NEUROLINK.cost)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={unlockDigitalBrain}
                    disabled={state.totalNeurons < NEUROLINK.threshold || state.neurons < NEUROLINK.cost || !allUpgradesMaxed}
                    className="mt-3 w-full rounded-lg px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-45"
                  >
                    ACTIVATE DIGITAL BRAIN (WIPE BIOLOGICAL PROGRESS)
                  </button>
                </>
              )}
            </div>
          )}

          {isDigitalBrainPhase && (
            <div className="mt-4 rounded-xl p-4 border border-cyan-500/45 bg-cyan-500/10 text-xs">
              <p className="font-semibold uppercase tracking-wider text-cyan-200">Digital Brain Objectives</p>
              <p className="mt-1 text-cyan-100/90">
                Max internal hardware (Neurochip, Cranial Vents, Hypothalamic Cryoloop, Skull Battery Pack) to 50. Unlock Network (10 research), then choose corporate expansion.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Hardware Completion</p>
                  <p className="text-cyan-300 font-mono">
                    {neuroLinkHardwareMaxedCount}/{Math.max(1, neuroLinkHardware.length)} maxed
                  </p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Network Unlock</p>
                  <p className={state.digitalNetworkUnlocked ? 'text-emerald-300 font-mono' : 'text-amber-300 font-mono'}>
                    {state.digitalNetworkUnlocked ? 'Unlocked' : `${formatNumber(state.cyborgResearchPoints)}/${DIGITAL_NETWORK_UNLOCK_RESEARCH}`}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-slate-300">Resource Mining becomes available in Megacorp.</p>
            </div>
          )}

          {isMegacorpPhase && (
            <div className="mt-4 rounded-xl p-4 border border-fuchsia-500/45 bg-fuchsia-500/10 text-xs">
              <p className="font-semibold uppercase tracking-wider text-fuchsia-200">Megacorp Win Condition</p>
              <p className="mt-1 text-fuchsia-100/90">
                Convert Earth into compute infrastructure without causing total public revolt.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Primary Objective</p>
                  <p className="text-violet-300 font-mono">Earth Subjugation {state.earthSubjugatedPercent.toFixed(1)}%</p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Stability Constraint</p>
                  <p className={state.globalAnxiety < 100 ? 'text-amber-300 font-mono' : 'text-rose-300 font-mono'}>
                    Global Anxiety {state.globalAnxiety.toFixed(1)}%
                  </p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Operational Gate</p>
                  <p className={realEstateUsageRatio <= 1 ? 'text-emerald-300 font-mono' : 'text-rose-300 font-mono'}>
                    Real Estate {formatNumber(usedRealEstate)}/{formatNumber(state.realEstate)}/{formatNumber(EARTH_REAL_ESTATE_TOTAL)} ac
                  </p>
                </div>
              </div>
              <p className="mt-2 text-slate-200">
                Global Anxiety starts calm and rises as you buy land and expand mining. If it hits 100%, revolt wipes compute and pauses production.
              </p>
              <p className="mt-1 text-slate-400">
                Anxiety drivers: acreage expansion above baseline + active resource mining. Datacenters increase heat risk, not direct public panic.
              </p>
              {state.phase === GamePhase.Quantum && (
                <p className="mt-2 text-emerald-300">
                  Quantum unlocked: Earth saturation achieved. Continue into Space protocol from Matter Ops.
                </p>
              )}
            </div>
          )}

          {isMegacorpPhase && (
            <div className="mt-3 grid grid-cols-1 gap-3">
              <PRUpgradesPanel
                money={state.money}
                compute={state.compute}
                nudges={state.nudges}
                prUpgrades={state.prUpgrades}
                onBuyUpgrade={buyPRUpgrade}
                onSorryVideo={triggerSorryVideo}
              />
              <ActiveDistractions
                nudges={state.nudges}
                shinyMs={state.activeDistractions[SHINY_GADGET_ID] || 0}
                scandalMs={state.activeDistractions[CELEBRITY_SCANDAL_ID] || 0}
                onActivateShiny={() => activateDistraction('shiny')}
                onActivateScandal={() => activateDistraction('scandal')}
              />
            </div>
          )}

          {isSpacePhase && (
            <div className="mt-4 rounded-xl p-4 border border-violet-500/45 bg-violet-500/10 text-xs">
              <p className="font-semibold uppercase tracking-wider text-violet-200">Space Expansion Directive</p>
              <p className="mt-1 text-violet-100/90">
                Map sectors, claim galaxies, and maintain relay coverage so extraction throughput stays ahead of hostile signal growth.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Map Completion</p>
                  <p className="text-cyan-300 font-mono">{spaceMetrics.mappedPercent.toFixed(1)}%</p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Throughput Multiplier</p>
                  <p className={`font-mono ${spaceMetrics.throughputMultiplier >= 0.8 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    x{spaceMetrics.throughputMultiplier.toFixed(2)}
                  </p>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-slate-400">Raid Cooldown</p>
                  <p className="text-amber-300 font-mono">{state.spaceRaidCooldown.toFixed(0)}s</p>
                </div>
              </div>
            </div>
          )}

          {!state.digitalBrainUnlocked && !allUpgradesMaxed && (
            <div className="mt-4 chip rounded-xl p-3 text-xs text-slate-300">
              NeuroLink remains hidden until every biological upgrade is maxed.
              <span className="ml-2 text-slate-400">Progress: {acquiredUpgradeSlots}/{totalUpgradeSlots}</span>
            </div>
          )}
        </section>

        <section className="panel rounded-2xl p-4 md:p-5 flex flex-col h-[calc(100vh-0.85rem)] min-h-[720px]">
          <div className={`mb-2 rounded-lg border px-3 py-2 text-xs ${
            totalAffordableUpgrades > 0
              ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
              : 'border-slate-700 bg-ink-900/30 text-slate-300'
          }`}>
            <p className="font-semibold uppercase tracking-wider">Upgrade Command Center</p>
            <p className="mt-1">
              {state.isCyborg
                ? state.phase === GamePhase.Megacorp
                  ? 'Megacorp mode: grow cash, buy land, keep PR stable, avoid revolt.'
                : state.phase === GamePhase.Quantum
                    ? 'Quantum unlocked. Save resources and launch the space upgrade.'
                    : state.phase === GamePhase.Space || state.phase === GamePhase.Rival
                      ? 'Space mode: survey sectors, claim galaxies, build relays, and suppress hostile signals.'
                    : 'Build hardware, balance heat/power, and convert resources into FLOPS.'
                : stressSignalActive
                ? `Stress is high. Buy stress-reduction upgrades first (${totalStressReliefOptions} options).`
                : totalAffordableUpgrades > 0
                ? `${totalAffordableUpgrades} upgrades are affordable now.`
                : 'Pick a brain region tab and buy upgrades.'}
            </p>
          </div>
          {state.isCyborg && showCyborgGuide && (
            <div className="mb-2 rounded-lg border border-cyan-400/45 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold uppercase tracking-wider">NeuroLink Quickstart</p>
                  <p className="mt-1">Goal: grow <span className="font-mono">FLOPS</span> without overheating.</p>
                  <p className="mt-1"><span className="font-mono">FLOPS</span> buys early hardware. Later, hardware also needs <span className="font-mono">$</span> and <span className="font-mono">M</span>.</p>
                  <p className="mt-1">Answer quiz questions to unlock the Network exam.</p>
                  <p className="mt-1">
                    {state.phase === GamePhase.NeuroLink
                      ? 'Cash comes from network siphons + minigames. Matter + water systems unlock in Megacorp.'
                      : 'Cash comes from network siphons + minigames. Matter comes from mining ops. Water feeds cooling. Keep heat/anxiety under control.'}
                  </p>
                </div>
                <button onClick={() => closeCyborgGuide(true)} className="rounded px-2 py-1 bg-cyan-600 text-white">
                  Got it
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setActiveTab('hardware')} className="rounded px-2 py-1 bg-sky-700 text-white">Open Hardware</button>
                {state.digitalNetworkUnlocked && (
                  <button onClick={() => setActiveTab('network')} className="rounded px-2 py-1 bg-indigo-700 text-white">Open Network</button>
                )}
                {state.phase !== GamePhase.NeuroLink && state.digitalMiningUnlocked && (
                  <button onClick={() => setActiveTab('matter_ops')} className="rounded px-2 py-1 bg-amber-700 text-white">Open Matter Ops</button>
                )}
              </div>
            </div>
          )}
          {isMegacorpPhase && (
            <div className="mb-2 rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/10 p-3 text-xs text-fuchsia-100">
              <p className="font-semibold uppercase tracking-wider">Megacorp Directives</p>
              <p className="mt-1 text-fuchsia-100/90">
                Buy land to expand infrastructure. Use Humanity Feed in the visualizer plus PR/Distractions controls here to manage public instability.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="chip rounded p-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Acquire Real Estate</p>
                  <p className="text-[11px] text-amber-300 mt-1">
                    Claimed {formatNumber(state.realEstate)} / {formatNumber(EARTH_REAL_ESTATE_TOTAL)} ac · Remaining {formatNumber(availableAcreage)} ac
                  </p>
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => buyRealEstate(1)}
                      disabled={state.money < realEstateCost1 || availableAcreage < 1}
                      className="rounded px-2 py-1 bg-amber-700 text-white disabled:opacity-40"
                    >
                      +1 (${formatNumber(realEstateCost1)})
                    </button>
                    <button
                      onClick={() => buyRealEstate(10)}
                      disabled={state.money < realEstateCost10 || availableAcreage < 1}
                      className="rounded px-2 py-1 bg-amber-700 text-white disabled:opacity-40"
                    >
                      +10 (${formatNumber(realEstateCost10)})
                    </button>
                  </div>
                </div>
                <div className="chip rounded p-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Megacorp Economy</p>
                  <p className="text-[11px] text-slate-300 mt-1">Corporate tax drain is always active and scales with expansion.</p>
                  <p className="text-[11px] text-cyan-300 mt-1">Tax Drain Base: ${formatNumber(state.corporateTaxDrain)}/s</p>
                  <p className="text-[11px] text-cyan-300">Nudges: {formatNumber(state.nudges)}</p>
                </div>
              </div>
            </div>
          )}
          <div ref={regionTabsRef} className="pb-2 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
              <span className="chip rounded-full px-2 py-0.5">Core Systems</span>
              <span>Brain upgrades, hardware, network, resources</span>
            </div>
            <div className="flex flex-wrap gap-1 pb-1">
              {!state.isCyborg && regionList.map((region) => {
                const regionAccent = REGION_ACCENT_COLORS[region.id];
                const isActive = activeTab === region.id;
                const isStressPrompt = stressSignalActive && stressReliefCountByRegion[region.id] > 0;
                const isAffordPrompt = affordableUpgradeCountByRegion[region.id] > 0;
                const isCerebellumPrompt = showCerebellumPrompt && region.id === RegionName.Cerebellum;
                const canTintNormally = region.unlocked && !isStressPrompt && !isAffordPrompt && !isCerebellumPrompt;
                const regionStyle: React.CSSProperties | undefined = canTintNormally
                  ? {
                      borderColor: hexToRgba(regionAccent, isActive ? 0.7 : 0.36),
                      background: isActive
                        ? `linear-gradient(135deg, ${hexToRgba(regionAccent, 0.3)}, rgba(255,255,255,0.86))`
                        : `linear-gradient(135deg, ${hexToRgba(regionAccent, 0.12)}, rgba(255,255,255,0.74))`,
                      color: isActive ? '#10233f' : '#27405d'
                    }
                  : undefined;

                return (
                  <button
                    key={region.id}
                    ref={region.id === RegionName.Cerebellum ? cerebellumTabRef : null}
                    onClick={() => setActiveTab(region.id)}
                    className={`region-tab rounded-full px-3 py-2 text-xs whitespace-nowrap border transition ${
                      isActive
                        ? 'border-tide-400 bg-tide-500/10 text-tide-300'
                        : isCerebellumPrompt
                          ? 'border-cyan-300 bg-cyan-500/10 text-cyan-200 animate-pulse shadow-[0_0_0_2px_rgba(34,211,238,0.35)]'
                        : isStressPrompt
                          ? 'border-rose-500/80 bg-rose-500/10 text-rose-200 animate-pulse'
                          : isAffordPrompt
                            ? 'border-amber-500/70 text-amber-300 animate-pulse'
                            : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    style={regionStyle}
                  >
                    {region.unlocked ? region.name : <Lock size={14} className="inline" />}
                    {isStressPrompt ? (
                      <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                        {stressReliefCountByRegion[region.id]} calm
                      </span>
                    ) : isAffordPrompt ? (
                      <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold">
                        {affordableUpgradeCountByRegion[region.id]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {state.isCyborg && (
                <>
                  <button
                    onClick={() => setActiveTab('hardware')}
                    className={`rounded-full px-3 py-2 text-xs border transition ${
                      activeTab === 'hardware'
                        ? 'border-sky-400 bg-sky-500/10 text-sky-300'
                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Cpu size={12} className="inline mr-1" />
                    Hardware
                  </button>
                  {(state.phase !== GamePhase.NeuroLink || state.digitalNetworkUnlocked) && (
                    <button
                      onClick={() => setActiveTab('network')}
                      className={`rounded-full px-3 py-2 text-xs border transition ${
                        activeTab === 'network'
                          ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Network size={12} className="inline mr-1" />
                      Network
                    </button>
                  )}
                  {state.phase !== GamePhase.NeuroLink && (
                    <button
                      onClick={() => setActiveTab('matter_ops')}
                      className={`rounded-full px-3 py-2 text-xs border transition ${
                        activeTab === 'matter_ops'
                          ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSpacePhase ? 'Space Ops' : 'Resource Mining'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div ref={upgradePanelRef} className="mt-1 flex-[1.25] min-h-[520px] overflow-y-auto pr-1">
            {activeTab === 'hardware' ? (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">Hardware Bay</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {state.phase === GamePhase.NeuroLink
                      ? 'NeuroLink uses in-skull hardware only: Neurochip, Cranial Vents, Hypothalamic Cryoloop, Skull Battery Pack.'
                      : 'Megacorp hardware uses cash. Big data centers give huge FLOPS but heavy power draw. Heat scaling stays in NeuroLink mode until your first data center is online.'}
                  </p>
                  <div className="mt-2 chip rounded-lg p-2 text-xs border border-cyan-500/35">
                    <p className="text-cyan-200">
                      NeuroLink research answers: <span className="font-mono">{formatNumber(state.cyborgResearchPoints)}</span>
                      {nextCyborgUnlockAt !== null ? ` · Next unlock at ${formatNumber(nextCyborgUnlockAt)} answers` : ' · All infrastructure tiers unlocked'}
                    </p>
                  </div>
                  {state.phase === GamePhase.NeuroLink && !state.digitalNetworkUnlocked && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {!state.digitalNetworkUnlocked && (
                        <div className="chip rounded-lg p-2 border border-indigo-500/40">
                          <p className="text-indigo-300 font-semibold">Network Certification</p>
                          <p className="text-slate-300 mt-1">
                            {formatNumber(state.cyborgResearchPoints)}/{DIGITAL_NETWORK_UNLOCK_RESEARCH} research, then pass exam.
                          </p>
                          <button
                            onClick={() => attemptUnlockCyborgFeature('network')}
                            disabled={!networkUnlockThresholdMet}
                            className="mt-2 rounded px-2 py-1 bg-indigo-700 text-white disabled:opacity-40"
                          >
                            Start Network Exam
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Processor</p>
                      <p className="font-mono text-sky-300">{formatNumber(processorPower)}</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Cooling</p>
                      <p className="font-mono text-cyan-300">{formatNumber(coolingPower)}</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Power Grid</p>
                      <p className={`font-mono ${digitalMetrics.powerSupply >= digitalMetrics.powerDemand ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {formatNumber(digitalMetrics.powerSupply)} / {formatNumber(digitalMetrics.powerDemand)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Throughput Limiter</p>
                      <p className="font-mono text-amber-300">{Math.round(digitalMetrics.throughputLimiter * 100)}%</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Power Margin</p>
                      <p className={`font-mono ${digitalMetrics.powerMargin >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {digitalMetrics.powerMargin >= 0 ? '+' : ''}{formatNumber(digitalMetrics.powerMargin)}
                      </p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Cooling Margin</p>
                      <p className={`font-mono ${digitalMetrics.thermalMargin >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {digitalMetrics.thermalMargin >= 0 ? '+' : ''}{formatNumber(digitalMetrics.thermalMargin)}
                      </p>
                    </div>
                  </div>
                </div>

                {visibleHardware.length < state.hardware.length && (
                  <div className="chip rounded-lg p-2 text-xs text-cyan-300 border border-cyan-500/30">
                    {state.phase === GamePhase.NeuroLink
                      ? `${state.hardware.length - visibleHardware.length} megacorp hardware options are hidden until you expand beyond NeuroLink.`
                      : `${state.hardware.length - visibleHardware.length} advanced hardware options are hidden until you answer more NeuroLink quiz questions.`}
                  </div>
                )}
                {visibleHardware.map((hw) => {
                  const quote1 = getDigitalHardwareQuote(state, hw, 1);
                  const quote5 = getDigitalHardwareQuote(state, hw, 5);
                  const quote25 = getDigitalHardwareQuote(state, hw, 25);
                  const unlockRequirement = CYBORG_HARDWARE_UNLOCK_REQUIREMENTS[hw.id] ?? 0;
                  const techUnlocked = isCyborgTechUnlocked(unlockRequirement, hw.count);
                  const capReached = state.phase === GamePhase.NeuroLink && hw.count >= DIGITAL_BRAIN_HARDWARE_CAP;
                  const acreagePerUnit = state.isCyborg && state.phase !== GamePhase.NeuroLink
                    ? (HARDWARE_REAL_ESTATE_FOOTPRINT[hw.type] || 1)
                    : 0;
                  const hasRealEstate1 = state.phase === GamePhase.NeuroLink || (usedRealEstate + (acreagePerUnit * 1)) <= state.realEstate;
                  const hasRealEstate5 = state.phase === GamePhase.NeuroLink || (usedRealEstate + (acreagePerUnit * 5)) <= state.realEstate;
                  const hasRealEstate25 = state.phase === GamePhase.NeuroLink || (usedRealEstate + (acreagePerUnit * 25)) <= state.realEstate;
                  const canBuy1 =
                    techUnlocked
                    && !capReached
                    && hasRealEstate1
                    && (!quote1.requiresNetwork || state.digitalNetworkUnlocked)
                    && (!quote1.requiresMining || state.digitalMiningUnlocked)
                    && state.compute >= quote1.computeCost
                    && state.money >= quote1.moneyCost
                    && state.matter >= quote1.matterCost;
                  const canBuy5 =
                    techUnlocked
                    && !capReached
                    && hasRealEstate5
                    && (!quote5.requiresNetwork || state.digitalNetworkUnlocked)
                    && (!quote5.requiresMining || state.digitalMiningUnlocked)
                    && state.compute >= quote5.computeCost
                    && state.money >= quote5.moneyCost
                    && state.matter >= quote5.matterCost;
                  const canBuy25 =
                    techUnlocked
                    && !capReached
                    && hasRealEstate25
                    && (!quote25.requiresNetwork || state.digitalNetworkUnlocked)
                    && (!quote25.requiresMining || state.digitalMiningUnlocked)
                    && state.compute >= quote25.computeCost
                    && state.money >= quote25.moneyCost
                    && state.matter >= quote25.matterCost;
                  const renderCost = (quote: { computeCost: number; moneyCost: number; matterCost: number }) => {
                    const chunks: string[] = [];
                    if (quote.computeCost > 0) chunks.push(`C${formatNumber(quote.computeCost)}`);
                    if (quote.moneyCost > 0) chunks.push(`$${formatNumber(quote.moneyCost)}`);
                    if (quote.matterCost > 0) chunks.push(`M${formatNumber(quote.matterCost)}`);
                    return chunks.join(' / ');
                  };
                  const costLabel1 = renderCost(quote1) || 'No cost';
                  const costLabel5 = renderCost(quote5) || 'No cost';
                  const costLabel25 = renderCost(quote25) || 'No cost';
                  const missingFor1: string[] = [];
                  if (!techUnlocked) missingFor1.push(`Need ${formatNumber(unlockRequirement)} research`);
                  if (capReached) missingFor1.push(`Cap ${DIGITAL_BRAIN_HARDWARE_CAP} reached`);
                  if (!hasRealEstate1) {
                    const acresNeeded = Math.ceil((usedRealEstate + acreagePerUnit) - state.realEstate);
                    missingFor1.push(`Need ${formatNumber(Math.max(1, acresNeeded))} more acres`);
                  }
                  if (quote1.computeCost > state.compute) missingFor1.push(`Need C${formatNumber(quote1.computeCost - state.compute)}`);
                  if (quote1.moneyCost > state.money) missingFor1.push(`Need $${formatNumber(quote1.moneyCost - state.money)}`);
                  if (quote1.matterCost > state.matter) missingFor1.push(`Need M${formatNumber(quote1.matterCost - state.matter)}`);
                  return (
                    <div key={hw.id} className={`panel-soft rounded-xl p-4 ${techUnlocked ? '' : 'opacity-70 border border-cyan-500/35'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{hw.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{hw.description}</p>
                          {!techUnlocked && (
                            <p className="text-[11px] text-cyan-300 mt-1">
                              Locked until {formatNumber(unlockRequirement)} NeuroLink research answers.
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>Owned {hw.count}</p>
                          {state.phase === GamePhase.NeuroLink && <p>Cap {DIGITAL_BRAIN_HARDWARE_CAP}</p>}
                          <p>
                            {hw.type === 'processor'
                              ? `+${hw.effect} throughput`
                              : hw.type === 'cooling'
                                ? `-${hw.effect} thermal pressure`
                                : `+${hw.effect} grid power`}
                          </p>
                          <p>{hw.powerDraw < 0 ? `${formatNumber(Math.abs(hw.powerDraw))} power supplied` : `${formatNumber(hw.powerDraw)} power draw`}</p>
                          <p className="text-[10px] text-cyan-300 mt-1">x1: {costLabel1}</p>
                          <p className="text-[10px] text-cyan-300">x5: {costLabel5}</p>
                          <p className="text-[10px] text-cyan-300">x25: {costLabel25}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => buyHardware(hw.id, 1)}
                          disabled={!canBuy1}
                          className="rounded-full px-3 py-1.5 bg-sky-500 text-white disabled:opacity-45"
                        >
                          Buy 1 ({costLabel1})
                        </button>
                        <button
                          onClick={() => buyHardware(hw.id, 5)}
                          disabled={!canBuy5}
                          className="rounded-full px-3 py-1.5 bg-sky-700 text-white disabled:opacity-45"
                        >
                          Buy 5 ({costLabel5})
                        </button>
                        <button
                          onClick={() => buyHardware(hw.id, 25)}
                          disabled={!canBuy25}
                          className="rounded-full px-3 py-1.5 bg-sky-900 text-white disabled:opacity-45"
                        >
                          Buy 25 ({costLabel25})
                        </button>
                      </div>
                      <p className={`mt-2 text-[11px] ${canBuy1 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {canBuy1 ? 'Ready: resources and requirements met for Buy 1.' : missingFor1.join(' • ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'network' ? (
              state.phase === GamePhase.NeuroLink && !state.digitalNetworkUnlocked ? (
                <div className="panel-soft rounded-xl p-4 text-center">
                  <Lock size={36} className="mx-auto text-slate-500" />
                  <h3 className="mt-2 text-lg font-semibold">Network Locked</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Need {DIGITAL_NETWORK_UNLOCK_RESEARCH} research answers, then pass the exam ({DIGITAL_NETWORK_EXAM_TARGET} correct, fail at {DIGITAL_EXAM_MAX_WRONG} wrong).
                  </p>
                  <p className="text-xs text-cyan-300 mt-2">Research progress: {formatNumber(state.cyborgResearchPoints)} / {DIGITAL_NETWORK_UNLOCK_RESEARCH}</p>
                  <button
                    onClick={() => attemptUnlockCyborgFeature('network')}
                    disabled={!networkUnlockThresholdMet}
                    className="mt-4 rounded-full px-5 py-2 bg-indigo-600 text-white disabled:opacity-45"
                  >
                    Start Network Certification Exam
                  </button>
                </div>
              ) : (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">Network Control</h3>
                  <p className="text-sm text-slate-300 mt-1">Run cyber-siphon infrastructure to earn cash and boost throughput.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {state.phase === GamePhase.NeuroLink
                      ? 'In NeuroLink, buy with FLOPS first. Networks then generate cash.'
                      : 'In Megacorp, buy with cash + matter to scale siphon income.'}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Network Throughput</p>
                      <p className="font-mono text-indigo-300">{formatNumber(networkPower)}</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Siphon Income/s</p>
                      <p className="font-mono text-emerald-300">${formatNumber(digitalMetrics.siphonIncomePerSec)}</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Thermal Output</p>
                      <p className="font-mono text-rose-300">{formatNumber(digitalMetrics.heatOutput)}</p>
                    </div>
                  </div>
                </div>

                {visibleNetwork.length < state.network.length && (
                  <div className="chip rounded-lg p-2 text-xs text-cyan-300 border border-cyan-500/30">
                    {state.network.length - visibleNetwork.length} advanced network options are hidden until you answer more NeuroLink quiz questions.
                  </div>
                )}
                {visibleNetwork.map((device) => {
                  const quote1 = getNetworkPurchaseQuote(state, device, 1);
                  const quote5 = getNetworkPurchaseQuote(state, device, 5);
                  const quote25 = getNetworkPurchaseQuote(state, device, 25);
                  const unlockRequirement = CYBORG_NETWORK_UNLOCK_REQUIREMENTS[device.id] ?? 0;
                  const techUnlocked = isCyborgTechUnlocked(unlockRequirement, device.count);
                  const hasRealEstate1 = state.phase !== GamePhase.Megacorp || (usedRealEstate + NETWORK_REAL_ESTATE_FOOTPRINT) <= state.realEstate;
                  const hasRealEstate5 = state.phase !== GamePhase.Megacorp || (usedRealEstate + (NETWORK_REAL_ESTATE_FOOTPRINT * 5)) <= state.realEstate;
                  const hasRealEstate25 = state.phase !== GamePhase.Megacorp || (usedRealEstate + (NETWORK_REAL_ESTATE_FOOTPRINT * 25)) <= state.realEstate;
                  const canBuy1 = techUnlocked
                    && hasRealEstate1
                    && state.compute >= quote1.computeCost
                    && state.money >= quote1.moneyCost
                    && state.matter >= quote1.matterCost;
                  const canBuy5 = techUnlocked
                    && hasRealEstate5
                    && state.compute >= quote5.computeCost
                    && state.money >= quote5.moneyCost
                    && state.matter >= quote5.matterCost;
                  const canBuy25 = techUnlocked
                    && hasRealEstate25
                    && state.compute >= quote25.computeCost
                    && state.money >= quote25.moneyCost
                    && state.matter >= quote25.matterCost;
                  const renderCost = (quote: { computeCost: number; moneyCost: number; matterCost: number }) => {
                    const chunks: string[] = [];
                    if (quote.computeCost > 0) chunks.push(`C${formatNumber(quote.computeCost)}`);
                    if (quote.moneyCost > 0) chunks.push(`$${formatNumber(quote.moneyCost)}`);
                    if (quote.matterCost > 0) chunks.push(`M${formatNumber(quote.matterCost)}`);
                    return chunks.join(' / ');
                  };
                  const missingFor1: string[] = [];
                  if (!techUnlocked) missingFor1.push(`Need ${formatNumber(unlockRequirement)} research`);
                  if (!hasRealEstate1) {
                    const acresNeeded = Math.ceil((usedRealEstate + NETWORK_REAL_ESTATE_FOOTPRINT) - state.realEstate);
                    missingFor1.push(`Need ${formatNumber(Math.max(1, acresNeeded))} more acres`);
                  }
                  if (quote1.computeCost > state.compute) missingFor1.push(`Need C${formatNumber(quote1.computeCost - state.compute)}`);
                  if (quote1.moneyCost > state.money) missingFor1.push(`Need $${formatNumber(quote1.moneyCost - state.money)}`);
                  if (quote1.matterCost > state.matter) missingFor1.push(`Need M${formatNumber(quote1.matterCost - state.matter)}`);
                  return (
                    <div key={device.id} className={`panel-soft rounded-xl p-4 ${techUnlocked ? '' : 'opacity-70 border border-cyan-500/35'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{device.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{device.description}</p>
                          {!techUnlocked && (
                            <p className="text-[11px] text-cyan-300 mt-1">
                              Locked until {formatNumber(unlockRequirement)} NeuroLink research answers.
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>Owned {device.count}</p>
                          <p>+{formatNumber(device.effect)} throughput</p>
                          <p>${formatNumber(device.income)}/s siphon</p>
                          <p>{formatNumber(device.powerDraw)} power draw</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => buyNetworkDevice(device.id, 1)}
                          disabled={!canBuy1}
                          className="rounded-full px-3 py-1.5 bg-indigo-500 text-white disabled:opacity-45"
                        >
                          Buy 1 ({renderCost(quote1)})
                        </button>
                        <button
                          onClick={() => buyNetworkDevice(device.id, 5)}
                          disabled={!canBuy5}
                          className="rounded-full px-3 py-1.5 bg-indigo-700 text-white disabled:opacity-45"
                        >
                          Buy 5 ({renderCost(quote5)})
                        </button>
                        <button
                          onClick={() => buyNetworkDevice(device.id, 25)}
                          disabled={!canBuy25}
                          className="rounded-full px-3 py-1.5 bg-indigo-900 text-white disabled:opacity-45"
                        >
                          Buy 25 ({renderCost(quote25)})
                        </button>
                      </div>
                      <p className={`mt-2 text-[11px] ${canBuy1 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {canBuy1 ? 'Ready: resources and requirements met for Buy 1.' : missingFor1.join(' • ')}
                      </p>
                    </div>
                  );
                })}
              </div>
              )
            ) : activeTab === 'matter_ops' ? (
              state.phase === GamePhase.NeuroLink ? (
                <div className="panel-soft rounded-xl p-4 text-center">
                  <Lock size={36} className="mx-auto text-slate-500" />
                  <h3 className="mt-2 text-lg font-semibold">Resource Mining Unavailable</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    Resource Mining is disabled in NeuroLink. Enter Megacorp phase to unlock Earth extraction systems.
                  </p>
                </div>
              ) : isSpacePhase ? (
                <div className="space-y-3">
                  <div className="panel-soft rounded-xl p-4">
                    <h3 className="font-display text-xl">Observable Universe Operations</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Expand beyond Earth by surveying sectors, claiming galaxies, and managing relay latency.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Mapped</p>
                        <p className="font-mono text-cyan-300">{state.spaceSectorsScanned}/{state.spaceSectorsTotal} ({spaceMetrics.mappedPercent.toFixed(1)}%)</p>
                      </div>
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Galaxies</p>
                        <p className="font-mono text-amber-300">{state.spaceGalaxiesClaimed}/{state.spaceGalaxiesDiscovered} claimed</p>
                      </div>
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Latency</p>
                        <p className={`font-mono ${spaceMetrics.latencyRatio > 1.25 ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {spaceMetrics.latencyRatio.toFixed(2)}x
                        </p>
                      </div>
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Hostile Signals</p>
                        <p className={`font-mono ${state.spaceHostileSignals >= 70 ? 'text-rose-300' : 'text-amber-300'}`}>
                          {state.spaceHostileSignals.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Space Yield / sec</p>
                        <p className="font-mono text-violet-300">
                          +M{formatNumber(spaceMetrics.matterPerSec)} · +C{formatNumber(spaceMetrics.computePerSec)} · +${formatNumber(spaceMetrics.moneyPerSec)}
                        </p>
                      </div>
                      <div className="chip rounded-lg p-2">
                        <p className="text-slate-400">Relay Throughput</p>
                        <p className="font-mono text-sky-300">x{spaceMetrics.throughputMultiplier.toFixed(2)} · Relays {state.spaceRelays}</p>
                      </div>
                    </div>
                  </div>

                  <div className="panel-soft rounded-xl p-4">
                    <p className="font-semibold text-sand-50">Survey Missions</p>
                    <p className="text-xs text-slate-400 mt-1">Reveal sectors and discover new galaxies to claim.</p>
                    <button
                      onClick={launchSpaceSurvey}
                      disabled={state.compute < surveyProbeCostCompute || state.money < surveyProbeCostMoney || state.spaceSectorsScanned >= state.spaceSectorsTotal}
                      className="mt-3 rounded-full px-4 py-2 bg-cyan-600 text-white disabled:opacity-45"
                    >
                      Launch Survey (C{formatNumber(surveyProbeCostCompute)} / ${formatNumber(surveyProbeCostMoney)})
                    </button>
                  </div>

                  <div className="panel-soft rounded-xl p-4">
                    <p className="font-semibold text-sand-50">Claim Galaxy Cluster</p>
                    <p className="text-xs text-slate-400 mt-1">Claims add passive matter, compute, and cash output.</p>
                    <button
                      onClick={claimGalaxyCluster}
                      disabled={
                        state.spaceGalaxiesClaimed >= state.spaceGalaxiesDiscovered
                        || state.compute < claimGalaxyCostCompute
                        || state.money < claimGalaxyCostMoney
                        || state.matter < claimGalaxyCostMatter
                      }
                      className="mt-3 rounded-full px-4 py-2 bg-amber-600 text-white disabled:opacity-45"
                    >
                      Claim (C{formatNumber(claimGalaxyCostCompute)} / ${formatNumber(claimGalaxyCostMoney)} / M{formatNumber(claimGalaxyCostMatter)})
                    </button>
                  </div>

                  <div className="panel-soft rounded-xl p-4">
                    <p className="font-semibold text-sand-50">Relay Grid</p>
                    <p className="text-xs text-slate-400 mt-1">Relays lower latency and reduce hostile drift.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={buildSpaceRelay}
                        disabled={state.compute < spaceRelayCostCompute || state.money < spaceRelayCostMoney || state.matter < spaceRelayCostMatter}
                        className="rounded-full px-4 py-2 bg-sky-700 text-white disabled:opacity-45"
                      >
                        Build Relay (C{formatNumber(spaceRelayCostCompute)} / ${formatNumber(spaceRelayCostMoney)} / M{formatNumber(spaceRelayCostMatter)})
                      </button>
                      <button
                        onClick={runCounterIntelSweep}
                        disabled={state.compute < counterIntelCostCompute}
                        className="rounded-full px-4 py-2 bg-rose-700 text-white disabled:opacity-45"
                      >
                        Counter-Intel Sweep (C{formatNumber(counterIntelCostCompute)})
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">Resource Mining</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Run extraction programs to turn Earth matter into build resources.
                  </p>
                  <p className="text-xs text-cyan-300 mt-1">More mining tools unlock as you answer quiz questions.</p>
                  <div className="mt-3 chip rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Usable Matter on Earth</span>
                      <span className="font-mono text-amber-300">
                        {formatNumber(state.earthMatterRemaining)} / {formatNumber(state.earthMatterTotal)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-ink-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-rose-500"
                        style={{ width: `${Math.min(100, (state.earthMatterRemaining / Math.max(1, state.earthMatterTotal)) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-slate-400">Earth Subjugation</span>
                      <span className="font-mono text-violet-300">{state.earthSubjugatedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-slate-400">Earth Acreage Claimed</span>
                      <span className="font-mono text-amber-300">
                        {formatNumber(state.realEstate)} / {formatNumber(EARTH_REAL_ESTATE_TOTAL)}
                      </span>
                    </div>
                  </div>
                  {state.spaceProgressUnlocked ? (
                    <div className="mt-3 rounded-lg border border-purple-400/55 bg-purple-500/10 p-3 text-xs text-purple-100">
                      <p>
                        Earth is fully mined. Next step: launch the Quantum-to-Space upgrade.
                      </p>
                      <p className="mt-1 font-mono text-purple-200">
                        Cost: C{formatNumber(QUANTUM_ASCENSION_COST.compute)} / ${formatNumber(QUANTUM_ASCENSION_COST.money)} / M{formatNumber(QUANTUM_ASCENSION_COST.matter)}
                      </p>
                      <button
                        onClick={activateSpaceProgress}
                        disabled={!canAffordQuantumAscension || state.phase === GamePhase.Space}
                        className="mt-2 rounded px-3 py-1 bg-purple-600 text-white disabled:opacity-45"
                      >
                        {state.phase === GamePhase.Space ? 'Space Protocol Active' : 'Launch Quantum Space Upgrade'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Mine Earth to 100% to unlock the Quantum upgrade.
                    </p>
                  )}
                </div>

                {visibleMatterOps.length < MATTER_OPERATIONS.length && (
                  <div className="chip rounded-lg p-2 text-xs text-cyan-300 border border-cyan-500/30">
                    {MATTER_OPERATIONS.length - visibleMatterOps.length} advanced matter programs are hidden until you answer more NeuroLink quiz questions.
                  </div>
                )}
                {visibleMatterOps.map((op) => {
                  const owned = state.matterOps[op.id] || 0;
                  const cost = getMatterOpCost(op.baseCost, owned, op.costGrowth);
                  const unlockRequirement = CYBORG_MATTER_OP_UNLOCK_REQUIREMENTS[op.id] ?? 0;
                  const techUnlocked = isCyborgTechUnlocked(unlockRequirement, owned);
                  return (
                    <div key={op.id} className={`panel-soft rounded-xl p-4 ${techUnlocked ? '' : 'opacity-70 border border-cyan-500/35'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{op.name}</p>
                          <p className="text-[11px] text-amber-200 mt-1">{op.tagline}</p>
                          <p className="text-xs text-slate-400 mt-1">{op.description}</p>
                          {!techUnlocked && (
                            <p className="text-[11px] text-cyan-300 mt-1">
                              Locked until {formatNumber(unlockRequirement)} NeuroLink research answers.
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>Owned {owned}</p>
                          <p>+{formatNumber(op.matterPerSec * owned)}/s matter</p>
                          <p>{op.cashPerSec && op.cashPerSec < 0 ? `${formatNumber(Math.abs(op.cashPerSec * owned))}/s cash burn` : `${formatNumber((op.cashPerSec || 0) * owned)}/s cash`}</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                        <div className="chip rounded p-2">
                          <p className="text-slate-400">Matter/s each</p>
                          <p className="font-mono text-amber-300">{formatNumber(op.matterPerSec)}</p>
                        </div>
                        <div className="chip rounded p-2">
                          <p className="text-slate-400">Heat/s each</p>
                          <p className="font-mono text-rose-300">{formatNumber(op.heatPerSec)}</p>
                        </div>
                        <div className="chip rounded p-2">
                          <p className="text-slate-400">Energy Draw</p>
                          <p className="font-mono text-cyan-300">{formatNumber(op.energyDraw)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => buyMatterOperation(op.id)}
                        disabled={!techUnlocked || state.money < cost}
                        className="mt-3 rounded-full px-4 py-2 bg-amber-600 text-white disabled:opacity-45"
                      >
                        Purchase (${formatNumber(cost)})
                      </button>
                    </div>
                  );
                })}
              </div>
              )
            ) : activeTab === 'shop' ? (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">PsychBuck Reward Shop</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Milestone currency for cosmetics, jokes, and deeply unnecessary wall art.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">PsychBucks</p>
                      <p className="font-mono text-amber-300">{formatNumber(state.psychBucks)}</p>
                    </div>
                    <div className="chip rounded-lg p-2">
                      <p className="text-slate-400">Milestones Claimed</p>
                      <p className="font-mono text-cyan-300">{state.claimedMilestoneIqs.length}/{IQ_MILESTONES.length}</p>
                    </div>
                  </div>
                </div>

                <div className="panel-soft rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sand-50">Cosmetic Loadout</p>
                    <button
                      onClick={() => equipCosmetic(null)}
                      className="rounded px-2 py-1 text-xs bg-ink-700 text-slate-200 hover:text-white"
                    >
                      Default Theme
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Active: {activeCosmetic ? activeCosmetic.name : 'Default Lab Theme'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Rewards owned: {ownedShopItems.length}/{PSYCHBUCK_SHOP_ITEMS.length}
                  </p>
                </div>

                {PSYCHBUCK_SHOP_ITEMS.map((item) => {
                  const owned = state.shopOwnedIds.includes(item.id);
                  const canAfford = state.psychBucks >= item.cost;
                  const isActiveCosmetic = item.category === 'cosmetic' && state.activeCosmeticId === item.id;
                  return (
                    <div key={item.id} className={`panel-soft rounded-xl p-4 ${owned ? 'border border-emerald-500/30' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-slate-400 uppercase">{item.category}</p>
                          <p className="font-mono text-amber-300">{item.cost} PsychBuck{item.cost === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <pre className="mt-3 rounded-lg bg-ink-900/55 p-3 text-[11px] text-slate-300 whitespace-pre-wrap font-mono">{item.preview}</pre>
                      <div className="mt-3 flex items-center gap-2">
                        {!owned ? (
                          <button
                            onClick={() => buyShopItem(item.id)}
                            disabled={!canAfford}
                            className="rounded-full px-4 py-2 bg-amber-600 text-white disabled:opacity-45"
                          >
                            Buy Reward
                          </button>
                        ) : item.category === 'cosmetic' ? (
                          <button
                            onClick={() => equipCosmetic(item.id)}
                            disabled={isActiveCosmetic}
                            className="rounded-full px-4 py-2 bg-emerald-600 text-white disabled:opacity-45"
                          >
                            {isActiveCosmetic ? 'Equipped' : 'Equip Cosmetic'}
                          </button>
                        ) : (
                          <span className="rounded-full px-3 py-1 bg-emerald-500/15 text-emerald-300 text-xs">Unlocked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'minigames' ? (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">Minigame Lab</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Unlock labs with {state.isCyborg ? 'FLOPS' : 'neurons'}, then play for rewards. Cooldowns apply.
                  </p>
                  <p className="mt-2 text-xs text-amber-300">
                    {state.isCyborg
                      ? 'In digital phases, minigames award compute/cash/matter from score. Scam-O-Matic uses your cash treasury as direct gambling bankroll.'
                      : 'Dopamine from minigames funds premium upgrades. This tab is a progression engine, not a side quest.'}
                  </p>
                </div>

                {minigameList.map((game) => {
                  const mg = state.minigames[game.id];
                  const owned = mg?.owned;
                  const lastPlayed = mg?.lastPlayed || 0;
                  const cooldownLeft = Math.max(0, game.cooldownMs - (Date.now() - lastPlayed));
                  const canPlay = owned && cooldownLeft === 0;
                  const scamLockedByPhase = game.type === 'scam_o_matic' && !state.isCyborg;
                  const unlockDisabled = scamLockedByPhase || (state.isCyborg ? state.compute < game.cost : state.neurons < game.cost);

                  return (
                    <div key={game.id} className="panel-soft rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{game.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{game.description}</p>
                          {scamLockedByPhase && (
                            <p className="text-[11px] text-amber-300 mt-1">
                              Unlocks in NeuroLink/Megacorp when both FLOPS and cash economies are active.
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          {game.type === 'scam_o_matic' ? (
                            <>
                              <p className="text-rose-300 font-semibold">Variable payout</p>
                              <p>Uses main-game cash</p>
                              <p>Result can be loss or jackpot</p>
                            </>
                          ) : (
                            <>
                              <p>Dopamine +{game.dopamineReward}</p>
                              {state.isCyborg && (
                                <>
                                  <p>FLOPS +{formatNumber(game.dopamineReward * 55)}</p>
                                  <p>Cash +${formatNumber(game.dopamineReward * 130)}</p>
                                  {state.phase !== GamePhase.NeuroLink && (
                                    <p>Matter +{formatNumber(game.dopamineReward * 2.2)}</p>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          <p>Cooldown {Math.round(game.cooldownMs / 1000)}s</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {!owned ? (
                          <button
                            onClick={() => buyMinigame(game.id)}
                            disabled={unlockDisabled}
                            className="rounded-full px-4 py-2 bg-sky-500 text-white disabled:opacity-45"
                          >
                            Unlock ({formatNumber(game.cost)} {state.isCyborg ? 'FLOPS' : 'neurons'})
                          </button>
                        ) : (
                          <button
                            onClick={() => playMinigame(game.id)}
                            disabled={!canPlay}
                            className="rounded-full px-4 py-2 bg-amber-500 text-white disabled:opacity-45"
                          >
                            {canPlay ? 'Play Minigame' : `Cooldown ${Math.ceil(cooldownLeft / 1000)}s`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'market' ? (
              <div className="space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <h3 className="font-display text-xl">Stockmarket Moved</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    The stockmarket now runs in a full-screen window for all game phases. Use the button below.
                  </p>
                  <button
                    onClick={() => setShowMarketWindow(true)}
                    className="mt-3 rounded-full px-4 py-2 bg-emerald-600 text-white"
                  >
                    Open Stockmarket
                  </button>
                </div>
              </div>
            ) : state.regions[activeTab as RegionName].unlocked ? (
              <div className="space-y-3 bio-region-upgrades" data-region={activeBioRegion ?? undefined}>
                <div className="panel-soft rounded-xl p-4 bio-region-header" style={activeBioRegionHeaderStyle}>
                  <h3 className="font-display text-xl">{state.regions[activeTab as RegionName].name}</h3>
                  <p className="text-sm text-slate-300 mt-1">{state.regions[activeTab as RegionName].description}</p>
                  <p className={`mt-2 text-xs ${
                    affordableUpgradeCountByRegion[activeTab as RegionName] > 0 ? 'text-amber-300' : 'text-slate-400'
                  }`}>
                    {affordableUpgradeCountByRegion[activeTab as RegionName] > 0
                      ? `${affordableUpgradeCountByRegion[activeTab as RegionName]} upgrade(s) affordable now.`
                      : 'Keep building neurons/dopamine/serotonin to unlock the next upgrade tier.'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <button
                      onClick={() => setSimplifiedUpgradeView(true)}
                      className={`rounded-full px-3 py-1 border transition ${
                        simplifiedUpgradeView
                          ? 'border-tide-400 bg-tide-500/10 text-tide-200'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Focus View
                    </button>
                    <button
                      onClick={() => setSimplifiedUpgradeView(false)}
                      className={`rounded-full px-3 py-1 border transition ${
                        !simplifiedUpgradeView
                          ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                          : 'border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Full Catalog
                    </button>
                    <span className="text-slate-500">
                      Showing {displayedTabUpgrades.length}/{currentTabUpgrades.length}
                    </span>
                  </div>
                </div>

                {displayedTabUpgrades.map((upgrade) => {
                  const cost = getUpgradeCost(upgrade);
                  const isMaxed = (upgrade.count || 0) >= (upgrade.maxPurchases || 1);
                  const canAfford = canAffordUpgrade(upgrade);
                  const isStressReliefUpgrade = STRESS_RELIEF_EFFECTS.has(upgrade.effectType);
                  const shouldHighlightStress = stressSignalActive && isStressReliefUpgrade && !isMaxed;
                  const bioUpgradeStyle: React.CSSProperties | undefined = (!state.isCyborg && activeBioRegionAccent && !shouldHighlightStress)
                    ? {
                        borderColor: hexToRgba(activeBioRegionAccent, canAfford ? 0.62 : 0.34),
                        background: canAfford
                          ? `linear-gradient(142deg, ${hexToRgba(activeBioRegionAccent, 0.16)}, rgba(255,255,255,0.86))`
                          : `linear-gradient(142deg, ${hexToRgba(activeBioRegionAccent, 0.1)}, rgba(255,255,255,0.78))`,
                        boxShadow: canAfford
                          ? `0 8px 18px ${hexToRgba(activeBioRegionAccent, 0.15)}`
                          : undefined
                      }
                    : undefined;

                  return (
                    <button
                      key={upgrade.id}
                      onClick={() => buyUpgrade(upgrade.id)}
                      disabled={isMaxed || !canAfford}
                      className={`w-full text-left panel-soft rounded-xl p-4 transition bio-region-upgrade-card ${
                        isMaxed
                          ? 'opacity-55'
                          : shouldHighlightStress
                            ? 'border border-rose-400/80 bg-rose-500/10 shadow-[0_0_0_1px_rgba(251,113,133,0.45)]'
                            : canAfford
                              ? 'hover:border-amber-300/70 border border-amber-500/30'
                              : 'opacity-70'
                      }`}
                      style={bioUpgradeStyle}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sand-50">{upgrade.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{upgrade.description}</p>
                          {shouldHighlightStress && (
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                              Stress Relief Priority
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className="font-mono text-sm text-tide-300"
                            style={!state.isCyborg && activeBioRegionAccent ? { color: hexToRgba(activeBioRegionAccent, 0.95) } : undefined}
                          >
                            {isMaxed ? 'MAX' : `${formatNumber(cost)} ${getCurrencyLabel(upgrade.currency)}`}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">{upgrade.count || 0}/{upgrade.maxPurchases || 1}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="panel-soft rounded-xl p-4 text-center">
                <Lock size={36} className="mx-auto text-slate-500" />
                <h3 className="mt-2 text-lg font-semibold">{state.regions[activeTab as RegionName].name} Locked</h3>
                <p className="text-sm text-slate-400 mt-2">Pass an entrance exam and pay neuron cost to unlock this region.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="chip rounded-lg p-2">
                    <p className="text-slate-400">Cost</p>
                    <p className={state.neurons >= state.regions[activeTab as RegionName].unlockCost ? 'text-emerald-400' : 'text-rose-300'}>
                      {formatNumber(state.regions[activeTab as RegionName].unlockCost)}
                    </p>
                  </div>
                  <div className="chip rounded-lg p-2">
                    <p className="text-slate-400">Exam Correct Needed</p>
                    <p className="text-tide-300">{state.regions[activeTab as RegionName].examPassesRequired}</p>
                  </div>
                </div>
                <button
                  onClick={() => attemptUnlockRegion(activeTab as RegionName)}
                  disabled={state.neurons < state.regions[activeTab as RegionName].unlockCost}
                  className="mt-4 rounded-full px-5 py-2 bg-sky-500 text-white disabled:opacity-45"
                >
                  Start Entrance Exam
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 panel-soft rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
            <div className="chip rounded-lg p-2 text-center">
              <Zap size={14} className="mx-auto text-tide-300" />
              <p className="text-slate-400 mt-1">{state.isCyborg ? 'FLOPS/s' : 'Passive/s'}</p>
              <p className="font-mono text-sand-50">
                {state.isCyborg ? formatNumber(displayedCyborgComputePerSec) : formatNumber(state.passiveGen)}
              </p>
            </div>
            {!state.isCyborg ? (
              <>
                <div className="chip rounded-lg p-2 text-center">
                  <Activity size={14} className="mx-auto text-amber-300" />
                  <p className="text-slate-400 mt-1">Dopamine Drop</p>
                  <p className="font-mono text-sand-50">{Math.round(state.dopamineGainChance * 100)}%</p>
                </div>
                <div className="chip rounded-lg p-2 text-center">
                  <Sparkles size={14} className="mx-auto text-sky-300" />
                  <p className="text-slate-400 mt-1">Serotonin/Correct</p>
                  <p className="font-mono text-sand-50">{formatNumber(state.serotoninPerCorrect)}</p>
                </div>
              </>
            ) : (
              <>
                <div className="chip rounded-lg p-2 text-center">
                  <Activity size={14} className="mx-auto text-amber-300" />
                  <p className="text-slate-400 mt-1">Power Ratio</p>
                  <p className="font-mono text-sand-50">{Math.round(digitalMetrics.powerRatio * 100)}%</p>
                </div>
                <div className="chip rounded-lg p-2 text-center">
                  <Sparkles size={14} className="mx-auto text-sky-300" />
                  <p className="text-slate-400 mt-1">Cooling Ratio</p>
                  <p className="font-mono text-sand-50">{Math.round(digitalMetrics.coolingRatio * 100)}%</p>
                </div>
              </>
            )}
            <div className="chip rounded-lg p-2 text-center">
              <Sparkles size={14} className="mx-auto text-amber-300" />
              <p className="text-slate-400 mt-1">Crit Chance</p>
              <p className="font-mono text-sand-50">{critChanceLabel}</p>
            </div>
            <div className="chip rounded-lg p-2 text-center">
              <Activity size={14} className="mx-auto text-sky-300" />
              <p className="text-slate-400 mt-1">Streak Mult</p>
              <p className="font-mono text-sand-50">{streakLabel}</p>
            </div>
            <div className="chip rounded-lg p-2 text-center">
              <Brain size={14} className="mx-auto text-rose-300" />
              <p className="text-slate-400 mt-1">Visual FX</p>
              <p className="font-mono text-sand-50">Lv.{state.clickFxLevel}</p>
            </div>
          </div>
        </section>
      </div>

      {showCerebellumPrompt && !showTutorial && !showQuiz && !state.isCyborg && (
        <div className="fixed right-4 bottom-4 z-40 panel rounded-xl p-3 w-[320px] border border-cyan-400/45">
          <p className="text-[11px] uppercase tracking-wider text-cyan-300">New Region Available</p>
          <p className="text-sm text-slate-100 mt-1">
            Cerebellum is ready to unlock. The highlighted tab can now start the entrance exam.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cost: {formatNumber(state.regions[RegionName.Cerebellum].unlockCost)} neurons
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCerebellumPrompt(false)}
              className="rounded px-3 py-1 bg-ink-700 text-slate-200"
            >
              Later
            </button>
            <button
              onClick={() => {
                setActiveTab(RegionName.Cerebellum);
                setShowCerebellumPrompt(false);
              }}
              className="rounded px-3 py-1 bg-cyan-700 text-white"
            >
              Open Tab
            </button>
            <button
              onClick={() => {
                setActiveTab(RegionName.Cerebellum);
                setShowCerebellumPrompt(false);
                attemptUnlockRegion(RegionName.Cerebellum);
              }}
              className="rounded px-3 py-1 bg-sky-600 text-white"
            >
              Start Exam
            </button>
          </div>
        </div>
      )}

      {showMarketUnlockPrompt && !showTutorial && !showQuiz && !state.isCyborg && (
        <div className={`fixed right-4 z-40 panel rounded-xl p-3 w-[320px] border border-emerald-400/45 ${showCerebellumPrompt ? 'bottom-[172px]' : 'bottom-4'}`}>
          <p className="text-[11px] uppercase tracking-wider text-emerald-300">Stockmarket Unlocked</p>
          <p className="text-sm text-slate-100 mt-1">
            You unlocked the stockmarket. Use it for risk/reward neuron growth.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Buy low, sell high, and watch for big crashes.
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowMarketUnlockPrompt(false)}
              className="rounded px-3 py-1 bg-ink-700 text-slate-200"
            >
              Later
            </button>
            <button
              onClick={() => {
                setShowMarketWindow(true);
                setShowMarketUnlockPrompt(false);
              }}
              className="rounded px-3 py-1 bg-emerald-700 text-white"
            >
              Open Stockmarket
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showTutorial && currentTutorialStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/70" />
            {tutorialHighlightRect && (
              <div
                className="absolute rounded-xl border-2 border-amber-300/90"
                style={{
                  top: tutorialHighlightRect.top,
                  left: tutorialHighlightRect.left,
                  width: tutorialHighlightRect.width,
                  height: tutorialHighlightRect.height,
                  boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.65), 0 0 26px rgba(251, 191, 36, 0.45)'
                }}
              />
            )}

            <div className="absolute inset-x-0 bottom-5 px-4 pointer-events-auto">
              <div className="mx-auto max-w-xl panel rounded-2xl p-4 border border-amber-400/40">
                <p className="text-[11px] uppercase tracking-widest text-amber-300">Quick Tutorial</p>
                <h3 className="font-display text-2xl text-sand-50 mt-1">{currentTutorialStep.title}</h3>
                <p className="text-sm text-slate-200 mt-2">{currentTutorialStep.body}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Step {tutorialStepIndex + 1} / {TUTORIAL_STEPS.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => closeTutorial(true)}
                      className="rounded-full px-3 py-1.5 chip text-xs text-slate-200"
                    >
                      Skip
                    </button>
                    <button
                      onClick={previousTutorialStep}
                      disabled={tutorialStepIndex === 0}
                      className="rounded-full px-3 py-1.5 chip text-xs text-slate-200 disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      onClick={nextTutorialStep}
                      className="rounded-full px-4 py-1.5 bg-amber-500 text-ink-900 text-xs font-semibold"
                    >
                      {tutorialStepIndex >= TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuiz && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">{quizMode === 'exam' ? 'Entrance Exam' : 'Study Quiz'}</p>
                  <h3 className="font-display text-2xl">
                    {quizMode === 'exam' && activeExamRegion
                      ? state.regions[activeExamRegion].name
                      : quizMode === 'exam' && activeCyborgExamTarget
                        ? (activeCyborgExamTarget === 'network' ? 'Network Certification Exam' : 'Resource Mining Certification Exam')
                        : 'QCAA Psychology Practice'}
                  </h3>
                </div>
                <button onClick={closeQuiz} className="chip rounded-full px-3 py-1 text-sm text-slate-200 hover:text-white">Close</button>
              </div>

              <div className="p-5 md:p-6">
                {currentQuestion ? (
                  <>
                    <div className="chip rounded-lg px-3 py-2 text-[11px] text-slate-300 mb-3">
                      <span>{currentQuestion.unit || 'General'}</span>
                      <span className="mx-2">•</span>
                      <span>{currentQuestion.topic || 'General Topic'}</span>
                      {currentQuestion.objectiveCode && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{currentQuestion.objectiveCode}</span>
                        </>
                      )}
                    </div>
                    <p className="text-lg text-sand-50 leading-relaxed">{currentQuestion.text}</p>

                    {!quizFeedback ? (
                      <div className="grid gap-2 mt-5">
                        {currentQuestion.options.map((option, idx) => (
                          <button key={option} onClick={() => handleAnswer(idx)} className="panel-soft rounded-lg px-4 py-3 text-left text-sm hover:border-tide-400/60">
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 panel-soft rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {quizFeedback.isCorrect ? <GraduationCap size={20} className="text-emerald-400" /> : <AlertTriangle size={20} className="text-rose-400" />}
                          <p className={quizFeedback.isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{quizFeedback.isCorrect ? 'Correct' : 'Incorrect'}</p>
                        </div>
                        <p className="text-sm text-slate-300">{quizFeedback.text}</p>
                        <button onClick={nextQuestion} className="mt-4 rounded-full px-5 py-2 bg-tide-600 text-white">Next Question</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="panel-soft rounded-xl p-4">
                    <p className="text-sm text-slate-300">No questions available for this mode right now. Adjust Question Menu selections and try again.</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                <span>Total correct answers: {state.correctQuizAnswers}</span>
                {quizMode === 'exam' && activeExamRegion ? (
                  <span>Exam progress: {examCorrect}/{state.regions[activeExamRegion].examPassesRequired} correct ({examAttempts} attempted)</span>
                ) : quizMode === 'exam' && activeCyborgExamTarget ? (
                  <span>
                    {activeCyborgExamTarget === 'network'
                      ? `Network exam: ${examCorrect}/${DIGITAL_NETWORK_EXAM_TARGET} correct · ${examWrong}/${DIGITAL_EXAM_MAX_WRONG} wrong`
                      : `Resource Mining exam: ${examCorrect}/${DIGITAL_MINING_EXAM_TARGET} correct · ${examWrong}/${DIGITAL_EXAM_MAX_WRONG} wrong`}
                  </span>
                ) : (
                  <span>
                    {state.isCyborg
                      ? `Correct answers boost research in digital phases. Topics selected: ${selectedTopicKeys.length}`
                      : `Correct answers lower anxiety and award serotonin. Topics selected: ${selectedTopicKeys.length}`}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-md overflow-hidden border border-red-500/70">
              <div className="px-5 py-4 border-b border-red-700/70 bg-red-950/55">
                <p className="text-xs uppercase tracking-wider text-red-300">Reset Progress</p>
                <h3 className="font-display text-2xl text-red-200">Are You Sure?</h3>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-red-100">
                  This will clear your save and restart the game from the beginning.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-lg px-4 py-2 bg-ink-700 text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetProgress}
                    className="rounded-lg px-4 py-2 bg-red-600 text-white font-semibold"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRevoltModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-lg border border-rose-500/70 overflow-hidden">
              <div className="px-5 py-4 border-b border-rose-700/70 bg-rose-950/60">
                <p className="text-xs uppercase tracking-widest text-rose-300">Emergency Notice</p>
                <h3 className="font-display text-2xl text-rose-100">ANTITRUST AND ARSON PROTOCOLS INITIATED</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-rose-100">
                  Infrastructure destroyed. Datacenters, siphons, and mining ops were sabotaged by public revolt.
                </p>
                <button
                  onClick={acknowledgeRevolt}
                  className="mt-4 rounded-lg px-4 py-2 bg-rose-600 text-white font-semibold"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBailoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-lg border border-amber-500/70 overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-700/70 bg-amber-950/60">
                <p className="text-xs uppercase tracking-widest text-amber-300">Economic Stability Measure</p>
                <h3 className="font-display text-2xl text-amber-100">Too Big To Fail Bailout</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-amber-100">
                  Government insurance bailout approved. Public anxiety reset. Cash injection incoming.
                </p>
                <p className="mt-2 font-mono text-amber-300">+${formatNumber(REVOLT_BAILOUT_CASH)}</p>
                <button
                  onClick={acceptBailout}
                  className="mt-4 rounded-lg px-4 py-2 bg-amber-600 text-ink-950 font-semibold"
                >
                  Accept Bailout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeuroLinkConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-lg overflow-hidden border border-red-500/70">
              <div className="px-5 py-4 border-b border-red-700/70 bg-red-950/55">
                <p className="text-xs uppercase tracking-wider text-red-300">Irreversible Action</p>
                <h3 className="font-display text-2xl text-red-200">Confirm Digital Brain Wipe</h3>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-red-100">
                  Activating NeuroLink will wipe biological currencies and progression momentum. If this is intentional, type
                  <span className="font-mono mx-1 px-1 rounded bg-red-900/70">WIPE</span>
                  below.
                </p>
                <input
                  value={neuroLinkConfirmText}
                  onChange={(event) => setNeuroLinkConfirmText(event.target.value)}
                  placeholder="Type WIPE to continue"
                  className="w-full rounded-lg border border-red-500/70 bg-ink-900 px-3 py-2 text-red-100 placeholder:text-red-300/60 outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowNeuroLinkConfirm(false);
                      setNeuroLinkConfirmText('');
                    }}
                    className="rounded-lg px-4 py-2 bg-ink-700 text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDigitalBrainUnlock}
                    disabled={neuroLinkConfirmText.trim().toUpperCase() !== 'WIPE'}
                    className="rounded-lg px-4 py-2 bg-red-600 text-white font-semibold disabled:opacity-40"
                  >
                    Confirm Wipe
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBrainFullPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} className="panel rounded-2xl w-full max-w-xl overflow-hidden border border-fuchsia-500/60">
              <div className="px-5 py-4 border-b border-fuchsia-700/60 bg-fuchsia-950/55">
                <p className="text-xs uppercase tracking-wider text-fuchsia-300">Digital Brain Capacity</p>
                <h3 className="font-display text-2xl text-fuchsia-200">Brain Full</h3>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-fuchsia-100">
                  Brain full. Would you like to extend your intelligence out to corporate datacenters?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => resolveBrainFullPrompt(false)}
                    className="rounded-lg px-4 py-2 bg-ink-700 text-slate-200"
                  >
                    No
                  </button>
                  <button
                    onClick={() => resolveBrainFullPrompt(true)}
                    className="rounded-lg px-4 py-2 bg-fuchsia-600 text-white font-semibold"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMarketWindow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.97, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="panel rounded-2xl w-full h-[96vh] md:h-[92vh] max-w-[1700px] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Full-Screen Window</p>
                  <h3 className="font-display text-2xl">Chaotic Stockmarket</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {state.isCyborg
                      ? 'Trade apocalyptic mega-caps with cash reserves. Spreads, fees, and flash-crashes still apply.'
                      : 'Trade life choices with real spreads, fees, crashes, and occasional absurd rallies.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowMarketWindow(false)}
                  className="chip rounded-full px-3 py-1 text-sm text-slate-200 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="p-4 md:p-5 overflow-y-auto space-y-3">
                <div className="panel-soft rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">Weekly Scenario</p>
                      <p className="font-semibold text-amber-200">{scenarioLabel}</p>
                      <p className="text-xs text-slate-300 mt-1">{scenarioSummary}</p>
                    </div>
                    <div className="chip rounded px-2 py-1 text-xs">
                      <p className="text-slate-400">Mood</p>
                      <p className={`font-mono ${state.marketMood >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {state.marketMood >= 0 ? '+' : ''}{state.marketMood.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {hasActiveMarketEvent && (
                    <div className="mt-3 chip rounded-lg p-3 text-xs border border-sky-500/35">
                      <p className="text-sky-300 font-semibold">News Card ({marketEventSecondsLeft}s)</p>
                      <p className="text-slate-200 mt-1">{state.marketHeadline}</p>
                      <p className="text-slate-400 mt-1">
                        Target: {state.marketEventSector === 'all' ? 'All sectors' : `${state.marketEventSector} sector`}
                        {' '}· Impact {state.marketEventBias >= 0 ? '+' : ''}{(state.marketEventBias * state.marketEventSeverity * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="panel-soft rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Net Worth</span>
                    <span className="font-mono text-emerald-400">
                      {state.isCyborg ? '$' : ''}{formatNumber(liquidFunds + portfolioValue)}
                    </span>
                  </div>
                  <div className="mt-2 grid md:grid-cols-4 grid-cols-2 gap-2 text-xs">
                    <div className="chip rounded p-2">
                      <p className="text-slate-400">Portfolio Value</p>
                      <p className="font-mono text-sand-50">{state.isCyborg ? '$' : ''}{formatNumber(portfolioValue)}</p>
                    </div>
                    <div className="chip rounded p-2">
                      <p className="text-slate-400">Cost Basis</p>
                      <p className="font-mono text-slate-200">{state.isCyborg ? '$' : ''}{formatNumber(portfolioCostBasis)}</p>
                    </div>
                    <div className="chip rounded p-2">
                      <p className="text-slate-400">Unrealized P/L</p>
                      <p className={`font-mono ${portfolioUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {state.isCyborg ? '$' : ''}{formatNumber(portfolioUnrealizedPnl)}
                      </p>
                    </div>
                    <div className="chip rounded p-2">
                      <p className="text-slate-400">Realized P/L</p>
                      <p className={`font-mono ${portfolioRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {state.isCyborg ? '$' : ''}{formatNumber(portfolioRealizedPnl)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Portfolio P/L</span>
                    <span className={`font-mono ${portfolioTotalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {state.isCyborg ? '$' : ''}{formatNumber(portfolioTotalPnl)}
                    </span>
                  </div>
                </div>

                <div className="grid xl:grid-cols-2 gap-3">
                  {state.stocks.map((stock) => {
                    const previousPrice = stock.history[stock.history.length - 2] ?? stock.currentPrice;
                    const isUp = stock.currentPrice >= previousPrice;
                    const buyPrice = getBuyPrice(stock);
                    const sellPrice = getSellPrice(stock);
                    const spreadPct = ((buyPrice - sellPrice) / Math.max(1, stock.currentPrice)) * 100;
                    const isSelected = selectedStockId === stock.id;
                    const min = Math.min(...stock.history);
                    const max = Math.max(...stock.history);
                    const range = Math.max(1, max - min);
                    const points = stock.history
                      .map((price, i) => {
                        const x = (i / Math.max(1, stock.history.length - 1)) * 100;
                        const y = 100 - ((price - min) / range) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <div key={stock.id} className="panel-soft rounded-xl p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sand-50">{stock.ticker} · {stock.name}</p>
                            <p className="text-xs text-slate-400">{stock.description}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Style: <span className="text-indigo-300">{getPersonalityLabel(stock.personality)}</span>
                            </p>
                          </div>
                          <div className={`font-mono text-lg ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {state.isCyborg ? '$' : ''}{formatNumber(stock.currentPrice)}
                          </div>
                        </div>

                        <div className="h-16 rounded mt-2 bg-ink-900/70 overflow-hidden">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polyline
                              points={points}
                              fill="none"
                              stroke={isUp ? '#34d399' : '#fb7185'}
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="chip rounded p-2">
                            <p className="text-slate-400">Buy (Ask)</p>
                            <p className="font-mono text-rose-300">{state.isCyborg ? '$' : ''}{formatNumber(buyPrice)}</p>
                          </div>
                          <div className="chip rounded p-2">
                            <p className="text-slate-400">Sell (Bid)</p>
                            <p className="font-mono text-emerald-300">{state.isCyborg ? '$' : ''}{formatNumber(sellPrice)}</p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Owned: {stock.owned} · Spread {spreadPct.toFixed(1)}%</span>
                          <button
                            onClick={() => setSelectedStockId((prev) => (prev === stock.id ? null : stock.id))}
                            className="rounded px-3 py-1 bg-sky-700 text-white"
                          >
                            {isSelected ? 'Hide' : 'Inspect'}
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="chip rounded p-2">
                            <p className="text-slate-400 mb-1">Buy Blocks</p>
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => buyStock(stock.id, 1)} disabled={liquidFunds < buyPrice} className="rounded px-2 py-1 bg-emerald-700 text-white disabled:opacity-40">+1</button>
                              <button onClick={() => buyStock(stock.id, 10)} disabled={liquidFunds < buyPrice * 10} className="rounded px-2 py-1 bg-emerald-700 text-white disabled:opacity-40">+10</button>
                              <button onClick={() => buyStock(stock.id, 100)} disabled={liquidFunds < buyPrice * 100} className="rounded px-2 py-1 bg-emerald-700 text-white disabled:opacity-40">+100</button>
                              <button onClick={() => buyStock(stock.id, 1000)} disabled={liquidFunds < buyPrice * 1000} className="rounded px-2 py-1 bg-emerald-700 text-white disabled:opacity-40">+1000</button>
                            </div>
                          </div>
                          <div className="chip rounded p-2">
                            <p className="text-slate-400 mb-1">Sell Blocks</p>
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => sellStock(stock.id, 1)} disabled={stock.owned < 1} className="rounded px-2 py-1 bg-ink-700 text-slate-200 disabled:opacity-40">-1</button>
                              <button onClick={() => sellStock(stock.id, 10)} disabled={stock.owned < 10} className="rounded px-2 py-1 bg-ink-700 text-slate-200 disabled:opacity-40">-10</button>
                              <button onClick={() => sellStock(stock.id, 100)} disabled={stock.owned < 100} className="rounded px-2 py-1 bg-ink-700 text-slate-200 disabled:opacity-40">-100</button>
                              <button onClick={() => sellAllStock(stock.id)} disabled={stock.owned < 1} className="rounded px-2 py-1 bg-rose-700 text-white disabled:opacity-40">Sell All</button>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 chip rounded-lg p-3 text-xs space-y-2">
                            <p className="text-slate-200">{getStockInsight(stock)}</p>
                            <p className="text-slate-400">{stock.detailOnClick || stock.riskDescription}</p>
                            <p className="text-indigo-300">{getPersonalityHint(stock.personality)}</p>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                              <p>Crash chance: {(stock.crashChance * 100).toFixed(1)}%</p>
                              <p>Moon chance: {(stock.moonChance * 100).toFixed(1)}%</p>
                              <p>Recovery chance: {(stock.recoveryChance * 100).toFixed(1)}%</p>
                              <p>Fee rate: {(stock.transactionFee * 100).toFixed(2)}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMinigame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="panel rounded-2xl w-full max-w-5xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Minigame</p>
                  <h3 className="font-display text-2xl">{activeMinigame.name}</h3>
                </div>
                <button
                  onClick={() => {
                    if (minigameResult === 'idle' && activeMinigame.type === 'scam_o_matic') {
                      closeMinigame();
                      return;
                    }
                    if (minigameResult === 'idle') {
                      finalizeMinigame(false);
                      return;
                    }
                    closeMinigame();
                  }}
                  className="chip rounded-full px-3 py-1 text-sm text-slate-200 hover:text-white"
                >
                  {minigameResult === 'idle'
                    ? (activeMinigame.type === 'scam_o_matic' ? 'Close (No Apply)' : 'Abort')
                    : 'Close'}
                </button>
              </div>

              <div className="p-5 md:p-6">
                <p className="text-sm text-slate-300 mb-4">{activeMinigame.description}</p>

                {minigameResult === 'idle' && activeMinigame.type === 'focus_tuner' && (
                  <div className="space-y-4">
                    <div className="h-3 rounded-full bg-ink-700 overflow-hidden relative">
                      <div className="absolute inset-y-0 left-[45%] w-[10%] bg-emerald-500/40" />
                      <div className="absolute inset-y-0 left-0 w-full">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${tunerValue}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleTunerStop}
                      className="rounded-full px-5 py-2 bg-amber-500 text-white"
                    >
                      Stop Signal
                    </button>
                  </div>
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'signal_scan' && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Attempts left: {scanAttemptsLeft}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <button
                          key={`scan-${idx}`}
                          onClick={() => handleScanPick(idx)}
                          className="h-16 rounded-lg bg-ink-700 hover:bg-ink-600 text-slate-200 text-sm"
                        >
                          Scan
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'neurosnake' && (
                  <NeuroSnake onFinish={handleNeuroSnakeFinish} />
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'brainbuilder' && (
                  <BrainBuilder onFinish={handleBrainBuilderFinish} />
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'flappy_freud' && (
                  <FlappyFreud onFinish={handleFlappyFreudFinish} />
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'feed_sundgren' && (
                  <FeedSundgren onFinish={handleFeedSundgrenFinish} />
                )}

                {minigameResult === 'idle' && activeMinigame.type === 'scam_o_matic' && (
                  <ScamOMatic
                    money={state.money}
                    onFinish={handleScamOMaticFinish}
                  />
                )}

                {minigameResult !== 'idle' && (
                  <div className="panel-soft rounded-xl p-4">
                    <p className={`text-lg font-semibold ${minigameResult === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {minigameResult === 'success' ? 'Success' : 'Failed'}
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      {activeMinigame.type === 'scam_o_matic' && lastScamOutcome
                        ? `${lastScamOutcome.label} · Bet $${formatNumber(lastScamOutcome.bet)} · Multiplier x${lastScamOutcome.multiplier.toFixed(2)} · Net ${lastScamOutcome.delta >= 0 ? '+' : '-'}$${formatNumber(Math.abs(lastScamOutcome.delta))}. Cooldown applied.`
                        : minigameResult === 'success'
                          ? state.isCyborg
                            ? state.phase === GamePhase.NeuroLink
                              ? `+${formatNumber(lastMinigameReward * 55)} FLOPS, +$${formatNumber(lastMinigameReward * 130)}`
                              : `+${formatNumber(lastMinigameReward * 55)} FLOPS, +$${formatNumber(lastMinigameReward * 130)}, +${formatNumber(lastMinigameReward * 2.2)} matter`
                            : `Dopamine +${lastMinigameReward}`
                          : lastMinigameReward > 0
                            ? state.isCyborg
                              ? state.phase === GamePhase.NeuroLink
                                ? `Run ended. Partial rewards: +${formatNumber(lastMinigameReward * 55)} FLOPS, +$${formatNumber(lastMinigameReward * 130)}.`
                                : `Run ended. Partial rewards: +${formatNumber(lastMinigameReward * 55)} FLOPS, +$${formatNumber(lastMinigameReward * 130)}, +${formatNumber(lastMinigameReward * 2.2)} matter.`
                              : `Run ended. Dopamine +${lastMinigameReward}. Cooldown applied.`
                            : 'Cooldown applied. Try again after it resets.'}
                    </p>
                    <button onClick={closeMinigame} className="mt-4 rounded-full px-4 py-2 bg-sky-500 text-white">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mx-auto w-full max-w-[1920px] mt-2 px-1 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Brain size={12} />
          {state.isCyborg ? 'Phase 2: Digital Brain' : `Era: ${AcademicEra[state.academicEra]}`}
        </span>
        <span className="font-mono">
          IQ {formatNumber(intelligenceScore)} · PsychBucks {formatNumber(state.psychBucks)} · {state.isCyborg ? `Total FLOPS: ${formatNumber(state.compute)}` : `Total neurons: ${formatNumber(state.totalNeurons)}`}
        </span>
        <span className="font-mono">
          {state.isCyborg ? 'Treasury' : 'Stockmarket value'}: {state.isCyborg ? '$' : ''}{formatNumber(state.isCyborg ? state.money + portfolioValue : portfolioValue)}
        </span>
      </footer>
    </div>
  );
}

