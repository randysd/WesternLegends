const DATA_FILES = {
  settings: 'data/settings.json',
  triggers: 'data/triggers.json',
  oneOffs: 'data/one-off-events.json',
  arcs: 'data/character-arcs.json',
  storylines: 'data/major-storylines.json',
  worldEvents: 'data/world-events.json',
  locations: 'data/locations.json',
  newspaper: 'data/newspaper-generator.json',
  setupAssist: 'data/setup-assist.json',
  items: 'data/items.json',
  finalScoring: 'data/final-scoring.json'
};

const SAVE_KEY = 'wl_frontier_director_save_v1';
const KOFI_SUPPORT_URL = 'https://ko-fi.com/randyd426';
const PLAYER_COLORS = ['white', 'red', 'yellow', 'blue', 'purple', 'black'];
const NULL_PLAYER_COLOR = '';
const PLAYER_COLOR_OPTIONS = [...PLAYER_COLORS, NULL_PLAYER_COLOR];
const TRASH_ICON_SVG = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
// Characters are tied to the expansion/module that supplies them. The Base
// Game pool is always available; expansion characters only enter the player
// dropdown when that expansion is active in the current setup.
const CHARACTER_SETS = {
  base: [
    'Annie Oakley',
    'Bass Reeves',
    'Billy the Kid',
    'Bloody Knife',
    'Calamity Jane',
    'Doc Holliday',
    'Jesse James',
    'Kit Carson',
    'Stagecoach Mary Fields',
    'Wild Bill Hickok',
    'Wyatt Earp',
    'Y. B. Rowdy'
  ],
  the_good_the_bad_and_the_handsome: [
    'Judge Roy Bean',
    'Butch Cassidy',
    'Joaquin Murrieta'
  ],
  fistful_of_extras: [
    'Belle Starr',
    'Isom Dart',
    'Allan Pinkerton',
    'Buffalo Bill Cody',
    'Bat Masterson',
    'Pearl Hart'
  ],
  wild_bunch: [
    'Ada Curnutt',
    'Dave Rudabaugh',
    'Johnny Ringo',
    'Tiburcio Vasquez'
  ],
  ante_up: [
    'Fee Lee Wong',
    'Maria Gertrudis Barceló',
    'Pat Garrett',
    'Poker Alice',
    'Seth Bullock',
    'Jefferson “Soapy” Smith',
    'Sundance Kid',
    'William “Curly Bill” Brocius'
  ],
  blood_money: [
    'Al Swearengen',
    'Ben Hodges',
    'Buckshot Roberts',
    'Charlie Parkhurst',
    'Elfego Baca',
    'James “Bloody Arm” Beckworth',
    'Lottie Deno',
    'Lozen',
    'Texas John Slaughter',
    'Tom Tobin'
  ],
  big_box: [
    'Aaron Ross'
  ],
  dark_knight: [
    'Dark Knight'
  ]
};

function characterSortKey(name = '') {
  // Leading nickname quotes should not cause entries such as "Doc" Holliday
  // or "Stagecoach Mary" Fields to sort before A in the dropdown.
  return String(name).replace(/^[^\p{L}\p{N}]+/u, '');
}

function sortCharactersAlphabetically(characters) {
  return characters.slice().sort((a, b) =>
    characterSortKey(a).localeCompare(characterSortKey(b), 'en', { sensitivity: 'base' })
  );
}

function characterExpansionIsActive(moduleId, activeModules) {
  if (activeModules.has(moduleId)) return true;

  // For expansion-level character pools (Ante Up, Blood Money, Wild Bunch,
  // etc.), selecting ANY child module means that expansion is in use and its
  // characters should be available. Dark Knight is intentionally a child-only
  // pool, so it unlocks only when that specific fan module is selected.
  const group = MODULES.find(entry => entry.id === moduleId);
  return !!group?.modules?.some(child => activeModules.has(child.id));
}

function availableCharactersForSetup() {
  const active = new Set(state?.setup?.modules || ['base']);
  const available = [...CHARACTER_SETS.base];

  Object.entries(CHARACTER_SETS).forEach(([moduleId, characters]) => {
    if (moduleId === 'base') return;
    const enabled = moduleId === 'dark_knight'
      ? active.has('dark_knight')
      : characterExpansionIsActive(moduleId, active);
    if (enabled) available.push(...characters);
  });

  return sortCharactersAlphabetically([...new Set(available)]);
}

function reconcileSelectedCharactersWithModules() {
  normalizePlayers();
  const available = new Set(availableCharactersForSetup());
  state.setup.playerDetails.forEach(player => {
    if (player.character && !available.has(player.character)) player.character = '';
  });
}
const MODULES = [
  {
    id: 'base',
    name: 'Base Game',
    detail: 'Required core Western Legends game content.',
    locked: true,
    modules: [
      { id: 'base_core', name: 'Core Board & Actions', detail: 'Darkrock, Red Falls, ranches, mines, bandits, poker, cattle, and core actions.', locked: true },
      { id: 'base_goals', name: 'Goals', detail: 'Adds character Goal cards and additional challenges/rewards. Automatically enables Legendary Tokens.' },
      { id: 'base_legendary_tokens', name: 'Legendary Tokens', detail: 'Uses the facedown Legendary token supply and player mat token spaces.' }
    ]
  },
  {
    id: 'ante_up',
    name: 'Ante Up',
    detail: 'Adds Ante Up characters, items, Legendary Items, and selected modules below.',
    modules: [
      { id: 'ante_up_sideboard', name: 'Buzzard Gulch Sideboard', detail: 'Adds Buzzard Gulch, mountain passes, frontier spaces, orange ranch, outlaw camp, and train station.' },
      { id: 'ante_up_train', name: 'Train Module', detail: 'Uses the train, train deck, train movement, and train encounter hooks.' },
      { id: 'ante_up_events', name: 'Events Deck', detail: 'Adds Event cards/tokens, setup events, and High Roller, Claim Jumper, Longhorn, and Outlaw token content.' },
      { id: 'ante_up_gambler', name: 'Gambler Track', detail: 'Uses Gambler Points and gambling-related story opportunities.' },
      { id: 'ante_up_faro', name: 'Faro', detail: 'Adds Faro as an alternate Gamble action at saloons.' },
      { id: 'ante_up_high_stakes_poker', name: 'High Stakes Poker', detail: 'Adds the multiplayer High Stakes Poker gambling option.' }
    ]
  },
  {
    id: 'blood_money',
    name: 'Blood Money',
    detail: 'Adds Blood Money characters, items, Legendary Items, and selected modules below.',
    modules: [
      { id: 'blood_money_stories', name: 'Legendary Story System', detail: 'Adds the Legendary Story board/cards and enables Ruin-token related rules such as Repair.' },
      { id: 'blood_money_risk_die', name: 'Risk Die', detail: 'Enables Risk Die challenges and high-risk event outcomes.' },
      { id: 'blood_money_injuries', name: 'Injury Deck', detail: 'Enables injuries as lasting penalties and Doctor/healing hooks.' },
      { id: 'blood_money_deeds', name: 'Deeds', detail: 'Adds Deeds, Claim actions, and property-related rewards.' },
      { id: 'blood_money_traveling_trader', name: 'Traveling Trader', detail: 'Adds the Traveling Trader stand, movement deck, miniature, and Legendary Item market.' }
    ]
  },
  {
    id: 'wild_bunch',
    name: 'Wild Bunch of Extras',
    detail: 'Adds Wild Bunch characters, items, Legendary Items, and optional variants.',
    modules: [
      { id: 'wild_bunch_titles', name: 'Titles', detail: 'Adds Title cards and end-game scoring/effect options.' },
      { id: 'wild_bunch_gang_posse', name: 'Gang/Posse', detail: 'Lets Marshal and Wanted players recruit extra muscle.' },
      { id: 'wild_bunch_sheriff', name: 'Sheriff', detail: 'Adds Sheriff personality cards that change when the Sheriff loses a fight.' },
      { id: 'wild_bunch_bandit_variant', name: 'Bandit Variant', detail: 'Adds numbered Bandit rings and Bandit personality cards/effects.' },
      { id: 'wild_bunch_man_in_black', name: 'Man in Black', detail: 'Adds the automated Man in Black player, deck, setup, round turn, and scoring rules.' },
      { id: 'wild_bunch_unique_events', name: 'Unique Events', detail: 'Adds Unique Event cards and tokens to the Event system.' }
    ]
  },
  {
    id: 'the_good_the_bad_and_the_handsome',
    name: 'The Good, the Bad, and the Handsome',
    detail: 'Adds this expansion’s characters, items, and Legendary Items.',
    modules: []
  },
  {
    id: 'fistful_of_extras',
    name: 'Fistful of Extras',
    detail: 'Adds this expansion’s characters/items and optional Joker variant.',
    modules: [
      { id: 'fistful_jokers', name: 'Jokers Variant', detail: 'Adds Joker cards to the Poker deck.' }
    ]
  },
  {
    id: 'promos',
    name: 'Promos',
    detail: 'Optional promotional and edition-specific content.',
    selectable: false,
    modules: [
      { id: 'big_box', name: 'Big Box Edition', detail: 'Adds Aaron Ross and the Strongbox Legendary Item.' },
      { id: 'promo_carbine', name: 'Carbine', detail: 'Adds the Carbine weapon item.' }
    ]
  },
  {
    id: 'variants',
    name: 'Variants',
    detail: 'Optional add-on decks and fan-made gameplay variants.',
    selectable: false,
    modules: [
      { id: 'treasure_hunting_rumors', name: 'Treasure Hunting', detail: 'Piece together Rumor cards to find the legendary buried treasure.' },
      { id: 'hunting', name: 'Hunting', detail: 'Hunt legendary targets roaming the wild west.' },
      { id: 'fishing', name: 'Fishing', detail: 'Fish river spaces for catches, LP, and recovery opportunities.' },
      { id: 'foraging_crafting', name: 'Foraging/Crafting', detail: 'Gather resources to craft unique and powerful items.' },
      { id: 'theatre', name: 'Theatre', detail: 'Adds variable Theatre-card results for the Revel action.' },
      { id: 'prospecting_cards', name: 'Prospecting Deck', detail: 'Adds a Prospecting deck and LP-track gold triggers to vary mine strategy.' },
      { id: 'dark_knight', name: 'Dark Knight', detail: 'Adds the fan-made Dark Knight character.' }
    ]
  }
];

// Legacy module ids are kept as aliases so old saves and existing data files
// continue to behave correctly after the setup tree was reorganized.
const MODULE_ALIASES = {
  wild_bunch_of_extras: 'wild_bunch',
  gang_posse: 'wild_bunch_gang_posse',
  gang_posse_gangs: 'wild_bunch_gang_posse',
  gang_posse_posses: 'wild_bunch_gang_posse',
  hunting_animals: 'hunting',
  hunting_legendary_animals: 'hunting',
  hunting_harvest_resources: 'hunting',
  fishing_fish_deck: 'fishing',
  fishing_delivery: 'fishing',
  foraging: 'foraging_crafting',
  crafting: 'foraging_crafting',
  foraging_resources: 'foraging_crafting',
  foraging_deliveries: 'foraging_crafting',
  prospecting: 'prospecting_cards',
  prospecting_bonus_die: 'prospecting_cards',
  treasure: 'treasure_hunting_rumors',
  treasure_map: 'treasure_hunting_rumors'
};
const MAN_IN_BLACK_ID = 'man_in_black';

// Small line icons shown on each expansion tree row in the setup dialog.
// Falls back to a generic star/badge icon for any module id not listed here.
const MODULE_ICONS = {
  base: '<path d="M3 5h18v14H3z"/><path d="M3 10h18"/>',
  base_core: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  base_legendary_tokens: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  ante_up: '<path d="M3 12h18M15 6l6 6-6 6"/>',
  blood_money: '<path d="M12 3c3 4 6 6.8 6 10.5A6 6 0 0 1 6 13.5C6 9.8 9 7 12 3z"/>',
  blood_money_ruins: '<path d="M4 20V9l4-4 3 3 3-5 6 6v11"/><path d="M3 20h18"/>',
  gang_posse: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.4"/><path d="M15.5 14a4.6 4.6 0 0 1 5.5 4.4"/>',
  hunting: '<path d="M12 3 4 20h16z"/><path d="M7 14h10"/>',
  fishing: '<path d="M2 12s4-5 10-5 10 5 10 5-4 5-10 5-10-5-10-5z"/><circle cx="16" cy="12" r="1.3"/>',
  foraging: '<path d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z"/><path d="M12 21V10"/>',
  wild_bunch: '<path d="M12 2l2.4 6.9H22l-5.8 4.2 2.2 7-6.4-4.4L5.6 20l2.2-7L2 8.9h7.6z"/>',
  fistful_of_extras: '<path d="M12 2l2.4 6.9H22l-5.8 4.2 2.2 7-6.4-4.4L5.6 20l2.2-7L2 8.9h7.6z"/>',
  the_good_the_bad_and_the_handsome: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  big_box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  promo_carbine: '<path d="M3 15l13-6 2 2-4 4 3 3-2 2-3-3-4 4-2-2z"/>',
  fan_modules: '<path d="M4 4l16 4-6 3 3 6-4-2-3 5-6-16z"/>',
  dark_knight: '<path d="M4 17c2-5 5-8 8-11 3 3 6 6 8 11-2-1-4-1-6 0l-2 3-2-3c-2-1-4-1-6 0z"/>'
};
function moduleIcon(id) {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MODULE_ICONS[id] || MODULE_ICONS.wild_bunch}</svg>`;
}

const SETUP_SECTIONS = []; // setup instructions are loaded from data/setup-assist.json


const app = document.getElementById('app');
const dialog = document.getElementById('storyDialog');
const voicePlayer = document.getElementById('voicePlayer');
const musicPlayer = document.getElementById('musicPlayer');
const sfxPlayer = document.getElementById('sfxPlayer');
const assistDialog = document.getElementById('assistDialog');
const assistBody = document.getElementById('assistBody');
const assistTitle = document.getElementById('assistTitle');
const assistType = document.getElementById('assistType');

let db = {};
let state = null;
let currentDialogEvent = null;
let storyDialogReturnTarget = null;
let assistView = 'menu';
let assistReturnTarget = null;
let assistReturnAfterClose = false;
let assistNestedReturn = null;
let worldEventHeartbeatTimer = null;
let fightFlowReturnTarget = null;
let gamblingFlowReturnTarget = null;
let gamblingFlowSelection = 'poker';
let actionsReturnTarget = null;
let storyTrackNotificationQueue = [];
let storyTrackNotificationActive = false;

const STORY_FREQUENCY_OPTIONS = [
  { value: 'rare', label: 'Rare' },
  { value: 'standard', label: 'Standard' },
  { value: 'frequent', label: 'Frequent' }
];

function defaultStoryEventOptions() {
  const configured = db?.settings?.storyEvents?.defaults || {};
  return {
    oneOff: { enabled: configured.oneOff?.enabled !== false, frequency: configured.oneOff?.frequency || 'standard' },
    arcs: { enabled: configured.arcs?.enabled !== false, frequency: configured.arcs?.frequency || 'standard' },
    world: { enabled: configured.world?.enabled !== false, frequency: configured.world?.frequency || 'standard' }
  };
}

function storyDensityToFrequency(value) {
  if (value === 'light') return 'rare';
  if (value === 'heavy' || value === 'cinematic') return 'frequent';
  return 'standard';
}

function normalizeStoryEventSettings() {
  if (!state?.setup) return;
  const defaults = defaultStoryEventOptions();
  const legacyFrequency = storyDensityToFrequency(state.setup.storyDensity);
  if (!state.setup.storyOptions || typeof state.setup.storyOptions !== 'object') {
    state.setup.storyOptions = {
      oneOff: { ...defaults.oneOff, frequency: legacyFrequency },
      arcs: { ...defaults.arcs, frequency: legacyFrequency },
      world: { ...defaults.world, frequency: legacyFrequency }
    };
  }
  ['oneOff', 'arcs', 'world'].forEach(key => {
    if (!state.setup.storyOptions[key]) state.setup.storyOptions[key] = { ...defaults[key] };
    if (typeof state.setup.storyOptions[key].enabled !== 'boolean') state.setup.storyOptions[key].enabled = defaults[key].enabled;
    if (!STORY_FREQUENCY_OPTIONS.some(option => option.value === state.setup.storyOptions[key].frequency)) {
      state.setup.storyOptions[key].frequency = defaults[key].frequency;
    }
  });
  if (!['guided', 'checklist'].includes(state.setup.setupGuideMode)) state.setup.setupGuideMode = 'guided';
  if (!['modules', 'basics', 'setup'].includes(state.setup.setupPanel)) state.setup.setupPanel = 'modules';
  if (!Array.isArray(state.setup.setupProgress)) state.setup.setupProgress = [];
  if (!Number.isFinite(Number(state.setup.setupGuideSection))) state.setup.setupGuideSection = 0;
  if (!state.worldEventClock || typeof state.worldEventClock !== 'object') {
    state.worldEventClock = { nextAt: null, pendingEventId: null };
  }
}

function storyEventsEnabled(key) {
  normalizeStoryEventSettings();
  return state.setup.storyOptions?.[key]?.enabled !== false;
}

function storyEventFrequency(key) {
  normalizeStoryEventSettings();
  return state.setup.storyOptions?.[key]?.frequency || 'standard';
}

function defaultState() {
  return {
    screen: 'home',
    gameStarted: false,
    setup: {
      players: 1,
      playerColors: [],
      playerDetails: [{ name: '', character: '', color: PLAYER_COLORS[0] }],
      modules: (db?.settings?.enabledModulesDefault || ['base']).slice(),
      targetLP: 20,
      storyDensity: 'standard',
      useStoryTrack: true,
      storyOptions: defaultStoryEventOptions(),
      setupGuideMode: 'guided',
      setupPanel: 'modules',
      setupGuideSection: 0,
      setupProgress: []
    },
    activeTriggers: [],
    activeStories: [],
    activeWorldEvents: [],
    worldTags: [],
    counters: {},
    seenTriggerIds: [],
    recentTriggerIds: [],
    triggeredLog: [],
    newspaperNotes: [],
    finalScores: {},
    finalWinnerColor: null,
    finalWinnerColors: [],
    // Permanent record of character-arc / storyline progress, keyed by arc id.
    // This is what actually prevents an already-resolved chapter from being
    // picked again - state.activeStories only tracks *currently pending*
    // chapters, so once a chapter resolved/expired it dropped out of that
    // list and looked "available" again forever. arcProgress never forgets.
    // Virtual replacement for the physical 4-space Story Point track (one
    // marker per player color, position 0-3: 0=Start, 1=Move Sheriff,
    // 2=Spawn Bandits, 3=Choose a point, then wraps back to 0).
    storyTrack: {},
    // Per-player running totals of Gambling/Legendary/Marshal/Wanted points
    // gained from landing on the "choose a point" story-track space.
    playerCounters: {},
    arcProgress: {},
    worldEventClock: { nextAt: null, pendingEventId: null },
    settings: { musicOn: true, soundOn: true, voiceOn: true, musicVolume: 0.2, soundVolume: 0.6, voiceVolume: 0.8 }
  };
}

async function init() {
  db = await loadData();
  state = loadSave() || defaultState();
  if (state.screen === 'reference' || state.screen === 'settings') state.screen = state.gameStarted ? 'game' : 'home';
  normalizeSetupModules();
  normalizeStoryEventSettings();
  ensureWorldEventClock();
  save();
  preloadAudio(PROSPECT_DICE_SFX);
  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
  document.querySelectorAll('[data-assist]').forEach(btn => btn.addEventListener('click', () => {
    const fromDrawer = !!btn.closest('#drawerNav');
    assistReturnTarget = fromDrawer ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    openAssistMenu();
  }));
  document.querySelectorAll('[data-open-audio]').forEach(btn => btn.addEventListener('click', () => {
    const returnTarget = btn.closest('#drawerNav') ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    renderAudioSettings(returnTarget);
  }));
  document.querySelectorAll('[data-open-reference]').forEach(btn => btn.addEventListener('click', () => {
    const returnTarget = btn.closest('#drawerNav') ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    renderReferenceOverlay(returnTarget);
  }));
  document.querySelectorAll('[data-end-game]').forEach(btn => btn.addEventListener('click', () => beginEndGame()));
  document.getElementById('assistCloseBtn')?.addEventListener('click', handleAssistCloseRequest);
  document.getElementById('storyDialogCloseBtn')?.addEventListener('click', () => { if (dialog.open) { dialog.close(); render(); } });
  installCreditsSupportButton();
  document.addEventListener('click', event => {
    const creditsBtn = event.target.closest?.('[data-open-credits-support]');
    if (!creditsBtn) return;
    event.preventDefault();
    storyDialogReturnTarget = creditsBtn.closest('#drawerNav') ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    showCreditsSupportDialog();
  });
  assistDialog.addEventListener('close', () => {
    assistNestedReturn = null;
    currentStoreLayout = null;
    clearTimeout(storeAutoRandomizeTimer);
    storeAutoRandomizeTimer = null;
    Object.keys(prospectDieTimers).forEach(key => { clearTimeout(prospectDieTimers[key]); delete prospectDieTimers[key]; });
    resetFightCardHand();
    if (assistReturnAfterClose) {
      assistReturnAfterClose = false;
      openAssistMenu();
      return;
    }
    if (assistReturnTarget === 'drawer') {
      assistReturnTarget = null;
      document.getElementById('drawerNav')?.classList.add('open');
    }
  });
  setupDialogBackdropClose(dialog);
  setupBackdropClose(assistDialog, '.dialog-card', handleAssistCloseRequest);
  setupBackdropClose(document.getElementById('drawerNav'), '.drawer-nav-card', () => document.getElementById('drawerNav')?.classList.remove('open'));
  document.getElementById('drawerNavCloseBtn')?.addEventListener('click', () => document.getElementById('drawerNav')?.classList.remove('open'));
  dialog.addEventListener('close', () => {
    stopVoice();
    if (storyDialogReturnTarget === 'drawer') {
      storyDialogReturnTarget = null;
      document.getElementById('drawerNav')?.classList.add('open');
    }
    setTimeout(maybePresentPendingWorldEvent, 40);
  });
  document.addEventListener('click', event => {
    const swatch = event.target.closest?.('[data-cycle-player-color]');
    if (!swatch) return;
    event.preventDefault();
    event.stopPropagation();
    cyclePlayerColor(Number(swatch.dataset.cyclePlayerColor));
  }, true);
  document.addEventListener('click', event => {
    const openBtn = event.target.closest?.('[data-open-assist]');
    if (!openBtn) return;
    event.preventDefault();
    openAssist(openBtn.dataset.openAssist);
  });
  document.addEventListener('click', event => {
    const viewBtn = event.target.closest?.('[data-view-image]');
    if (!viewBtn) return;
    event.preventDefault();
    showFullscreenImage(viewBtn.dataset.viewImage, viewBtn.dataset.viewAlt, viewBtn.dataset.viewCaption);
  });
  document.getElementById('navHome').addEventListener('click', () => navigate('home'));
  document.getElementById('menuBtn')?.addEventListener('click', () => document.getElementById('drawerNav')?.classList.toggle('open'));
  registerServiceWorker();
  applyAudioSettings();
  render();
  startWorldEventHeartbeat();
}

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return [key, await response.json()];
  }));
  return Object.fromEntries(entries);
}

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function navigate(screen) {
  if (screen === 'game' && !state.gameStarted) screen = 'setup';
  state.screen = screen;
  document.getElementById('drawerNav')?.classList.remove('open');
  save();
  render();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function setActiveNav() {
  document.querySelectorAll('.nav-btn, .bottom-btn').forEach(b => {
    const isScreenActive = b.dataset.view && b.dataset.view === state.screen;
    const isEndGameActive = b.hasAttribute('data-end-game') && (state.screen === 'finalTally' || state.screen === 'end');
    b.classList.toggle('active', !!(isScreenActive || isEndGameActive));
  });
  const drawerGameBtn = document.getElementById('drawerGameBtn');
  if (drawerGameBtn) drawerGameBtn.textContent = state.gameStarted ? 'Resume Game' : 'New Game';
  document.querySelectorAll('[data-end-game]').forEach(btn => {
    btn.disabled = !state.gameStarted;
    btn.setAttribute('aria-disabled', state.gameStarted ? 'false' : 'true');
    btn.title = state.gameStarted ? 'Wrap up the current game' : 'Start a game before ending it';
  });
}

function reopenDrawerAfterOverlay(returnTarget) {
  render();
  if (returnTarget === 'drawer') document.getElementById('drawerNav')?.classList.add('open');
}

function beginEndGame() {
  if (!state.gameStarted) return;
  document.getElementById('drawerNav')?.classList.remove('open');
  navigate('finalTally');
}

function installCreditsSupportButton() {
  const drawer = document.getElementById('drawerNav')?.querySelector('.drawer-nav-card');
  if (!drawer || drawer.querySelector('[data-open-credits-support]')) return;
  const divider = document.createElement('div');
  divider.className = 'drawer-nav-divider';
  divider.setAttribute('aria-hidden', 'true');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-btn credits-support-nav-btn';
  button.dataset.openCreditsSupport = 'true';
  button.textContent = 'About';
  drawer.appendChild(divider);
  drawer.appendChild(button);
}

function showCreditsSupportDialog() {
  const supportUrl = KOFI_SUPPORT_URL;
  currentDialogEvent = null;
  document.getElementById('dialogType').textContent = 'Western Legends Companion';
  document.getElementById('dialogTitle').textContent = 'About';
  document.getElementById('dialogText').innerHTML = `<div class="credits-support-copy">
    <p><strong>Frontier Director</strong> is an unofficial fan-made companion that adds dynamic events, story encounters, setup guidance, quick references, and table-side helpers to Western Legends.</p>
    <p>Created and developed by Randy Dykstra for the Western Legends community.</p>
    <p>If it has earned a place at your table, a small tip helps support continued development and future frontier tales.</p>
    <p class="credits-disclaimer">Western Legends and its related expansions belong to their respective owners. This fan project is not affiliated with or endorsed by the publisher.</p>
  </div>
  <div class="about-version-section">${renderVersionBlock()}</div>`;
  const reward = document.getElementById('dialogReward');
  reward.innerHTML = '';
  reward.classList.add('hidden');
  document.getElementById('dialogReplayVoice').classList.add('hidden');
  document.getElementById('dialogPlayerAssign').classList.add('hidden');
  const wrap = document.getElementById('dialogButtons');
  wrap.innerHTML = '';
  const supportBtn = document.createElement('button');
  supportBtn.type = 'button';
  supportBtn.className = 'primary-btn support-project-btn';
  supportBtn.textContent = 'Support This Project';
  supportBtn.onclick = () => window.open(supportUrl, '_blank', 'noopener,noreferrer');
  wrap.appendChild(supportBtn);
  wireVersionBlock();
  document.getElementById('drawerNav')?.classList.remove('open');
  if (!dialog.open) dialog.showModal();
}

function hasModule(moduleId) {
  normalizeSetupModules();
  if (state.setup.modules.includes(moduleId)) return true;
  const canonical = MODULE_ALIASES[moduleId];
  return !!canonical && state.setup.modules.includes(canonical);
}
function hasAllModules(modules = []) { return modules.every(m => hasModule(m)); }
function hasTags(tags = []) { return tags.every(t => state.worldTags.includes(t)); }
function lacksTags(tags = []) { return tags.every(t => !state.worldTags.includes(t)); }
function addTag(tag) { if (tag && !state.worldTags.includes(tag)) state.worldTags.push(tag); }
function logNote(text) { if (text) state.newspaperNotes.push({ time: Date.now(), text }); }

// --- Arc/storyline progress tracking -----------------------------------
// One record per arc/storyline id, persisted for the whole game (never
// reset except at game start). This is the single source of truth for
// "has this chapter already happened" - independent of whether it's
// currently sitting in state.activeStories.
function getArcProgress(arcId) {
  if (!state.arcProgress) state.arcProgress = {};
  if (!state.arcProgress[arcId]) {
    state.arcProgress[arcId] = {
      completedNodeIds: [],
      assignedColor: null,
      lastOutcome: null,
      status: 'inactive',
      scope: 'personal'
    };
  }
  return state.arcProgress[arcId];
}

function markArcNodeStarted(arcId, assignedColor = null, scope = 'personal') {
  if (!arcId) return;
  const progress = getArcProgress(arcId);
  if (progress.status === 'inactive') progress.status = 'in_progress';
  progress.scope = scope || progress.scope || 'personal';
  if (assignedColor && !progress.assignedColor && progress.scope === 'personal') progress.assignedColor = assignedColor;
}

// Permanently retires a node so it can never be selected again, records the
// outcome, and locks in the arc's assignedColor the first time one is set
// (later chapters compare the *current* triggering player against this).
function markArcNodeCompleted(arcId, nodeId, outcome, assignedColor) {
  if (!arcId || !nodeId) return;
  const progress = getArcProgress(arcId);
  if (!progress.completedNodeIds.includes(nodeId)) progress.completedNodeIds.push(nodeId);
  progress.lastOutcome = outcome;
  if (assignedColor && !progress.assignedColor) progress.assignedColor = assignedColor;
  if (progress.status === 'inactive') progress.status = 'in_progress';
  const stillEligible = allArcNodes().some(n => {
    if (n.arcId !== arcId || progress.completedNodeIds.includes(n.id)) return false;
    if (!hasAllModules(n.requiredModules || [])) return false;
    if (!hasTags(n.requiresWorldTags || [])) return false;
    if (!lacksTags(n.requiresWorldTagsAbsent || [])) return false;
    return true;
  });
  if (!stillEligible) progress.status = 'complete';
}

// --- Virtual Story Point track --------------------------------------------
// Mirrors the physical 4-space circular Story Point track: each player
// color has its own marker at position 0-3. Landing on 1/2/3 tells that
// player to do something physically (move the Sheriff, spawn Bandits, or
// choose a point to gain); landing back on 0 is just the quiet reset lap.
function ensurePlayerTrackState(color) {
  if (!color) return;
  if (!state.storyTrack) state.storyTrack = {};
  if (!(color in state.storyTrack)) state.storyTrack[color] = 0;
  if (!state.playerCounters) state.playerCounters = {};
  if (!state.playerCounters[color]) state.playerCounters[color] = { gamblingPoints: 0, legendaryPoints: 0, marshalPoints: 0, wantedPoints: 0 };
}

const STORY_TRACK_SPACES = [
  { id: 'start', title: 'Start' },
  { id: 'sheriff', title: 'Move the Sheriff', screenText: 'Move the Sheriff up to 3 spaces.' },
  { id: 'bandits', title: 'Spawn Bandits', screenText: 'Spawn Bandits at Hideout A, B, or C.' },
  { id: 'choose', title: 'Choose a Point', screenText: 'Choose one to gain: Gambling Point, Legendary Point, Marshal Point, or Wanted Point.' }
];

function gainStoryPoint(color, onDone) {
  if (!color) { onDone?.(); return; }
  ensurePlayerTrackState(color);
  const next = (state.storyTrack[color] + 1) % STORY_TRACK_SPACES.length;
  state.storyTrack[color] = next;
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyTrackAdvance', color, space: STORY_TRACK_SPACES[next].id });
  save();
  if (next !== 0) enqueueStoryTrackNotification(color, next, onDone);
  else onDone?.();
}

function ensureStoryTrackNotificationLayer() {
  let layer = document.getElementById('storyTrackNotificationLayer');
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'storyTrackNotificationLayer';
  layer.className = 'story-track-notification-layer';
  layer.setAttribute('aria-live', 'polite');
  document.body.appendChild(layer);
  return layer;
}

function enqueueStoryTrackNotification(color, position, onDone) {
  storyTrackNotificationQueue.push({ color, position, onDone });
  showNextStoryTrackNotification();
}

function showNextStoryTrackNotification() {
  if (storyTrackNotificationActive || !storyTrackNotificationQueue.length) return;
  storyTrackNotificationActive = true;
  const item = storyTrackNotificationQueue.shift();
  const { color, position, onDone } = item;
  const space = STORY_TRACK_SPACES[position];
  const layer = ensureStoryTrackNotificationLayer();
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const displayName = player?.name?.trim() || player?.character?.trim() || `${color.charAt(0).toUpperCase()}${color.slice(1)} Player`;
  const dotClass = PLAYER_COLORS.includes(color) ? `swatch-${color}` : 'swatch-none';
  let closed = false;
  let autoDismissTimer = null;

  const closeNotification = () => {
    if (closed) return;
    closed = true;
    if (autoDismissTimer) clearTimeout(autoDismissTimer);

    // This is only a reminder. The player resolves the physical choice at the
    // table, so the companion does not ask which Hideout or point was chosen.
    // After the fourth Story Track reward, return the virtual marker to Start.
    if (space.id === 'choose') {
      ensurePlayerTrackState(color);
      state.storyTrack[color] = 0;
      save();
    }

    layer.innerHTML = '';
    storyTrackNotificationActive = false;
    try { onDone?.(); } finally { setTimeout(showNextStoryTrackNotification, 0); }
  };

  layer.innerHTML = `<section class="story-track-notification" role="status" aria-label="Story Point reminder" tabindex="0">
    <div class="story-track-notification-accent ${dotClass}" aria-hidden="true"></div>
    <div class="story-track-notification-copy">
      <div class="story-track-notification-kicker"><span class="story-track-notification-dot ${dotClass}" aria-hidden="true"></span>${escapeHtml(displayName)} · Story Point</div>
      <div class="story-track-notification-line"><strong>${escapeHtml(space.title)}</strong><span>${escapeHtml(space.screenText)}</span></div>
      <small>Tap to dismiss</small>
    </div>
    <button type="button" class="story-track-notification-close" aria-label="Dismiss Story Point reminder">×</button>
  </section>`;

  const card = layer.querySelector('.story-track-notification');
  card?.addEventListener('click', closeNotification);
  card?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeNotification();
    }
  });
  layer.querySelector('.story-track-notification-close')?.addEventListener('click', event => {
    event.stopPropagation();
    closeNotification();
  });

  // Informational reminders should never block the game indefinitely.
  autoDismissTimer = setTimeout(closeNotification, 6500);
}

function categoryName(category) { return (category || 'frontier').replaceAll('_', ' '); }

function normalizeSetupModules() {
  if (!state.setup.modules || !Array.isArray(state.setup.modules)) state.setup.modules = ['base'];
  // Migrate older module ids into the reorganized setup model while keeping
  // the original ids harmlessly readable through hasModule aliases.
  const migrated = new Set(state.setup.modules);
  Object.entries(MODULE_ALIASES).forEach(([legacyId, canonicalId]) => {
    if (migrated.has(legacyId)) migrated.add(canonicalId);
  });
  migrated.add('base');
  migrated.add('base_core');
  // Any selected child means that expansion is in use. Keep the parent id in
  // state so expansion-level characters/items/Legendary Items stay available.
  MODULES.forEach(group => {
    if ((group.modules || []).some(child => migrated.has(child.id))) migrated.add(group.id);
  });
  if (migrated.has('base_goals')) migrated.add('base_legendary_tokens');
  if (migrated.has('wild_bunch_unique_events')) {
    migrated.add('wild_bunch');
    migrated.add('ante_up');
    migrated.add('ante_up_events');
  }
  state.setup.modules = Array.from(migrated);
  state.setup.activeModules = Object.fromEntries(state.setup.modules.map(id => [id, true]));
}

function setupBackdropClose(containerEl, cardSelector, onClose) {
  if (!containerEl) return;

  // Track where the pointer started and close only when the pointer begins
  // outside the visible card - avoids accidentally closing on a text-selection
  // drag that starts inside the card but releases outside it.
  let pointerStartedOnBackdrop = false;

  const isBackdropEvent = event => {
    const card = containerEl.querySelector(cardSelector);
    if (!card) return event.target === containerEl;
    const rect = card.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };

  containerEl.addEventListener('pointerdown', event => {
    pointerStartedOnBackdrop = isBackdropEvent(event);
  });

  containerEl.addEventListener('click', event => {
    if (event.target === containerEl || (pointerStartedOnBackdrop && isBackdropEvent(event))) {
      onClose();
      pointerStartedOnBackdrop = false;
    }
  });
}

function setupDialogBackdropClose(dialogEl) {
  if (!dialogEl) return;
  setupBackdropClose(dialogEl, '.dialog-card', () => dialogEl.close());
}

function normalizePlayers() {
  // IMPORTANT: this function is called very frequently (often more than once
  // per user action, including from inside helpers like selectedPlayerColors
  // that run in the middle of a color-cycle mutation). It must fix up the
  // array/objects IN PLACE rather than replacing them with new objects, or
  // any code holding a reference to an existing player object (e.g.
  // cyclePlayerColor) will end up mutating an orphaned copy that never
  // makes it back into state.
  if (!state.setup.playerDetails || !Array.isArray(state.setup.playerDetails)) state.setup.playerDetails = [];
  if (!state.setup.playerDetails.length && Array.isArray(state.setup.playerColors) && state.setup.playerColors.length) {
    state.setup.playerDetails = state.setup.playerColors.map(color => ({ name: '', character: '', color }));
  }
  if (!state.setup.playerDetails.length) state.setup.playerDetails.push({ name: '', character: '', color: PLAYER_COLORS[0] });
  if (state.setup.playerDetails.length > 6) state.setup.playerDetails.length = 6;
  state.setup.playerDetails.forEach(player => {
    if (typeof player.name !== 'string') player.name = '';
    if (typeof player.character !== 'string') player.character = '';
    if (typeof player.color !== 'string') player.color = '';
  });
  state.setup.players = state.setup.playerDetails.length;
  state.setup.playerColors = state.setup.playerDetails.map(p => p.color).filter(Boolean);
}

function selectedPlayerColors(exceptIndex = -1) {
  normalizePlayers();
  return new Set(state.setup.playerDetails.map((p, index) => index === exceptIndex ? null : p.color).filter(Boolean));
}

function nextAvailablePlayerColor(currentColor, playerIndex) {
  const used = selectedPlayerColors(playerIndex);
  const current = currentColor || NULL_PLAYER_COLOR;
  let startIndex = PLAYER_COLOR_OPTIONS.indexOf(current);
  if (startIndex < 0) startIndex = PLAYER_COLOR_OPTIONS.length - 1;
  for (let i = 1; i <= PLAYER_COLOR_OPTIONS.length; i++) {
    const candidate = PLAYER_COLOR_OPTIONS[(startIndex + i) % PLAYER_COLOR_OPTIONS.length];
    if (candidate === NULL_PLAYER_COLOR || !used.has(candidate)) return candidate || null;
  }
  return null;
}

function readPlayerFieldsFromSetupUI() {
  if (!state?.setup?.playerDetails) return;
  state.setup.playerDetails.forEach((player, index) => {
    const nameEl = document.getElementById(`playerName_${index}`);
    const charEl = document.getElementById(`playerCharacter_${index}`);
    if (nameEl) player.name = nameEl.value.trim();
    if (charEl) player.character = charEl.value.trim();
  });
}

function updateStartGameButtonState() {
  const btn = document.getElementById('beginGame');
  if (!btn) return;

  const players = state.setup.playerDetails || [];
  const allPlayersHaveColors =
      players.length > 0 && players.every(player => !!player.color);

  btn.disabled = !allPlayersHaveColors;
}

function refreshPlayerSetupRows() {
  const rows = document.getElementById('playerSetupRows');
  if (!rows) return;

  rows.innerHTML = renderPlayerSetupRows();
  bindSetupPlayerInputs();
  updateStartGameButtonState();
}

function cyclePlayerColor(playerIndex) {
  normalizePlayers();
  readPlayerFieldsFromSetupUI();
  const player = state.setup.playerDetails[playerIndex];
  if (!player) return;
  player.color = nextAvailablePlayerColor(player.color, playerIndex);
  state.setup.playerColors = state.setup.playerDetails.map(p => p.color).filter(Boolean);
  save();
  refreshPlayerSetupRows();
}

function handleSetupPlayerButtonClick(event) {
  const colorBtn = event.target.closest('[data-cycle-player-color]');
  if (colorBtn) {
    event.preventDefault();
    event.stopPropagation();
    cyclePlayerColor(Number(colorBtn.dataset.cyclePlayerColor));
    return true;
  }

  const removeBtn = event.target.closest('[data-remove-player]');
  if (removeBtn) {
    event.preventDefault();
    event.stopPropagation();
    removeSetupPlayer(Number(removeBtn.dataset.removePlayer));
    return true;
  }

  const clearBtn = event.target.closest('[data-clear-character]');
  if (clearBtn) {
    event.preventDefault();
    event.stopPropagation();
    clearSetupCharacter(Number(clearBtn.dataset.clearCharacter));
    return true;
  }

  return false;
}

function addSetupPlayer() {
  updateSetupFromUI(false);
  if (state.setup.playerDetails.length >= 6) return;
  const color = nextAvailablePlayerColor('', -1) || '';
  state.setup.playerDetails.push({ name: '', character: '', color });
  state.setup.players = state.setup.playerDetails.length;
  save();
refreshPlayerSetupRows()
}

function removeSetupPlayer(playerIndex) {
  updateSetupFromUI(false);
  if (state.setup.playerDetails.length <= 1) return;
  state.setup.playerDetails.splice(playerIndex, 1);
  state.setup.players = state.setup.playerDetails.length;
  state.setup.playerColors = state.setup.playerDetails.map(p => p.color).filter(Boolean);
  save();
refreshPlayerSetupRows()
}

function clearSetupCharacter(playerIndex) {
  updateSetupFromUI(false);
  const player = state.setup.playerDetails[playerIndex];
  if (!player) return;
  player.character = '';
  save();
refreshPlayerSetupRows()
}

function updateStartGameDisabled() {
  normalizePlayers();
  const btn = document.getElementById('beginGame');
  if (!btn) return;
  const everyPlayerHasColor = state.setup.playerDetails.length > 0 && state.setup.playerDetails.every(p => !!p.color);
  btn.disabled = !everyPlayerHasColor;
  btn.title = everyPlayerHasColor ? '' : 'Assign a color to every player before starting.';
}

function isSetupReadyToStart() {
  normalizePlayers();
  return state.setup.playerDetails.length > 0 && state.setup.playerDetails.every(p => !!p.color);
}

function updateSetupFromUI(rerender = false) {
  normalizeStoryEventSettings();
  const previousWorldSettings = { ...state.setup.storyOptions.world };
  const targetDisplay = document.getElementById('targetLPValue');
  const useStoryTrackEl = document.getElementById('useStoryTrack');
  if (targetDisplay) state.setup.targetLP = Math.max(1, Number(targetDisplay.dataset.value || targetDisplay.textContent || 20));
  if (useStoryTrackEl) state.setup.useStoryTrack = useStoryTrackEl.checked;

  ['oneOff', 'arcs', 'world'].forEach(key => {
    const enabledEl = document.getElementById(`storyEnabled_${key}`);
    if (enabledEl) state.setup.storyOptions[key].enabled = enabledEl.checked;
    const frequencySelect = document.querySelector(`[data-story-frequency-select="${key}"]`);
    if (frequencySelect) state.setup.storyOptions[key].frequency = frequencySelect.value;
  });

  normalizePlayers();
  state.setup.playerDetails.forEach((player, index) => {
    const nameEl = document.getElementById(`playerName_${index}`);
    const charEl = document.getElementById(`playerCharacter_${index}`);
    if (nameEl) player.name = nameEl.value.trim();
    if (charEl) player.character = charEl.value.trim();
  });
  state.setup.players = state.setup.playerDetails.length;
  state.setup.playerColors = state.setup.playerDetails.map(p => p.color).filter(Boolean);

  if (document.querySelector('.module-group-checkbox, .module-child-checkbox')) {
    state.setup.modules = selectedModuleIdsFromSetupUI();
    state.setup.activeModules = Object.fromEntries(state.setup.modules.map(id => [id, true]));
    reconcileSelectedCharactersWithModules();
    syncExpansionCheckboxStates();
  }

  // If World Event settings are changed while a saved game already exists,
  // immediately rebuild the clock from the newly selected frequency. Without
  // this, a clock created under an older Rare/Standard setting could continue
  // running even after the UI was changed to Frequent.
  const currentWorldSettings = state.setup.storyOptions.world;
  if (state.gameStarted && (
    previousWorldSettings.enabled !== currentWorldSettings.enabled ||
    previousWorldSettings.frequency !== currentWorldSettings.frequency
  )) {
    state.worldEventClock = { nextAt: null, pendingEventId: null };
    if (currentWorldSettings.enabled) scheduleNextWorldEvent(true);
  }

  renderSetupNotes();
  updateStartGameDisabled();
  save();
  if (rerender) {
    const rows = document.getElementById('playerSetupRows');
    if (rows) rows.innerHTML = renderPlayerSetupRows();
    bindSetupPlayerInputs();
  }
}

function renderPlayerSetupRows() {
  normalizePlayers();
  const availableCharacters = availableCharactersForSetup();
  const selectedCharacters = new Set(state.setup.playerDetails.map(p => p.character).filter(Boolean));
  const rows = state.setup.playerDetails.map((player, index) => {
    const colorClass = player.color ? `swatch-${player.color}` : 'swatch-none';
    const selectedOthers = new Set([...selectedCharacters].filter(name => name !== player.character));
    const characterOptions = [''].concat(availableCharacters.filter(name => !selectedOthers.has(name) || name === player.character));
    const canRemove = state.setup.playerDetails.length > 1;
    return `<div class="player-setup-row">
      <button type="button" class="player-color-swatch ${colorClass}" data-cycle-player-color="${index}" onclick="cyclePlayerColor(${index})" title="Tap to cycle color" aria-label="Cycle Player ${index + 1} color"></button>
      <input id="playerName_${index}" class="player-setup-input" value="${escapeHtml(player.name || '')}" placeholder="Name" autocomplete="off" aria-label="Player ${index + 1} name">
      <select id="playerCharacter_${index}" class="player-setup-input player-character-select" aria-label="Player ${index + 1} character">
        ${characterOptions.map(name => `<option value="${escapeHtml(name)}" ${player.character === name ? 'selected' : ''}>${name ? escapeHtml(name) : 'Character'}</option>`).join('')}
      </select>
      <button type="button" class="player-remove-btn" data-remove-player="${index}" ${canRemove ? '' : 'disabled'} aria-label="Remove Player ${index + 1}">${TRASH_ICON_SVG}</button>
    </div>`;
  }).join('');
  const manInBlackRow = hasModule('wild_bunch_man_in_black') ? `<div class="player-setup-row man-in-black-setup-row" aria-label="Man In Black automated player">
    <span class="player-color-swatch swatch-man-in-black" aria-hidden="true"></span>
    <strong class="man-in-black-setup-label">Man In Black</strong>
  </div>` : '';
  const goalsNote = hasModule('base_goals') ? `<p class="player-goals-note"><strong>Goals:</strong> after choosing each character, take that character's 4 Goal cards.</p>` : '';
  const addButton = state.setup.playerDetails.length < 6 ? `<button type="button" class="secondary-btn add-player-btn" id="addPlayerBtn">Add Player</button>` : '';
  return rows + manInBlackRow + addButton + goalsNote;
}

function playerLabel(color) {
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  return player?.name ? `${player.name} (${color})` : `${color} player`;
}

function moduleChildIds(group) {
  return (group.modules || []).map(m => m.id);
}

function isModuleSelected(id) {
  normalizeSetupModules();
  return state.setup.modules.includes(id);
}

function selectedModuleIdsFromSetupUI() {
  const ids = new Set(['base', 'base_core']);
  app.querySelectorAll('.module-group-checkbox:checked').forEach(input => ids.add(input.value));
  app.querySelectorAll('.module-child-checkbox:checked').forEach(input => {
    ids.add(input.value);
    if (input.dataset.parent) ids.add(input.dataset.parent);
  });
  // Goals use the Legendary Token side of the player mat, so that dependency
  // is automatic and cannot drift out of sync.
  if (ids.has('base_goals')) ids.add('base_legendary_tokens');
  // Unique Events are inserted into the Ante Up Event deck.
  if (ids.has('wild_bunch_unique_events')) {
    ids.add('wild_bunch');
    ids.add('ante_up');
    ids.add('ante_up_events');
  }
  return Array.from(ids);
}

function syncExpansionCheckboxStates() {
  MODULES.forEach(group => {
    const parent = app.querySelector(`.module-group-checkbox[data-group="${group.id}"]`);
    const children = Array.from(app.querySelectorAll(`.module-child-checkbox[data-parent="${group.id}"]`));

    // First restore child checkboxes from state/dependencies. Required children
    // remain checked even though the user cannot toggle them directly.
    children.forEach(child => {
      child.checked = child.disabled || isModuleSelected(child.value);
    });

    if (!parent) return;

    if (group.locked) {
      // Base Game is required, so its parent checkbox always remains visibly
      // checked even though optional Base modules may be individually toggled.
      parent.checked = true;
      parent.indeterminate = false;
    } else if (children.length) {
      // Standard tri-state behavior for an expansion with child modules:
      //   all children checked  -> checked
      //   some children checked -> indeterminate
      //   no children checked   -> unchecked
      const checkedCount = children.filter(child => child.checked).length;
      parent.checked = checkedCount === children.length;
      parent.indeterminate = checkedCount > 0 && checkedCount < children.length;
    } else {
      // Expansions with no child modules (for example The Good, the Bad, and
      // the Handsome) remain simple two-state expansion checkboxes.
      parent.checked = isModuleSelected(group.id);
      parent.indeterminate = false;
    }

    children.forEach(child => {
      child.closest('.module-child')?.classList.toggle(
        'parent-inactive',
        !parent.checked && !parent.indeterminate && !child.disabled
      );
    });
  });
}

function weightedPick(items, weightFn = item => item.baseWeight || item.weight || 1) {
  const weighted = items.map(item => ({ item, weight: Math.max(0, weightFn(item)) })).filter(x => x.weight > 0);
  const total = weighted.reduce((sum, x) => sum + x.weight, 0);
  if (!total) return null;
  let roll = Math.random() * total;
  for (const x of weighted) { roll -= x.weight; if (roll <= 0) return x.item; }
  return weighted.at(-1).item;
}

function eligibleTriggers() {
  return db.triggers.filter(t =>
    hasAllModules(t.requiredModules || []) &&
    !state.activeTriggers.some(a => a.id === t.id) &&
    (t.canRepeat !== false || !state.seenTriggerIds.includes(t.id))
  );
}

function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }

// Maps a trigger's `category` to which side of the wanted/marshal tug-of-war
// it belongs on. In this data set the categories are "outlaw" (wanted-point
// actions) and "law" (marshal-point actions) rather than the literal words
// "wanted"/"marshal" - category is checked first since it's the unambiguous,
// intentional classification. Tags are only consulted as a fallback for
// triggers with no matching category (e.g. future custom triggers), and even
// then marshal is checked first because some law-category triggers (like
// arresting a wanted player) legitimately carry a "wanted" tag describing
// their *target* without themselves being a wanted-generating action.
const WANTED_CATEGORY_VALUES = ['outlaw', 'wanted'];
const MARSHAL_CATEGORY_VALUES = ['law', 'marshal'];

function triggerBalanceBucket(trigger) {
  if (WANTED_CATEGORY_VALUES.includes(trigger.category)) return 'wanted';
  if (MARSHAL_CATEGORY_VALUES.includes(trigger.category)) return 'marshal';
  const tags = trigger.tags || [];
  if (tags.includes('marshal')) return 'marshal';
  if (tags.includes('wanted')) return 'wanted';
  return 'neutral';
}

// Self-balancing pressure: the more WANTED-flavored triggers have actually
// fired recently, the less likely another one is to appear and the more
// likely a MARSHAL-flavored one is (marshals need to respond). Once marshal
// activity has caught up and overtaken, pressure flips back toward neutral,
// everyday triggers (things have calmed down) - and if marshal presence
// stays high without wanted activity, wanted triggers get a slight bump
// back too, since a quiet town with idle marshals invites more trouble.
const WANTED_MARSHAL_WINDOW = 10;
const WANTED_MARSHAL_STRENGTH = 0.14;

function categoryBalanceFactor(trigger) {
  const recent = state.triggeredLog.slice(0, WANTED_MARSHAL_WINDOW);
  const wantedRecent = recent.filter(t => triggerBalanceBucket(t) === 'wanted').length;
  const marshalRecent = recent.filter(t => triggerBalanceBucket(t) === 'marshal').length;
  const net = wantedRecent - marshalRecent; // >0: wanted has been running hot; <0: marshals are dominant

  const bucket = triggerBalanceBucket(trigger);
  if (bucket === 'wanted') return clamp(1 - net * WANTED_MARSHAL_STRENGTH, 0.3, 1.8);
  if (bucket === 'marshal') return clamp(1 + net * (WANTED_MARSHAL_STRENGTH + 0.06), 0.3, 2.6);

  // Neutral trigger: gets a bump when marshals have recently been dominant
  // (the frontier calms down and everyone goes back to prospecting, etc.).
  const marshalLead = Math.max(0, -net);
  return clamp(1 + marshalLead * 0.09, 1, 2);
}

// Which primary-trigger ids would unlock the *next* chapter of an arc whose
// prerequisites (tags/modules/counters) are already satisfied - these get a
// strong weight boost so the story actually keeps moving instead of just
// sitting there waiting on a random draw.
function pendingArcTriggerBoosts() {
  if (!storyEventsEnabled('arcs')) return new Set();
  const activeIds = state.activeStories.map(s => s.id);
  const boosts = new Set();
  allArcNodes().forEach(n => {
    if (!n.trigger) return; // counter-gated nodes aren't delivered via a primary trigger tap
    if (activeIds.includes(n.id)) return;
    const progress = getArcProgress(n.arcId);
    if (progress.status !== 'in_progress') return;
    if (progress.completedNodeIds.includes(n.id)) return;
    if (!hasAllModules(n.requiredModules || [])) return;
    if (!hasTags(n.requiresWorldTags || [])) return;
    if (!lacksTags(n.requiresWorldTagsAbsent || [])) return;
    boosts.add(n.trigger);
  });
  return boosts;
}

// How many of the most-recently-tapped trigger ids to check this trigger
// against before considering it "too soon to repeat" - configurable per
// trigger via cooldownAfterSeen, defaulting to 2 if not specified.
// How many most-recently-tapped trigger ids to remember, sized to comfortably
// cover whichever trigger has the largest cooldownAfterSeen so none of them
// get forgotten before their cooldown window has actually elapsed.
function recentTriggerHistoryLength() {
  const maxCooldown = (db.triggers || []).reduce((max, t) => Math.max(max, Number.isFinite(t.cooldownAfterSeen) ? t.cooldownAfterSeen : 2), 2);
  return Math.max(8, maxCooldown + 2);
}

function triggerRecentlySeen(trigger) {
  const window = Number.isFinite(trigger.cooldownAfterSeen) ? trigger.cooldownAfterSeen : 2;
  if (window <= 0) return false;
  return state.recentTriggerIds.slice(0, window).includes(trigger.id);
}

function triggerWeight(trigger, pendingBoosts = pendingArcTriggerBoosts()) {
  let weight = trigger.baseWeight || 1;
  if (triggerRecentlySeen(trigger)) weight *= 0.25;
  const tagMatch = trigger.tags?.some(t => state.worldTags.includes(t));
  if (tagMatch) weight += 2;
  if (state.activeStories.some(s => s.trigger === trigger.id)) weight += 5;
  if (pendingBoosts.has(trigger.id)) weight += 8;
  weight *= categoryBalanceFactor(trigger);
  return Math.max(0.05, weight);
}

function refillTriggers() {
  const pendingBoosts = pendingArcTriggerBoosts();
  while (state.activeTriggers.length < (db.settings.primaryTriggerSlots || 3)) {
    const pick = weightedPick(eligibleTriggers(), t => triggerWeight(t, pendingBoosts));
    if (!pick) break;
    state.activeTriggers.push({ ...pick, dealtAt: Date.now() });
    state.seenTriggerIds.push(pick.id);
  }
}

function startGameFromSetup() {
  updateSetupFromUI(false);
  if (!isSetupReadyToStart()) {
    alert('Assign a color to every player before starting.');
    updateStartGameDisabled();
    return;
  }
  state.gameStarted = true;
  state.screen = 'game';
  state.activeTriggers = [];
  state.activeStories = [];
  state.activeWorldEvents = [];
  state.worldTags = [];
  state.counters = {};
  state.triggeredLog = [];
  state.newspaperNotes = [];
  state.finalScores = {};
  state.finalWinnerColor = null;
  state.finalWinnerColors = [];
  state.recentTriggerIds = [];
  state.arcProgress = {};
  state.storyTrack = {};
  state.playerCounters = {};
  state.worldEventClock = { nextAt: null, pendingEventId: null };
  state.setup.setupProgress = [];
  state.setup.setupGuideSection = 0;
  state.setup.setupPanel = 'modules';
  setupStepProgress = new Set();
  state.fightDeck = shuffleArray(FIGHT_RANKS);
  (state.setup.playerColors || []).filter(Boolean).forEach(color => ensurePlayerTrackState(color));
  refillTriggers();
  scheduleNextWorldEvent(true);
  save();
  playMusic();
  render();
}

function isStoryTrackEnabled() { return state.setup?.useStoryTrack !== false; }

function eventFrequencyChance(kind) {
  const frequency = storyEventFrequency(kind === 'oneOff' ? 'oneOff' : 'arcs');
  const configKey = kind === 'oneOff' ? 'oneOffChance' : 'arcStartChance';
  const configured = db?.settings?.storyEvents?.frequency?.[configKey]?.[frequency];
  if (Number.isFinite(configured)) return configured;
  const fallback = kind === 'oneOff'
    ? { rare: 0.15, standard: 0.35, frequent: 0.75 }
    : { rare: 0.08, standard: 0.20, frequent: 0.50 };
  return fallback[frequency] ?? fallback.standard;
}

function worldEventWindowMinutes() {
  const frequency = storyEventFrequency('world');
  const configured = db?.settings?.storyEvents?.frequency?.worldEventMinutes?.[frequency];
  if (configured && Number.isFinite(configured.min) && Number.isFinite(configured.max)) return configured;
  return {
    rare: { min: 30, max: 45 },
    standard: { min: 15, max: 25 },
    frequent: { min: 5, max: 8 }
  }[frequency] || { min: 15, max: 25 };
}

function scheduleNextWorldEvent(force = false) {
  normalizeStoryEventSettings();
  if (!state.gameStarted || !storyEventsEnabled('world')) {
    state.worldEventClock = { nextAt: null, pendingEventId: null };
    return;
  }
  if (!state.worldEventClock) state.worldEventClock = { nextAt: null, pendingEventId: null };
  if (!force && (state.worldEventClock.nextAt || state.worldEventClock.pendingEventId || state.activeWorldEvents?.length)) return;
  const windowMinutes = worldEventWindowMinutes();
  const minutes = windowMinutes.min + Math.random() * Math.max(0, windowMinutes.max - windowMinutes.min);
  state.worldEventClock.nextAt = Date.now() + Math.round(minutes * 60 * 1000);
  state.worldEventClock.pendingEventId = null;
  console.info(`[World Events] ${storyEventFrequency('world')} frequency: next event scheduled in ${minutes.toFixed(1)} minutes (${new Date(state.worldEventClock.nextAt).toLocaleTimeString()}).`);
}

function ensureWorldEventClock() {
  normalizeStoryEventSettings();
  if (!state.gameStarted || !storyEventsEnabled('world')) {
    if (state.worldEventClock) {
      state.worldEventClock.nextAt = null;
      state.worldEventClock.pendingEventId = null;
    }
    return;
  }
  if (!state.worldEventClock) state.worldEventClock = { nextAt: null, pendingEventId: null };

  // A saved v1.1.13 game may already have a clock scheduled using the older
  // 8-14 minute Frequent window (or an even slower previous setting). If the
  // existing future time is now outside the selected frequency's maximum,
  // rebuild it so upgrading the app immediately honors the current choice.
  if (state.worldEventClock.nextAt && !state.worldEventClock.pendingEventId && !state.activeWorldEvents?.length) {
    const maxDelayMs = worldEventWindowMinutes().max * 60 * 1000;
    if (state.worldEventClock.nextAt - Date.now() > maxDelayMs) {
      scheduleNextWorldEvent(true);
      return;
    }
  }
  scheduleNextWorldEvent(false);
}

function queueDueWorldEvent() {
  ensureWorldEventClock();
  if (!state.gameStarted || !storyEventsEnabled('world')) return false;
  if (state.activeWorldEvents?.length || state.worldEventClock?.pendingEventId) return false;
  if (!state.worldEventClock?.nextAt || Date.now() < state.worldEventClock.nextAt) return false;
  const event = pickWorldEvent();
  if (!event) {
    // Nothing is currently eligible (usually because of module/tag filters).
    // Try again shortly rather than silently losing the elapsed event window.
    state.worldEventClock.nextAt = Date.now() + 60 * 1000;
    console.warn('[World Events] Timer elapsed, but no World Event is currently eligible. Retrying in 1 minute.');
    save();
    return false;
  }
  state.worldEventClock.pendingEventId = event.id;
  state.worldEventClock.nextAt = null;
  console.info(`[World Events] Timer elapsed. Queued: ${event.title || event.id}.`);
  save();
  return true;
}

function maybePresentPendingWorldEvent() {
  if (!state.gameStarted || state.screen !== 'game') return;
  if (dialog.open || assistDialog.open || storyTrackNotificationActive) return;
  const eventId = state.worldEventClock?.pendingEventId;
  if (!eventId) return;
  const event = db.worldEvents.find(item => item.id === eventId);
  state.worldEventClock.pendingEventId = null;
  if (!event) {
    scheduleNextWorldEvent(true);
    save();
    return;
  }
  console.info(`[World Events] Presenting: ${event.title || event.id}.`);
  handleCreatedEvent(event, 'worldEvent', null);
  save();
}

function checkWorldEventClock() {
  if (!state?.gameStarted || !storyEventsEnabled('world')) return;
  const queued = queueDueWorldEvent();
  if (queued) save();
  maybePresentPendingWorldEvent();
}

function startWorldEventHeartbeat() {
  if (worldEventHeartbeatTimer) clearInterval(worldEventHeartbeatTimer);

  // The timestamp in state remains the source of truth. This heartbeat only
  // notices when that timestamp has elapsed, so browser throttling/sleep does
  // not reset or extend the World Event clock.
  worldEventHeartbeatTimer = setInterval(checkWorldEventClock, 15 * 1000);

  // Browsers heavily throttle background tabs. Re-check immediately whenever
  // the app becomes visible/focused so an overdue event surfaces right away.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkWorldEventClock();
  });
  window.addEventListener('focus', checkWorldEventClock);
  setTimeout(checkWorldEventClock, 500);
}

function finishPrimaryTriggerNarrative(trigger, triggeringColor) {
  maybeCreateTriggerEvent(trigger, triggeringColor);
  queueDueWorldEvent();
  save();
  render();
  setTimeout(maybePresentPendingWorldEvent, 30);
}

function tapPrimaryTrigger(triggerId, triggeringColor = null) {
  const trigger = state.activeTriggers.find(t => t.id === triggerId);
  if (!trigger) return;
  state.activeTriggers = state.activeTriggers.filter(t => t.id !== triggerId);
  state.recentTriggerIds.unshift(triggerId);
  state.recentTriggerIds = state.recentTriggerIds.slice(0, recentTriggerHistoryLength());
  if (triggeringColor) ensurePlayerTrackState(triggeringColor);
  state.triggeredLog.unshift({ time: Date.now(), type: 'primaryTrigger', id: trigger.id, label: trigger.label, category: trigger.category, tags: trigger.tags || [], color: triggeringColor || null });
  state.triggeredLog = state.triggeredLog.slice(0, 200);
  tickStoryExpirations();
  tickWorldExpirations();
  refillTriggers();
  save();
  render();

  if (!isStoryTrackEnabled()) {
    finishPrimaryTriggerNarrative(trigger, triggeringColor);
    return;
  }

  // Story Point rewards use their own compact notification layer. The real
  // narrative event (if any) waits until that reminder/choice is complete.
  gainStoryPoint(triggeringColor, () => finishPrimaryTriggerNarrative(trigger, triggeringColor));
}

function deliverArcEvent(event, triggeringColor) {
  if (!event) return false;
  const scope = event.arcScope || 'personal';
  if (scope === 'personal' && !triggeringColor) {
    promptForPlayerColor('Who Is This Happening To?', event.title || 'Story Arc', 'Choose the player whose story this is.', color => {
      handleCreatedEvent(event, 'characterArc', color);
      save();
    });
    return true;
  }
  handleCreatedEvent(event, 'characterArc', triggeringColor);
  return true;
}

function maybeCreateTriggerEvent(trigger, triggeringColor = null) {
  // 1) Once an arc exists, the matching future action advances it
  // deterministically instead of competing in another random roll.
  if (storyEventsEnabled('arcs')) {
    const continuation = pickArmedArcNode(trigger.id, triggeringColor);
    if (continuation) return deliverArcEvent(continuation, triggeringColor);

    // 2) Frequency controls STARTING a new arc, not continuing one.
    if (Math.random() < eventFrequencyChance('arcs')) {
      const starter = pickNewArcNode(trigger.id, triggeringColor);
      if (starter) return deliverArcEvent(starter, triggeringColor);
    }
  }

  // 3) One-offs are independent short encounters tied to the reported action.
  if (storyEventsEnabled('oneOff') && Math.random() < eventFrequencyChance('oneOff')) {
    const oneOff = pickOneOff(trigger.id);
    if (oneOff) {
      handleCreatedEvent(oneOff, 'oneOff', triggeringColor);
      return true;
    }
  }
  return false;
}

function pickOneOff(triggerId) {
  const pool = db.oneOffs.filter(e => e.trigger === triggerId && hasAllModules(e.requiredModules || []) && hasTags(e.requiresWorldTags || []) && lacksTags(e.requiresWorldTagsAbsent || []));
  return weightedPick(pool);
}

function allArcNodes() {
  const nodes = [];
  for (const arc of db.arcs) {
    (arc.nodes || []).forEach((node, index) => nodes.push({
      ...node,
      arcId: arc.id,
      arcTitle: arc.title,
      arcScope: arc.scope || 'personal',
      arcIndex: index,
      arcStartTrigger: arc.startTrigger || arc.nodes?.[0]?.trigger,
      baseWeight: node.baseWeight || arc.baseWeight || 5
    }));
  }
  for (const story of db.storylines) {
    if (!hasAllModules(story.requiredModules || [])) continue;
    (story.chapters || []).forEach((chapter, index) => nodes.push({
      ...chapter,
      arcId: story.id,
      arcTitle: story.title,
      arcScope: story.scope || 'global',
      arcIndex: index,
      arcStartTrigger: story.startTrigger || story.chapters?.[0]?.trigger,
      baseWeight: chapter.baseWeight || story.baseWeight || 5
    }));
  }
  return nodes;
}

function arcNodeEligible(n, triggerId = null) {
  const activeIds = state.activeStories.map(s => s.id);
  if (triggerId && n.trigger !== triggerId) return false;
  if (activeIds.includes(n.id)) return false;
  if (getArcProgress(n.arcId).completedNodeIds.includes(n.id)) return false;
  if (!hasAllModules(n.requiredModules || [])) return false;
  if (!hasTags(n.requiresWorldTags || [])) return false;
  if (!lacksTags(n.requiresWorldTagsAbsent || [])) return false;
  return true;
}

function pickArmedArcNode(triggerId, triggeringColor = null) {
  const pool = allArcNodes().filter(n => {
    if (!arcNodeEligible(n, triggerId)) return false;
    const progress = getArcProgress(n.arcId);
    if (progress.status !== 'in_progress') return false;
    if (n.arcScope === 'personal' && progress.assignedColor && triggeringColor !== progress.assignedColor) return false;
    return true;
  });
  // Branch prerequisites normally leave only one valid continuation. Weighted
  // selection is kept as a safe fallback for global storylines with parallel paths.
  return weightedPick(pool);
}

function pickNewArcNode(triggerId, triggeringColor = null) {
  const activeLimit = db.settings.activeStoryLimit || 5;
  const pool = allArcNodes().filter(n => {
    if (!arcNodeEligible(n, triggerId)) return false;
    const progress = getArcProgress(n.arcId);
    if (progress.status !== 'inactive') return false;
    if (n.arcIndex !== 0) return false;
    if ((n.type === 'storyTrigger' || !n.type) && state.activeStories.length >= activeLimit) return false;
    return true;
  });
  return weightedPick(pool);
}

// Backwards-compatible helper used by a few older code paths. Prefer an armed
// continuation, then an eligible opener.
function pickArcNode(triggerId, triggeringColor = null) {
  return pickArmedArcNode(triggerId, triggeringColor) || pickNewArcNode(triggerId, triggeringColor);
}

// Counter-gated chapters are consequences of an already-started storyline.
// They do not randomly begin a new arc and they obey the Story Arcs switch.
function checkCounterGatedNodes() {
  if (!storyEventsEnabled('arcs')) return false;
  const pool = allArcNodes().filter(n => {
    if (!n.requiresCounters?.length) return false;
    if (!arcNodeEligible(n)) return false;
    const progress = getArcProgress(n.arcId);
    if (progress.status !== 'in_progress') return false;
    return n.requiresCounters.every(c => (state.counters[c.counter] || 0) >= c.gte);
  });
  const pick = weightedPick(pool);
  if (!pick) return false;
  handleCreatedEvent(pick, 'characterArc', getArcProgress(pick.arcId).assignedColor || null);
  return true;
}

function pickWorldEvent() {
  const activeIds = state.activeWorldEvents.map(w => w.id);
  const pool = db.worldEvents.filter(w => !activeIds.includes(w.id) && hasAllModules(w.requiredModules || []) && hasTags(w.requiresWorldTags || []) && lacksTags(w.requiresWorldTagsAbsent || []));
  return weightedPick(pool);
}

function startWorldEventById(eventId) {
  if (state.activeWorldEvents.some(w => w.id === eventId)) return;
  const event = db.worldEvents.find(w => w.id === eventId);
  if (!event) return;
  state.activeWorldEvents.unshift({ ...event, turnsLeft: getDuration(event), createdAt: Date.now() });
}

// event.type === 'storyTrigger' is a TASK: a player needs to go do something
// at the table before it resolves or expires, so it lives in activeStories
// until the player taps Resolved/Ignored. Everything else that comes out of
// an arc/storyline (instantEvent, or a chapter typed as worldEvent) resolves
// immediately - narration + effects fire right away and the node is retired
// on the spot, since there's no ongoing task to track.
function handleCreatedEvent(event, type, triggeringColor = null) {
  event._deliveryType = type;
  if (triggeringColor) event._assignedColor = triggeringColor;
  const isTask = event.type === 'storyTrigger' || (type === 'characterArc' && !event.type);
  if (isTask) {
    const story = {
      id: event.id,
      arcId: event.arcId,
      arcTitle: event.arcTitle,
      title: event.title,
      trigger: event.trigger,
      screenText: event.screenText,
      rewardText: event.rewardText || '',
      audioFile: event.audioFile,
      turnsLeft: event.expiresAfterPrimaryTriggers || db.settings.defaultStoryExpirationPrimaryTriggers || 6,
      assignedColor: triggeringColor || '',
      onResolved: event.onResolved || [],
      onExpired: event.onExpired || [],
      createdAt: Date.now()
    };
    state.activeStories.unshift(story);
    state.activeStories = state.activeStories.slice(0, db.settings.activeStoryLimit || 5);
    markArcNodeStarted(event.arcId, triggeringColor, event.arcScope || 'personal');
  } else if (event.type === 'worldEvent' && type === 'worldEvent') {
    state.activeWorldEvents.unshift({ ...event, turnsLeft: getDuration(event), createdAt: Date.now() });
    if (state.worldEventClock) {
      state.worldEventClock.pendingEventId = null;
      state.worldEventClock.nextAt = null;
    }
  } else if (event.arcId) {
    // instantEvent, or a storyline chapter typed as its own worldEvent - one-shot.
    markArcNodeStarted(event.arcId, triggeringColor, event.arcScope || 'personal');
    applyEffects(event.effects || [], { arcId: event.arcId, currentColor: triggeringColor });
    markArcNodeCompleted(event.arcId, event.id, 'resolved', triggeringColor);
  }
  showEventDialog(event);
}

function getDuration(event) {
  const durationEffect = event.effects?.find(e => e.type === 'duration_primary_triggers');
  return durationEffect?.count || event.durationPrimaryTriggers || 5;
}

function tickStoryExpirations() {
  const expired = [];
  state.activeStories = state.activeStories.map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter(s => {
    if (s.turnsLeft <= 0) { expired.push(s); return false; }
    return true;
  });
  expired.forEach(s => {
    applyEffects(s.onExpired || [], { arcId: s.arcId, currentColor: s.assignedColor });
    markArcNodeCompleted(s.arcId, s.id, 'expired', s.assignedColor);
    state.triggeredLog.unshift({ time: Date.now(), type: 'storyExpired', id: s.id, label: s.title });
  });
}

function tickWorldExpirations() {
  const hadWorldEvents = state.activeWorldEvents.length > 0;
  state.activeWorldEvents = state.activeWorldEvents.map(w => ({ ...w, turnsLeft: w.turnsLeft - 1 })).filter(w => w.turnsLeft > 0);
  if (hadWorldEvents && !state.activeWorldEvents.length) scheduleNextWorldEvent(true);
}

function resolveStory(storyId) {
  const story = state.activeStories.find(s => s.id === storyId);
  if (!story) return;
  applyEffects(story.onResolved || [], { arcId: story.arcId, currentColor: story.assignedColor });
  markArcNodeCompleted(story.arcId, story.id, 'resolved', story.assignedColor);
  state.activeStories = state.activeStories.filter(s => s.id !== storyId);
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyResolved', id: story.id, label: story.title });

  const afterStoryPoint = () => {
    const openedCounterChapter = checkCounterGatedNodes();
    queueDueWorldEvent();
    save();
    render();
    if (!openedCounterChapter) setTimeout(maybePresentPendingWorldEvent, 30);
  };
  if (isStoryTrackEnabled() && story.assignedColor) gainStoryPoint(story.assignedColor, afterStoryPoint);
  else afterStoryPoint();
}

function expireStory(storyId) {
  const story = state.activeStories.find(s => s.id === storyId);
  if (!story) return;
  applyEffects(story.onExpired || [], { arcId: story.arcId, currentColor: story.assignedColor });
  markArcNodeCompleted(story.arcId, story.id, 'expired', story.assignedColor);
  state.activeStories = state.activeStories.filter(s => s.id !== storyId);
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyExpired', id: story.id, label: story.title });
  const openedCounterChapter = checkCounterGatedNodes();
  queueDueWorldEvent();
  save();
  render();
  if (!openedCounterChapter) setTimeout(maybePresentPendingWorldEvent, 30);
}

// `context.arcId` / `context.currentColor` let effects branch on whether the
// player resolving THIS chapter is the same player the arc originally
// locked onto back at its first chapter - e.g. "if this is the same player
// who abandoned the prospector, spawn 2 bandits instead of 1."
function applyEffects(effects = [], context = {}) {
  for (const e of effects) {
    if (e.type === 'addWorldTag') addTag(e.tag);
    else if (e.type === 'incrementCounter') { state.counters[e.counter] = (state.counters[e.counter] || 0) + (e.amount || 1); }
    else if (e.type === 'newspaperNote' || e.type === 'log_event') logNote(e.text || e.id);
    else if (e.type === 'start_world_event') startWorldEventById(e.eventId);
    else if (e.type === 'gain_story_point') { if (context.currentColor) gainStoryPoint(context.currentColor); }
    else if (e.type === 'reset_story_track') { if (context.currentColor) { ensurePlayerTrackState(context.currentColor); state.storyTrack[context.currentColor] = 0; } }
    else if (e.type === 'gainPlayerCounter') {
      if (context.currentColor) {
        ensurePlayerTrackState(context.currentColor);
        state.playerCounters[context.currentColor][e.counter] = (state.playerCounters[context.currentColor][e.counter] || 0) + (e.amount || 1);
      }
    }
    else if (e.type === 'if_same_color') {
      const arcColor = context.arcId ? getArcProgress(context.arcId).assignedColor : null;
      const isSame = !!(arcColor && context.currentColor && arcColor === context.currentColor);
      applyEffects((isSame ? e.then : e.else) || [], context);
    }
  }
}

// Every primary trigger tap now asks who triggered it first - this feeds
// the story-track marker, per-player stat totals, and richer end-game
// article data, instead of only asking sometimes deep inside an event
// dialog that might not even fire.
// Generic "who did this?" color prompt, reused for tapping a primary
// trigger and for resolving a world effect that requires one.
function promptForPlayerColor(dialogTypeLabel, titleText, subText, onChosen) {
  const colors = (state.setup.playerColors || []).filter(Boolean);
  if (!colors.length) { onChosen(null); return; }
  currentDialogEvent = null;
  document.getElementById('dialogType').textContent = dialogTypeLabel;
  document.getElementById('dialogTitle').textContent = titleText;
  document.getElementById('dialogText').textContent = subText;
  const reward = document.getElementById('dialogReward');
  reward.innerHTML = '';
  reward.classList.add('hidden');
  document.getElementById('dialogReplayVoice').classList.add('hidden');
  const assignWrap = document.getElementById('dialogPlayerAssign');
  assignWrap.innerHTML = '';
  assignWrap.classList.add('hidden');
  const wrap = document.getElementById('dialogButtons');
  wrap.innerHTML = '';
  wrap.classList.add('trigger-color-prompt-buttons');
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'player-color player-choice trigger-color-prompt-btn';
    btn.style.background = color;
    btn.title = playerLabel(color);
    btn.setAttribute('aria-label', playerLabel(color));
    btn.onclick = () => { wrap.classList.remove('trigger-color-prompt-buttons'); dialog.close(); onChosen(color); };
    wrap.appendChild(btn);
  });
  const skip = document.createElement('button');
  skip.type = 'button'; skip.className = 'secondary-btn'; skip.textContent = 'Skip';
  skip.onclick = () => { wrap.classList.remove('trigger-color-prompt-buttons'); dialog.close(); onChosen(null); };
  wrap.appendChild(skip);
  if (!dialog.open) dialog.showModal();
}

function promptTriggerColor(triggerId) {
  const trigger = state.activeTriggers.find(t => t.id === triggerId);
  if (!trigger) return;
  promptForPlayerColor('Who Triggered This?', trigger.label, 'Tap the player who just did this.', color => tapPrimaryTrigger(triggerId, color));
}

function promptResolveWorldEvent(eventId) {
  const event = state.activeWorldEvents.find(w => w.id === eventId);
  if (!event) return;
  promptForPlayerColor('Who Resolved This?', event.title, 'Tap the player who resolved this.', color => resolveWorldEvent(eventId, color));
}

function resolveWorldEvent(eventId, color) {
  const event = state.activeWorldEvents.find(w => w.id === eventId);
  if (!event) return;
  applyEffects(event.onResolved || [], { currentColor: color });
  state.activeWorldEvents = state.activeWorldEvents.filter(w => w.id !== eventId);
  state.triggeredLog.unshift({ time: Date.now(), type: 'worldEventResolved', id: event.id, label: event.title, color: color || null });
  scheduleNextWorldEvent(true);
  const finish = () => {
    save();
    render();
  };
  if (isStoryTrackEnabled() && color) gainStoryPoint(color, finish);
  else finish();
}

function showEventDialog(event) {
  currentDialogEvent = event;
  document.getElementById('dialogType').textContent = event._deliveryType === 'worldEvent' ? 'World Event' : event.arcTitle || 'Frontier Event';
  document.getElementById('dialogTitle').textContent = event.title || 'Frontier Event';
  document.getElementById('dialogText').textContent = event.screenText || 'Resolve the event as instructed.';
  const reward = document.getElementById('dialogReward');
  reward.innerHTML = event.rewardText ? `<strong>Reward:</strong> ${event.rewardText}` : renderEffects(event.effects || []);
  reward.classList.toggle('hidden', !reward.innerHTML.trim());
  const replayBtn = document.getElementById('dialogReplayVoice');
  if (event.audioFile) {
    replayBtn.classList.remove('hidden');
    replayBtn.onclick = () => playVoice(event.audioFile);
  } else {
    replayBtn.classList.add('hidden');
  }
  document.getElementById('dialogPlayerAssign').classList.add('hidden');
  renderDialogButtons(event);
  playVoice(event.audioFile);
  if (!dialog.open) dialog.showModal();
}

function renderDialogButtons(event) {
  const wrap = document.getElementById('dialogButtons');
  wrap.innerHTML = '';
  const buttons = event.resultButtons?.length ? event.resultButtons : [{ label: 'Dismiss' }];
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'primary-btn'; btn.textContent = typeof b === 'string' ? b : b.label;
    btn.onclick = () => {
      if (typeof b === 'object') applyEffects(b.effects || [], { arcId: event.arcId, currentColor: event._assignedColor });
      const active = state.activeStories.find(s => s.id === event.id);
      if (active && event._assignedColor) active.assignedColor = event._assignedColor;
      save();
      dialog.close();
      render();
      setTimeout(maybePresentPendingWorldEvent, 30);
    };
    wrap.appendChild(btn);
  });
}

function renderEffects(effects) {
  if (!effects.length) return '<strong>Effect:</strong> Follow the instructions above.';
  return '<strong>Effect:</strong><ul>' + effects.map(e => `<li>${effectToText(e)}</li>`).join('') + '</ul>';
}
function effectToText(e) {
  const map = {
    spawn_bandits_current_space: `Place ${e.count || 1} Bandit(s) in the current space.`,
    simultaneous_npc_fight: `Fight ${e.count || 1} ${e.npc || 'NPC'}(s) simultaneously.`,
    prospecting_bonus_die: `Roll ${e.count || 1} additional Prospecting Die.`,
    addWorldTag: `World tag: ${e.tag}`,
    duration_primary_triggers: `Lasts ${e.count} primary triggers.`,
    start_world_event: `Starts the "${e.eventId}" world event.`,
    if_same_color: `Different outcome if the same player is involved again.`,
    gain_story_point: `The triggering player gains 1 Story Point.`,
    gainPlayerCounter: `The triggering player gains 1 ${e.counter || 'point'}.`,
    reset_story_track: `Returns the Story Point marker to Start.`,
    gain_money: `Gain $${e.amount || 0}.`,
    draw_poker: `Draw ${e.count || 1} Poker Card${(e.count || 1) === 1 ? '' : 's'}.`,
    gain_wound: `Gain ${e.count || 1} wound${(e.count || 1) === 1 ? '' : 's'}.`,
    gain_lp: `Gain ${e.amount || 1} LP.`,
    gain_legendary_token: `Gain ${e.count || 1} Legendary Token${(e.count || 1) === 1 ? '' : 's'}.`,
    npc_draws: `NPC draws ${e.cards || 1} Fight Card${(e.cards || 1) === 1 ? '' : 's'}${e.use ? `; use ${e.use}` : ''}.`,
    choice: `Choose one of the listed outcomes.`,
    choose_one: `Choose one of the listed outcomes.`
  };
  return map[e.type] || e.type?.replaceAll('_', ' ') || 'Resolve listed effect';
}

function render() {
  setActiveNav();
  refillTriggers();
  if (state.screen === 'home') return renderHome();
  if (state.screen === 'setup') return renderSetup();
  if (state.screen === 'game') return renderGame();
  if (state.screen === 'end') return renderEndGame();
  if (state.screen === 'finalTally') return renderFinalTally();
}

function renderHome() {
  const isActiveGame = !!state.gameStarted;
  const players = Array.isArray(state.setup?.playerDetails) ? state.setup.playerDetails : [];
  const playerCount = players.length || Number(state.setup?.players || 0);
  const targetLP = Number(state.setup?.targetLP || 20);
  normalizeStoryEventSettings();
  const enabledStoryTypes = ['oneOff', 'arcs', 'world'].filter(key => storyEventsEnabled(key));
  const storySummary = enabledStoryTypes.length === 3 &&
    enabledStoryTypes.every(key => storyEventFrequency(key) === 'standard')
      ? 'Standard Stories'
      : enabledStoryTypes.length === 0
        ? 'Stories Off'
        : 'Custom Stories';
  const storyCount = Array.isArray(state.activeStories) ? state.activeStories.length : 0;
  const worldCount = Array.isArray(state.activeWorldEvents) ? state.activeWorldEvents.length : 0;

  const playerChips = players.map((player, index) => {
    const name = player?.name?.trim() || player?.character?.trim() || `Player ${index + 1}`;
    const color = PLAYER_COLORS.includes(player?.color) ? player.color : 'none';
    const character = player?.character?.trim();
    const title = character && character !== name ? `${name} — ${character}` : name;
    return `<span class="home-player-chip" title="${escapeHtml(title)}"><span class="home-player-dot swatch-${color}" aria-hidden="true"></span><span>${escapeHtml(name)}</span></span>`;
  }).join('');

  const activityParts = [];
  if (storyCount) activityParts.push(`${storyCount} active stor${storyCount === 1 ? 'y' : 'ies'}`);
  if (worldCount) activityParts.push(`${worldCount} world effect${worldCount === 1 ? '' : 's'}`);
  const activityText = activityParts.length ? activityParts.join(' · ') : 'The frontier is quiet... for now.';

  app.innerHTML = `<section class="hero home-hero ${isActiveGame ? 'has-active-game' : 'no-active-game'}">
    <div class="home-launcher">
      <div class="home-status-card">
        <div class="home-divider" aria-hidden="true"><span>★</span></div>

        ${isActiveGame ? `
          <p class="home-kicker">The Trail Continues</p>
          ${playerChips ? `<div class="home-player-chips" aria-label="Players in the current game">${playerChips}</div>` : ''}
          <div class="home-game-facts" aria-label="Current game summary">
            <span>${playerCount} Player${playerCount === 1 ? '' : 's'}</span>
            <span>${targetLP} LP</span>
            <span>${escapeHtml(storySummary)}</span>
          </div>
          <p class="home-context-line"><span aria-hidden="true">✦</span>${escapeHtml(activityText)}</p>
          <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary" id="resumeBtn">
            <span class="home-btn-mark" aria-hidden="true">◆</span>
            <span class="home-btn-label">Continue Game</span>
            <span class="home-btn-arrow" aria-hidden="true">›</span>
          </button>` : `
          <p class="home-kicker">Your Legend Awaits</p>
          <p class="home-subtitle">Gather your posse and make your mark on the frontier.</p>`}
      </div>

      <div class="actions home-actions">
        ${isActiveGame ? `
          <button class="secondary-btn home-major-btn home-leather-btn home-leather-btn-secondary" id="newGameBtn">
            <span class="home-btn-mark" aria-hidden="true">◇</span>
            <span class="home-btn-label">Start New Game</span>
            <span class="home-btn-arrow" aria-hidden="true">›</span>
          </button>` : `
          <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary" id="newGameBtn">
            <span class="home-btn-mark" aria-hidden="true">◆</span>
            <span class="home-btn-label">Start New Game</span>
            <span class="home-btn-arrow" aria-hidden="true">›</span>
          </button>`}
      </div>
    </div>
  </section>`;

  document.getElementById('newGameBtn')?.addEventListener('click', () => navigate('setup'));
  document.getElementById('resumeBtn')?.addEventListener('click', () => navigate('game'));
}

function renderStoryEventSetting(key, title, description) {
  normalizeStoryEventSettings();
  const cfg = state.setup.storyOptions[key];
  return `<div class="story-event-setting ${cfg.enabled ? '' : 'disabled'}" data-story-setting="${key}" title="${escapeHtml(description)}">
    <strong class="story-event-setting-title">${escapeHtml(title)}</strong>
    <label class="mini-switch" aria-label="${escapeHtml(title)} enabled">
      <input type="checkbox" id="storyEnabled_${key}" ${cfg.enabled ? 'checked' : ''}>
      <span></span>
    </label>
    <select class="story-frequency-select" data-story-frequency-select="${key}" aria-label="${escapeHtml(title)} frequency" ${cfg.enabled ? '' : 'disabled'}>
      ${STORY_FREQUENCY_OPTIONS.map(option => `<option value="${option.value}" ${cfg.frequency === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
    </select>
  </div>`;
}

function renderSetup() {
  normalizeSetupModules();
  normalizePlayers();
  normalizeStoryEventSettings();
  setupStepProgress = new Set(state.setup.setupProgress || []);
  const currentSetupPanel = state.setup.setupPanel || 'modules';
  app.innerHTML = `<div class="modal-screen-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card setup-card">
      <button type="button" class="dialog-close-x" data-modal-close aria-label="Close">&#10005;</button>

      <div class="setup-header">
        <div class="modal-title-header setup-title-block">
          <p class="eyebrow">Game Setup</p>
          <h1 class="section-title setup-title">New Game</h1>
        </div>
        <div class="setup-trail" role="tablist" aria-label="Setup steps">
          <button type="button" class="trail-stop ${currentSetupPanel === 'modules' ? 'active' : ''}" data-panel="modules" role="tab" aria-selected="${currentSetupPanel === 'modules' ? 'true' : 'false'}"><span class="badge">1</span><span class="trail-label">Modules</span></button>
          <button type="button" class="trail-stop ${currentSetupPanel === 'basics' ? 'active' : ''}" data-panel="basics" role="tab" aria-selected="${currentSetupPanel === 'basics' ? 'true' : 'false'}"><span class="badge">2</span><span class="trail-label">Basics</span></button>
          <button type="button" class="trail-stop ${currentSetupPanel === 'setup' ? 'active' : ''}" data-panel="setup" role="tab" aria-selected="${currentSetupPanel === 'setup' ? 'true' : 'false'}"><span class="badge">3</span><span class="trail-label">Setup</span></button>
        </div>
      </div>

      <div class="setup-content">

        <div class="setup-panel ${currentSetupPanel === 'modules' ? 'show' : ''}" id="panel-modules">
          <div class="module-groups">${MODULES.map(renderModuleGroup).join('')}</div>
        </div>

        <div class="setup-panel ${currentSetupPanel === 'basics' ? 'show' : ''}" id="panel-basics">
          <details class="options-card" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.9H22l-5.8 4.2 2.2 7-6.4-4.4L5.6 20l2.2-7L2 8.9h7.6z"/></svg>
              <span class="options-card-title">Victory Conditions</span>
              <span class="options-card-caret">⌄</span>
            </summary>
            <div class="options-card-body">
              <div class="lp-row">
                <button type="button" class="lp-step-btn" id="lpMinus" aria-label="Decrease target LP">−</button>
                <span id="targetLPValue" class="target-lp-value" data-value="${state.setup.targetLP}">${state.setup.targetLP}</span>
                <button type="button" class="lp-step-btn" id="lpPlus" aria-label="Increase target LP">+</button>
              </div>
              <p class="lp-caption">Target Legend Points to win the game</p>
            </div>
          </details>

          <details class="options-card story-events-options" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/></svg>
              <span class="options-card-title">Story &amp; Events</span>
              <span class="options-card-caret">⌄</span>
            </summary>
            <div class="options-card-body">
              <label class="toggle-row check-row story-track-setting">
                <div class="toggle-text"><span class="t-title">Track Story Points</span><span class="t-sub">Track each player's Story Track and show compact reward reminders.</span></div>
                <input type="checkbox" id="useStoryTrack" class="check-input">
              </label>
              <div class="story-event-settings">
                ${renderStoryEventSetting('oneOff', 'One-Off Events', 'Short encounters caused by actions during the game.')}
                ${renderStoryEventSetting('arcs', 'Character Arcs', 'Multi-part stories that remember earlier player choices and actions.')}
                ${renderStoryEventSetting('world', 'World Events', 'Occasional frontier-wide events that arrive independently over time.')}
              </div>
            </div>
          </details>

          <details class="options-card" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.6"/><path d="M15.5 14a4.6 4.6 0 0 1 5.5 4.4"/></svg>
              <span class="options-card-title">Players</span>
              <span class="options-card-caret">⌄</span>
            </summary>
            <div class="options-card-body">
              <div class="player-setup-list" id="playerSetupRows">${renderPlayerSetupRows()}</div>
            </div>
          </details>
        </div>

        <div class="setup-panel ${currentSetupPanel === 'setup' ? 'show' : ''}" id="panel-setup">
          <div id="setupNotes"></div>
        </div>

      </div>

      <div class="dialog-actions setup-final-actions-centered">
        <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary setup-start-game-btn" id="beginGame">
          <span class="home-btn-mark" aria-hidden="true">◆</span>
          <span class="home-btn-label">Start Game</span>
          <span class="home-btn-arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  </div>`;

  document.getElementById('useStoryTrack').checked = state.setup.useStoryTrack !== false;

  // --- trail step navigation ---
  const trailStops = Array.from(app.querySelectorAll('.trail-stop'));
  trailStops.forEach((stop, index) => {
    stop.addEventListener('click', () => {
      trailStops.forEach((s, i) => {
        s.classList.toggle('active', s === stop);
        s.classList.toggle('done', i < index);
        s.setAttribute('aria-selected', s === stop ? 'true' : 'false');
      });
      app.querySelectorAll('.setup-panel').forEach(p => p.classList.toggle('show', p.id === `panel-${stop.dataset.panel}`));
      state.setup.setupPanel = stop.dataset.panel;
      save();
      app.querySelector('.setup-content').scrollTop = 0;
    });
  });

  // --- independent story/event toggles + compact frequency dropdowns ---
  app.querySelectorAll('[id^="storyEnabled_"]').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const card = toggle.closest('[data-story-setting]');
      const frequencySelect = card?.querySelector('.story-frequency-select');
      card?.classList.toggle('disabled', !toggle.checked);
      if (frequencySelect) frequencySelect.disabled = !toggle.checked;
      updateSetupFromUI(false);
    });
  });
  app.querySelectorAll('.story-frequency-select').forEach(select => {
    select.addEventListener('change', () => updateSetupFromUI(false));
  });

  const updateTarget = amount => {
    const el = document.getElementById('targetLPValue');
    const next = Math.max(1, Math.min(99, Number(el.dataset.value || el.textContent || 20) + amount));
    el.dataset.value = String(next);
    el.textContent = String(next);
    updateSetupFromUI(false);
  };
  document.getElementById('useStoryTrack').addEventListener('change', () => updateSetupFromUI(false));
  document.getElementById('lpMinus').onclick = () => updateTarget(-1);
  document.getElementById('lpPlus').onclick = () => updateTarget(1);
  app.querySelectorAll('.module-group-checkbox').forEach(parent => {
    parent.addEventListener('click', event => event.stopPropagation());
    parent.addEventListener('change', () => {
      const groupId = parent.dataset.group;
      const children = Array.from(app.querySelectorAll(`.module-child-checkbox[data-parent="${groupId}"]`));

      // Expansion checkboxes control all child modules. Because a partial
      // parent is rendered as checked=false + indeterminate=true, clicking it
      // follows native checkbox behavior and changes it to checked=true; that
      // means the same code below turns a partial expansion back to fully on.
      // Clicking a fully checked expansion changes it to false and clears all
      // optional child modules.
      if (children.length) {
        children.forEach(child => {
          if (!child.disabled) child.checked = parent.checked;
        });
      }

      updateSetupFromUI(true);
    });
  });
  app.querySelectorAll('.module-group-header-content').forEach(header => {
    header.addEventListener('click', () => {
      const groupEl = header.closest('.module-group');
      if (!groupEl) return;
      if (groupEl.classList.contains('has-children')) {
        groupEl.classList.toggle('expanded');
        return;
      }
      const input = groupEl.querySelector('.module-group-checkbox');
      if (input && !input.disabled) {
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
  app.querySelectorAll('.module-child').forEach(row => {
    row.addEventListener('click', event => {
      const input = row.querySelector('.module-child-checkbox');
      if (!input || input.disabled) return;
      if (event.target === input) return;
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  app.querySelectorAll('.module-child-checkbox').forEach(child => child.addEventListener('change', () => {
    // updateSetupFromUI() saves the selected children, then
    // syncExpansionCheckboxStates() derives the parent checkbox's checked /
    // indeterminate state from those children.
    updateSetupFromUI(true);
  }));
  app.querySelector('#playerSetupRows')?.addEventListener('click', handleSetupPlayerButtonClick);
  bindSetupPlayerInputs();
  document.getElementById('beginGame').onclick = () => { updateSetupFromUI(false); startGameFromSetup(); };
  document.querySelector('[data-modal-close]').onclick = () => navigate('home');
  document.querySelector('[data-modal-backdrop]').addEventListener('click', event => {
    if (event.target.hasAttribute('data-modal-backdrop')) navigate('home');
  });
  syncExpansionCheckboxStates();
  renderSetupNotes();
  updateStartGameDisabled();
}

function bindSetupPlayerInputs() {
  app.querySelectorAll('.player-setup-input').forEach(el => el.addEventListener('change', () => updateSetupFromUI(el.classList.contains('player-character-select'))));
  app.querySelectorAll('[data-cycle-player-color]').forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      cyclePlayerColor(Number(btn.dataset.cyclePlayerColor));
    };
  });
  app.querySelectorAll('[data-remove-player]').forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      removeSetupPlayer(Number(btn.dataset.removePlayer));
    };
  });
  app.querySelectorAll('[data-clear-character]').forEach(btn => {
    btn.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      clearSetupCharacter(Number(btn.dataset.clearCharacter));
    };
  });
  document.getElementById('addPlayerBtn')?.addEventListener('click', addSetupPlayer);
  updateStartGameDisabled();
}

const REQUIRED_CHIP = `<span class="lock-pill" title="Required"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z"/></svg>Required</span>`;

function renderModuleGroup(group) {
  const children = group.modules || [];
  const parentChecked = group.locked || isModuleSelected(group.id);
  const checkbox = group.selectable === false ? '' : `<input class="module-group-checkbox check-input" type="checkbox" data-group="${group.id}" value="${group.id}" ${parentChecked ? 'checked' : ''} ${group.locked ? 'disabled' : ''} aria-label="Enable ${escapeHtml(group.name)}">`;
  return `<article class="module-group ${group.locked ? 'locked' : ''} ${group.selectable === false ? 'category-group' : ''} ${children.length ? 'has-children' : 'no-children'}">
    <div class="module-group-header">
      ${checkbox}
      <button type="button" class="module-group-header-content" aria-label="${children.length ? 'Expand' : 'Select'} ${escapeHtml(group.name)}">
        <span class="m-body"><strong>${group.name}${group.locked ? ' ' + REQUIRED_CHIP : ''}</strong><small>${group.detail}</small></span>
        ${children.length ? '<span class="module-caret" aria-hidden="true"></span>' : ''}
      </button>
    </div>
    ${children.length ? `<div class="module-children">${children.map(child => renderModuleChild(group, child)).join('')}</div>` : ''}
  </article>`;
}

function renderModuleChild(group, child) {
  // A required expansion (Base Game) does not make every optional module
  // inside it required. Only children explicitly marked locked stay fixed.
  const checked = child.locked || isModuleSelected(child.id);
  const isLocked = !!child.locked;
  const checkbox = `<input class="module-child-checkbox check-input" type="checkbox" data-parent="${group.id}" value="${child.id}" ${checked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} aria-label="Enable ${escapeHtml(child.name)}">`;
  return `<div class="module-child ${isLocked ? 'locked' : ''}">
    ${checkbox}
    <span class="m-body"><strong>${child.name}${isLocked ? ' ' + REQUIRED_CHIP : ''}</strong><small>${child.detail}</small></span>
  </div>`;
}

// Setup checklist progress is persisted with the pending game setup so a group
// can leave the setup screen and return without losing its place. It is cleared
// when the game actually starts.
let setupStepProgress = new Set();

// Small glyphs shown at the start of each setup step so a player can tell at
// a glance what kind of action it is without reading the full sentence.
// A data author can set an explicit `step.icon` (one of the keys below) to
// override the automatic guess; otherwise we infer it from the step's
// leading verb. Unrecognized/ambiguous text falls back to a plain bullet.
const SETUP_STEP_ICONS = {
  shuffle: '<path d="M3 6h4l3 4 3-4h5M3 18h4l3-4 3 4h5"/><path d="M17 4l3 2-3 2M17 16l3 2-3 2"/>',
  place: '<path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>',
  deal: '<rect x="4" y="6" width="9" height="13" rx="1.5" transform="rotate(-8 8.5 12.5)"/><rect x="11" y="5" width="9" height="13" rx="1.5"/>',
  assemble: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/>',
  choose: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  give: '<path d="M12 3v9M8.5 8.5 12 12l3.5-3.5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  remove: '<path d="M6 6l12 12M18 6L6 18"/>',
  reveal: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  attach: '<path d="M7 12.5l6-6a3.5 3.5 0 0 1 5 5l-7.5 7.5a2.1 2.1 0 0 1-3-3L14 9.5"/>',
  confirm: '<path d="M4 12l5 5L20 6"/>',
  generic: '<circle cx="12" cy="12" r="3"/>'
};
const SETUP_STEP_VERB_MAP = [
  [/^(shuffle)/i, 'shuffle'],
  [/^(place|put|position|set (the|it|them) (on|at|in)|lay)/i, 'place'],
  [/^(deal)/i, 'deal'],
  [/^(assemble|build|set up|construct)/i, 'assemble'],
  [/^(choose|select|pick|decide)/i, 'choose'],
  [/^(give|hand out|distribute|take)/i, 'give'],
  [/^(remove|discard|set aside|separate out)/i, 'remove'],
  [/^(reveal|draw|flip|turn over)/i, 'reveal'],
  [/^(attach|add|clip|connect)/i, 'attach'],
  [/^(confirm|check|press|verify)/i, 'confirm']
];
function inferStepIconKey(step) {
  if (step.icon && SETUP_STEP_ICONS[step.icon]) return step.icon;
  const text = String(step.text || '').trim();
  for (const [pattern, key] of SETUP_STEP_VERB_MAP) {
    if (pattern.test(text)) return key;
  }
  return 'generic';
}
function renderStepIcon(step) {
  const key = inferStepIconKey(step);
  return `<svg class="step-type-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SETUP_STEP_ICONS[key]}</svg>`;
}

function getVisibleSetupSections() {
  const setupSections = db.setupAssist?.sections || SETUP_SECTIONS;
  return setupSections.map(section => ({
    ...section,
    steps: (section.steps || []).filter(isSetupStepVisible)
  })).filter(section => section.steps.length);
}

function setupStepKey(section, stepIndex, step) {
  return `${section.title}::${stepIndex}::${step.text || ''}`.slice(0, 160);
}

function isSetupSectionComplete(section) {
  if (!section?.steps?.length) return false;
  return section.steps.every((step, stepIndex) => setupStepProgress.has(setupStepKey(section, stepIndex, step)));
}

function setupProgressStats(sections) {
  let total = 0;
  let done = 0;
  sections.forEach(section => section.steps.forEach((step, stepIndex) => {
    total += 1;
    if (setupStepProgress.has(setupStepKey(section, stepIndex, step))) done += 1;
  }));
  return { total, done };
}

function findModuleLabel(moduleId) {
  for (const group of MODULES) {
    if (group.id === moduleId) return group.name;
    const child = (group.modules || []).find(item => item.id === moduleId);
    if (child) return child.name;
  }
  const canonical = MODULE_ALIASES[moduleId];
  if (canonical && canonical !== moduleId) return findModuleLabel(canonical);
  return '';
}

function renderSetupStepBadges(step) {
  const ids = [...(step.requiredModules || []), ...(step.anyModules || [])]
    .map(id => MODULE_ALIASES[id] || id)
    .filter((id, index, list) => list.indexOf(id) === index)
    .filter(id => id !== 'base' && id !== 'base_core');
  if (!ids.length) return '';
  const labels = ids.map(findModuleLabel).filter(Boolean).slice(0, 2);
  return labels.length ? `<span class="setup-step-badges">${labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</span>` : '';
}

function renderReadySetupSummary() {
  const players = state.setup.playerDetails?.length || state.setup.players || 0;
  const selectedGroups = MODULES.filter(group => group.id === 'base' || state.setup.modules.includes(group.id))
    .filter(group => group.selectable !== false || (group.modules || []).some(child => state.setup.modules.includes(child.id)))
    .map(group => group.name);
  const storyTypes = [
    storyEventsEnabled('oneOff') ? 'One-Offs' : null,
    storyEventsEnabled('arcs') ? 'Story Arcs' : null,
    storyEventsEnabled('world') ? 'World Events' : null
  ].filter(Boolean);
  return `<div class="setup-ready-summary">
    <span><strong>${players}</strong> Player${players === 1 ? '' : 's'}</span>
    <span><strong>${Number(state.setup.targetLP || 20)}</strong> LP</span>
    <span>${escapeHtml(selectedGroups.join(' · '))}</span>
    <span>${storyTypes.length ? escapeHtml(storyTypes.join(' · ')) : 'Narrative events off'}</span>
  </div>`;
}

function renderSetupNotes() {
  normalizeSetupModules();
  normalizeStoryEventSettings();
  const wrap = document.getElementById('setupNotes');
  if (!wrap) return;
  setupStepProgress = new Set(state.setup.setupProgress || []);
  const visibleSections = getVisibleSetupSections();
  if (!visibleSections.length) {
    wrap.innerHTML = '<p class="hint">No setup steps are required for the current selection.</p>';
    return;
  }

  const mode = state.setup.setupGuideMode || 'guided';
  const stats = setupProgressStats(visibleSections);
  const firstIncomplete = visibleSections.findIndex(section => !isSetupSectionComplete(section));
  let currentIndex = Math.max(0, Math.min(visibleSections.length - 1, Number(state.setup.setupGuideSection) || 0));
  if (mode === 'guided' && firstIncomplete >= 0 && !Number.isFinite(Number(state.setup.setupGuideSection))) currentIndex = firstIncomplete;
  state.setup.setupGuideSection = currentIndex;

  const progressPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const allComplete = stats.total > 0 && stats.done === stats.total;

  wrap.innerHTML = `
    <section class="setup-guide-overview">
      <div class="setup-mode-switch" role="group" aria-label="Setup guide view">
        <button type="button" class="${mode === 'guided' ? 'active' : ''}" data-setup-mode="guided">Guided</button>
        <button type="button" class="${mode === 'checklist' ? 'active' : ''}" data-setup-mode="checklist">Checklist</button>
      </div>
      <div class="setup-progress-summary">
        <div>
          <strong>${allComplete ? 'Ready to Play' : `${stats.done} of ${stats.total} tasks complete`}</strong>
          <small>${allComplete ? 'The table is ready. Review anything you want, then start the game.' : mode === 'guided' ? `Step ${currentIndex + 1} of ${visibleSections.length} · ${escapeHtml(visibleSections[currentIndex].title)}` : 'Check items off in any order.'}</small>
        </div>
        <span>${progressPct}%</span>
      </div>
      <div class="setup-progress-bar" aria-label="${progressPct}% of setup complete"><span style="width:${progressPct}%"></span></div>
      ${allComplete ? renderReadySetupSummary() : ''}
    </section>
    ${mode === 'guided'
      ? renderGuidedSetup(visibleSections, currentIndex)
      : `<div class="setup-note-list checklist-view">${visibleSections.map((section, index) => renderSetupSection(section, index, firstIncomplete)).join('')}</div>`}
  `;
  bindSetupNoteInteractions(wrap, visibleSections);
}

function renderGuidedSetup(sections, currentIndex) {
  const current = sections[currentIndex];
  const currentComplete = isSetupSectionComplete(current);
  const rail = sections.map((section, index) => {
    const complete = isSetupSectionComplete(section);
    return `<button type="button" class="setup-section-stop ${index === currentIndex ? 'active' : ''} ${complete ? 'complete' : ''}" data-setup-section="${index}" title="${escapeHtml(section.title)}">
      <span>${complete ? '✓' : index + 1}</span><small>${escapeHtml(section.title)}</small>
    </button>`;
  }).join('');
  return `<div class="guided-setup">
    <div class="setup-section-rail" aria-label="Setup sections">${rail}</div>
    <article class="setup-guide-current ${currentComplete ? 'complete' : ''}">
      <header class="setup-guide-current-head">
        <span class="step-number">${currentComplete ? '✓' : currentIndex + 1}</span>
        <div>
          <p class="eyebrow">Setup Step ${currentIndex + 1}</p>
          <h3>${escapeHtml(current.title)}</h3>
          ${current.summary ? `<p>${escapeHtml(current.summary)}</p>` : ''}
        </div>
      </header>
      <ul class="setup-checklist guided-checklist">${current.steps.map((step, stepIndex) => renderSetupStep(step, current, stepIndex)).join('')}</ul>
      <div class="setup-guide-nav">
        <button type="button" class="secondary-btn" data-setup-prev ${currentIndex === 0 ? 'disabled' : ''}>Back</button>
        <button type="button" class="primary-btn" data-setup-next ${currentIndex === sections.length - 1 ? 'disabled' : ''}>Next</button>
      </div>
    </article>
  </div>`;
}

function bindSetupNoteInteractions(wrap, visibleSections) {
  wrap.querySelectorAll('[data-setup-mode]').forEach(btn => btn.addEventListener('click', () => {
    state.setup.setupGuideMode = btn.dataset.setupMode;
    if (state.setup.setupGuideMode === 'guided') {
      const firstIncomplete = visibleSections.findIndex(section => !isSetupSectionComplete(section));
      if (firstIncomplete >= 0) state.setup.setupGuideSection = firstIncomplete;
    }
    save();
    renderSetupNotes();
  }));

  wrap.querySelectorAll('[data-setup-section]').forEach(btn => btn.addEventListener('click', () => {
    state.setup.setupGuideSection = Number(btn.dataset.setupSection);
    save();
    renderSetupNotes();
  }));

  wrap.querySelector('[data-setup-prev]')?.addEventListener('click', () => {
    state.setup.setupGuideSection = Math.max(0, Number(state.setup.setupGuideSection || 0) - 1);
    save();
    renderSetupNotes();
  });
  wrap.querySelector('[data-setup-next]')?.addEventListener('click', () => {
    state.setup.setupGuideSection = Math.min(visibleSections.length - 1, Number(state.setup.setupGuideSection || 0) + 1);
    save();
    renderSetupNotes();
  });

  const allDetails = Array.from(wrap.querySelectorAll('.setup-note'));
  const focusSetupNote = target => {
    allDetails.forEach(d => { d.open = (d === target); });
  };
  allDetails.forEach(details => {
    details.addEventListener('toggle', () => { if (details.open) focusSetupNote(details); });
  });

  wrap.querySelectorAll('.step-image-toggle').forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const imagesEl = btn.nextElementSibling;
      const expanded = imagesEl?.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.textContent = expanded ? 'Hide reference' : 'Show reference';
    });
  });

  wrap.querySelectorAll('.setup-step-check').forEach(checkbox => {
    checkbox.addEventListener('click', event => event.stopPropagation());
    checkbox.addEventListener('change', () => {
      const key = checkbox.dataset.stepKey;
      if (checkbox.checked) setupStepProgress.add(key); else setupStepProgress.delete(key);
      state.setup.setupProgress = Array.from(setupStepProgress);
      const currentIndex = Number(state.setup.setupGuideSection || 0);
      const currentSection = visibleSections[currentIndex];
      const completedCurrent = currentSection && isSetupSectionComplete(currentSection);
      save();
      if (state.setup.setupGuideMode === 'guided' && checkbox.checked && completedCurrent && currentIndex < visibleSections.length - 1) {
        setTimeout(() => {
          state.setup.setupGuideSection = currentIndex + 1;
          save();
          renderSetupNotes();
          document.getElementById('setupNotes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      } else {
        renderSetupNotes();
      }
    });
  });
}

function isSetupStepVisible(step) {
  if (step.requiredModules && !hasAllModules(step.requiredModules)) return false;
  if (step.anyModules && !step.anyModules.some(moduleId => hasModule(moduleId))) return false;
  if (step.blockedModules && step.blockedModules.some(moduleId => hasModule(moduleId))) return false;
  const playerCount = Number(state.setup?.playerDetails?.length || state.setup?.players || 0);
  if (Number.isFinite(step.minPlayers) && playerCount < step.minPlayers) return false;
  if (Number.isFinite(step.maxPlayers) && playerCount > step.maxPlayers) return false;
  return true;
}

function renderSetupSection(section, index, firstIncomplete = 0) {
  const complete = isSetupSectionComplete(section);
  const stepItems = section.steps.map((step, stepIndex) => renderSetupStep(step, section, stepIndex)).join('');
  return `<details class="setup-note ${complete ? 'complete' : ''}" ${index === (firstIncomplete >= 0 ? firstIncomplete : 0) ? 'open' : ''}>
    <summary>
      <span class="step-number">${complete ? '✓' : index + 1}</span>
      <span class="setup-note-heading"><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml(section.summary || '')}</small></span>
      <span class="step-progress">${section.steps.filter((step, stepIndex) => setupStepProgress.has(setupStepKey(section, stepIndex, step))).length}/${section.steps.length}</span>
    </summary>
    <ul class="setup-checklist">${stepItems}</ul>
  </details>`;
}

function renderSetupStep(step, section, stepIndex) {
  const stepKey = setupStepKey(section, stepIndex, step);
  const isDone = setupStepProgress.has(stepKey);
  const images = (step.images || []).filter(isSetupVisualVisible);
  let imageHtml = '';
  if (images.length) {
    imageHtml = `<button type="button" class="step-image-toggle" aria-expanded="false">Show reference</button>
      <div class="setup-step-images">${images.map(renderSetupStepImage).join('')}</div>`;
  }
  const actionButtons = [
    ...(step.actionButton ? [step.actionButton] : []),
    ...(step.actionButtons || [])
  ].filter(isSetupVisualVisible);
  const actionButtonsHtml = actionButtons.length ? `<div class="setup-step-actions">${actionButtons.map(renderSetupStepActionButton).join('')}</div>` : '';
  return `<li class="${isDone ? 'done' : ''}">
    <label class="setup-step-line">
      <input type="checkbox" class="setup-step-check" data-step-key="${escapeHtml(stepKey)}" ${isDone ? 'checked' : ''} aria-label="Mark step done">
      ${renderStepIcon(step)}
      <span class="setup-step-text">${formatSetupText(step.text)}${renderSetupStepBadges(step)}</span>
    </label>
    ${imageHtml}${actionButtonsHtml}
  </li>`;
}

function renderSetupStepActionButton(action) {
  const label = action.label || action.text || 'Open';
  const opens = action.opens || action.assist || '';
  if (!opens) return '';
  return `<button type="button" class="setup-step-action-btn" data-open-assist="${escapeHtml(opens)}">${escapeHtml(label)}</button>`;
}

const IMAGE_GLYPH = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L5 18"/></svg>';

function renderSetupStepImage(image) {
  const isFullWidth = !!image.fullWidth;
  const figureClasses = ['setup-step-image', isFullWidth ? 'setup-step-image-full' : '', image.className || ''].filter(Boolean).join(' ');
  const imgClasses = ['setup-step-image-img', isFullWidth ? 'setup-step-image-full' : ''].filter(Boolean).join(' ');
  const label = image.alt || image.caption || 'image';
  // `schematicSrc` is an optional simplified/flat diagram to show at thumbnail
  // size instead of a busy photo scan of the real component; the full photo
  // (`src`) is always what opens in the tap-to-enlarge lightbox. Falls back
  // to `src` for both when no schematic has been authored yet.
  const thumbSrc = image.schematicSrc || image.src;
  return `<figure class="${figureClasses}">
    <button type="button" class="setup-step-image-btn" data-view-image="${escapeHtml(image.src)}" data-view-alt="${escapeHtml(image.alt || '')}" data-view-caption="${escapeHtml(image.caption || '')}" aria-label="View ${escapeHtml(label)} full size">
      <img class="${imgClasses}" src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(image.alt || '')}" loading="lazy">
    </button>
    ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
  </figure>`;
}

function isSetupVisualVisible(visual) {
  if (visual.requiredModules && !hasAllModules(visual.requiredModules)) return false;
  if (visual.anyModules && !visual.anyModules.some(moduleId => hasModule(moduleId))) return false;
  if (visual.blockedModules && visual.blockedModules.some(moduleId => hasModule(moduleId))) return false;
  return true;
}

function formatSetupText(text) {
  return escapeHtml(String(text || '')
    .replaceAll('{targetLP}', state.setup.targetLP)
    .replaceAll('${state.setup.targetLP}', state.setup.targetLP)
    .replaceAll('{playerCount}', state.setup.players));
}

function renderGame() {
  const hasStories = state.activeStories.length > 0;
  const hasWorldEvents = state.activeWorldEvents.length > 0;
  app.innerHTML = `<section class="game-intro">
    <h1 class="trigger-heading">Primary Actions</h1>
    <p>Perform one of these actions to see what happens.</p>
  </section>
  ${renderStoryTrackStrip()}
  <section class="trigger-grid" aria-label="Primary action triggers">
    ${state.activeTriggers.map(t => renderTriggerCard(t)).join('')}
  </section>
  ${hasStories ? `<section class="panel story-panel">
    <h2 class="story-section-title">Active Story Triggers</h2>
    ${renderStoryList()}
  </section>` : ''}
  ${hasWorldEvents ? `<section class="panel story-panel">
    <h2 class="story-section-title">Active World Effects</h2>
    ${renderWorldList()}
  </section>` : ''}`;
  app.querySelectorAll('[data-trigger]').forEach(b => b.onclick = () => {
    // Story Arcs are personal by default, so even when the virtual Story Track
    // is off we still need to know which player performed the trigger.
    if (isStoryTrackEnabled() || storyEventsEnabled('arcs')) promptTriggerColor(b.dataset.trigger);
    else tapPrimaryTrigger(b.dataset.trigger, null);
  });
  app.querySelectorAll('[data-resolve]').forEach(b => b.onclick = () => resolveStory(b.dataset.resolve));
  app.querySelectorAll('[data-resolve-world]').forEach(b => b.onclick = () => promptResolveWorldEvent(b.dataset.resolveWorld));
  app.querySelectorAll('[data-story-track-color]').forEach(b => b.onclick = () => {
    gainStoryPoint(b.dataset.storyTrackColor, () => { save(); render(); });
  });
  updateFrontierMoodMusic();
  if (queueDueWorldEvent()) save();
  setTimeout(maybePresentPendingWorldEvent, 40);
}

// One small row, one badge per player: colored background, current story-track
// space number (1-4) shown large inside. Tapping a badge manually awards that
// player a Story Point (for whenever one is earned some way other than a
// primary trigger/story/world-event resolution) - same gainStoryPoint() path
// used everywhere else, so it shows the same compact informational Story
// Track reminder as any other source of a Story Point.
function renderStoryTrackStrip() {
  if (!isStoryTrackEnabled()) return '';
  const colors = (state.setup.playerColors || []).filter(Boolean);
  if (!colors.length) return '';
  return `<div class="story-track-strip" aria-label="Story Point track per player">${colors.map(color => {
    ensurePlayerTrackState(color);
    const position = state.storyTrack[color] || 0;
    const space = STORY_TRACK_SPACES[position];
    return `<button type="button" class="player-color-swatch story-track-chip swatch-${color}" data-story-track-color="${color}" title="${escapeHtml(playerLabel(color))} \u2014 ${escapeHtml(space.title)} (tap to add a Story Point)">
      <span class="story-track-chip-number">${position + 1}</span>
    </button>`;
  }).join('')}</div>`;
}

function renderTriggerCard(t) {
  const title = renderTriggerTitle(t);
  const image = t.image || imageForTrigger(t);
  return `<button class="trigger-card" data-trigger="${t.id}" aria-label="${escapeHtml(t.label)}">
    <span class="trigger-title-text">${title}</span>
    <span class="rule" aria-hidden="true"></span>
    <span class="trigger-image" style="background-image:url('${image}')" aria-hidden="true"></span>
    <span class="trigger-footer">Tap When It Happens</span>
  </button>`;
}

function renderTriggerTitle(t) {
  const parts = t.titleParts || titlePartsFromLabel(t.label);
  return parts.map(part => {
    const cls = part.style && part.style !== 'normal' ? ` trigger-title-keyword ${part.style}` : ' trigger-title-line';
    return `<span class="${cls.trim()}">${escapeHtml(part.text)}</span>`;
  }).join('');
}

function titlePartsFromLabel(label = '') {
  const clean = label.replace(/^A player /i, '').replace(/\.$/, '');
  const words = clean.split(' ');
  const keywordMap = [
    ['Bandit','red'], ['Prospect','blue'], ['Gold','blue'], ['Item','green'], ['Poker','gold'], ['Saloon','gold'], ['Cattle','brown'], ['Ranch','brown'], ['Move','brown'], ['Heist','red'], ['Rob','red'], ['Arrest','blue'], ['Heal','green']
  ];
  const found = keywordMap.find(([word]) => clean.toLowerCase().includes(word.toLowerCase()));
  if (!found) return [{ text: clean.toUpperCase(), style: 'normal' }];
  const [word, style] = found;
  const before = clean.slice(0, clean.toLowerCase().indexOf(word.toLowerCase())).trim();
  return [
    { text: (before || 'A PLAYER').toUpperCase(), style: 'normal' },
    { text: word.toUpperCase(), style }
  ];
}

function imageForTrigger(t) {
  const text = `${t.label} ${(t.tags || []).join(' ')}`.toLowerCase();
  if (text.includes('bandit') || text.includes('fight') || text.includes('rob') || text.includes('heist')) return 'assets/images/triggers/bandit.svg';
  if (text.includes('prospect') || text.includes('mine') || text.includes('gold')) return 'assets/images/triggers/prospect.svg';
  if (text.includes('purchase') || text.includes('item') || text.includes('upgrade') || text.includes('store')) return 'assets/images/triggers/item.svg';
  if (text.includes('move') || text.includes('travel') || text.includes('rail')) return 'assets/images/triggers/move.svg';
  if (text.includes('poker') || text.includes('gamble') || text.includes('saloon')) return 'assets/images/triggers/poker.svg';
  if (text.includes('ranch') || text.includes('cattle') || text.includes('wrangle') || text.includes('rustle')) return 'assets/images/triggers/ranch.svg';
  return 'assets/images/triggers/generic.svg';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function renderStoryList() {
  if (!state.activeStories.length) return '<p>No active story triggers. Keep watching the three primary action cards.</p>';
  return `<div class="story-list">${state.activeStories.map(s => {
    const icon = storyIcon(s);
    return `<article class="story-row">
      <span class="story-icon" style="background-image:url('${icon}')" aria-hidden="true"></span>
      <div class="story-main">
        <h3>${s.assignedColor ? `<span class="player-color" style="display:inline-block;background:${s.assignedColor};vertical-align:middle"></span> ` : ''}${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.screenText)}</p>
        <div class="story-meta">${escapeHtml(s.arcTitle || 'Story Trigger')}</div>
      </div>
      <span class="counter">${s.turnsLeft} left</span>
      ${s.rewardText ? `<p style="grid-column:1/-1"><strong>${escapeHtml(s.rewardText)}</strong></p>` : ''}
      <div class="story-actions"><button class="small-btn" data-resolve="${s.id}">Resolved</button></div>
    </article>`;
  }).join('')}</div>`;
}

function storyIcon(s) {
  const text = `${s.title} ${s.arcTitle} ${s.screenText}`.toLowerCase();
  if (text.includes('prospector') || text.includes('mine')) return 'assets/images/triggers/prospect.svg';
  if (text.includes('rail') || text.includes('train')) return 'assets/images/triggers/move.svg';
  if (text.includes('marshal') || text.includes('sheriff') || text.includes('bandit')) return 'assets/images/triggers/bandit.svg';
  if (text.includes('ranch') || text.includes('cattle')) return 'assets/images/triggers/ranch.svg';
  if (text.includes('poker') || text.includes('saloon')) return 'assets/images/triggers/poker.svg';
  if (text.includes('store') || text.includes('item')) return 'assets/images/triggers/item.svg';
  return 'assets/images/triggers/generic.svg';
}

function renderWorldList() {
  if (!state.activeWorldEvents.length) return '<p>No active world effects.</p>';
  return `<div class="story-list">${state.activeWorldEvents.map(w => `<article class="story-row">
    <span class="story-icon" style="background-image:url('${storyIcon(w)}')" aria-hidden="true"></span>
    <div class="story-main"><h3>${escapeHtml(w.title)}</h3><p>${escapeHtml(w.screenText)}</p><div class="story-meta">World Event</div></div>
    <span class="counter">${w.turnsLeft} left</span>
    ${w.resolvable ? `<div class="story-actions"><button class="small-btn" data-resolve-world="${w.id}">Resolve</button></div>` : ''}
  </article>`).join('')}</div>`;
}


function renderPokerHandsReference() {
  return `<ol>
    <li>5 of a Kind</li>
    <li>Royal Flush</li>
    <li>Straight Flush</li>
    <li>4 of a Kind</li>
    <li>Full House</li>
    <li>Flush</li>
    <li>Straight</li>
    <li>3 of a Kind</li>
    <li>Two Pair</li>
    <li>Pair</li>
    <li>High Card</li>
  </ol>`;
}

let fightFlowSelection = '';

function availableFightFlowTypes() {
  const types = [
    { value: 'player_arrest', group: 'Player', label: 'Arrest', kind: 'player' },
    { value: 'player_duel', group: 'Player', label: 'Duel', kind: 'player' },
    { value: 'player_rob', group: 'Player', label: 'Rob', kind: 'player' },
    { value: 'npc_bandit', group: 'NPC', label: 'Bandit', kind: 'npc', npcType: 'bandit', cards: 2 },
    { value: 'npc_bank_guard', group: 'NPC', label: 'Bank Guard', kind: 'npc', npcType: 'bank_guard', cards: 3 },
    { value: 'npc_sheriff', group: 'NPC', label: 'Sheriff', kind: 'npc', npcType: 'sheriff', cards: 4 },
    { value: 'npc_outlaw', group: 'NPC', label: 'Outlaw', kind: 'npc', npcType: 'other', cards: null, countSource: 'the Outlaw token', requiredModules: ['ante_up_events'] },
    { value: 'npc_claim_jumper', group: 'NPC', label: 'Claim Jumper', kind: 'npc', npcType: 'other', cards: null, countSource: 'the Claim Jumper token', requiredModules: ['ante_up_events'] },
    { value: 'npc_train_guard', group: 'NPC', label: 'Train Guard', kind: 'npc', npcType: 'other', cards: null, countSource: 'the Train Encounter card', requiredModules: ['ante_up_train'] }
  ];
  return types.filter(type => !type.requiredModules || hasAllModules(type.requiredModules));
}

function selectedFightFlowType() {
  const available = availableFightFlowTypes();
  if (!available.some(type => type.value === fightFlowSelection)) fightFlowSelection = '';
  return available.find(type => type.value === fightFlowSelection) || null;
}

function renderFightFlowTypeSelector() {
  const types = availableFightFlowTypes();
  const groups = ['Player', 'NPC'];
  return `<div class="fight-flow-selector-card">
    <label for="fightFlowType"><span>Fight Type</span><select id="fightFlowType" data-fight-flow-type>
      <option value="" ${fightFlowSelection ? '' : 'selected'} disabled>Choose fight type…</option>
      ${groups.map(group => {
        const options = types.filter(type => type.group === group);
        if (!options.length) return '';
        return `<optgroup label="${group}">${options.map(type => `<option value="${type.value}" ${type.value === fightFlowSelection ? 'selected' : ''}>${escapeHtml(type.label)}</option>`).join('')}</optgroup>`;
      }).join('')}
    </select></label>
  </div>`;
}

function renderFightFlowPhase(label) {
  return `<div class="fight-flow-phase"><span>${escapeHtml(label)}</span></div>`;
}

function renderFightFlowArrow(label = '') {
  return `<div class="fight-flow-arrow" aria-hidden="true">${label ? `<span>${escapeHtml(label)}</span>` : ''}</div>`;
}

function renderFightFlowNode(icon, eyebrow, title, summary, stepKey, cls = '') {
  return `<button type="button" class="fight-flow-node fight-flow-tappable ${cls}" data-fight-flow-step="${escapeHtml(stepKey)}">
    <span class="fight-flow-icon" aria-hidden="true">${icon}</span>
    <span class="fight-flow-copy">
      ${eyebrow ? `<small>${escapeHtml(eyebrow)}</small>` : ''}
      <strong>${escapeHtml(title)}</strong>
      ${summary ? `<span>${escapeHtml(summary)}</span>` : ''}
    </span>
    <span class="fight-flow-info-dot" aria-hidden="true">i</span>
  </button>`;
}

function fightFlowTargetLabel(type) {
  return type ? `${type.group}: ${type.label}` : '';
}

function fightFlowNpcCardSummary(type) {
  if (!type || type.kind !== 'npc') return '';
  return Number.isFinite(type.cards) ? `Draw ${type.cards} Fight Card${type.cards === 1 ? '' : 's'}` : 'Use count shown on token/card';
}

function fightFlowResultSummary(type, outcome) {
  if (!type) return '';
  const win = outcome === 'win';
  const summaries = {
    player_arrest: win ? 'Arrest the target' : 'Target avoids capture',
    player_duel: win ? 'Gain 2 LP' : 'Take 1 wound',
    player_rob: win ? 'Steal from the target' : 'Robbery fails',
    npc_bandit: win ? 'Gain 1 MP or 1 LP' : 'Take 1 wound',
    npc_bank_guard: win ? 'Gain 3 WP & $80' : '1 wound & gain 1 WP',
    npc_sheriff: win ? (hasModule('wild_bunch_sheriff') ? 'Return Sheriff & reveal new Sheriff' : 'Return Sheriff to office') : 'You are arrested',
    npc_outlaw: win ? 'Gain printed reward' : 'Take 1 wound',
    npc_claim_jumper: win ? 'Gain printed reward' : 'Take 1 wound',
    npc_train_guard: win ? 'Gain printed reward' : 'Resolve card consequences'
  };
  return summaries[type.value] || (win ? 'Resolve the win result' : 'Resolve the loss result');
}

function renderFightFlowOutcome(type) {
  return `<div class="fight-flow-outcome-shell">
    <div class="fight-flow-outcome-connector" aria-hidden="true"></div>
    <div class="fight-flow-outcomes">
      <div class="fight-flow-outcome-branch fight-flow-win">
        <span class="fight-flow-branch-label">WIN</span>
        ${renderFightFlowNode('★', '', 'Active Player Wins', fightFlowResultSummary(type, 'win'), 'result-win', 'fight-flow-result-node')}
      </div>
      <div class="fight-flow-outcome-branch fight-flow-loss">
        <span class="fight-flow-branch-label">LOSE</span>
        ${renderFightFlowNode('✕', '', 'Active Player Loses', fightFlowResultSummary(type, 'lose'), 'result-lose', 'fight-flow-result-node')}
      </div>
    </div>
    <div class="fight-flow-outcome-merge" aria-hidden="true"></div>
  </div>`;
}

function renderFightSequenceReference() {
  const type = selectedFightFlowType();
  const selector = renderFightFlowTypeSelector();
  if (!type) {
    return `<div class="fight-flowchart interactive-fight-flow" aria-label="Interactive fight resolution flowchart">
      ${selector}
      <div class="fight-flow-empty"><span aria-hidden="true">⚔</span><strong>Select a fight type to begin</strong><p>The rest of the flow adapts to Player or NPC fights and the modules enabled for this game.</p></div>
    </div>`;
  }

  const playerFight = type.kind === 'player';
  const opponentStep = playerFight
    ? renderFightFlowNode('🃏', 'Target Player', 'Choose a Card or Decline', '1 Poker Card facedown — or decline and lose immediately', 'opponent-card')
    : renderFightFlowNode('🂠', type.label, 'Choose NPC Fight Card', fightFlowNpcCardSummary(type), 'opponent-card', 'fight-flow-tool-node');
  const reactionSummary = playerFight ? 'Alternate until both players pass' : 'Active player reactions, then NPC card effect';
  const compareSummary = playerFight ? 'Highest value wins — Active Player wins ties' : 'Highest value wins — NPC wins ties';

  return `<div class="fight-flowchart interactive-fight-flow" aria-label="Interactive fight resolution flowchart">
    ${selector}
    <div class="fight-flow-selected"><span>${escapeHtml(fightFlowTargetLabel(type))}</span></div>
    ${renderFightFlowPhase('START OF FIGHT')}
    ${renderFightFlowNode('⚡', 'Start', 'Resolve Start Effects', playerFight ? 'Alternate until both players pass' : 'Active Player resolves start effects', 'start-effects')}
    ${type.value === 'npc_bandit' && hasModule('wild_bunch_bandit_variant') ? `${renderFightFlowArrow()}${renderFightFlowNode('◆', 'Bandit Variant', 'Reveal Bandit Effect', 'Reveal top Bandit card & mini ring number', 'bandit-variant')}` : ''}
    ${renderFightFlowArrow()}
    ${renderFightFlowNode('🃏', 'Active Player', 'Choose Poker Card', 'Choose 1 card and place it facedown', 'active-card')}
    ${renderFightFlowArrow()}
    ${opponentStep}
    ${renderFightFlowArrow()}
    ${renderFightFlowPhase('REVEAL')}
    ${renderFightFlowNode('👁', 'Reveal', 'Reveal Both Cards', 'Turn both selected cards faceup', 'reveal-cards')}
    ${renderFightFlowArrow()}
    ${renderFightFlowNode('✦', 'Abilities', 'Apply Bonuses & Abilities', playerFight ? 'Active Player, then Target Player' : 'Resolve Active Player bonuses and abilities', 'bonuses')}
    ${renderFightFlowArrow()}
    ${renderFightFlowNode('↻', 'Reactions', playerFight ? 'Play Reaction Effects' : 'Reactions & Fight Card Effect', reactionSummary, 'reactions')}
    ${renderFightFlowArrow()}
    ${renderFightFlowPhase('COMPARE')}
    ${renderFightFlowNode('⚖', 'Compare', 'Compare Final Values', compareSummary, 'compare')}
    ${renderFightFlowArrow()}
    ${renderFightFlowPhase('RESULT')}
    ${renderFightFlowOutcome(type)}
    ${renderFightFlowArrow()}
    ${renderFightFlowPhase('END OF FIGHT')}
    ${renderFightFlowNode('✓', 'End', 'Resolve End Effects', playerFight ? 'Active Player, then Target Player' : 'Resolve Active Player end effects', 'end-effects')}
    ${renderFightFlowArrow()}
    ${renderFightFlowNode('🂠', 'Cleanup', 'Clean Up Played Cards', playerFight ? 'Discard both played Poker Cards' : 'Return Fight Cards, discard played Poker Card', 'cleanup')}
  </div>`;
}

function fightFlowResultDetail(type, outcome) {
  const win = outcome === 'win';
  const hasEvents = hasModule('ante_up_events');
  const longhornText = hasEvents ? ' all Cattle and Longhorn tokens,' : ' all Cattle tokens,';
  const robberyTokenText = hasEvents ? ' plus 1 Cattle or Longhorn token.' : ' plus 1 Cattle token.';
  const details = {
    player_arrest: win
      ? `<p><strong>Active Player:</strong> Gain 1 Wanted Point.</p><p><strong>Target Player:</strong> Gain 1 wound and draw 1 Poker Card. Place the target miniature at the Sheriff/Marshal Office with the Sheriff. The target loses all Wanted Points,${longhornText} half of their Gold Nuggets rounded up, and half of their money rounded up.</p>`
      : `<p><strong>Active Player:</strong> Gain 1 wound and draw 1 Poker Card.</p><p><strong>Target Player:</strong> Avoids capture.</p>`,
    player_duel: win
      ? `<p><strong>Active Player:</strong> Gain 2 Legendary Points.</p><p><strong>Target Player:</strong> Gain 1 wound and draw 1 Poker Card.</p>`
      : `<p><strong>Active Player:</strong> Gain 1 wound and draw 1 Poker Card.</p><p><strong>Target Player:</strong> No additional effect.</p>`,
    player_rob: win
      ? `<p><strong>Active Player:</strong> Gain 1 Wanted Point. Steal half of the target's money <em>or</em> half of their Gold Nuggets, rounded up,${robberyTokenText}</p><p><strong>Target Player:</strong> Gain 1 wound and draw 1 Poker Card.</p>`
      : `<p><strong>Active Player:</strong> Gain 1 wound and draw 1 Poker Card.</p><p><strong>Target Player:</strong> Avoids being robbed.</p>`,
    npc_bandit: win
      ? `<p>Gain <strong>1 Marshal Point or 1 Legendary Point</strong>, then remove the Bandit from play.</p>`
      : `<p>Gain <strong>1 wound</strong>, draw 1 Poker Card, then remove the Bandit from play.</p>`,
    npc_bank_guard: win
      ? `<p>Gain <strong>3 Wanted Points and $80</strong>.</p>`
      : `<p>Gain <strong>1 wound</strong>, draw 1 Poker Card, and gain <strong>1 Wanted Point</strong>.</p>`,
    npc_sheriff: win
      ? `<p>Place the Sheriff at the <strong>Sheriff/Marshal Office</strong>.</p>${hasModule('wild_bunch_sheriff') ? '<p><strong>Sheriff Variant:</strong> the Sheriff lost the fight, so discard/replace the current Sheriff card and reveal the next Sheriff card.</p>' : ''}`
      : `<p>The player is <strong>arrested</strong>, gains 1 wound, and draws 1 Poker Card.</p>`,
    npc_outlaw: win
      ? `<p>Gain the <strong>reward printed on the Outlaw token</strong>, then remove the token from play.</p>`
      : `<p>Gain <strong>1 wound</strong>, draw 1 Poker Card, then remove the Outlaw token from play.</p>`,
    npc_claim_jumper: win
      ? `<p>Gain the <strong>reward printed on the Claim Jumper token</strong>, then remove the token from play.</p>`
      : `<p>Gain <strong>1 wound</strong>, draw 1 Poker Card, then remove the Claim Jumper token from play.</p>`,
    npc_train_guard: win
      ? `<p>Gain the <strong>reward printed on the Train Encounter card</strong>.</p>`
      : `<p>Gain <strong>1 wound</strong>, draw 1 Poker Card, and resolve the additional consequences printed on the Train Encounter card.</p>`
  };
  return details[type.value] || '<p>Resolve the result listed by the fight or encounter.</p>';
}

function fightFlowStepDetail(stepKey, type) {
  if (!type) return null;
  const playerFight = type.kind === 'player';
  const npcDrawText = Number.isFinite(type.cards)
    ? `Another player draws <strong>${type.cards} Fight Card${type.cards === 1 ? '' : 's'}</strong>, chooses 1, and places it facedown.`
    : `Another player draws the number of Fight Cards shown on <strong>${escapeHtml(type.countSource || 'the NPC component')}</strong>, chooses 1, and places it facedown.`;
  const info = {
    'start-effects': {
      eyebrow: 'Start of Fight', title: 'Resolve Start Effects',
      html: playerFight
        ? `<p>The <strong>Active Player</strong> resolves a Start of Fight effect, then the <strong>Target Player</strong> may resolve one. Continue alternating until both players pass.</p>`
        : `<p>The <strong>Active Player</strong> resolves all applicable Start of Fight effects before cards are chosen.</p>`
    },
    'bandit-variant': {
      eyebrow: 'Bandit Variant', title: 'Reveal Bandit Effect',
      html: `<p>Reveal the <strong>top Bandit card</strong>, then reveal the number on the bottom of the Bandit miniature's grey ring. Read the matching Bandit effect aloud and apply it for this fight.</p>`
    },
    'active-card': {
      eyebrow: 'Card Selection', title: 'Active Player Chooses',
      html: `<p>The Active Player chooses <strong>1 Poker Card from hand</strong> and places it facedown.</p>`
    },
    'opponent-card': {
      eyebrow: playerFight ? 'Target Player' : type.label,
      title: playerFight ? 'Choose a Card or Decline' : 'Choose NPC Fight Card',
      html: playerFight
        ? `<p>The Target Player chooses <strong>1 Poker Card from hand</strong> and places it facedown.</p><p>Instead, the Target Player may <strong>decline the fight</strong>. If they decline, they instantly lose — skip Reveal and Compare and resolve the Active Player's win result.</p>`
        : `<p>${npcDrawText}</p><p>The Active Player's Poker Card and the chosen NPC Fight Card remain facedown until the Reveal step.</p>`,
      autoSelect: !playerFight
    },
    'reveal-cards': {
      eyebrow: 'Reveal', title: 'Reveal Both Cards',
      html: `<p>Reveal the Active Player's Poker Card and the opposing Poker/Fight Card at the same time.</p>`
    },
    'bonuses': {
      eyebrow: 'Reveal', title: 'Apply Bonuses & Abilities',
      html: playerFight
        ? `<p>The <strong>Active Player</strong> resolves any bonus, character ability, or item ability that affects the revealed card. Then the <strong>Target Player</strong> resolves their applicable bonuses and abilities.</p>`
        : `<p>The <strong>Active Player</strong> resolves any bonus, character ability, or item ability that affects their revealed card.</p>`
    },
    'reactions': {
      eyebrow: 'Reveal', title: playerFight ? 'Play Reaction Effects' : 'Reactions & Fight Card Effect',
      html: playerFight
        ? `<p>The Active Player may play a Reaction effect, then the Target Player may play one. <strong>Alternate until both players pass.</strong></p>`
        : `<p>The Active Player resolves applicable Reaction effects. Then apply the effect printed on the selected <strong>NPC Fight Card</strong>.</p>`
    },
    'compare': {
      eyebrow: 'Compare', title: 'Compare Final Values',
      html: playerFight
        ? `<p>After all modifiers and effects, the <strong>highest final value wins</strong>. If the values are tied, the <strong>Active Player wins the tie</strong>.</p>`
        : `<p>After all modifiers and effects, the <strong>highest final value wins</strong>. If the values are tied, the <strong>NPC wins the tie</strong>.</p>`
    },
    'result-win': {
      eyebrow: `${type.label} Result`, title: 'Active Player Wins', html: fightFlowResultDetail(type, 'win')
    },
    'result-lose': {
      eyebrow: `${type.label} Result`, title: 'Active Player Loses', html: fightFlowResultDetail(type, 'lose')
    },
    'end-effects': {
      eyebrow: 'End of Fight', title: 'Resolve End Effects',
      html: playerFight
        ? `<p>The <strong>Active Player</strong> resolves all applicable End of Fight effects. Then the <strong>Target Player</strong> resolves their applicable End of Fight effects.</p>`
        : `<p>The <strong>Active Player</strong> resolves all applicable End of Fight effects.</p>`
    },
    'cleanup': {
      eyebrow: 'End of Fight', title: 'Clean Up Played Cards',
      html: playerFight
        ? `<p>Discard all Poker Cards played in this fight.</p>`
        : `<p>Shuffle the Fight Cards drawn for this fight and place them on the <strong>bottom of the Fight deck</strong>. Discard all Poker Cards played in the fight.</p>`
    }
  };
  return info[stepKey] || null;
}

function showFightFlowInfo(info, source, host) {
  if (!info) return;
  const overlay = document.createElement('div');
  overlay.className = 'fight-flow-info-viewer';
  overlay.innerHTML = `<div class="fight-flow-info-card">
    <p class="eyebrow">${escapeHtml(info.eyebrow || 'Fight Flow')}</p>
    <h3>${escapeHtml(info.title || '')}</h3>
    <div class="fight-flow-info-copy">${info.html || ''}</div>
    ${info.autoSelect ? `<button type="button" class="primary-btn fight-flow-auto-btn" data-fight-auto-select>Auto-Select Fight Card</button>` : ''}
    <small>Tap anywhere to close</small>
  </div>`;
  overlay.addEventListener('click', event => {
    const autoBtn = event.target.closest('[data-fight-auto-select]');
    if (autoBtn) {
      event.preventDefault();
      event.stopPropagation();
      overlay.remove();
      openFightCardFromFlow(source);
      return;
    }
    overlay.remove();
  });
  const dialogHost = host?.closest?.('dialog[open]');
  (dialogHost || document.body).appendChild(overlay);
}

function bindFightFlowInteractions(host, source = 'assist') {
  if (!host) return;
  const select = host.querySelector('[data-fight-flow-type]');
  if (select) {
    select.addEventListener('change', event => {
      fightFlowSelection = event.target.value;
      host.innerHTML = renderFightSequenceReference();
      bindFightFlowInteractions(host, source);
    });
  }
  host.querySelectorAll('[data-fight-flow-step]').forEach(node => {
    node.addEventListener('click', () => {
      const type = selectedFightFlowType();
      showFightFlowInfo(fightFlowStepDetail(node.dataset.fightFlowStep, type), source, host);
    });
  });
}

function renderFightFlowAssist(returnTarget = fightFlowReturnTarget) {
  fightFlowReturnTarget = returnTarget || null;
  assistNestedReturn = fightFlowReturnTarget || null;
  setAssistHeader('Fight Flow', 'Fight Helper');
  assistBody.innerHTML = `<div class="assist-panel reference-assist-panel fight-flow-assist-panel"><div data-fight-flow-host>${renderFightSequenceReference()}</div></div>`;
  bindFightFlowInteractions(assistBody.querySelector('[data-fight-flow-host]'), 'assist');
  showAssistDialog();
}

function renderReferenceOverlay(returnTarget = null) {
  const fightReference = `
    <h4 class="reference-subheading">Fight Flow</h4>
    <div data-fight-flow-host>${renderFightSequenceReference()}</div>`;
  const gamblingReference = `
    <h4 class="reference-subheading">Gambling Flow</h4>
    <div data-gambling-flow-host>${renderGamblingSequenceReference()}</div>`;
  const turnAndActions = `
    <h4 class="reference-subheading">Turn Summary</h4>
    ${renderTurnSummaryReference()}`;

  app.innerHTML = `<div class="modal-screen-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card">
      <button type="button" class="dialog-close-x" data-modal-close aria-label="Close">&#10005;</button>
      <div class="modal-title-header">
        <p class="eyebrow">Rules & Reminders</p>
        <h1 class="section-title">Quick Reference</h1>
      </div>
      <div class="utility-grid reference-sections">
        ${renderReferenceSection('Turn/Actions', turnAndActions)}
        ${renderReferenceSection('Fight', fightReference)}
        ${renderReferenceSection('Gambling', gamblingReference)}
        ${renderReferenceSection('Points', renderPointReference())}
      </div>
    </section>
  </div>`;
  const closeReference = () => reopenDrawerAfterOverlay(returnTarget);
  document.querySelector('[data-modal-close]').onclick = closeReference;
  document.querySelector('[data-modal-backdrop]').addEventListener('click', event => {
    if (event.target.hasAttribute('data-modal-backdrop')) closeReference();
  });
  bindFightFlowInteractions(document.querySelector('[data-fight-flow-host]'), 'reference');
  bindGamblingFlowInteractions(document.querySelector('[data-gambling-flow-host]'), 'reference');
  document.querySelectorAll('[data-open-actions-reference]').forEach(btn => btn.addEventListener('click', () => openActionsReference('reference')));
}

function referenceItemVisible(item) {
  return hasAllModules(item.requiredModules || []) && (item.blockedModules || []).every(moduleId => !hasModule(moduleId));
}

function buildReferenceList(items, sort = true) {
  const visible = items.filter(referenceItemVisible).map(item => item.name);
  if (sort) visible.sort((a, b) => a.localeCompare(b));
  return visible.join(', ');
}

function renderTurnPhasePanel(eyebrow, title, bodyHtml, open = false) {
  return `<details class="turn-phase-panel" ${open ? 'open' : ''}>
    <summary><span class="turn-phase-summary-copy"><small>${escapeHtml(eyebrow)}</small><strong>${escapeHtml(title)}</strong></span></summary>
    <div class="turn-phase-detail">${bodyHtml}</div>
  </details>`;
}

function renderTurnSummaryReference() {
  const targetLP = Number(state.setup?.targetLP || 20);
  const startItems = [
    hasModule('ante_up_train') ? '<li>Move the Train.</li>' : '',
    '<li>Resolve start of turn effects.</li>',
    '<li>Choose income.</li>',
    '<li>Choose active weapon/mount.</li>'
  ].filter(Boolean).join('');

  const actionItems = [
    '<li><strong>Move:</strong> move up to your movement value (2 default).</li>',
    '<li><strong>Card:</strong> play a Poker Card action as written.</li>',
    '<li><strong>Fight Another Player:</strong> initiate a fight in your space.</li>',
    '<li><strong>Free Deliveries:</strong> Rustle after ending movement at Ranch; Wrangle after ending movement at Rail Station.</li>',
    `<li class="turn-location-action"><strong>Location:</strong> use the available location/module actions. <button type="button" class="small-btn inline-reference-btn" data-open-actions-reference>View Actions</button></li>`,
    hasModule('blood_money_risk_die') ? '<li><strong>Risk Die:</strong> once per turn, roll at no action cost to draw 1 Poker Card, gain $10, or move 1 (not a Move action).</li>' : ''
  ].filter(Boolean).join('');

  const endItems = [
    '<li>Resolve end of turn effects.</li>',
    hasModule('blood_money_stories') ? '<li>Resolve Legendary Story Card conditions.</li>' : '',
    '<li>Discard down to hand size: <strong>5 - 1 per wound.</strong></li>',
    '<li>If Wanted, gain LP from the Wanted Track.</li>',
    `<li>If LP is at least <strong>${targetLP}</strong>, trigger the end: finish the current round, then play 1 final full round.</li>`
  ].filter(Boolean).join('');

  const manInBlackItems = hasModule('wild_bunch_man_in_black') ? [
    '<li>Draw and resolve, top to bottom, 1 card from the Man in Black deck.</li>',
    '<li>He is considered a player for gameplay effects.</li>',
    '<li>He cannot gain MP, WP, GP, SP, or Wounds.</li>',
    '<li>He always has $120 and 4 Gold Nuggets.</li>',
    '<li>He draws 3 Fight Cards in fights and resolves the highest-value card.</li>',
    '<li>He decreases the value of Poker Cards played against him by 1.</li>',
    '<li>He wins all ties.</li>'
  ].join('') : '';

  const prospectingTrackItems = hasModule('prospecting_cards') ? [
    '<li>When a player lands on or passes a Gold Nugget on the LP track, return that nugget to the supply.</li>',
    '<li>Reveal the next Prospecting Card and add the designated Gold Nuggets to the indicated mines.</li>'
  ].join('') : '';

  return `<div class="turn-summary-panels">
    ${renderTurnPhasePanel('Start', 'Choose 2: $10, 1 Card', `<ul class="compact-list turn-phase-list">${startItems}</ul>`)}
    ${renderTurnPhasePanel('Actions', 'Take up to 3 actions', `<ul class="compact-list turn-phase-list">${actionItems}</ul>`)}
    ${renderTurnPhasePanel('End', 'Discard to hand size', `<ul class="compact-list turn-phase-list">${endItems}</ul>`)}
    ${manInBlackItems ? renderTurnPhasePanel('End of Round', 'Man in Black Turn', `<ul class="compact-list turn-phase-list">${manInBlackItems}</ul>`) : ''}
    ${prospectingTrackItems ? renderTurnPhasePanel('Track Trigger', 'Prospecting Deck', `<ul class="compact-list turn-phase-list">${prospectingTrackItems}</ul>`) : ''}
  </div>`;
}

function hasRuinModule() {
  return hasModule('blood_money_stories') || hasModule('wild_bunch_man_in_black') ||
    ['blood_money_ruins', 'blood_money_ruin', 'blood_money_ruin_tokens'].some(id => state.setup.modules.includes(id));
}

function renderActionToolButton(label, tool, extra = '') {
  return `<button type="button" class="small-btn action-tool-btn" data-action-tool="${escapeHtml(tool)}" ${extra}>${escapeHtml(label)}</button>`;
}

function renderActionReferencePanel(title, summary, body, open = false) {
  return `<details class="action-reference-panel" ${open ? 'open' : ''}>
    <summary><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(summary)}</small></span></summary>
    <div class="action-reference-detail">${body}</div>
  </details>`;
}

function renderLocationAction(title, summary, body, toolButton = '') {
  return `<details class="location-action-panel">
    <summary><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(summary)}</small></span></summary>
    <div class="location-action-detail">${body}${toolButton ? `<div class="location-action-tools">${toolButton}</div>` : ''}</div>
  </details>`;
}

function renderActionsReferenceContent() {
  const hasSideboard = hasModule('ante_up_sideboard');
  const hasTrain = hasModule('ante_up_train');
  const hasFaro = hasModule('ante_up_faro');
  const hasHighStakes = hasModule('ante_up_high_stakes_poker');
  const hasGangPosse = hasModule('wild_bunch_gang_posse');
  const hasRuins = hasRuinModule();
  const hasTheatre = hasModule('theatre');
  const gambleGames = ['Poker', hasFaro ? 'Faro' : '', hasHighStakes ? 'High Stakes Poker' : ''].filter(Boolean);

  const locationActions = [
    {
      title: 'Acquire',
      summary: 'Take a facedown Cattle token at a Ranch',
      body: '<p>While at a Ranch space, gain 1 facedown Cattle token if you are not already carrying one.</p>'
    },
    hasModule('treasure_hunting_rumors') ? {
      title: 'Acquire Rumor',
      summary: 'Buy Rumor cards in town for $30 each',
      body: '<p>While inside town, buy any number of Rumor Cards for $30 each. Rumor Cards are treated as $10 while in your possession.</p>'
    } : null,
    hasModule('ante_up_events') ? {
      title: 'Challenge',
      summary: 'Challenge the High Roller to Poker',
      body: '<p>While adjacent to a Saloon where the High Roller token is present, initiate a game of Poker.</p>'
    } : null,
    hasModule('blood_money_deeds') ? {
      title: 'Claim',
      summary: 'Purchase a Deed at its location',
      body: '<p>While at any location with a Deed card, pay its cost and take the Deed card.</p>'
    } : null,
    {
      title: 'Deposit',
      summary: 'Sell Gold Nuggets at the Bank',
      body: '<p>While at the Bank space, sell Gold Nuggets. Gain <strong>$20 + 1 LP per nugget</strong>.</p>'
    },
    hasModule('treasure_hunting_rumors') ? {
      title: 'Dig Up Treasure',
      summary: 'Turn 3 matching Rumors into buried treasure',
      body: '<p>When your miniature is on the board space indicated by 3 Rumor Cards, discard those Rumor Cards and gain <strong>3 LP</strong>, 1 random Legendary Item, and the result of 2 Prospecting Dice rolls.</p>'
    } : null,
    hasModule('fishing') ? {
      title: 'Fishing',
      summary: 'Fish while on a river space',
      body: '<p>While on a river space, discard 1 Poker Card (J, Q, K = 10; A = 11) plus any Fish Cards (1 per card) to determine Fishing Effort. Reveal Fish Cards until their total value is at least the Fishing Effort, discarding any overage. Gain 1 LP if the total equals the Fishing Effort and you caught at least 1 Fish.</p>'
    } : null,
    hasSideboard ? {
      title: 'Frontier',
      summary: 'Complete a Frontier token challenge',
      body: '<p>While on a space with a Frontier token, discard Poker Cards from your hand with a total value greater than or equal to the Frontier token + space. Gain the reward printed on the back. J, Q, K = 10; A = 11.</p>'
    } : null,
    {
      title: 'Gamble',
      summary: `Play ${gambleGames.join(', ').replace(/, ([^,]*)$/, ' or $1')} at a Saloon`,
      body: `<p>While adjacent to a Saloon, choose to play ${gambleGames.join(', ').replace(/, ([^,]*)$/, ' or $1')}.</p>`,
      tool: renderActionToolButton('Gambling Flow', 'gambling')
    },
    {
      title: 'Heal',
      summary: 'Remove wounds and injuries at the Doctor',
      body: '<p>While at the Doctor\'s Office, pay $10 to lose all wounds/injuries, then draw 1 Poker Card per wound.</p>'
    },
    {
      title: 'Heist',
      summary: `Once per turn: fight the guard at the Bank${hasTrain ? ' or Train' : ''}`,
      body: `<p><strong>Once per turn:</strong> while at the Bank${hasTrain ? ' or Train' : ''}, fight the guard.</p>`,
      tool: renderActionToolButton('Fight Flow', 'heist-fight')
    },
    hasModule('hunting') ? {
      title: 'Hunt',
      summary: 'Use a Hunt Action marker to hunt an animal',
      body: '<p>While on a space with a Hunt Action marker, remove the marker and draw Animal Cards until one matching the marker size or a Bird is revealed. Either discard the chosen Animal Card and end the action, or discard Poker Card(s) whose total value (J, Q, K = 10; A = 11) is at least the animal\'s Strength. Rifle modifies the check by +/-1; Shotgun gives +2. Then place the Hunt Action marker on a new unoccupied space.</p>'
    } : null,
    {
      title: 'Prospect',
      summary: 'Roll Prospecting Dice at a Mine',
      body: `<p>While at a Mine, roll the mining dice and gain the results.</p>${hasModule('prospecting_cards') ? '<p><strong>Prospecting Deck:</strong> whenever your LP marker lands on or passes a Gold Nugget on the LP track, return it to the supply and reveal the next Prospecting Card, adding the designated Gold Nuggets to the indicated mines.</p>' : ''}`,
      tool: renderActionToolButton('Dice Roller', 'prospecting-dice')
    },
    {
      title: 'Purchase/Upgrade',
      summary: `Buy or upgrade items at the Store${hasSideboard ? ' or Trading Post' : ''}`,
      body: `<p>While adjacent to the Store${hasSideboard ? ' or Trading Post' : ''}, purchase an item from the rack or pay to upgrade an owned item.</p>`
    },
    hasGangPosse ? {
      title: 'Recruit',
      summary: 'Recruit a Posse or Gang for $20',
      body: '<p>Pay $20. At the Sheriff/Marshal Office with Marshal Points, recruit a Posse; at the Outlaw Camp with Wanted Points, recruit a Gang.</p>'
    } : null,
    hasRuins ? {
      title: 'Repair',
      summary: 'Remove a Ruin token for 2 SP',
      body: '<p>While at a space with a Ruin token, discard 1 Poker Card to gain 2 SP and remove the Ruin token.</p>'
    } : null,
    {
      title: 'Revel',
      summary: hasTheatre ? 'Buy faceup Theatre cards at the Cabaret' : 'Pay $30 at the Cabaret for 1 LP',
      body: hasTheatre
        ? '<p>While at the Cabaret, buy any number of faceup Theatre Cards and gain the LP indicated on them. Reveal new cards until 3 Theatre Cards are faceup again.</p>'
        : '<p>While at the Cabaret, pay $30 to gain 1 LP.</p>'
    },
    hasSideboard ? {
      title: 'Trail',
      summary: 'Move between matching trail heads',
      body: '<p>Use a Move action from one trail head location to the matching trail head location on the opposite board.</p>'
    } : null,
    hasModule('blood_money_traveling_trader') ? {
      title: 'Trader',
      summary: 'Buy an item from the Traveling Trader',
      body: '<p>While in the same region as the Traveling Trader, pay $40 to gain an item from the Trader stand. Move the Trader to a new location based on the drawn card.</p>'
    } : null,
    hasTrain ? {
      title: 'Travel By Rail',
      summary: 'Pay $10 to travel between Rail Stations',
      body: '<p>Pay $10 to place your miniature on the opposite Rail Station, then continue the Move action up to your maximum movement.</p>'
    } : null,
    {
      title: 'Work',
      summary: 'Gain $10 at any location',
      body: `<p>Gain $10 at any location${hasRuins ? ' without a Ruin token' : ''}.</p>`
    }
  ].filter(Boolean).sort((a, b) => a.title.localeCompare(b.title));

  const locationPanels = locationActions
    .map(action => renderLocationAction(action.title, action.summary, action.body, action.tool || ''))
    .join('');

  return `<div class="actions-reference-list">
    ${renderActionReferencePanel('Move', 'Move up to your movement value (2 default)', '<p>Move up to your movement value. The default movement value is 2.</p>')}
    ${renderActionReferencePanel('Fight', 'Initiate a fight with a player in your space', `<p>Initiate a fight in your space with another player: Arrest, Duel, or Rob.</p><div class="action-reference-tools">${renderActionToolButton('Fight Flow', 'fight')}</div>`)}
    ${renderActionReferencePanel('Card', 'Play a Poker Card action', '<p>Play a Poker Card action as written on the card.</p>')}
    ${renderActionReferencePanel('Free Deliveries', 'Rustle or Wrangle after movement', '<p><strong>Rustle:</strong> after ending movement at a Ranch.</p><p><strong>Wrangle:</strong> after ending movement at a Rail Station.</p>')}
    ${renderActionReferencePanel('Location', 'Actions available at specific locations', `<div class="location-action-list">${locationPanels}</div>`, true)}
  </div>`;
}
function openActionsReference(source = 'reference') {
  actionsReturnTarget = source || null;
  renderActionsAssist();
}

function renderActionsAssist() {
  assistView = 'detail';
  assistNestedReturn = actionsReturnTarget === 'reference' ? 'reference' : null;
  setAssistHeader('Actions', 'Quick Reference');
  assistBody.innerHTML = `<div class="assist-panel actions-reference-assist">${renderActionsReferenceContent()}</div>`;
  assistBody.querySelectorAll('[data-action-tool]').forEach(btn => btn.addEventListener('click', () => openActionTool(btn.dataset.actionTool)));
  showAssistDialog();
}

function openActionTool(tool) {
  assistNestedReturn = 'actions';
  if (tool === 'fight') {
    fightFlowSelection = '';
    fightFlowReturnTarget = 'actions';
    renderFightFlowAssist('actions');
    return;
  }
  if (tool === 'heist-fight') {
    fightFlowSelection = 'npc_bank_guard';
    fightFlowReturnTarget = 'actions';
    renderFightFlowAssist('actions');
    return;
  }
  if (tool === 'gambling') {
    gamblingFlowReturnTarget = 'actions';
    gamblingFlowSelection = 'poker';
    renderGamblingAssist('poker', 'actions');
    return;
  }
  if (tool === 'prospecting-dice') {
    openDiceAssist('prospecting');
  }
}

function gamblingFlowSteps(game = 'poker') {
  if (game === 'faro') return [
    { title: 'Take Gamble Action', summary: 'Choose Faro at an adjacent Saloon', detail: 'Be in a space adjacent to a Saloon and choose Faro if the module is in play.' },
    { title: 'Place Bets', summary: 'Place legal bets on the Faro layout', detail: 'Place legal bets on the Faro layout according to Ante Up rules.' },
    { title: 'Reveal Dealer Cards', summary: 'Resolve the dealer cards in sequence', detail: 'Reveal and resolve the dealer cards in sequence.' },
    { title: 'Pay Winners / Collect Losses', summary: 'Resolve each bet', detail: 'Resolve each bet as win, lose, or push according to Faro.' },
    { title: 'Continue or End', summary: 'Finish the Faro sequence', detail: 'Continue the Faro sequence as allowed, then apply Gambler Point or event effects.' }
  ];
  if (game === 'high_stakes') return [
    {
      title: 'Take Gamble Action',
      summary: 'Need $30 + 1 Poker Card; ante $10 & draw 1',
      detail: 'The active player must have at least $30 and 1 Poker Card. At a Saloon, take a Gamble action, ante $10, and draw 1 Poker Card.'
    },
    {
      title: 'Invite Other Players',
      summary: 'Same-town players may join clockwise',
      detail: 'Starting clockwise from the active player, every other player in the same town decides whether to join. A player needs at least $30 and 1 Poker Card to join; each joining player antes $10 and draws 1 Poker Card.'
    },
    {
      title: 'Build the Pot / Set Dealer',
      summary: 'Saloon adds $40; solo player faces the dealer',
      detail: 'The Saloon adds $40 to the pot. If no other player joins, the dealer (the player seated to the right of the active player) sets aside their normal hand and draws 5 Poker Cards to play against the active player.'
    },
    {
      title: 'Deal the Flop',
      summary: 'Reveal 3 communal Poker Cards',
      detail: 'Deal the flop by turning 3 communal Poker Cards faceup.'
    },
    {
      title: 'Bet or Fold',
      summary: 'Add $20 or fold; dealer always bets',
      detail: 'Starting with the first player left of the active player and proceeding clockwise, each player adds $20 to the pot or folds. A folding player forfeits their $10 ante, loses the High Stakes Poker game, and draws 1 Poker Card. The dealer always adds $20 from the supply and never folds.'
    },
    {
      title: 'Check for an Early Winner',
      summary: 'All fold: clear pot; lone player may win immediately',
      detail: 'If all players fold, return all money in the pot to the supply. If only 1 player remains and the dealer was not playing, that player takes the pot and gains 1 LP and 1 GP.'
    },
    {
      title: 'Turn & River',
      summary: 'Add $20 from Saloon if needed; reveal 2 more cards',
      detail: 'If the hand continues and the dealer is not playing, the Saloon adds $20 to the pot. Then deal the turn and river: 2 more communal Poker Cards faceup.'
    },
    {
      title: 'Build Best Poker Hand',
      summary: 'Use 2 hand cards + 3 communal cards',
      detail: 'Starting left of the active player and proceeding clockwise, each player reveals 2 cards from hand and combines them with 3 communal cards to make their best Poker hand. The dealer does the same when playing. Resolve Poker/Gambling abilities as in a normal Poker game.',
      pokerHands: true
    },
    {
      title: 'Determine the Winner',
      summary: 'Best hand wins; dealer & active player have tie priority',
      detail: 'The best Poker hand wins. The dealer wins ties. The active player wins ties against other players. If multiple non-active players remain tied, they each gain 1 LP and 1 GP and split the pot evenly, rounding down; return any extra money to the supply.'
    },
    {
      title: 'Resolve Rewards & Cleanup',
      summary: 'Winner takes pot +1 LP/+1 GP; losers draw 1',
      detail: 'If the dealer wins, return the entire pot to the supply. A winning player takes the pot and gains 1 LP and 1 GP. All losing players draw 1 Poker Card. All players discard the cards they revealed.'
    }
  ];
  return [
    { title: 'Take Gamble Action', summary: 'Gamble at an adjacent Saloon', detail: 'Be in a space adjacent to a Saloon and spend 1 action to Gamble.' },
    { title: 'Pay Ante / Set Stakes', summary: 'Pay the required bet', detail: 'Pay or place any required bet according to the gambling rules in play.' },
    { title: 'Deal Poker Cards', summary: 'Deal and draw cards as required', detail: 'Deal and/or draw Poker Cards as required by the Gamble action.' },
    { title: 'Reveal & Compare Hands', summary: 'Determine the best Poker hand', detail: 'Use the Poker Hand reference to determine the winning hand.', pokerHands: true },
    { title: 'Resolve Rewards', summary: 'Apply money, points, and other effects', detail: 'Apply money, Gambler Points, LP, or other effects from the game state and expansions.' }
  ];
}

function availableGamblingGames() {
  return [
    { value: 'poker', label: 'Poker' },
    hasModule('ante_up_faro') ? { value: 'faro', label: 'Faro' } : null,
    hasModule('ante_up_high_stakes_poker') ? { value: 'high_stakes', label: 'High Stakes Poker' } : null
  ].filter(Boolean);
}

function normalizeGamblingFlowSelection() {
  const games = availableGamblingGames();
  if (!games.some(game => game.value === gamblingFlowSelection)) gamblingFlowSelection = 'poker';
  return gamblingFlowSelection;
}

function renderGamblingGameSelector() {
  const games = availableGamblingGames();
  normalizeGamblingFlowSelection();
  if (games.length === 1) {
    return `<div class="gambling-flow-game-chip"><span>Game</span><strong>Poker</strong></div>`;
  }
  return `<div class="fight-flow-selector-card gambling-flow-selector-card">
    <label for="gamblingFlowGame"><span>Game</span><select id="gamblingFlowGame" data-gambling-flow-game>
      ${games.map(game => `<option value="${game.value}" ${gamblingFlowSelection === game.value ? 'selected' : ''}>${escapeHtml(game.label)}</option>`).join('')}
    </select></label>
  </div>`;
}

function renderGamblingFlowNode(step, index) {
  const icons = ['♠', '$', '🂠', '⚖', '★', '◆', '🃏', '♣', '★', '✓'];
  return `<div class="fight-flow-node gambling-flow-node" data-gambling-flow-step="${index}" tabindex="0" role="button">
    <span class="fight-flow-icon" aria-hidden="true">${icons[index] || '•'}</span>
    <span class="fight-flow-copy"><small>Step ${index + 1}</small><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.summary || step.detail)}</span></span>
    <span class="fight-flow-info-dot" aria-hidden="true">i</span>
    ${step.pokerHands ? `<button type="button" class="small-btn gambling-poker-hands-btn" data-open-poker-hands>Poker Hands</button>` : ''}
  </div>`;
}

function gamblingFlowLabel(game) {
  if (game === 'faro') return 'Faro';
  if (game === 'high_stakes') return 'High Stakes Poker';
  return 'Poker';
}

function renderGamblingSequenceReference() {
  const game = normalizeGamblingFlowSelection();
  const steps = gamblingFlowSteps(game);
  return `<div class="fight-flowchart gambling-flowchart" aria-label="${escapeHtml(gamblingFlowLabel(game))} gambling flowchart">
    ${renderGamblingGameSelector()}
    ${renderFightFlowPhase(gamblingFlowLabel(game).toUpperCase())}
    ${steps.map((step, index) => `${renderGamblingFlowNode(step, index)}${index < steps.length - 1 ? renderFightFlowArrow() : ''}`).join('')}
  </div>`;
}

function gamblingFlowStepInfo(index) {
  const game = normalizeGamblingFlowSelection();
  const step = gamblingFlowSteps(game)[Number(index)];
  if (!step) return null;
  return { eyebrow: `${gamblingFlowLabel(game)} Flow`, title: step.title, html: `<p>${escapeHtml(step.detail)}</p>` };
}

function openPokerHandsFromGambling(source = 'reference') {
  if (source === 'reference') {
    assistNestedReturn = 'reference';
    gamblingFlowReturnTarget = 'reference';
  } else {
    assistNestedReturn = 'gamblingFlow';
  }
  assistView = 'detail';
  renderReferenceStyleAssist('Poker Hands', renderPokerHandsReference(), 'Gambling Reference');
}

function bindGamblingFlowInteractions(host, source = 'reference') {
  if (!host) return;
  host.querySelector('[data-gambling-flow-game]')?.addEventListener('change', event => {
    gamblingFlowSelection = event.target.value;
    host.innerHTML = renderGamblingSequenceReference();
    bindGamblingFlowInteractions(host, source);
  });
  host.querySelectorAll('[data-gambling-flow-step]').forEach(node => {
    const showInfo = event => {
      if (event.target.closest?.('[data-open-poker-hands]')) return;
      showFightFlowInfo(gamblingFlowStepInfo(node.dataset.gamblingFlowStep), source, host);
    };
    node.addEventListener('click', showInfo);
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showInfo(event); }
    });
  });
  host.querySelectorAll('[data-open-poker-hands]').forEach(btn => btn.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation(); openPokerHandsFromGambling(source);
  }));
}

function renderReferenceSection(title, content) {
  return `<details class="ref-card ref-section"><summary class="ref-section-summary"><h3>${escapeHtml(title)}</h3><span class="ref-section-caret">▾</span></summary><div class="ref-section-body">${content}</div></details>`;
}

function renderReferenceStep(number, title, detail) {
  return `<details class="ref-step"><summary><span class="step-number">${number}</span><strong>${title}</strong></summary><p>${escapeHtml(detail)}</p></details>`;
}

function renderPointReference() {
  const sections = [
    {
      title: 'Legendary Points (LP)',
      cls: 'gold',
      items: [
        { icon: 'bank.png', action: 'Deposit Gold', detail: 'At the Bank, gain $20 and 1 LP for each Gold Nugget sold.' },
        { icon: 'cabaret.png', action: 'Revel', detail: 'At the Cabaret, pay $30 to gain 1 LP; you may repeat during the same Revel action.' },
        { icon: 'fight.png', action: 'Win Fights', detail: 'Defeat Bandits or story NPCs when the fight reward allows LP.' },
        { icon: 'lp.png', action: 'Complete Stories', detail: 'Story Cards, Legendary Stories, event triggers, and app story objectives may award LP.' },
        { icon: 'deed.png', action: 'Use Deeds', detail: 'Claim or use Deeds when a property reward grants LP.' },
        { icon: 'generic.svg', action: 'Expansion Rewards', detail: 'Hunting, fishing, crafting, and other expansion content may award LP through their own rules or stories.' }
      ]
    },
    {
      title: 'Marshal Points (MP)',
      cls: 'blue',
      items: [
        { icon: 'ranch.png', action: 'Wrangle Cattle', detail: 'Deliver cattle tokens to a Rail Station.' },
        { icon: 'sheriff.png', action: 'Arrest Outlaws', detail: 'Arrest Wanted players or resolve lawman rewards that grant Marshal Points.' },
        { icon: 'bandit.png', action: 'Defeat Bandits', detail: 'Choose Marshal Points when the Bandit reward allows MP instead of LP.' },
        { icon: 'marshal.png', action: 'Serve the Law', detail: 'Complete Sheriff, Marshal, Posse, or law-themed story events that award MP.' }
      ]
    },
    {
      title: 'Wanted Points (WP)',
      cls: 'black',
      items: [
        { icon: 'ranch.png', action: 'Rustle Cattle', detail: 'Deliver cattle to the wrong Ranch color.' },
        { icon: 'bankheist.png', action: 'Rob / Heist', detail: 'Rob another player, rob the Bank, or commit Heist/Outlaw actions that award Wanted Points.' },
        { icon: 'gun.png', action: 'Fight the Law', detail: 'Attack or interfere with lawmen when a rule or story says to gain WP.' },
        { icon: 'wanted.png', action: 'Outlaw Events', detail: 'Resolve outlaw, gang, train-heist, or bandit story events that grant WP.' }
      ]
    },
    {
      title: 'Gambler Points (GP)',
      cls: 'purple',
      requiredModules: ['ante_up_gambler'],
      items: [
        { icon: 'gp.png', action: 'Gambling Rewards', detail: 'Win or resolve Ante Up gambling activities when the Gambler Track/module is enabled.' },
        { icon: 'poker.svg', action: 'Poker / Faro', detail: 'Play Poker or Faro events that award Gambler Points.' },
        { icon: 'saloon.png', action: 'Gambling Stories', detail: 'Complete saloon, cabaret, card-shark, or traveling-showman story events that award GP.' }
      ]
    },
    {
      title: 'Story Points (SP)',
      cls: 'silver',
      requiredModules: ['blood_money_stories'],
      items: [
        { icon: 'sp.png', action: 'Legendary Stories', detail: 'Gain Story Points from Blood Money Legendary Story content when instructed.' },
        { iconPath: 'assets/images/dice/risk.png', action: 'Risk Die Effects', detail: 'Gain Story Points from the Risk Die or other module effects when instructed.' },
        { icon: 'sp.png', action: 'Story Objectives', detail: 'Complete story objectives, major storyline chapters, or app events that explicitly award Story Points.' }
      ]
    }
  ].filter(referenceItemVisible);

  return `<div class="point-reference">${sections.map(section => `<article class="point-group">
    <h4 class="theme-${section.cls}">${section.title}</h4>
    <ul class="point-action-list">${section.items.map(item => {
      const src = item.iconPath || `assets/images/triggers/${item.icon}`;
      return `<li><span class="point-action-icon" aria-hidden="true"><img src="${src}" alt=""></span><span class="point-action-copy"><strong>${escapeHtml(item.action)}</strong><span>${escapeHtml(item.detail)}</span></span></li>`;
    }).join('')}</ul>
  </article>`).join('')}</div>`;
}

function renderAudioSettings(returnTarget = null) {
  app.innerHTML = `<div class="modal-screen-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card audio-settings-card">
      <button type="button" class="dialog-close-x" data-modal-close aria-label="Close">&#10005;</button>
      <div class="modal-title-header">
        <p class="eyebrow">Sound Controls</p>
        <h1 class="section-title">Audio</h1>
      </div>
      <div class="sound-compact-grid">
        ${soundControl('musicOn','Music','musicVolume')}
        ${soundControl('soundOn','Sounds','soundVolume')}
        ${soundControl('voiceOn','Voice','voiceVolume')}
      </div>
    </section>
  </div>`;
  [['musicOn', 'musicVolume'], ['soundOn', 'soundVolume'], ['voiceOn', 'voiceVolume']].forEach(([flag, volumeKey]) => {
    const checkbox = document.getElementById(flag);
    const slider = document.getElementById(volumeKey);
    checkbox.onchange = () => {
      state.settings[flag] = checkbox.checked;
      slider.disabled = !checkbox.checked;
      applyAudioSettings();
      save();
      if (flag === 'musicOn') setMusicEnabled(checkbox.checked);
      if (flag === 'voiceOn' && !checkbox.checked) voicePlayer.pause();
    };
    slider.oninput = () => {
      state.settings[volumeKey] = Number(slider.value);
      applyAudioSettings();
      save();
    };
  });
  const closeAudio = () => reopenDrawerAfterOverlay(returnTarget);
  document.querySelector('[data-modal-close]').onclick = closeAudio;
  document.querySelector('[data-modal-backdrop]').addEventListener('click', event => {
    if (event.target.hasAttribute('data-modal-backdrop')) closeAudio();
  });
}

function soundControl(flag, label, volume) {
  const on = !!state.settings[flag];
  return `<article class="ref-card sound-control-block">
    <h3>${label}</h3>
    <div class="sound-control-row">
      <input type="checkbox" id="${flag}" class="sound-toggle" ${on ? 'checked' : ''} aria-label="${label} on/off">
      <input id="${volume}" type="range" min="0" max="1" step="0.01" value="${state.settings[volume]}" ${on ? '' : 'disabled'} aria-label="${label} volume">
    </div>
  </article>`;
}
// Pauses/resumes actual playback the instant the Music checkbox is toggled,
// rather than only taking effect the next time something tries to start
// playing. Resumes whichever mood track (see the frontier-mood crossfade
// system) was already active instead of resetting to the default loop.
function setMusicEnabled(enabled) {
  if (!enabled) {
    musicPlayer.pause();
    if (musicPlayerB) musicPlayerB.pause();
    return;
  }
  const active = (typeof activeMusicSlot !== 'undefined' && activeMusicSlot === 'B' && musicPlayerB) ? musicPlayerB : musicPlayer;
  if (active.src) active.play().catch(() => {});
  else playMusic();
}
function applyAudioSettings() { musicPlayer.volume = state?.settings?.musicVolume ?? .2; sfxPlayer.volume = state?.settings?.soundVolume ?? .6; voicePlayer.volume = state?.settings?.voiceVolume ?? .8; }
function playMusic() { if (!state.settings.musicOn) return; if (!musicPlayer.src) musicPlayer.src = 'audio/music/western_loop.mp3'; musicPlayer.play().catch(()=>{}); }

// One mp3 per frontier mood - crossfaded smoothly whenever the dominant
// mood changes, rather than an abrupt cut. "quiet" reuses the same default
// ambient loop playMusic() already starts the game with, so a fresh game
// doesn't immediately crossfade away from what's already playing.
const MOOD_MUSIC = {
  quiet: 'audio/music/western_loop.mp3',
  lawless: 'audio/music/mood_lawless.mp3',
  orderly: 'audio/music/mood-orderly.mp3',
  tense: 'audio/music/mood-tense.mp3',
  opportunity: 'audio/music/mood-opportunity.mp3',
  bloodshed: 'audio/music/mood-bloodshed.mp3'
};
const MUSIC_CROSSFADE_MS = 1800;
let musicPlayerB = null;
let activeMusicSlot = 'A';
let currentMoodMusicKey = null;

function ensureSecondMusicPlayer() {
  if (!musicPlayerB) {
    musicPlayerB = document.createElement('audio');
    musicPlayerB.loop = true;
    musicPlayerB.style.display = 'none';
    document.body.appendChild(musicPlayerB);
  }
  return musicPlayerB;
}

// Recomputes the current frontier mood and, if it's changed since the last
// check, smoothly crossfades the background music to that mood's track.
// Cheap to call on every game-screen render - it no-ops instantly if the
// mood hasn't moved.
function updateFrontierMoodMusic() {
  if (!state.gameStarted || state.screen !== 'game') return;
  const moodKey = computeFrontierMood().key;
  if (moodKey === currentMoodMusicKey) return;
  currentMoodMusicKey = moodKey;
  if (!state.settings.musicOn) return;
  const src = MOOD_MUSIC[moodKey] || MOOD_MUSIC.quiet;
  ensureSecondMusicPlayer();
  const active = activeMusicSlot === 'A' ? musicPlayer : musicPlayerB;
  const incoming = activeMusicSlot === 'A' ? musicPlayerB : musicPlayer;
  if (active.src.endsWith(src)) return; // already playing this exact track
  const targetVolume = state.settings.musicVolume ?? 0.2;
  incoming.src = src;
  incoming.volume = 0;
  incoming.currentTime = 0;
  incoming.play().catch(() => {});
  const steps = 18;
  let step = 0;
  const fade = setInterval(() => {
    step++;
    const t = step / steps;
    incoming.volume = Math.min(targetVolume, targetVolume * t);
    active.volume = Math.max(0, targetVolume * (1 - t));
    if (step >= steps) {
      clearInterval(fade);
      active.pause();
      activeMusicSlot = activeMusicSlot === 'A' ? 'B' : 'A';
    }
  }, MUSIC_CROSSFADE_MS / steps);
}
function playVoice(src) { if (!src || !state.settings.voiceOn) return; voicePlayer.src = src; voicePlayer.play().catch(()=>{}); }
function stopVoice() { voicePlayer.pause(); voicePlayer.currentTime = 0; }

function showToolResult(html) { const el = document.getElementById('toolResult'); el.innerHTML = html; el.classList.remove('hidden'); }


const FIGHT_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const FIGHT_CARD_BACK_SRC = 'assets/images/cards/fight-back.png';
function fightCardFrontSrc(rank) { return `assets/images/cards/fight-${rank}.png`; }

const FIGHT_RANK_VALUE = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
// How harmful each card is to play when no drawn card is likely to win the
// fight outright - higher score = more worth playing purely for its effect.
// Harm ranking only for cards genuinely unlikely to win (2-8 - below the
// deck's 8.5 median against a uniformly random opposing draw). 9 is
// deliberately NOT in here: it sits right at the median, so it's evaluated
// for its win chances instead, never silently defaulting to a harm score
// that would never actually get consulted.
const FIGHT_HARM_SCORE = { '2': 95, '3': 90, '4': 82, '6': 74, '7': 68, '5': 62 };
// How many wounds each harm-tier card actually deals (7 is a choice between
// a wound and a discard, so it only gets partial credit toward "guaranteed
// wound") and whether that wound can be prevented by anything else in the
// game - only rank 6 explicitly says its wound "cannot be canceled."
const FIGHT_WOUND_AMOUNT = { '2': 1, '3': 2, '4': 1, '5': 1, '6': 1, '7': 0.5 };
const FIGHT_WOUND_UNCANCELABLE = { '6': true };
const FIGHT_CARD_ABILITY_TEXT = {
  'A': 'The other player gains 1 LP, 1 Marshal Point, or 1 Wanted Point.',
  'K': 'The other player gains 1 LP.',
  'Q': 'The other player draws 1 Poker Card.',
  'J': 'The other player gains $10.',
  '10': 'Cancel this fight and start another. Shuffle these cards to the bottom of the deck, then draw again.',
  '9': 'The other player discards 1 Poker Card or loses $10.',
  '8': 'The other player gains 1 wound.',
  '7': 'The other player gains 1 wound or discards 1 random Poker Card.',
  '6': 'The other player gains 1 wound. This wound cannot be canceled.',
  '5': 'The other player gains 1 wound.',
  '4': 'The other player gains 1 wound and discards 1 Poker Card.',
  '3': 'The other player gains 2 wounds.',
  '2': 'The other player gains 1 wound and loses 1 LP.'
};

// Looks at what's actually still left in the persistent deck (state.fightDeck
// already excludes whatever's currently drawn) to reason about the odds of
// a redraw, the same way a card-counting player would: not by peeking at the
// exact next cards, just by knowing the composition of what's left.
function analyzeRemainingFightDeck() {
  const remaining = Array.isArray(state.fightDeck) ? state.fightDeck : [];
  const strongRemainingCount = remaining.filter(r => FIGHT_RANK_VALUE[r] >= FIGHT_RANK_VALUE['J']).length;
  const harmRemaining = remaining.filter(r => FIGHT_HARM_SCORE[r] !== undefined);
  const bestHarmRemaining = harmRemaining.length ? Math.max(...harmRemaining.map(r => FIGHT_HARM_SCORE[r])) : -Infinity;
  return { total: remaining.length, strongRemainingCount, bestHarmRemaining };
}

// Score-based NPC card choice, tuned around the fact that both sides draw
// from the same 13-card, 2-14 range: a Jack or better already wins roughly
// 3 of every 4 possible opposing draws (K/Q/A/A-tie all beat it, everything
// else loses to it), so it's worth defending even when a 10 is also
// available. If the opponent has a card-reducing weapon, that margin gets
// thinner (a reduced Jack is much closer to a coin flip), so the bar for
// "worth defending" moves up to Queen or better instead.
//
// Priority order:
//   1. A genuinely strong card (Jack+, or Queen+ if the opponent's weapon
//      might reduce it) - play it rather than trading it away.
//   2. Otherwise, a 10 - normally cancel and redraw, UNLESS what's actually
//      left in the deck argues against it:
//        - if most of the strong cards are still undrawn, the odds of a
//          winner next time are good - cancel.
//        - if every strong card is already accounted for elsewhere (a
//          winner is now impossible either way) AND the nastiest card still
//          left in the deck is worse than anything on hand right now, still
//          cancel - not to win, but because the next hand is likely to hit
//          harder.
//        - otherwise the deck's unremarkable either way - just play what's
//          already in hand instead of gambling on a redraw for nothing.
//   3. Otherwise, a 9 - it sits right at the deck's median, so it's still
//      a roughly even-odds play, worth taking over a guaranteed-harmful low
//      card.
//   4. Otherwise, everything on hand is an underdog (2-8) - maximize the
//      harmful effect instead of hoping for an unlikely win.
// Adjusts a card's base harm score for context the app can't otherwise see:
//   - If the opponent is one wound away from being bedridden (Western
//     Legends benches a player at 3 wounds), wound-dealing cards jump in
//     priority - especially rank 3 (deals 2 wounds at once, most likely to
//     cross the threshold by itself) and rank 6 (its wound explicitly can't
//     be prevented, so it's the most *reliable* way to cross it even if the
//     opponent has some other wound-cancelling effect available).
//   - If the opponent has no Poker Cards on hand, the discard portion of
//     rank 4's effect has nothing to discard - it still lands a wound, just
//     not the full effect the base score assumed.
// Adjusts a card's base harm score for context the app can't otherwise see.
// A wound the card text explicitly guarantees can't be prevented (rank 6)
// gets a small permanent edge, as a hedge against any wound-prevention
// effect elsewhere in the game.
//
// Two real rules matter here:
//   - Wounds cap at 3. Once the opponent is already at the max, any further
//     wound converts into a forced discard instead - or, if they also have
//     no Poker Cards left to discard, does nothing at all. So wound-dealing
//     cards get sharply discounted at max wounds, and nearly zeroed out if
//     the opponent's hand is also empty.
//   - Below the max, a forced discard with an empty hand converts into a
//     wound instead - the opposite direction. Only rank 4's discard is
//     unconditional (7 and 9 already have a built-in non-discard fallback),
//     so an empty-handed opponent makes 4 hit harder, not weaker.
function adjustedHarmScore(rank, opts) {
  let score = FIGHT_HARM_SCORE[rank] || 0;
  const wounds = FIGHT_WOUND_AMOUNT[rank] || 0;

  if (FIGHT_WOUND_UNCANCELABLE[rank]) score += 6;

  if (opts.opponentAtMaxWounds && wounds > 0) {
    score -= wounds * (opts.opponentHasNoPokerCards ? 30 : 10);
  } else if (opts.opponentHasNoPokerCards && rank === '4') {
    score += 15;
  }

  return score;
}

// Score-based NPC card choice. Both sides draw from the same 13-card,
// 2-14 range, and the NPC wins ties - so a card of value V beats exactly
// V-1 of the 13 possible opposing values (itself included, via the tie).
// That puts the true breakeven point between 7 (wins 6/13 = 46%) and
// 8 (wins 7/13 = 54%) - one rank lower than it would be without the tie
// rule - and a Jack already wins 10/13 = 77% of the time, more than
// enough to defend even when a 10 is also available.
//
// The bar for "worth defending" shifts with context:
//   - a card-reducing weapon pushes it up to Queen+ (a reduced Jack drops
//     to fighting at an effective 10, much closer to a coin flip);
//   - a high-stakes NPC (one whose defeat reward is unusually valuable -
//     a Bank Guard's $80 and 3 Wanted Points, a Sheriff avoiding jail, etc.)
//     pushes it back down to 8+ (the actual breakeven card), since losing
//     this particular fight costs more than usual;
//   - both together roughly cancel out, landing back on the Jack+ default.
//
// Priority order:
//   1. A card that clears the current defend threshold - play it rather
//      than trading it away.
//   2. Otherwise, a 10 - normally cancel and redraw, UNLESS what's actually
//      left in the deck argues against it:
//        - if most of the strong cards are still undrawn, the odds of a
//          winner next time are good - cancel.
//        - if every strong card is already accounted for elsewhere (a
//          winner is now impossible either way) AND the nastiest card still
//          left in the deck is worse than anything on hand right now, still
//          cancel - not to win, but because the next hand is likely to hit
//          harder.
//        - otherwise the deck's unremarkable either way - just play what's
//          already in hand instead of gambling on a redraw for nothing.
//   3. Otherwise, an 8 or 9 - both sit at/above the true breakeven once the
//      NPC's tie-win advantage is factored in, so they're still favored to
//      win more often than not (unless the defend threshold above already
//      claimed one of them).
//   4. Otherwise, everything on hand is an underdog (2-7) - maximize the
//      harmful effect instead of hoping for an unlikely win (adjusted for
//      wound-cap / missing Poker Cards, see adjustedHarmScore).
function chooseBestFightCard(ranks, options = {}) {
  if (!ranks || !ranks.length) return null;
  const opts = typeof options === 'boolean' ? { opponentHasReducingWeapon: options } : options;
  const hasTen = ranks.includes('10');
  const others = ranks.filter(r => r !== '10');
  const bestOtherValue = others.length ? Math.max(...others.map(r => FIGHT_RANK_VALUE[r])) : -Infinity;
  const bestOther = () => others.find(r => FIGHT_RANK_VALUE[r] === bestOtherValue);
  const harmSort = list => list.slice().sort((a, b) => adjustedHarmScore(b, opts) - adjustedHarmScore(a, opts));

  let defendThreshold = FIGHT_RANK_VALUE[opts.opponentHasReducingWeapon ? 'Q' : 'J'];
  if (opts.highStakesNpc) {
    defendThreshold = opts.opponentHasReducingWeapon ? FIGHT_RANK_VALUE['J'] : FIGHT_RANK_VALUE['8'];
  }
  if (bestOtherValue >= defendThreshold) return bestOther();

  if (hasTen) {
    const deck = analyzeRemainingFightDeck();
    const currentBestHarm = others.length
      ? Math.max(-Infinity, ...others.filter(r => FIGHT_HARM_SCORE[r] !== undefined).map(r => adjustedHarmScore(r, opts)))
      : -Infinity;
    const goodOddsOfAStrongRedraw = deck.strongRemainingCount >= 3;
    const harsherPunishmentAwaits = deck.strongRemainingCount === 0 && deck.bestHarmRemaining > currentBestHarm;
    if (!others.length || goodOddsOfAStrongRedraw || harsherPunishmentAwaits) return '10';
  }

  if (bestOtherValue >= FIGHT_RANK_VALUE['8']) return bestOther();
  if (others.length) return harmSort(others)[0];
  return hasTen ? '10' : null;
}

// --- Persistent virtual Fight deck ---------------------------------------
// Only 13 cards total; shuffled once at game start and persisted in state
// (state.fightDeck) so it survives save/reload of an in-progress game.
// Drawing takes cards off the top; discarding shuffles them back onto the
// bottom, exactly like the physical deck.
function ensureFightDeck() {
  if (!Array.isArray(state.fightDeck)) state.fightDeck = shuffleArray(FIGHT_RANKS);
}
function drawFightCardsFromDeck(count) {
  ensureFightDeck();
  const drawn = [];
  for (let i = 0; i < count && state.fightDeck.length; i++) drawn.push(state.fightDeck.shift());
  save();
  return drawn;
}
function discardFightCardsToDeck(ranks) {
  if (!ranks || !ranks.length) return;
  ensureFightDeck();
  state.fightDeck = state.fightDeck.concat(shuffleArray(ranks));
  save();
}


const ASSIST_GROUP_ICONS = {
  Fight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4l15 15M19 4L4 19M6 3l3 3-3 3M18 3l-3 3 3 3"/></svg>',
  Gambling: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-2.5 3.6-6 5.6-6 9a4 4 0 0 0 7 2.6V18H9v3h6v-3h-4v-3.4A4 4 0 0 0 18 12c0-3.4-3.5-5.4-6-9z"/></svg>',
  Dice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/></svg>',
  Randomizers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3c5 0 5 10 10 10h5M18 14l3 3-3 3M3 17h3c2.2 0 3.4-1.8 4.6-4M18 4l3 3-3 3M14 7h7"/></svg>',
  More: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
};

function assistGroupIcon(title) {
  return `<span class="assist-group-heading-icon">${ASSIST_GROUP_ICONS[title] || ASSIST_GROUP_ICONS.More}</span>`;
}

function openAssistMenu() {
  assistView = 'menu';
  assistNestedReturn = null;
  fightFlowReturnTarget = null;
  gamblingFlowReturnTarget = null;
  setAssistHeader('Game Assist', 'Quick Helpers');
  const groups = [
    { title: 'Fight', items: [
      { id: 'fightCards', title: 'Draw', desc: 'Auto-draw NPC Fight Card' },
      { id: 'fightFlow', title: 'Fight Flow', desc: 'Step-by-step fight guide' }
    ]},
    { title: 'Gambling', items: [
      { id: 'pokerHands', title: 'Poker Hands', desc: 'Which hand beats which.' },
      { id: 'pokerFlow', title: 'Poker', desc: 'Step-by-step Poker guide.' },
      ...(hasModule('ante_up_faro') ? [{ id: 'faroFlow', title: 'Faro', desc: 'Step-by-step Faro guide.' }] : []),
      ...(hasModule('ante_up_high_stakes_poker') ? [{ id: 'highStakesPokerFlow', title: 'High Stakes Poker', desc: 'Step-by-step high stakes guide.' }] : [])
    ]},
    { title: 'Dice', items: [
      { id: 'prospectDiceMenu', title: 'Prospecting Dice', desc: 'Roll Prospecting Dice' },
      ...(hasModule('blood_money_risk_die') ? [{ id: 'riskDiceMenu', title: 'Risk Die', desc: 'Roll the Risk Die.' }] : [])
    ]},
    { title: 'Randomizers', items: [
      { id: 'firstPlayer', title: 'First Player', desc: 'Choose first player' },
      { id: 'randomPlayer', title: 'Random Player', desc: 'Pick a random player color.' },
      { id: 'storeRandomizer', title: 'Store Randomizer', desc: hasModule('ante_up_sideboard') ? 'Fill General Store/Trading Post' : 'Fill General Store' }
    ]}
  ];
  const extras = [];
  if (hasModule('ante_up_train')) extras.push({ id: 'train', title: 'Train Assist', desc: 'Quick train reminder.' });
  if (hasModule('hunting_animals')) extras.push({ id: 'hunt', title: 'Hunting Assist', desc: 'Quick hunt challenge placeholder.' });
  if (hasModule('fishing_fish_deck')) extras.push({ id: 'fish', title: 'Fishing Assist', desc: 'Quick fishing placeholder.' });
  if (hasModule('foraging_resources')) extras.push({ id: 'forage', title: 'Foraging Assist', desc: 'Quick forage/crafting placeholder.' });
  if (extras.length) groups.push({ title: 'More', items: extras });

  assistBody.innerHTML = groups.map(group => `<div class="assist-group">
    <h3 class="assist-group-title">${assistGroupIcon(group.title)}<span>${escapeHtml(group.title)}</span></h3>
    <div class="assist-choice-list">${group.items.map(item => `<button type="button" class="assist-choice assist-choice-no-icon" data-assist-open="${item.id}"><span class="assist-choice-copy"><strong>${item.title}</strong><small>${item.desc}</small></span></button>`).join('')}</div>
  </div>`).join('');
  assistBody.querySelectorAll('[data-assist-open]').forEach(btn => btn.onclick = () => openAssist(btn.dataset.assistOpen));
  showAssistDialog();
}

// A lightweight wrapper for showing static reference-style content (steps,
// tables, lists) inside the Assist dialog, reusing the exact same content
// generators as the full Rules screen so the two never drift apart.
function renderReferenceStyleAssist(title, contentHtml, type = 'Reference') {
  setAssistHeader(title, type);
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel reference-assist-panel">${contentHtml}</div>`;
  bindAssistBack();
  showAssistDialog();
}

// Opens the dice roller preset to a specific die type/count - used by the
// "Prospecting Dice" and "Risk Die" Assist menu buttons so each starts
// fresh with the expected default rather than whatever was left over from
// an earlier session.
function openDiceAssist(defaultType) {
  if (defaultType === 'risk' && hasModule('blood_money_risk_die')) {
    prospectDiceState = { dice: [{ type: 'risk', face: DICE_TYPES.risk.outcomes[0] }], selectedType: 'risk' };
  } else {
    prospectDiceState = { dice: [{ type: 'prospecting', face: 'gold' }, { type: 'prospecting', face: 'gold' }], selectedType: 'prospecting' };
  }
  renderProspectingAssist();
}

function openAssist(kind) {
  assistView = 'detail';
  if (kind === 'fightCards') return renderFightCardAssist();
  if (kind === 'fightFlow') { fightFlowReturnTarget = null; return renderFightFlowAssist(null); }
  if (kind === 'pokerHands') return renderReferenceStyleAssist('Poker Hands', renderPokerHandsReference(), 'Gambling Reference');
  if (kind === 'pokerFlow') { gamblingFlowReturnTarget = null; return renderGamblingAssist('poker', null); }
  if (kind === 'faroFlow') { gamblingFlowReturnTarget = null; return renderGamblingAssist('faro', null); }
  if (kind === 'highStakesPokerFlow') { gamblingFlowReturnTarget = null; return renderGamblingAssist('high_stakes', null); }
  if (kind === 'prospectDiceMenu') return openDiceAssist('prospecting');
  if (kind === 'riskDiceMenu') return openDiceAssist('risk');
  if (kind === 'randomPlayer') return renderRandomPlayerAssist();
  if (kind === 'firstPlayer') return renderFirstPlayerAssist();
  if (kind === 'storeRandomizer') return renderStoreRandomizerAssist();
  return renderSimpleAssist(kind);
}

function setAssistHeader(title, type = 'Trail Helper') {
  document.getElementById('assistTitle').textContent = title;
  document.getElementById('assistType').textContent = type;
}

function showAssistDialog() {
  if (assistTitle.textContent !== 'First Player') assistDialog.classList.remove('first-player-dialog');
  if (!assistDialog.open) assistDialog.showModal();
}

function closeAssist() {
  assistDialog.classList.remove('first-player-dialog');
  if (assistDialog.open) assistDialog.close();
}

function handleAssistCloseRequest() {
  if (!assistDialog.open) return;
  if (assistNestedReturn === 'fightFlow') {
    resetFightCardHand();
    renderFightFlowAssist(fightFlowReturnTarget);
    return;
  }
  if (assistNestedReturn === 'gamblingFlow') {
    renderGamblingAssist(gamblingFlowSelection, gamblingFlowReturnTarget);
    return;
  }
  if (assistNestedReturn === 'actions') {
    renderActionsAssist();
    return;
  }
  if (assistNestedReturn === 'reference') {
    assistNestedReturn = null;
    closeAssist();
    return;
  }
  if (assistView !== 'menu') {
    assistReturnAfterClose = true;
    assistDialog.close();
    return;
  }
  closeAssist();
}

function assistBackButton() {
  return '';
}

function bindAssistBack() {
  // The universal X acts as Back for a helper and Close at the helper menu.
}

// Session-only (not persisted): the currently-drawn hand for this screen.
// { count, npcType, flowTargetLabel, flowCountHint, cards: [{rank, revealed}], chosenIndex, hasDrawn }
let fightCardState = null;

const FIGHT_CARD_NPC_PRESETS = {
  bandit: { label: 'Bandit', count: 2 },
  bank_guard: { label: 'Bank Guard', count: 3 },
  sheriff: { label: 'Sheriff', count: 4 },
  other: { label: 'Other', count: 2 }
};

function createFightCardState(npcType = 'bandit', count = null, context = {}) {
  const preset = FIGHT_CARD_NPC_PRESETS[npcType] || FIGHT_CARD_NPC_PRESETS.other;
  const resolvedCount = Math.max(1, Math.min(FIGHT_RANKS.length, Number(count) || preset.count));
  return {
    npcType: FIGHT_CARD_NPC_PRESETS[npcType] ? npcType : 'other',
    count: resolvedCount,
    cards: Array.from({ length: resolvedCount }, () => ({ rank: null, revealed: false })),
    chosenIndex: null,
    hasDrawn: false,
    opponentHasWeapon: false,
    opponentAtMaxWounds: false,
    opponentHasNoPokerCards: false,
    highStakesNpc: npcType === 'bank_guard' || npcType === 'sheriff',
    flowTargetLabel: context.flowTargetLabel || '',
    flowCountHint: context.flowCountHint || ''
  };
}

// Called whenever the assist dialog closes - any cards still "in hand" that
// were actually drawn from the deck get shuffled back in, so closing the
// screen mid-fight never lets cards silently leak out of the 13-card deck.
function resetFightCardHand() {
  if (fightCardState && fightCardState.hasDrawn) {
    const ranks = fightCardState.cards.filter(c => c.rank).map(c => c.rank);
    discardFightCardsToDeck(ranks);
  }
  fightCardState = null;
}

function fightCardImgHtml(rank, showFront) {
  const src = showFront ? fightCardFrontSrc(rank) : FIGHT_CARD_BACK_SRC;
  const alt = showFront ? `Fight card ${rank}` : 'Fight card back';
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.closest('.fight-card-3d').classList.add('store-slot-noart');this.remove();">`;
}
function fightCardFaceInner(rank, showFront) {
  const art = `<span class="fight-card-art">${fightCardImgHtml(rank, showFront)}</span>`;
  if (!showFront) return art;
  return art + `<span class="fight-card-overlay"><span class="fight-card-rank">${escapeHtml(rank)}</span></span>`;
}
function renderFightCardEl(index) {
  const entry = fightCardState.cards[index];
  const stateClass = entry.revealed ? 'fight-card-front-state' : 'fight-card-back-state';
  const chosenClass = fightCardState.chosenIndex === index ? 'fight-card-chosen' : '';
  return `<div class="fight-card-3d ${stateClass} ${chosenClass}" data-card-index="${index}">
    <div class="fight-card-face" data-card-face>${fightCardFaceInner(entry.rank, entry.revealed)}</div>
  </div>`;
}
function updateFightCardDom(container, rank, showFront) {
  const face = container.querySelector('[data-card-face]');
  container.classList.toggle('fight-card-front-state', showFront);
  container.classList.toggle('fight-card-back-state', !showFront);
  face.innerHTML = fightCardFaceInner(rank, showFront);
}

function ensureFightCardState() {
  if (!fightCardState) fightCardState = createFightCardState('bandit');
  return fightCardState;
}

function fightCardPresetForFlow(type) {
  if (!type || type.kind !== 'npc') return { npcType: 'other', count: 2, flowTargetLabel: '', flowCountHint: '' };
  if (type.npcType && type.npcType !== 'other') {
    return { npcType: type.npcType, count: type.cards || FIGHT_CARD_NPC_PRESETS[type.npcType]?.count || 2, flowTargetLabel: '', flowCountHint: '' };
  }
  const hint = type.value === 'npc_train_guard'
    ? 'Use the Fight Card count shown on the Train Encounter card.'
    : `Use the Fight Card count shown on ${type.countSource || 'the NPC component'}.`;
  return { npcType: 'other', count: 2, flowTargetLabel: type.label, flowCountHint: hint };
}

function openFightCardFromFlow(source = 'assist') {
  const type = selectedFightFlowType();
  if (!type || type.kind !== 'npc') return;
  resetFightCardHand();
  const preset = fightCardPresetForFlow(type);
  fightCardState = createFightCardState(preset.npcType, preset.count, preset);
  assistNestedReturn = source === 'reference' ? 'reference' : 'fightFlow';
  if (source === 'reference') {
    assistReturnTarget = null;
    assistReturnAfterClose = false;
  }
  assistView = 'detail';
  renderFightCardAssist();
}

function changeFightCardOpponent(npcType) {
  const previous = ensureFightCardState();
  if (previous.hasDrawn) {
    const ranks = previous.cards.filter(c => c.rank).map(c => c.rank);
    if (ranks.length) discardFightCardsToDeck(ranks);
  }
  const preset = FIGHT_CARD_NPC_PRESETS[npcType] || FIGHT_CARD_NPC_PRESETS.other;
  const next = createFightCardState(npcType, preset.count);
  next.opponentHasWeapon = previous.opponentHasWeapon;
  next.opponentAtMaxWounds = previous.opponentAtMaxWounds;
  next.opponentHasNoPokerCards = previous.opponentHasNoPokerCards;
  next.highStakesNpc = npcType === 'bank_guard' || npcType === 'sheriff';
  fightCardState = next;
  renderFightCardAssist();
}

function renderFightCardAssist() {
  setAssistHeader('Draw Fight Cards', 'Fight Helper');
  const st = ensureFightCardState();
  const chosenRank = st.chosenIndex != null ? st.cards[st.chosenIndex]?.rank : null;
  const customCount = st.npcType === 'other';
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    <div class="fight-card-opponent-control ${customCount ? 'has-custom-count' : 'fixed-count'}">
      <label><span>NPC</span><select data-fc-opponent>
        ${Object.entries(FIGHT_CARD_NPC_PRESETS).map(([value, preset]) => `<option value="${value}" ${st.npcType === value ? 'selected' : ''}>${escapeHtml(preset.label)}${value === 'other' ? '' : ` — ${preset.count} cards`}</option>`).join('')}
      </select></label>
      ${customCount ? `<div class="fight-card-count-control">
        <span>Fight Cards</span>
        <div class="dice-count-control"><button type="button" class="small-btn" data-fc-minus aria-label="Draw one fewer Fight Card">−</button><strong>${st.count}</strong><button type="button" class="small-btn" data-fc-plus aria-label="Draw one more Fight Card">+</button></div>
      </div>` : ''}
    </div>
    ${st.flowTargetLabel ? `<div class="fight-card-flow-context"><strong>${escapeHtml(st.flowTargetLabel)}</strong><span>${escapeHtml(st.flowCountHint)}</span></div>` : ''}
    <p class="assist-hint">${st.hasDrawn ? 'Tap a face-down card to peek at it. Tap any revealed card to view it full size.' : 'Tap Draw to draw this many Fight Cards and reveal the NPC\u2019s best play.'}</p>
    <div class="fight-card-grid" data-fight-card-area>${st.cards.map((c, i) => renderFightCardEl(i)).join('')}</div>
    ${chosenRank ? `<div class="dialog-reward fight-card-chosen-note"><strong>NPC plays the ${escapeHtml(chosenRank)}:</strong> ${escapeHtml(FIGHT_CARD_ABILITY_TEXT[chosenRank] || '')}</div>` : ''}
    <details class="fight-context-toggles">
      <summary>Advanced: refine the NPC's decision</summary>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-weapon ${st.opponentHasWeapon ? 'checked' : ''}> Opponent has a card-reducing weapon</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-maxwounds ${st.opponentAtMaxWounds ? 'checked' : ''}> Opponent already has 3 wounds (the max)</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-stakes ${st.highStakesNpc ? 'checked' : ''}> This NPC\u2019s defeat reward is especially valuable (Bank Guard, Sheriff, etc.)</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-nopoker ${st.opponentHasNoPokerCards ? 'checked' : ''}> Opponent has no Poker Cards to discard</label>
    </details>
    <button type="button" class="primary-btn assist-action-btn-centered" data-fc-draw>${st.hasDrawn ? 'Re-Draw' : 'Draw'}</button>
  </div>`;
  bindAssistBack();
  assistBody.querySelector('[data-fc-opponent]').onchange = event => changeFightCardOpponent(event.target.value);
  assistBody.querySelector('[data-fc-weapon]').onchange = event => { fightCardState.opponentHasWeapon = event.target.checked; };
  assistBody.querySelector('[data-fc-maxwounds]').onchange = event => { fightCardState.opponentAtMaxWounds = event.target.checked; };
  assistBody.querySelector('[data-fc-stakes]').onchange = event => { fightCardState.highStakesNpc = event.target.checked; };
  assistBody.querySelector('[data-fc-nopoker]').onchange = event => { fightCardState.opponentHasNoPokerCards = event.target.checked; };
  const minusBtn = assistBody.querySelector('[data-fc-minus]');
  const plusBtn = assistBody.querySelector('[data-fc-plus]');
  if (minusBtn) minusBtn.onclick = () => adjustFightCardCount(-1);
  if (plusBtn) plusBtn.onclick = () => adjustFightCardCount(1);
  assistBody.querySelector('[data-fc-draw]').onclick = () => animateFightCardDraw();
  assistBody.querySelector('[data-fight-card-area]').onclick = event => {
    const cardEl = event.target.closest('[data-card-index]');
    if (!cardEl) return;
    const index = Number(cardEl.dataset.cardIndex);
    const entry = fightCardState.cards[index];
    if (!entry || !entry.rank) return;
    if (entry.revealed) showFullscreenImage(fightCardFrontSrc(entry.rank), `Fight Card ${entry.rank}`, '');
    else animatePeekFightCard(index);
  };
  showAssistDialog();
}

function adjustFightCardCount(delta) {
  const st = ensureFightCardState();
  if (st.npcType !== 'other') return;
  const next = Math.max(1, Math.min(FIGHT_RANKS.length, st.count + delta));
  if (next === st.count) return;
  if (next < st.count) {
    const removed = st.cards.slice(next).filter(c => c.rank).map(c => c.rank);
    if (removed.length) discardFightCardsToDeck(removed);
    st.cards.length = next;
    if (st.chosenIndex != null && st.chosenIndex >= next) st.chosenIndex = null;
  } else {
    while (st.cards.length < next) st.cards.push({ rank: null, revealed: false });
  }
  st.count = next;
  renderFightCardAssist();
}

// Flips a single face-down card to reveal it without changing which card is
// "chosen" for the fight - just a peek.
function animatePeekFightCard(index) {
  const cardEl = assistBody.querySelector(`[data-card-index="${index}"]`);
  if (!cardEl) return;
  const face = cardEl.querySelector('[data-card-face]');
  const entry = fightCardState.cards[index];
  if (!entry || entry.revealed) return;
  flipStoreSlotFace(face, () => {
    entry.revealed = true;
    updateFightCardDom(cardEl, entry.rank, true);
  });
}

// Discards whatever's currently in hand, draws a fresh set from the
// persistent deck, runs the NPC's card-choice logic, and animates: any
// currently-revealed card flips back to its back first, then the newly
// chosen card flips forward to reveal itself. Reuses the exact same
// scaleX flip helper built for the Store Randomizer.
function animateFightCardDraw() {
  const st = ensureFightCardState();
  if (st.hasDrawn) {
    const inHand = st.cards.filter(c => c.rank).map(c => c.rank);
    if (inHand.length) discardFightCardsToDeck(inHand);
  }
  const drawnRanks = drawFightCardsFromDeck(st.count);
  const chosenLocalIndex = drawnRanks.length ? drawnRanks.indexOf(chooseBestFightCard(drawnRanks, {
    opponentHasReducingWeapon: st.opponentHasWeapon,
    opponentAtMaxWounds: st.opponentAtMaxWounds,
    opponentHasNoPokerCards: st.opponentHasNoPokerCards,
    highStakesNpc: st.highStakesNpc
  })) : -1;

  assistBody.querySelector('[data-fc-draw]').disabled = true;
  const cardEls = assistBody.querySelectorAll('[data-card-index]');
  const flips = [];
  cardEls.forEach((el, i) => {
    const face = el.querySelector('[data-card-face]');
    const wasRevealed = st.cards[i] && st.cards[i].revealed;
    const newRank = drawnRanks[i] || null;
    const willReveal = i === chosenLocalIndex;
    if (wasRevealed) {
      flips.push(
        flipStoreSlotFace(face, () => updateFightCardDom(el, newRank, false), i * 40)
          .then(() => willReveal ? flipStoreSlotFace(face, () => updateFightCardDom(el, newRank, true), 90) : null)
      );
    } else if (willReveal) {
      flips.push(flipStoreSlotFace(face, () => updateFightCardDom(el, newRank, true), i * 40));
    } else {
      updateFightCardDom(el, newRank, false);
    }
  });
  fightCardState = {
    npcType: st.npcType,
    flowTargetLabel: st.flowTargetLabel || '',
    flowCountHint: st.flowCountHint || '',
    count: st.count,
    cards: drawnRanks.map((rank, i) => ({ rank, revealed: i === chosenLocalIndex })),
    chosenIndex: chosenLocalIndex >= 0 ? chosenLocalIndex : null,
    hasDrawn: true,
    opponentHasWeapon: st.opponentHasWeapon,
    opponentAtMaxWounds: st.opponentAtMaxWounds,
    opponentHasNoPokerCards: st.opponentHasNoPokerCards,
    highStakesNpc: st.highStakesNpc
  };
  Promise.all(flips).then(() => renderFightCardAssist());
}

function renderGamblingAssist(game = null, returnTarget = gamblingFlowReturnTarget) {
  gamblingFlowReturnTarget = returnTarget || null;
  if (game) gamblingFlowSelection = game;
  normalizeGamblingFlowSelection();
  assistNestedReturn = gamblingFlowReturnTarget || null;
  setAssistHeader('Gambling Flow', 'Gambling Helper');
  assistBody.innerHTML = `<div class="assist-panel reference-assist-panel gambling-flow-assist-panel"><div data-gambling-flow-host>${renderGamblingSequenceReference()}</div></div>`;
  bindGamblingFlowInteractions(assistBody.querySelector('[data-gambling-flow-host]'), 'assist');
  showAssistDialog();
}

function renderAssistDetailStep(number, title, detail) {
  return `<details class="ref-step" open><summary><span class="step-number">${number}</span><strong>${title}</strong></summary><p>${escapeHtml(detail)}</p></details>`;
}

// Each die "type" defines its own 4 outcomes mapped onto the 6 physical
// cube faces (3 faces share the most-common outcome, matching a real d6),
// its own images/labels, and (for anything beyond the base Prospecting Die)
// which module has to be active before it's even offered as an option.
//
// NOTE ON THE RISK DIE: Blood Money's rulebook describes it only in general
// terms ("can award Story Points; can also result in wounds, sometimes a
// combination of both") - I could not find its exact face-by-face makeup,
// so this mapping is a best-effort placeholder using that description,
// structured the same way as the Prospecting Die (3 common/1/1/1). Please
// verify against the physical die and adjust DICE_TYPES.risk below (and the
// image filenames) if it doesn't match.
const DICE_TYPES = {
  prospecting: {
    label: 'Prospecting Die',
    requiredModule: null,
    outcomes: ['gold', 'gold', 'gold', 'money', 'reroll', 'miss'],
    images: {
      gold: 'assets/images/dice/face-nugget.png',
      money: 'assets/images/dice/face-money.png',
      reroll: 'assets/images/dice/face-reroll.png',
      miss: 'assets/images/dice/face-null.png'
    },
    labels: { gold: 'Gold Nugget', money: 'Money', reroll: '$ + Reroll', miss: 'Miss' },
    slotMap: { front: 'gold', back: 'gold', right: 'gold', left: 'money', top: 'reroll', bottom: 'miss' }
  },
  risk: {
    label: 'Risk Die',
    requiredModule: 'blood_money_risk_die',
    outcomes: ['blank', 'wound', 'wound', 'doublewound', 'storypoint', 'woundstorypoint'],
    // Use the supplied per-face Risk Die artwork when available. The die
    // renderer falls back to readable text if any face image is unavailable.
    images: {
      blank: 'assets/images/dice/risk-blank.png',
      wound: 'assets/images/dice/risk-wound.png',
      doublewound: 'assets/images/dice/risk-woundwound.png',
      storypoint: 'assets/images/dice/risk-sp.png',
      woundstorypoint: 'assets/images/dice/risk-woundsp.png'
    },
    labels: { blank: 'Blank', wound: 'Gain 1 wound', doublewound: 'Gain 2 wounds', storypoint: 'Gain 1 Story Point', woundstorypoint: 'Gain 1 wound + 1 Story Point' },
    slotMap: { front: 'woundstorypoint', back: 'blank', right: 'wound', left: 'wound', top: 'storypoint', bottom: 'doublewound' }
  }
};
const PROSPECT_DICE_SFX = 'audio/sfx/sfx_dice.mp3';
const PROSPECT_ROLL_MS = 820;

// A physical cube only has 6 faces but each die type has 4 distinct
// outcomes (its most common one appears on 3 of them) - this maps every
// physical face to the cube rotation that brings it to face the camera
// (the exact inverse of that face's own build-time transform), per type.
const CUBE_FACE_GEOMETRY = [
  { face: 'front', x: 0, y: 0 },
  { face: 'back', x: 0, y: 180 },
  { face: 'right', x: 0, y: -90 },
  { face: 'left', x: 0, y: 90 },
  { face: 'top', x: -90, y: 0 },
  { face: 'bottom', x: 90, y: 0 }
];
const DICE_TYPE_FACE_OPTIONS = Object.fromEntries(Object.entries(DICE_TYPES).map(([typeKey, type]) => [
  typeKey,
  CUBE_FACE_GEOMETRY.reduce((map, g) => { (map[type.slotMap[g.face]] ||= []).push(g); return map; }, {})
]));

function availableDiceTypes() {
  return Object.entries(DICE_TYPES).filter(([, type]) => !type.requiredModule || hasModule(type.requiredModule));
}

// Uniform 1-in-6 pick across a type's 6 physical faces via Math.random() -
// each call is an independent, uniformly distributed draw. See the
// accompanying test suite for an empirical check across tens of thousands
// of rolls confirming the observed frequencies track the expected split.
function rollDieFace(typeKey) {
  const outcomes = DICE_TYPES[typeKey]?.outcomes || DICE_TYPES.prospecting.outcomes;
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function cubeRestTransform(typeKey, outcomeKey) {
  const options = DICE_TYPE_FACE_OPTIONS[typeKey]?.[outcomeKey] || DICE_TYPE_FACE_OPTIONS.prospecting.gold;
  const target = options[0];
  return `rotateX(${target.x}deg) rotateY(${target.y}deg)`;
}
// Builds the target rotation for a given outcome, with extra full spins
// (in a random direction per axis) layered on top so the transition actually
// tumbles through several turns instead of just snapping to the resting
// angle. Because start/end transforms use the same rotateX()/rotateY()
// function order, the browser interpolates each angle independently rather
// than taking a "shortest path" through the matrix - so this reliably spins.
function cubeSpinTransform(typeKey, outcomeKey) {
  const options = DICE_TYPE_FACE_OPTIONS[typeKey]?.[outcomeKey] || DICE_TYPE_FACE_OPTIONS.prospecting.gold;
  const target = options[Math.floor(Math.random() * options.length)];
  const spinsX = (2 + Math.floor(Math.random() * 2)) * (Math.random() < .5 ? 1 : -1);
  const spinsY = (2 + Math.floor(Math.random() * 2)) * (Math.random() < .5 ? 1 : -1);
  return `rotateX(${target.x + 360 * spinsX}deg) rotateY(${target.y + 360 * spinsY}deg)`;
}

function dieCubeMarkup(typeKey) {
  const type = DICE_TYPES[typeKey] || DICE_TYPES.prospecting;
  const face = slotFace => {
    const outcomeKey = type.slotMap[slotFace];
    const label = type.labels[outcomeKey] || outcomeKey;
    const image = type.images?.[outcomeKey];
    const content = image
      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(label)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="die-face-text" hidden>${escapeHtml(label)}</span>`
      : `<span class="die-face-text">${escapeHtml(label)}</span>`;
    return `<div class="die-face die-face-${slotFace}">${content}</div>`;
  };
  return `<div class="die-cube" data-cube>${['front', 'back', 'right', 'left', 'top', 'bottom'].map(face).join('')}</div>`;
}

// Persists across renders of this screen (added/removed dice keep their
// current face instead of resetting) and across individual reroll timers,
// since those now update this array directly instead of round-tripping
// through a full re-render. Each die remembers its own type, so a session
// can freely mix Prospecting and Risk dice together.
let prospectDiceState = null;
// dieIndex -> pending completion timeoutId, so re-clicking a die that's
// mid-roll cancels ONLY that die's own pending completion and starts fresh,
// without touching any other die's in-flight roll.
const prospectDieTimers = {};

function ensureProspectDiceState() {
  if (!prospectDiceState) {
    prospectDiceState = { dice: [{ type: 'prospecting', face: 'gold' }, { type: 'prospecting', face: 'gold' }], selectedType: 'prospecting' };
  }
  return prospectDiceState;
}

function addProspectDie() {
  const st = ensureProspectDiceState();
  if (st.dice.length >= 6) return;
  const type = DICE_TYPES[st.selectedType] ? st.selectedType : 'prospecting';
  st.dice.push({ type, face: DICE_TYPES[type].outcomes[0] });
}
function removeProspectDie() {
  const st = ensureProspectDiceState();
  if (st.dice.length > 1) st.dice.pop();
}

function updateRollAllButtonState() {
  const btn = assistBody.querySelector('[data-roll-all]');
  if (btn) btn.disabled = Object.keys(prospectDieTimers).length > 0;
}

function renderProspectingAssist() {
  const st = ensureProspectDiceState();
  setAssistHeader(st.selectedType === 'risk' ? 'Risk Die' : 'Prospecting Dice', 'Dice Roller');
  const typeOptions = availableDiceTypes();
  const showTypeSelect = typeOptions.length > 1;
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    ${showTypeSelect ? `<label class="dice-type-select-label">Die Type
      <select data-dice-type-select>${typeOptions.map(([key, type]) => `<option value="${key}" ${st.selectedType === key ? 'selected' : ''}>${escapeHtml(type.label)}</option>`).join('')}</select>
    </label>` : ''}
    <div class="dice-count-control"><button type="button" class="small-btn" data-prospect-minus>−</button><strong>${st.dice.length}</strong><button type="button" class="small-btn" data-prospect-plus>+</button></div>
    <div class="prospect-dice-area" data-roll-prospect aria-label="Roll dice">
      ${st.dice.map((d, index) => `<div class="prospect-die-3d" data-die-index="${index}" data-face="${d.face}" data-die-type="${d.type}">
        <div class="prospect-die-cube-wrap">${dieCubeMarkup(d.type)}</div>
        <div class="prospect-die-label">${escapeHtml(DICE_TYPES[d.type]?.labels[d.face] || '')}</div>
      </div>`).join('')}
    </div>
    <button type="button" class="primary-btn assist-action-btn-centered" data-roll-all>Roll All Dice</button>
  </div>`;
  bindAssistBack();
  // Snap every cube straight to its resting orientation (no animation) so a
  // fresh render never visibly spins - only an actual roll/reroll should.
  assistBody.querySelectorAll('[data-die-index]').forEach(el => {
    const cube = el.querySelector('[data-cube]');
    cube.style.transition = 'none';
    cube.style.transform = cubeRestTransform(el.dataset.dieType, el.dataset.face);
    void cube.offsetWidth;
    cube.style.transition = '';
  });
  if (showTypeSelect) {
    assistBody.querySelector('[data-dice-type-select]').onchange = event => { prospectDiceState.selectedType = event.target.value; renderProspectingAssist(); };
  }
  assistBody.querySelector('[data-prospect-minus]').onclick = () => { removeProspectDie(); renderProspectingAssist(); };
  assistBody.querySelector('[data-prospect-plus]').onclick = () => { addProspectDie(); renderProspectingAssist(); };
  assistBody.querySelector('[data-roll-all]').onclick = () => animateProspectRollAll();
  assistBody.querySelector('[data-roll-prospect]').onclick = event => {
    const dieEl = event.target.closest('[data-die-index]');
    if (dieEl) animateProspectReroll(Number(dieEl.dataset.dieIndex));
  };
  enableShakeToRollDice();
  showAssistDialog();
}

function playSoundEffect(src) {
  if (!src || !state.settings.soundOn) return;
  sfxPlayer.src = src;
  sfxPlayer.currentTime = 0;
  sfxPlayer.play().catch(()=>{});
}

// Warms the browser's cache for a sound effect so the first time it's
// actually played (e.g. the first dice roll of a session) doesn't stall
// waiting on the initial fetch/decode.
function preloadAudio(src) {
  if (!src) return;
  const warm = new Audio(src);
  warm.preload = 'auto';
  warm.load();
}

// The shared sfxPlayer element can only play one sound at a time - reusing
// it for several dice landing/spinning in quick succession would cut off
// each previous sound. Each call here spins up its own independent Audio
// instance so overlapping dice genuinely layer their sounds together.
function playOverlappingSoundEffect(src) {
  if (!src || !state.settings.soundOn) return;
  const clip = new Audio(src);
  clip.volume = state.settings.soundVolume ?? 0.6;
  clip.play().catch(() => {});
}

// Rolls exactly one die (by index) without touching any other die's DOM,
// state, or in-flight timer. Re-clicking a die that's already spinning
// cancels only its own pending completion and restarts the spin, redirecting
// smoothly from its current mid-flight angle since we're just updating the
// same transform property again rather than tearing anything down.
// After a roll settles, the cube's transform is left at whatever oversized
// absolute angle (e.g. rotateX(-1080deg)) the spin happened to produce.
// Left alone, the NEXT roll's "spin distance" becomes the gap between that
// arbitrary leftover number and the new target - which can be huge on one
// axis and tiny on the other, making rolls look inconsistent (sometimes
// barely moving, sometimes spinning on only one axis). Snapping back down to
// the small canonical rest angle is visually invisible (same orientation,
// mod 360) but keeps every future roll's spin distance consistent.
function snapCubeToRest(cube, typeKey, face) {
  if (!cube) return;
  cube.style.transition = 'none';
  cube.style.transform = cubeRestTransform(typeKey, face);
  void cube.offsetWidth;
  cube.style.transition = '';
}

function animateProspectReroll(index) {
  playOverlappingSoundEffect(PROSPECT_DICE_SFX);
  if (prospectDieTimers[index]) { clearTimeout(prospectDieTimers[index]); delete prospectDieTimers[index]; }
  const dieEl = assistBody.querySelector(`[data-die-index="${index}"]`);
  if (!dieEl) return;
  const type = dieEl.dataset.dieType;
  const cube = dieEl.querySelector('[data-cube]');
  const label = dieEl.querySelector('.prospect-die-label');
  const nextFace = rollDieFace(type);
  if (label) label.textContent = '';
  if (cube) cube.style.transform = cubeSpinTransform(type, nextFace);
  updateRollAllButtonState();
  prospectDieTimers[index] = setTimeout(() => {
    delete prospectDieTimers[index];
    if (prospectDiceState) prospectDiceState.dice[index].face = nextFace;
    dieEl.dataset.face = nextFace;
    if (label) label.textContent = DICE_TYPES[type]?.labels[nextFace] || '';
    snapCubeToRest(cube, type, nextFace);
    updateRollAllButtonState();
  }, PROSPECT_ROLL_MS);
}

// Rolls every die at once, each with its own independent staggered timer
// (reusing the exact same per-die completion logic as a single reroll) so
// mixing "Roll All" with individual die taps can never corrupt each other.
function animateProspectRollAll() {
  const dieEls = assistBody.querySelectorAll('[data-die-index]');
  dieEls.forEach((el, i) => {
    if (prospectDieTimers[i]) { clearTimeout(prospectDieTimers[i]); delete prospectDieTimers[i]; }
    const type = el.dataset.dieType;
    const cube = el.querySelector('[data-cube]');
    const label = el.querySelector('.prospect-die-label');
    if (label) label.textContent = '';
    const nextFace = rollDieFace(type);
    setTimeout(() => {
      playOverlappingSoundEffect(PROSPECT_DICE_SFX);
      if (cube) cube.style.transform = cubeSpinTransform(type, nextFace);
    }, i * 45);
    prospectDieTimers[i] = setTimeout(() => {
      delete prospectDieTimers[i];
      if (prospectDiceState) prospectDiceState.dice[i].face = nextFace;
      el.dataset.face = nextFace;
      if (label) label.textContent = DICE_TYPES[type]?.labels[nextFace] || '';
      snapCubeToRest(cube, type, nextFace);
      updateRollAllButtonState();
    }, i * 45 + PROSPECT_ROLL_MS);
  });
  updateRollAllButtonState();
}

// Shake-to-roll: brief device shake rolls all dice while the Prospecting
// Dice screen is open. Requests iOS 13+ motion permission the first time
// this screen opens (from within that same tap, satisfying the user-gesture
// requirement); silently does nothing on devices/browsers without motion
// support. Once attached, the listener stays attached for the rest of the
// session and simply no-ops whenever this screen isn't the one open.
let shakeListenerAttached = false;
let lastShakeAt = 0;
const SHAKE_DELTA_THRESHOLD = 18;
const SHAKE_COOLDOWN_MS = 1500;

function handleDeviceMotionForDice(event) {
  if (!assistDialog.open || !assistBody.querySelector('[data-roll-prospect]')) return;
  const acc = event.accelerationIncludingGravity || event.acceleration;
  if (!acc) return;
  const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
  if (Math.abs(magnitude - 9.8) < SHAKE_DELTA_THRESHOLD) return;
  const now = Date.now();
  if (now - lastShakeAt < SHAKE_COOLDOWN_MS) return;
  lastShakeAt = now;
  if (assistBody.querySelectorAll('[data-die-index]').length) animateProspectRollAll();
}

function enableShakeToRollDice() {
  if (shakeListenerAttached) return;
  const attach = () => { window.addEventListener('devicemotion', handleDeviceMotionForDice); shakeListenerAttached = true; };
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(result => { if (result === 'granted') attach(); }).catch(() => {});
  } else if (typeof DeviceMotionEvent !== 'undefined') {
    attach();
  }
}

function shuffleArray(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function eligibleStoreItems() {
  return (db.items?.items || []).filter(isSetupVisualVisible);
}

function isTradingPostActive() {
  const cfg = db.items?.storeLayout?.tradingPost;
  if (!cfg) return false;
  return isSetupVisualVisible(cfg);
}

function generateStoreLayout() {
  const pool = shuffleArray(eligibleStoreItems());
  const generalSlots = db.items?.storeLayout?.generalStore?.slots || 6;
  const tradingActive = isTradingPostActive();
  const tradingSlots = tradingActive ? (db.items?.storeLayout?.tradingPost?.slots || 6) : 0;

  const takeFirstOfType = type => {
    const idx = pool.findIndex(i => i.type === type);
    return idx === -1 ? null : pool.splice(idx, 1)[0];
  };

  const generalStore = [];
  const tradingPost = [];

  const firstWeapon = takeFirstOfType('weapon');
  if (firstWeapon) generalStore.push(firstWeapon);
  const firstMount = takeFirstOfType('mount');
  if (firstMount) generalStore.push(firstMount);

  if (tradingActive) {
    const secondWeapon = takeFirstOfType('weapon');
    if (secondWeapon) tradingPost.push(secondWeapon);
    const secondMount = takeFirstOfType('mount');
    if (secondMount) tradingPost.push(secondMount);
  }

  while (generalStore.length < generalSlots && pool.length) generalStore.push(pool.shift());
  while (tradingPost.length < tradingSlots && pool.length) tradingPost.push(pool.shift());
  while (generalStore.length < generalSlots) generalStore.push(null);
  while (tradingPost.length < tradingSlots) tradingPost.push(null);

  return { generalStore, tradingPost, tradingActive };
}

const CARD_BACK_SRC = 'assets/images/cards/item-back.png';
const STORE_FLIP_HALF_MS = 160;
const STORE_FLIP_STAGGER_MS = 40;
const STORE_FLIP_PAUSE_MS = 90;

let currentStoreLayout = null;
let storeAutoRandomizeTimer = null;

function itemTypeLabel(type) {
  if (type === 'weapon') return 'Weapon';
  if (type === 'mount') return 'Mount';
  return 'Misc';
}

function itemImageSrc(item) {
  if (item.image) return item.image;
  const slug = (item.id || '').replace(/_/g, '');
  return `assets/images/cards/item-${slug}.png`;
}

function storeSlotImgHtml(item, showFront) {
  const src = showFront ? itemImageSrc(item) : CARD_BACK_SRC;
  const alt = showFront ? escapeHtml(item.name) : 'Item card back';
  return `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" onerror="this.closest('.store-slot').classList.add('store-slot-noart');this.remove();">`;
}

// The "face" is the single element that gets horizontally flipped - it holds
// the art plus (when shown front-up) the name/type text floated over the image.
function storeSlotFaceInnerHtml(item, showFront) {
  const art = `<span class="store-slot-art">${storeSlotImgHtml(item, showFront)}</span>`;
  if (!showFront) return art;
  return art + `<span class="store-slot-overlay">
    <span class="store-slot-name">${escapeHtml(item.name)}</span>
    <span class="store-slot-type">${itemTypeLabel(item.type)}</span>
  </span>`;
}

// Renders the static (non-animated) markup for one slot. `item` may be:
//   null        -> permanently empty slot (item pool ran out)
//   an item obj -> drawn card, shown as its back or front depending on `revealed`
function renderStoreSlotCard(item, area, index, revealed) {
  if (!item) {
    return `<div class="store-slot store-slot-empty" data-slot="${area}:${index}"><span class="store-slot-empty-label">Empty</span></div>`;
  }
  const showFront = !!revealed;
  const rerollBtn = showFront
    ? `<button type="button" class="store-slot-reroll" data-reroll-slot="${area}:${index}" title="Draw a different item" aria-label="Reroll ${escapeHtml(item.name)}">⟲</button>`
    : '';
  return `<div class="store-slot ${showFront ? 'store-slot-' + item.type : 'store-slot-back'}" data-slot="${area}:${index}">
    <div class="store-slot-face" ${showFront ? `data-view-card="${area}:${index}" role="button" tabindex="0" aria-label="View ${escapeHtml(item.name)} full size"` : ''}>${storeSlotFaceInnerHtml(item, showFront)}</div>
    ${rerollBtn}
  </div>`;
}

function renderStoreArea(title, items, area, revealed) {
  if (!items.length) return '';
  return `<div class="store-area">
    <h3 class="store-area-title">${escapeHtml(title)}</h3>
    <div class="store-slot-grid">${items.map((item, index) => renderStoreSlotCard(item, area, index, revealed)).join('')}</div>
  </div>`;
}

// Updates an already-rendered slot's contents in place (no re-render), used mid-flip
// so the DOM node survives the animation instead of being torn down.
function updateStoreSlotDom(container, item, area, index, showFront) {
  const face = container.querySelector('.store-slot-face');
  container.className = `store-slot ${showFront ? 'store-slot-' + item.type : 'store-slot-back'}`;
  face.innerHTML = storeSlotFaceInnerHtml(item, showFront);
  let rerollBtn = container.querySelector('.store-slot-reroll');
  if (showFront) {
    face.dataset.viewCard = `${area}:${index}`;
    face.setAttribute('role', 'button');
    face.setAttribute('tabindex', '0');
    face.setAttribute('aria-label', `View ${item.name} full size`);
    if (!rerollBtn) {
      rerollBtn = document.createElement('button');
      rerollBtn.type = 'button';
      rerollBtn.className = 'store-slot-reroll';
      container.appendChild(rerollBtn);
    }
    rerollBtn.dataset.rerollSlot = `${area}:${index}`;
    rerollBtn.title = 'Draw a different item';
    rerollBtn.setAttribute('aria-label', `Reroll ${item.name}`);
    rerollBtn.textContent = '⟲';
  } else {
    delete face.dataset.viewCard;
    face.removeAttribute('role');
    face.removeAttribute('tabindex');
    face.removeAttribute('aria-label');
    if (rerollBtn) rerollBtn.remove();
  }
}

// Horizontal shrink -> swap content -> grow flip on a single .store-slot-face element.
function flipStoreSlotFace(faceEl, swapContent, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      faceEl.style.transition = `transform ${STORE_FLIP_HALF_MS}ms ease-in`;
      faceEl.style.transform = 'scaleX(0.02)';
      setTimeout(() => {
        swapContent();
        faceEl.style.transition = `transform ${STORE_FLIP_HALF_MS}ms ease-out`;
        faceEl.style.transform = 'scaleX(1)';
        setTimeout(resolve, STORE_FLIP_HALF_MS);
      }, STORE_FLIP_HALF_MS);
    }, delay);
  });
}

function setStoreControlsDisabled(disabled) {
  assistBody.querySelectorAll('.store-slot').forEach(el => el.classList.toggle('store-slot-locked', disabled));
  const btn = assistBody.querySelector('[data-store-randomize-all]');
  if (btn) btn.disabled = disabled;
}

// Flips every slot: back->front on first reveal, or front->back->new-front once
// a layout already exists. Cascades with a short per-card stagger.
function randomizeStoreAllAnimated() {
  clearTimeout(storeAutoRandomizeTimer);
  storeAutoRandomizeTimer = null;
  const wasRevealed = !!currentStoreLayout;
  const newLayout = generateStoreLayout();
  setStoreControlsDisabled(true);
  const areas = [['generalStore', newLayout.generalStore], ['tradingPost', newLayout.tradingPost]];
  const promises = [];
  let cardIndex = 0;
  areas.forEach(([area, items]) => {
    items.forEach((item, index) => {
      const slotEl = assistBody.querySelector(`[data-slot="${area}:${index}"]`);
      if (!slotEl) return;
      if (!item) {
        slotEl.outerHTML = renderStoreSlotCard(null, area, index, false);
        return;
      }
      const face = slotEl.querySelector('.store-slot-face');
      const delay = cardIndex * STORE_FLIP_STAGGER_MS;
      cardIndex++;
      if (!wasRevealed) {
        promises.push(flipStoreSlotFace(face, () => updateStoreSlotDom(slotEl, item, area, index, true), delay));
      } else {
        promises.push(
          flipStoreSlotFace(face, () => updateStoreSlotDom(slotEl, item, area, index, false), delay)
            .then(() => flipStoreSlotFace(face, () => updateStoreSlotDom(slotEl, item, area, index, true), STORE_FLIP_PAUSE_MS))
        );
      }
    });
  });
  currentStoreLayout = newLayout;
  Promise.all(promises).then(() => renderStoreRandomizerAssist());
}

// Re-rolls and double-flips a single already-revealed slot.
function rerollStoreSlotAnimated(area, index) {
  if (!currentStoreLayout) return;
  const slotEl = assistBody.querySelector(`[data-slot="${area}:${index}"]`);
  if (!slotEl) return;
  const face = slotEl.querySelector('.store-slot-face');
  const outgoing = currentStoreLayout[area][index];
  const usedIds = new Set([...currentStoreLayout.generalStore, ...currentStoreLayout.tradingPost].filter(Boolean).map(i => i.id));
  const candidates = eligibleStoreItems().filter(i => !usedIds.has(i.id) && i.id !== outgoing?.id);
  const replacement = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : outgoing;

  setStoreControlsDisabled(true);
  flipStoreSlotFace(face, () => updateStoreSlotDom(slotEl, outgoing, area, index, false))
    .then(() => flipStoreSlotFace(face, () => {
      currentStoreLayout[area][index] = replacement;
      updateStoreSlotDom(slotEl, replacement, area, index, true);
    }, STORE_FLIP_PAUSE_MS))
    .then(() => renderStoreRandomizerAssist());
}

// Generic fullscreen viewer: shows any image large, tap-anywhere closes it.
// Appends to the topmost open <dialog> if one is showing (so it stacks above
// modal content), otherwise to the page body.
function showFullscreenImage(src, alt, caption) {
  const openDialog = document.querySelector('dialog[open]');
  const host = openDialog || document.body;
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-image-viewer';
  const captionHtml = (alt || caption)
    ? `<div class="fullscreen-image-viewer-caption">
        ${alt ? `<span class="fullscreen-image-viewer-name">${escapeHtml(alt)}</span>` : ''}
        ${caption ? `<span class="fullscreen-image-viewer-type">${escapeHtml(caption)}</span>` : ''}
      </div>`
    : '';
  overlay.innerHTML = `<div class="fullscreen-image-viewer-inner">
    <img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" onerror="this.closest('.fullscreen-image-viewer-inner').classList.add('store-slot-noart');this.remove();">
    ${captionHtml}
  </div>`;
  overlay.addEventListener('click', () => overlay.remove());
  host.appendChild(overlay);
}

function showFullscreenStoreCard(item) {
  showFullscreenImage(itemImageSrc(item), item.name, itemTypeLabel(item.type));
}

function renderStoreRandomizerAssist() {
  setAssistHeader('Store Randomizer', 'Setup Helper');
  const generalSlots = db.items?.storeLayout?.generalStore?.slots || 6;
  const tradingActive = isTradingPostActive();
  const tradingSlots = tradingActive ? (db.items?.storeLayout?.tradingPost?.slots || 6) : 0;
  const hasLayout = !!currentStoreLayout;
  const generalItems = hasLayout ? currentStoreLayout.generalStore : Array.from({ length: generalSlots }, () => ({ __pending: true }));
  const tradingItems = hasLayout ? currentStoreLayout.tradingPost : Array.from({ length: tradingSlots }, () => ({ __pending: true }));

  // A "pending" placeholder has no real name/type yet — it only ever renders as a card back.
  const generalHtml = renderStoreArea('General Store', generalItems, 'generalStore', hasLayout);
  const tradingHtml = tradingActive
    ? renderStoreArea('Trading Post', tradingItems, 'tradingPost', hasLayout)
    : `<p class="assist-hint">Trading Post is inactive for this setup — enable the Buzzard Gulch Sideboard module to include it.</p>`;
  const hint = !hasLayout
    ? 'Tap Randomize to reveal the store.'
    : 'Tap a card to view it full size, or tap ⟲ to draw a different item. The first drawn Weapon and Mount are locked into the General Store automatically.';
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel store-randomizer">
    <p class="assist-hint">${hint}</p>
    ${generalHtml}
    ${tradingHtml}
    <button type="button" class="secondary-btn" data-store-randomize-all>${hasLayout ? 'Re-Randomize' : 'Randomize'}</button>
  </div>`;
  bindAssistBack();
  const wrap = assistBody.querySelector('.store-randomizer');
  wrap.onclick = event => {
    const rerollBtn = event.target.closest('[data-reroll-slot]');
    if (rerollBtn) {
      const [area, index] = rerollBtn.dataset.rerollSlot.split(':');
      rerollStoreSlotAnimated(area, Number(index));
      return;
    }
    const face = event.target.closest('[data-view-card]');
    if (face) {
      const [area, index] = face.dataset.viewCard.split(':');
      const item = currentStoreLayout?.[area]?.[Number(index)];
      if (item) showFullscreenStoreCard(item);
      return;
    }
    if (event.target.closest('[data-store-randomize-all]')) {
      randomizeStoreAllAnimated();
    }
  };
  clearTimeout(storeAutoRandomizeTimer);
  if (!hasLayout) {
    storeAutoRandomizeTimer = setTimeout(() => {
      storeAutoRandomizeTimer = null;
      randomizeStoreAllAnimated();
    }, 500);
  }
  showAssistDialog();
}

function renderRandomPlayerAssist() {
  setAssistHeader('Random Player', 'Randomizer');
  const colors = (state.setup.playerColors || PLAYER_COLORS.slice(0, state.setup.players || 4)).filter(Boolean);
  const picked = colors[Math.floor(Math.random() * colors.length)] || 'white';
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    <div class="random-player-result"><span class="player-color large" style="background:${picked}"></span><strong>${picked.toUpperCase()} Player</strong></div>
    <button type="button" class="primary-btn" data-random-again>Pick Again</button>
  </div>`;
  bindAssistBack();
  assistBody.querySelector('[data-random-again]').onclick = renderRandomPlayerAssist;
  showAssistDialog();
}

function renderFirstPlayerAssist() {
  setAssistHeader('First Player', 'Touch Randomizer');
  assistDialog.classList.add('first-player-dialog');
  assistBody.innerHTML = `<div class="first-player-stage" id="firstPlayerStage">
    <div class="first-player-timer" id="firstPlayerTimer">3</div>
    <p>Place fingers on the screen. The timer resets whenever a finger is added or removed.</p>
    <div id="fingerLayer" class="finger-layer"></div>
  </div>`;
  const stage = document.getElementById('firstPlayerStage');
  const layer = document.getElementById('fingerLayer');
  const timer = document.getElementById('firstPlayerTimer');
  const touches = new Map();
  let countdown = 3;
  let interval = null;
  const colors = ['#d84b3a', '#3a79b8', '#e1b93f', '#6f9f55', '#8a5ca8', '#eee'];
  function resetTimer() {
    countdown = 3;
    timer.textContent = countdown;
    clearInterval(interval);
    if (touches.size === 0) return;
    interval = setInterval(() => {
      countdown -= 1;
      timer.textContent = countdown;
      if (countdown <= 0) chooseFinger();
    }, 1000);
  }
  function renderFingers(winnerId = null) {
    layer.innerHTML = Array.from(touches.values()).map(t => `<span class="finger-pulse ${winnerId === t.id ? 'winner' : ''}" style="left:${t.x}px;top:${t.y}px;background:${t.color}"></span>`).join('');
  }
  function chooseFinger() {
    clearInterval(interval);
    if (!touches.size) return;
    const picked = Array.from(touches.values())[Math.floor(Math.random() * touches.size)];
    timer.textContent = '★';
    renderFingers(picked.id);
  }
  stage.onpointerdown = e => { stage.setPointerCapture?.(e.pointerId); touches.set(e.pointerId, { id:e.pointerId, x:e.offsetX, y:e.offsetY, color: colors[touches.size % colors.length] }); renderFingers(); resetTimer(); };
  stage.onpointermove = e => { if (!touches.has(e.pointerId)) return; const t = touches.get(e.pointerId); t.x = e.offsetX; t.y = e.offsetY; renderFingers(); };
  const remove = e => { if (touches.delete(e.pointerId)) { renderFingers(); resetTimer(); } };
  stage.onpointerup = remove;
  stage.onpointercancel = remove;
  showAssistDialog();
}
function renderSimpleAssist(kind) {
  const labels = {
    train: ['Train Assist', 'Use this for train movement, train heists, and Train Encounter reminders.'],
    hunt: ['Hunting Assist', 'Use this for Hunt markers, animal draws, strength checks, and harvest rewards.'],
    fish: ['Fishing Assist', 'Use this for fish draws, bait/lure checks, and fish delivery hooks.'],
    forage: ['Foraging & Crafting Assist', 'Use this for resource draws, craft costs, and delivery story hooks.']
  };
  const [title, text] = labels[kind] || ['Assist', 'This assist can be expanded later.'];
  setAssistHeader(title, 'Module Helper');
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel"><p>${escapeHtml(text)}</p><p class="assist-hint">Placeholder ready for the next build-out.</p></div>`;
  bindAssistBack();
  showAssistDialog();
}

function finalTallyContestants() {
  const contestants = (state.setup.playerColors || []).filter(Boolean);
  if (hasModule('wild_bunch_man_in_black')) contestants.push(MAN_IN_BLACK_ID);
  return contestants;
}

function finalTallyPlayerLabel(color) {
  if (color === MAN_IN_BLACK_ID) return 'Man In Black';
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const character = player?.character?.trim();
  const name = player?.name?.trim();
  const colorLabel = `${String(color || '').charAt(0).toUpperCase()}${String(color || '').slice(1)} Player`;
  if (character && name) return `${character} (${name})`;
  if (character) return character;
  if (name) return `${colorLabel} (${name})`;
  return colorLabel;
}

function finalTallyPlayerDisplay(color) {
  if (color === MAN_IN_BLACK_ID) return { eyebrow: '', title: 'Man In Black' };
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const character = player?.character?.trim();
  const name = player?.name?.trim();
  const colorLabel = `${String(color || '').charAt(0).toUpperCase()}${String(color || '').slice(1)} Player`;
  return { eyebrow: name || '', title: character || colorLabel };
}

const FINAL_SCORING_STEP_TITLES = {
  mounts_weapons: 'Upgraded Gear',
  legendary_items: 'Legendary Items',
  money: 'Money',
  wounds: 'Wounds',
  injuries: 'Injuries',
  wanted: 'Wanted Track',
  marshal: 'Marshal Track',
  gambler: 'Gambler Track',
  legendary_tokens: 'Legendary Tokens',
  deeds: 'Deeds',
  titles: 'Title Card',
  man_in_black: 'Man In Black'
};

const FINAL_SCORING_STEP_SUMMARIES = {
  mounts_weapons: 'Score LP shown on upgraded mounts & weapons',
  legendary_items: 'Score any LP printed on Legendary Items',
  money: '+1 LP for every $60',
  wounds: '−1 LP for each wound',
  injuries: 'Apply any end-game Injury penalties',
  wanted: 'Most Wanted: +3 LP; other Wanted: +1 LP',
  marshal: 'Score the LP shown by your Marshal row',
  gambler: 'Leader(s) gain +1 LP',
  legendary_tokens: 'Add the LP value of your tokens',
  deeds: 'Score eligible Deeds',
  titles: 'Apply the revealed Title card',
  man_in_black: 'Wins end-game ties'
};

function finalScoringStepTitle(step) {
  return FINAL_SCORING_STEP_TITLES[step.id]
    || String(step.id || 'Scoring').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function finalScoringStepSummary(step) {
  return FINAL_SCORING_STEP_SUMMARIES[step.id] || 'Tap for the complete scoring rule';
}

const FINAL_SCORING_ORDER = ['mounts_weapons', 'legendary_items', 'deeds', 'titles', 'money', 'legendary_tokens', 'wanted', 'marshal', 'gambler', 'wounds', 'injuries', 'man_in_black'];

function renderFinalScoringReference() {
  const data = db.finalScoring;
  if (!data) return '';
  const steps = (data.scoringSteps || []).filter(isSetupVisualVisible).slice().sort((a, b) => {
    const ai = FINAL_SCORING_ORDER.indexOf(a.id);
    const bi = FINAL_SCORING_ORDER.indexOf(b.id);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
  if (!steps.length) return '';
  return `<section class="final-scoring-reference final-scoring-accordion" aria-label="Final scoring reminders">
    <div class="final-scoring-accordion-heading">
      <strong>Final Scoring</strong>
    </div>
    <div class="final-scoring-panels">${steps.map(step => `<details class="final-scoring-item">
      <summary><span class="final-scoring-item-copy"><strong>${escapeHtml(finalScoringStepTitle(step))}</strong><small>${escapeHtml(finalScoringStepSummary(step))}</small></span></summary>
      <div class="final-scoring-item-detail"><p>${escapeHtml(step.text)}</p></div>
    </details>`).join('')}</div>
  </section>`;
}

function finalTieBreakerReference() {
  const tiebreakers = (db.finalScoring?.tiebreakers || []).slice(1);
  if (!tiebreakers.length) return '';
  return `<details class="final-tiebreak-details">
    <summary>Tie-breakers</summary>
    <ol>${tiebreakers.map(s => `<li>${escapeHtml(s.text)}</li>`).join('')}</ol>
  </details>`;
}

function renderFinalTally() {
  const colors = finalTallyContestants();
  app.innerHTML = `<div class="modal-screen-overlay end-game-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card final-tally-card">
      <button type="button" class="dialog-close-x" data-final-close aria-label="Back to game">&#10005;</button>
      <div class="modal-title-header">
        <p class="eyebrow">End Game</p>
        <h1 class="section-title">Final Tally</h1>
      </div>
      ${renderFinalScoringReference()}
      <div class="final-tally-rows">
        ${colors.map(color => {
          const display = finalTallyPlayerDisplay(color);
          return `<div class="final-tally-row" data-final-player="${color}">
            <span class="player-color-swatch ${color === MAN_IN_BLACK_ID ? 'swatch-man-in-black' : `swatch-${color}`}" aria-hidden="true"></span>
            <span class="final-tally-player-copy">
              ${display.eyebrow ? `<small>${escapeHtml(display.eyebrow)}</small>` : ''}
              <strong>${escapeHtml(display.title)}</strong>
            </span>
            <input type="number" inputmode="numeric" class="final-tally-input" data-final-score="${color}" min="0" value="${state.finalScores?.[color] ?? ''}" placeholder="LP" aria-label="Final LP for ${escapeHtml(finalTallyPlayerLabel(color))}">
            <span class="final-winner-star hidden" data-winner-star="${color}" title="Winner" aria-label="Winner">★</span>
          </div>`;
        }).join('') || '<p>No players were assigned colors this game.</p>'}
      </div>
      <div class="final-tie-panel hidden" id="finalTiePanel"></div>
      <p class="form-error hidden" id="finalTallyError" role="alert"></p>
      <div class="dialog-actions setup-final-actions final-tally-actions">
        <button class="secondary-btn" id="cancelTally">Back</button>
        <button class="primary-btn" id="generateNewspaperBtn">Newspaper</button>
      </div>
    </section>
  </div>`;

  const closeTally = () => navigate('game');
  document.getElementById('cancelTally').onclick = closeTally;
  document.querySelector('[data-final-close]').onclick = closeTally;
  document.querySelector('[data-modal-backdrop]').addEventListener('click', event => {
    if (event.target.hasAttribute('data-modal-backdrop')) closeTally();
  });

  let resolvedWinnerColors = [];
  let tieSelection = '';

  const readScores = () => {
    const scores = {};
    const missing = [];
    colors.forEach(color => {
      const raw = app.querySelector(`[data-final-score="${color}"]`)?.value?.trim() || '';
      if (raw === '') missing.push(color);
      else scores[color] = Number(raw);
    });
    return { scores, missing };
  };

  const updateWinnerDisplay = () => {
    const { scores, missing } = readScores();
    const tiePanel = document.getElementById('finalTiePanel');
    app.querySelectorAll('[data-winner-star]').forEach(star => star.classList.add('hidden'));
    app.querySelectorAll('[data-final-player]').forEach(row => row.classList.remove('winner-row'));
    resolvedWinnerColors = [];
    if (missing.length || !colors.length) {
      tiePanel.classList.add('hidden');
      tiePanel.innerHTML = '';
      return;
    }

    const maxScore = Math.max(...Object.values(scores));
    const tied = colors.filter(color => scores[color] === maxScore);
    // The Wild Bunch Man in Black wins end-game ties automatically.
    if (tied.length > 1 && tied.includes(MAN_IN_BLACK_ID)) {
      tieSelection = '';
      resolvedWinnerColors = [MAN_IN_BLACK_ID];
      app.querySelector(`[data-winner-star="${MAN_IN_BLACK_ID}"]`)?.classList.remove('hidden');
      app.querySelector(`[data-final-player="${MAN_IN_BLACK_ID}"]`)?.classList.add('winner-row');
      tiePanel.innerHTML = `<div class="auto-winner-note"><span class="sheriff-star" aria-hidden="true">★</span><span><small>Man in Black tie rule</small><strong>Man In Black wins the tie</strong></span></div>`;
      tiePanel.classList.remove('hidden');
      return;
    }
    if (tied.length === 1) {
      tieSelection = '';
      resolvedWinnerColors = tied.slice();
      const winner = tied[0];
      app.querySelector(`[data-winner-star="${winner}"]`)?.classList.remove('hidden');
      app.querySelector(`[data-final-player="${winner}"]`)?.classList.add('winner-row');
      tiePanel.innerHTML = `<div class="auto-winner-note"><span class="sheriff-star" aria-hidden="true">★</span><span><small>Highest LP</small><strong>${escapeHtml(finalTallyPlayerLabel(winner))} wins</strong></span></div>`;
      tiePanel.classList.remove('hidden');
      return;
    }

    const savedWinners = Array.isArray(state.finalWinnerColors) ? state.finalWinnerColors : (state.finalWinnerColor ? [state.finalWinnerColor] : []);
    const savedSingle = savedWinners.length === 1 && tied.includes(savedWinners[0]) ? savedWinners[0] : '';
    const savedShared = savedWinners.length > 1 && tied.every(color => savedWinners.includes(color));
    const selectedSingle = tieSelection && tieSelection !== 'shared' && tied.includes(tieSelection) ? tieSelection : savedSingle;
    const selectedShared = tieSelection === 'shared' || (!tieSelection && savedShared);
    tiePanel.innerHTML = `<div class="tie-heading"><span class="sheriff-star" aria-hidden="true">★</span><span><small>Highest LP is tied</small><strong>Resolve the tie</strong></span></div>
      <p>Use the normal tie-breakers, then choose the winner. If the tie remains, choose Shared Victory.</p>
      ${finalTieBreakerReference()}
      <div class="tie-choice-grid">
        ${tied.map(color => {
          const display = finalTallyPlayerDisplay(color);
          return `<label class="tie-choice"><input type="radio" name="finalTieWinner" value="${color}" ${selectedSingle === color ? 'checked' : ''}><span>${escapeHtml(display.title)}</span></label>`;
        }).join('')}
        <label class="tie-choice shared"><input type="radio" name="finalTieWinner" value="shared" ${selectedShared ? 'checked' : ''}><span>Shared Victory</span></label>
      </div>`;
    tiePanel.classList.remove('hidden');

    const syncTieChoice = () => {
      const choice = tiePanel.querySelector('input[name="finalTieWinner"]:checked')?.value || '';
      tieSelection = choice;
      app.querySelectorAll('[data-winner-star]').forEach(star => star.classList.add('hidden'));
      app.querySelectorAll('[data-final-player]').forEach(row => row.classList.remove('winner-row'));
      if (!choice) { resolvedWinnerColors = []; return; }
      resolvedWinnerColors = choice === 'shared' ? tied.slice() : [choice];
      resolvedWinnerColors.forEach(color => {
        app.querySelector(`[data-winner-star="${color}"]`)?.classList.remove('hidden');
        app.querySelector(`[data-final-player="${color}"]`)?.classList.add('winner-row');
      });
    };
    tiePanel.querySelectorAll('input[name="finalTieWinner"]').forEach(input => input.addEventListener('change', syncTieChoice));
    syncTieChoice();
  };

  app.querySelectorAll('[data-final-score]').forEach(input => input.addEventListener('input', updateWinnerDisplay));
  updateWinnerDisplay();

  document.getElementById('generateNewspaperBtn').onclick = () => {
    const { scores, missing } = readScores();
    const error = document.getElementById('finalTallyError');
    if (missing.length) {
      error.textContent = 'Enter the final LP score for every player.';
      error.classList.remove('hidden');
      return;
    }
    updateWinnerDisplay();
    if (!resolvedWinnerColors.length) {
      error.textContent = 'Resolve the tied high score before previewing the newspaper.';
      error.classList.remove('hidden');
      return;
    }
    error.classList.add('hidden');
    state.finalScores = scores;
    state.finalWinnerColors = resolvedWinnerColors.slice();
    state.finalWinnerColor = resolvedWinnerColors.length === 1 ? resolvedWinnerColors[0] : null;
    save();
    navigate('end');
  };
}

function formatNewspaperDate() {
  try {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  } catch {
    return new Date().toLocaleDateString();
  }
}

function renderEndGame() {
  const article = generateNewspaperArticle();
  app.innerHTML = `<section class="panel newspaper-page"><div class="newsprint" id="newspaper">
    <h1>The Darkrock Gazette</h1>
    <p class="newspaper-date">${escapeHtml(formatNewspaperDate())}</p>
    <p class="newspaper-edition">Special Frontier Edition</p>
    ${article}
  </div><div class="actions newspaper-actions">
    <button class="secondary-btn" id="backGame">Back</button>
    <button class="primary-btn" onclick="window.print()">Save</button>
    <button class="danger-btn" id="finishGame">Finish Game</button>
  </div></section>`;
  document.getElementById('backGame').onclick = () => navigate('game');
  document.getElementById('finishGame').onclick = () => {
    if (!confirm('Finish this game and clear its saved data? Print or save the newspaper first if you want to keep it.')) return;
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    render();
  };
}

// Reads the whole game's history to describe how tense the frontier turned
// out to be - the wanted/marshal tug-of-war, plus which flavor of point
// (Gambling/Legendary/Story) dominated the table, plus how much of the
// action was outright violence (fight-tagged triggers), independent of
// which side of the law it came from.
function computeWorldTension() {
  const primaryTriggers = state.triggeredLog.filter(l => l.type === 'primaryTrigger');
  const wanted = primaryTriggers.filter(l => triggerBalanceBucket(l) === 'wanted').length;
  const marshal = primaryTriggers.filter(l => triggerBalanceBucket(l) === 'marshal').length;
  const fights = primaryTriggers.filter(l => (l.tags || []).includes('fight') || l.category === 'fight').length;
  const totals = Object.values(state.playerCounters || {}).reduce((acc, c) => {
    acc.gambling += c.gamblingPoints || 0;
    acc.legendary += c.legendaryPoints || 0;
    acc.marshal += c.marshalPoints || 0;
    acc.wanted += c.wantedPoints || 0;
    return acc;
  }, { gambling: 0, legendary: 0, marshal: 0, wanted: 0 });
  const storyPoints = state.triggeredLog.filter(l => l.type === 'storyTrackAdvance').length;
  return { wanted, marshal, fights, neutral: primaryTriggers.length - wanted - marshal, net: wanted - marshal, total: primaryTriggers.length, totals, storyPoints };
}

// Classifies the whole game (or its state so far, mid-game) into one
// overall "feel" - lawlessness, law and order, opportunity, a tense
// standoff between the two, open bloodshed regardless of which side caused
// it, or a quiet day with little to report. This single classification
// drives both the newspaper's voice and which music track is playing, so
// the two always agree with each other.
function computeFrontierMood() {
  const t = computeWorldTension();
  let key, label;
  if (t.total < 3) { key = 'quiet'; label = 'Quiet'; }
  else if (t.total >= 5 && t.fights / t.total >= 0.5) { key = 'bloodshed'; label = 'Bloodshed'; }
  else if (t.net >= 3) { key = 'lawless'; label = 'Lawless'; }
  else if (t.net <= -3) { key = 'orderly'; label = 'Law and Order'; }
  else if (Math.abs(t.net) <= 1 && t.wanted + t.marshal >= 4) { key = 'tense'; label = 'Tense Standoff'; }
  else { key = 'opportunity'; label = 'Opportunity'; }
  return { key, label, ...t };
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

// Every mood gets its own headline options, lead paragraph, a short
// section-intro line that flavors the "Watched by the Frontier" roundup,
// and closing lines - so the whole article reads in one consistent voice
// instead of a mood-neutral template with a single tacked-on sentence.
const FRONTIER_MOODS = {
  quiet: {
    headlines: ['Quiet Day on the Frontier', 'Not Much to Report', 'Darkrock Sleeps Easy'],
    leads: [
      'The dust settled soft over Darkrock and Red Falls, with few tales fit for ink before the presses rolled.',
      'For once the territory kept its business to itself, and the Gazette\u2019s runners came back with empty notebooks.'
    ],
    sectionIntro: 'What little did cross the wire is recorded plainly below, for whatever it\u2019s worth:',
    closings: [
      'The frontier held its breath - no notable deeds crossed the Companion\u2019s ledger before the presses rolled, and Darkrock slept easy for once.',
      'Not a single wire came in from the range today. Some say a quiet frontier is a lucky one; others say it just means the trouble hasn\u2019t been caught yet.'
    ]
  },
  lawless: {
    headlines: ['Outlaw Trouble Rides Again', 'The Law Loses Its Grip', 'Bandits Own the Night'],
    leads: [
      'Honest folk kept one eye on their wallets and the other on the road as lawless deeds stirred the territory from sunup to sundown.',
      'Word from every stagecoach and saloon agrees: the wanted rode bolder this week than the marshals could answer.'
    ],
    sectionIntro: 'The wanted made their mark from one end of the territory to the other:',
    closings: [
      'Outlaws rode wilder than the law could answer this time - prospectors panned nervous and merchants counted their tills twice, for the wanted held the upper hand across the territory.',
      'The wanted ledger grew fat and the marshals grew thin trying to keep pace - it was, by any honest account, a lawless season out here.'
    ]
  },
  orderly: {
    headlines: ['Marshals Lay Down the Law', 'A Firm Hand on the Territory', 'Order Rules Darkrock'],
    leads: [
      'Badges outnumbered bandits at every turn this week, and the territory was all the calmer for it.',
      'From the Sheriff\u2019s office to the farthest ranch, word travels that the law is riding tall and the wanted are riding careful.'
    ],
    sectionIntro: 'The marshals kept a full ledger of their own this week:',
    closings: [
      'The marshals kept a tight rein on the territory - wanted men rode careful and quiet, and honest prospectors and shopkeepers turned a fine profit under a watchful, orderly sky.',
      'Law and order carried the day from start to finish - the badges outpaced the bandits at every turn, and the territory prospered for it.'
    ]
  },
  tense: {
    headlines: ['A Territory on Edge', 'Outlaw and Lawman, Even Odds', 'The Standoff Continues'],
    leads: [
      'For every robbery answered by an arrest, some fresh mischief rose up to take its place, and the territory stayed exactly as tense as the old-timers like it.',
      'Neither badge nor bandit could claim the upper hand this week - a seesaw of trouble and order that kept every saloon conversation lively.'
    ],
    sectionIntro: 'Both sides of the law had their say this week:',
    closings: [
      'It was a fair fight between outlaw and lawman all season - for every robbery answered by an arrest, some fresh mischief rose to take its place, and the territory stayed exactly as tense as the old-timers like it.',
      'Neither the wanted nor the marshals ever quite gained the upper hand - a seesaw of trouble and order that kept every saloon conversation lively.'
    ]
  },
  opportunity: {
    headlines: ['The Open Range Calls', 'Gold, Grit, and Good Fortune', 'Opportunity Knocks Across the Territory'],
    leads: [
      'From dusty mines to crowded card tables, the frontier offered opportunity to anyone bold enough to reach for it.',
      'Prospectors, gamblers, and shopkeepers alike found the territory generous this week, with fortune favoring the industrious over the infamous.'
    ],
    sectionIntro: 'Enterprise, not outlawry, carried the territory this week:',
    closings: [
      'The territory saw its share of both trouble and order, but mostly it saw opportunity - gold panned, cards played, and deals struck under a fair frontier sky.',
      'A little lawlessness, a little justice, and a whole lot of honest hustle filled out the day, the way it usually goes out here when the range is generous.'
    ]
  },
  bloodshed: {
    headlines: ['Guns Blaze Across the Territory', 'A Season of Powder Smoke', 'Blood on the Frontier'],
    leads: [
      'Fists and firearms settled more arguments than words this week, and the Gazette struggled to keep the tally of split lips and spent cartridges straight.',
      'Whatever else happened out on the range, the territory will remember this as the week when every disagreement seemed to end in a fight.'
    ],
    sectionIntro: 'Reports of fights - won, lost, and everything between - poured into the Gazette office:',
    closings: [
      'Whether it was over cards, cattle, or plain old grudges, the territory settled its business with fists and fight cards more often than words this week.',
      'Some weeks the frontier talks its way through trouble. This wasn\u2019t one of them - the fight cards did most of the talking instead.'
    ]
  }
};

// Which point type dominated (Gambling / Legendary / Story), layered on
// top of the mood as a second flavor sentence - independent of whether the
// week was lawless, orderly, or quiet.
function frontierFlavorSentence(t) {
  const flavors = [
    [t.totals.gambling, 'the gambling halls did a brisk trade, and more than one fortune changed hands over a turn of cards'],
    [t.totals.legendary, 'talk of legendary deeds and legendary items passed from porch to porch faster than the telegraph could carry it'],
    [t.storyPoints, 'story after story unfolded across the territory, each one adding a little more color to the frontier\u2019s memory']
  ].filter(([val]) => val > 0).sort((a, b) => b[0] - a[0]);
  return flavors.length ? `Meanwhile, ${flavors[0][1]}.` : '';
}

function generateFinalWord() {
  const mood = computeFrontierMood();
  const bank = FRONTIER_MOODS[mood.key] || FRONTIER_MOODS.opportunity;
  const sentences = [pick(bank.closings)];
  const flavor = frontierFlavorSentence(mood);
  if (flavor) sentences.push(flavor);
  sentences.push('Some riders chased gold, some chased glory, and some simply tried to stay ahead of trouble - but as every old hand knows, the frontier remembers what was done beneath that hard western sun.');
  return sentences.join(' ');
}

function finalScoreboardSection() {
  const scores = state.finalScores;
  if (!scores || !Object.keys(scores).length) return '';
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let winnerColors = Array.isArray(state.finalWinnerColors) ? state.finalWinnerColors.filter(color => color in scores) : [];
  if (!winnerColors.length && state.finalWinnerColor && state.finalWinnerColor in scores) winnerColors = [state.finalWinnerColor];
  if (!winnerColors.length) winnerColors = [ranked[0][0]];
  const winnerScore = scores[winnerColors[0]] ?? ranked[0][1];
  const rows = ranked.map(([color, score]) => `<li>${winnerColors.includes(color) ? '★ ' : ''}${escapeHtml(finalTallyPlayerLabel(color))} — ${score} LP</li>`).join('');
  const winnerText = winnerColors.length === 1
    ? `${escapeHtml(finalTallyPlayerLabel(winnerColors[0]))} stood tallest with ${winnerScore} Legendary Points to their name`
    : `${winnerColors.map(color => escapeHtml(finalTallyPlayerLabel(color))).join(' and ')} shared the victory with ${winnerScore} Legendary Points apiece`;
  return `<h2>Final Tally</h2>
    <p>When the last card was played and the last horse stabled for the night, ${winnerText}, and the territory will be telling that tale for a while yet.</p>
    <ul>${rows}</ul>`;
}

function generateNewspaperArticle() {
  const mood = computeFrontierMood();
  const bank = FRONTIER_MOODS[mood.key] || FRONTIER_MOODS.opportunity;
  const primaryTriggers = state.triggeredLog.filter(l => l.type === 'primaryTrigger');
  const resolved = state.triggeredLog.filter(l => l.type === 'storyResolved');
  const ignored = state.triggeredLog.filter(l => l.type === 'storyExpired');
  const humanPlayerNames = (state.setup.playerDetails || []).map((p, index) => p.name || p.character || `Player ${index + 1}`);
  const playerNames = humanPlayerNames.concat(hasModule('wild_bunch_man_in_black') ? ['Man In Black'] : []).join(', ');
  const triggerHighlights = primaryTriggers.slice(0, 8).map(l => `<li>${escapeHtml(l.label)}</li>`).join('') || '<li>No primary triggers were recorded before sundown.</li>';
  const storyHighlights = [
    ...resolved.slice(0, 4).map(l => `<li>${escapeHtml(l.label)} was resolved.</li>`),
    ...ignored.slice(0, 3).map(l => `<li>${escapeHtml(l.label)} was ignored and faded into frontier rumor.</li>`)
  ].join('') || '<li>No frontier tales reached their end, but the dust surely carried whispers.</li>';
  const notes = state.newspaperNotes.slice(0, 6).map(n => `<p>${escapeHtml(n.text)}</p>`).join('');
  return `<h2>${pick(bank.headlines)}</h2>
    <p>${pick(bank.leads)}</p>
    <p>Local witnesses report that ${escapeHtml(playerNames || 'a table of riders')} crossed the range with ${primaryTriggers.length} notable frontier moment${primaryTriggers.length === 1 ? '' : 's'} recorded by the Companion.</p>
    ${notes ? `<h2>Frontier Happenings</h2>${notes}` : ''}
    <h2>Watched by the Frontier</h2><p>${bank.sectionIntro}</p><ul>${triggerHighlights}</ul>
    <h2>Tales Told Around the Fire</h2><ul>${storyHighlights}</ul>
    ${finalScoreboardSection()}
    <h2>Final Word</h2><p>${generateFinalWord()}</p>`;
}

const APP_VERSION = '1.1.14';
let swRegistration = null;
let appUpdateAvailable = false;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    swRegistration = reg;
    // A worker was already waiting before we ever attached this listener
    // (e.g. an update finished installing in a previous tab/session).
    if (reg.waiting && navigator.serviceWorker.controller) markUpdateAvailable();
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) markUpdateAvailable();
      });
    });
    // Passive periodic check so a long-running open tab still notices a
    // newly published version without the user having to do anything.
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}

function markUpdateAvailable() {
  appUpdateAvailable = true;
  document.getElementById('menuBtn')?.classList.add('has-update-dot');
  document.querySelector('[data-open-credits-support]')?.classList.add('has-update-dot');
  refreshVersionBlockStatus();
}

function checkForAppUpdate() {
  if (!swRegistration) { window.location.reload(); return; }
  swRegistration.update().catch(() => {});
}

function applyAppUpdate() {
  if (swRegistration?.waiting) { swRegistration.waiting.postMessage('skipWaiting'); return; }
  window.location.reload();
}

function renderUpdateStatus() {
  return appUpdateAvailable
    ? `<button type="button" class="primary-btn app-update-btn" id="applyUpdateBtn">Update Available — Tap to Update</button>`
    : `<button type="button" class="secondary-btn app-update-btn" id="checkUpdateBtn">Check for Updates</button>`;
}

function renderVersionBlock() {
  return `<div class="app-version-block">
    <span class="app-version-label">Version ${escapeHtml(APP_VERSION)}</span>
    <div id="appUpdateStatus">${renderUpdateStatus()}</div>
  </div>`;
}
function wireVersionBlock() {
  document.getElementById('applyUpdateBtn')?.addEventListener('click', applyAppUpdate);
  document.getElementById('checkUpdateBtn')?.addEventListener('click', checkForAppUpdate);
}
function refreshVersionBlockStatus() {
  const status = document.getElementById('appUpdateStatus');
  if (!status) return;
  status.innerHTML = renderUpdateStatus();
  wireVersionBlock();
}

init().catch(err => {
  app.innerHTML = `<section class="panel"><h1>Unable to Start</h1><p>${err.message}</p><p>Run this app from a local web server so the JSON files can load.</p></section>`;
});
