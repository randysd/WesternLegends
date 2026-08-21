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
  finalScoring: 'data/final-scoring.json',
  ui: 'data/ui.json'
};

const SAVE_KEY = 'wl_frontier_director_save_v1';
const LANGUAGE_KEY = 'wl_frontier_director_language';
const DEFAULT_LANGUAGE = 'en';
const LANGUAGE_GLOBE_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>`;

function selectedLanguageCode() {
  return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}
function hasExplicitLanguageSelection() {
  return !!localStorage.getItem(LANGUAGE_KEY);
}
function localizedDataUrl(url, language = selectedLanguageCode()) {
  if (!language || language === DEFAULT_LANGUAGE) return url;
  return String(url).replace(/^data\//, `data/${language}/`);
}
const KOFI_SUPPORT_URL = 'https://ko-fi.com/randyd426';
const BGG_USERNAME = 'randyd42';
const BGG_PROFILE_URL = `https://boardgamegeek.com/user/${BGG_USERNAME}`;
const CONTACT_EMAIL = 'rdykstra1@yahoo.com';
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
    locked: true,
    modules: [
      { id: 'base_core', locked: true },
      { id: 'base_goals' },
      { id: 'base_legendary_tokens' }
    ]
  },
  {
    id: 'ante_up',
    modules: [
      { id: 'ante_up_sideboard' },
      { id: 'ante_up_train' },
      { id: 'ante_up_events' },
      { id: 'ante_up_gambler' },
      { id: 'ante_up_faro' },
      { id: 'ante_up_high_stakes_poker' }
    ]
  },
  {
    id: 'blood_money',
    modules: [
      { id: 'blood_money_stories' },
      { id: 'blood_money_risk_die' },
      { id: 'blood_money_injuries' },
      { id: 'blood_money_deeds' },
      { id: 'blood_money_traveling_trader' }
    ]
  },
  {
    id: 'wild_bunch',
    modules: [
      { id: 'wild_bunch_titles' },
      { id: 'wild_bunch_gang_posse' },
      { id: 'wild_bunch_sheriff' },
      { id: 'wild_bunch_bandit_variant' },
      { id: 'wild_bunch_man_in_black' },
      { id: 'wild_bunch_unique_events' }
    ]
  },
  {
    id: 'the_good_the_bad_and_the_handsome',
    modules: []
  },
  {
    id: 'fistful_of_extras',
    modules: [
      { id: 'fistful_jokers' }
    ]
  },
  {
    id: 'promos',
    selectable: false,
    modules: [
      { id: 'big_box' },
      { id: 'promo_carbine' }
    ]
  },
  {
    id: 'variants',
    selectable: false,
    modules: [
      { id: 'treasure_hunting_rumors' },
      { id: 'hunting' },
      { id: 'fishing' },
      { id: 'foraging_crafting' },
      { id: 'theatre' },
      { id: 'prospecting_cards' },
      { id: 'dark_knight' }
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
let storyTrackNoticeTimer = null;
let currentDialogEvent = null;
let storyDialogReturnTarget = null;
let gameSettingsReturnScreen = 'game';
let assistView = 'menu';
let assistReturnTarget = null;
let assistReturnAfterClose = false;
let assistOpenedDirectly = false;
let assistNestedReturn = null;
let worldEventHeartbeatTimer = null;
let fightFlowReturnTarget = null;
let gamblingFlowReturnTarget = null;
let gamblingFlowSelection = 'poker';
let actionsReturnTarget = null;
let firstPlayerAssistCleanup = null;


function uiValue(path, fallback = undefined) {
  const parts = String(path || '').split('.').filter(Boolean);
  let value = db?.ui;
  for (const part of parts) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, part)) return fallback;
    value = value[part];
  }
  return value === undefined ? fallback : value;
}

function t(key, params = {}) {
  const value = uiValue(key, key);
  if (typeof value !== 'string') return String(key || '');
  return value.replace(/\{(\w+)\}/g, (match, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match);
}

function tp(key, count, params = {}) {
  const bank = uiValue(key, null);
  const template = bank && typeof bank === 'object' ? (count === 1 ? bank.one : bank.other) : null;
  if (typeof template !== 'string') return t(key, { ...params, count });
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const values = { ...params, count };
    return Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match;
  });
}

function languageOptions() {
  const options = uiValue('languageSelector.options', []);
  return Array.isArray(options) ? options.filter(option => option && option.code && option.nativeName) : [];
}

function currentLanguageOption() {
  const code = selectedLanguageCode();
  return languageOptions().find(option => option.code === code)
    || languageOptions().find(option => option.code === DEFAULT_LANGUAGE)
    || { code, nativeName: code.toUpperCase(), dir: 'ltr' };
}

function currentLanguageName() {
  return currentLanguageOption().nativeName || selectedLanguageCode().toUpperCase();
}

function closeLanguagePicker() {
  document.querySelector('.language-picker-overlay')?.remove();
}

function openLanguagePicker() {
  closeLanguagePicker();
  const currentCode = selectedLanguageCode();
  const options = languageOptions();
  const overlay = document.createElement('div');
  overlay.className = 'modal-screen-overlay language-picker-overlay';
  overlay.innerHTML = `<section class="panel modal-screen-card language-picker-card" role="dialog" aria-modal="true" aria-labelledby="languagePickerTitle">
    <button type="button" class="dialog-close-x" data-language-picker-close aria-label="${escapeHtml(t('accessibility.close'))}">&#10005;</button>
    <div class="language-picker-heading">
      <span class="language-picker-globe" aria-hidden="true">${LANGUAGE_GLOBE_SVG}</span>
      <div>
        <p class="eyebrow">${escapeHtml(t('app.brand'))}</p>
        <h2 id="languagePickerTitle">${escapeHtml(t('languageSelector.choose'))}</h2>
      </div>
    </div>
    <p class="language-picker-intro">${escapeHtml(t('languageSelector.prompt'))}</p>
    <div class="language-picker-options" role="listbox" aria-label="${escapeHtml(t('languageSelector.choose'))}">
      ${options.map(option => {
        const active = option.code === currentCode;
        return `<button type="button" class="language-picker-option ${active ? 'selected' : ''}" data-language-code="${escapeHtml(option.code)}" role="option" aria-selected="${active}">
          <span class="language-picker-check" aria-hidden="true">${active ? '✓' : ''}</span>
          <span class="language-picker-name">${escapeHtml(option.nativeName)}</span>
          ${option.region ? `<span class="language-picker-region">${escapeHtml(option.region)}</span>` : ''}
        </button>`;
      }).join('')}
    </div>
  </section>`;
  document.body.appendChild(overlay);

  overlay.querySelector('[data-language-picker-close]')?.addEventListener('click', closeLanguagePicker);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeLanguagePicker(); });
  overlay.querySelectorAll('[data-language-code]').forEach(button => {
    button.addEventListener('click', () => {
      const code = button.dataset.languageCode;
      if (!languageOptions().some(option => option.code === code)) return;
      localStorage.setItem(LANGUAGE_KEY, code);
      window.location.reload();
    });
  });
}

function applyStaticTranslations(root = document) {
  document.documentElement.lang = uiValue('app.language', 'en');
  root.querySelectorAll?.('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll?.('[data-i18n-aria-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
  root.querySelectorAll?.('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  root.querySelectorAll?.('[data-i18n-content]').forEach(el => { el.setAttribute('content', t(el.dataset.i18nContent)); });
}

function moduleName(item) {
  if (!item?.id) return '';
  const parent = MODULES.find(group => (group.modules || []).some(child => child.id === item.id));
  return parent
    ? t(`modules.${parent.id}.children.${item.id}.name`)
    : t(`modules.${item.id}.name`);
}
function moduleDetail(item) {
  if (!item?.id) return '';
  const parent = MODULES.find(group => (group.modules || []).some(child => child.id === item.id));
  return parent
    ? t(`modules.${parent.id}.children.${item.id}.detail`)
    : t(`modules.${item.id}.detail`);
}
function localizedColorName(color) {
  return t(`setup.colors.${color}`);
}
function localizedColorPlayer(color) {
  return t('setup.colorPlayer', { color: localizedColorName(color) });
}

function storyTrackTitle(space) { return space?.id ? t(`story.track.${space.id}.title`) : ''; }
function storyTrackText(space) { return space?.id ? t(`story.track.${space.id}.screenText`) : ''; }
function diceTypeLabel(typeKey) { return t(`assist.dice.types.${typeKey}.label`); }
function diceFaceLabel(typeKey, face) { return t(`assist.dice.types.${typeKey}.faces.${face}`); }
function fightCardAbilityText(rank) { return t(`assist.fight.cardAbilities.${rank}`); }
function newspaperMoodBank(key) { return uiValue(`newspaper.moods.${key}`, uiValue('newspaper.moods.opportunity', {})); }

const STORY_FREQUENCY_OPTIONS = [
  { value: 'rare' },
  { value: 'standard' },
  { value: 'frequent' }
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
  if (!state.storyTrackLastReward || typeof state.storyTrackLastReward !== 'object') state.storyTrackLastReward = {};
  if (!Object.prototype.hasOwnProperty.call(state, 'storyTrackNotice')) state.storyTrackNotice = null;
  if (!state.settings || typeof state.settings !== 'object') state.settings = {};
  if (typeof state.settings.hideStoryTrackReminders !== 'boolean') state.settings.hideStoryTrackReminders = false;
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
    // Temporary in-page Story Point reward reminder. While present it
    // replaces the Story Point marker row without changing the page layout.
    storyTrackLastReward: {}, // retained for compatibility with v1.1.16 saves
    storyTrackNotice: null,
    // Per-player running totals of Gambling/Legendary/Marshal/Wanted points
    // gained from landing on the "choose a point" story-track space.
    playerCounters: {},
    arcProgress: {},
    worldEventClock: { nextAt: null, pendingEventId: null },
    settings: { musicOn: true, soundOn: true, voiceOn: true, musicVolume: 0.2, soundVolume: 0.6, voiceVolume: 0.8, hideStoryTrackReminders: false }
  };
}

async function init() {
  db = await loadData();
  applyStaticTranslations();
  state = loadSave() || defaultState();
  if (state.screen === 'reference' || state.screen === 'settings') state.screen = state.gameStarted ? 'game' : 'home';
  if (state.screen === 'gameSettings') state.screen = state.gameStarted ? 'game' : 'home';
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
  document.querySelectorAll('[data-open-settings]').forEach(btn => btn.addEventListener('click', () => {
    const returnTarget = btn.closest('#drawerNav') ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    renderSettingsOverlay(returnTarget);
  }));
  document.querySelectorAll('[data-open-reference]').forEach(btn => btn.addEventListener('click', () => {
    const returnTarget = btn.closest('#drawerNav') ? 'drawer' : null;
    document.getElementById('drawerNav')?.classList.remove('open');
    renderReferenceOverlay(returnTarget);
  }));
  document.getElementById('drawerGameSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('drawerNav')?.classList.remove('open');
    renderSettingsOverlay('drawer');
  });
  document.querySelectorAll('[data-end-game]').forEach(btn => btn.addEventListener('click', () => beginEndGame()));
  document.getElementById('assistCloseBtn')?.addEventListener('click', handleAssistCloseRequest);
  document.getElementById('storyDialogCloseBtn')?.addEventListener('click', () => { if (dialog.open) { dialog.classList.remove('player-color-prompt-dialog'); dialog.close(); render(); } });
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
    if (firstPlayerAssistCleanup) {
      firstPlayerAssistCleanup();
      firstPlayerAssistCleanup = null;
    }
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
    assistOpenedDirectly = true;
    assistReturnTarget = null;
    assistReturnAfterClose = false;
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

  // If the browser declined autoplay while restoring an in-progress game,
  // the very next real user gesture should recover music automatically.
  const recoverGameAudioFromGesture = () => {
    if (state?.gameStarted && state?.screen === 'game') ensureFrontierMusicPlaying();
  };
  document.addEventListener('pointerdown', recoverGameAudioFromGesture, { passive: true });
  document.addEventListener('keydown', recoverGameAudioFromGesture);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state?.gameStarted && state?.screen === 'game') ensureFrontierMusicPlaying();
  });
  window.addEventListener('focus', () => {
    if (state?.gameStarted && state?.screen === 'game') ensureFrontierMusicPlaying();
  });

  render();
  startWorldEventHeartbeat();
}

async function loadData() {
  const language = selectedLanguageCode();
  const uiUrl = localizedDataUrl(DATA_FILES.ui, language);
  const uiResponse = await fetch(uiUrl);
  if (!uiResponse.ok) throw new Error(uiUrl);
  const ui = await uiResponse.json();
  // Make UI copy available while the remaining data files load so any
  // user-facing load error can already be localized.
  db = { ...db, ui };
  const entries = await Promise.all(Object.entries(DATA_FILES)
    .filter(([key]) => key !== 'ui')
    .map(async ([key, url]) => {
      const localizedUrl = localizedDataUrl(url, language);
      const response = await fetch(localizedUrl);
      if (!response.ok) throw new Error(t('errors.unableLoad', { url: localizedUrl }));
      return [key, await response.json()];
    }));
  return { ...Object.fromEntries(entries), ui };
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
  if (screen === 'game' && state.gameStarted) {
    // Navigation to the live game is normally initiated by a user click/tap,
    // so use that gesture to recover from mobile/browser autoplay blocking.
    ensureFrontierMusicPlaying();
    }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
function setActiveNav() {
  document.querySelectorAll('.nav-btn, .bottom-btn').forEach(b => {
    const isScreenActive = b.dataset.view && b.dataset.view === state.screen;
    const isEndGameActive = b.hasAttribute('data-end-game') && (state.screen === 'finalTally' || state.screen === 'end');
    b.classList.toggle('active', !!(isScreenActive || isEndGameActive));
  });
  const drawerGameBtn = document.getElementById('drawerGameBtn');
  if (drawerGameBtn) drawerGameBtn.textContent = state.gameStarted ? t('navigation.resumeGame') : t('navigation.newGame');
  const drawerGameSettingsBtn = document.getElementById('drawerGameSettingsBtn');
  if (drawerGameSettingsBtn) {
    drawerGameSettingsBtn.disabled = false;
    drawerGameSettingsBtn.setAttribute('aria-disabled', 'false');
    drawerGameSettingsBtn.title = state.gameStarted ? t('settings.changeAudioGame') : t('settings.changeAudio');
  }
  document.querySelectorAll('[data-end-game]').forEach(btn => {
    btn.disabled = !state.gameStarted;
    btn.setAttribute('aria-disabled', state.gameStarted ? 'false' : 'true');
    btn.title = state.gameStarted ? t('settings.wrapGame') : t('settings.startBeforeEnd');
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
  button.textContent = t('navigation.about');
  drawer.appendChild(divider);
  drawer.appendChild(button);
}

function showCreditsSupportDialog() {
  const supportUrl = KOFI_SUPPORT_URL;
  currentDialogEvent = null;
  document.getElementById('dialogType').textContent = t('about.dialogType');
  document.getElementById('dialogTitle').textContent = t('about.title');
  document.getElementById('dialogText').innerHTML = `<div class="credits-support-copy">
    <p>${t('about.intro')}</p>
    <p>${escapeHtml(t('about.creator'))}</p>
    <p>${escapeHtml(t('about.support'))}</p>
    <p class="credits-disclaimer">${escapeHtml(t('about.disclaimer'))}</p>
  </div>
  <div class="about-version-section">${renderVersionBlock()}</div>
  <section class="credits-contact-block" aria-labelledby="creditsContactTitle">
    <h3 id="creditsContactTitle">${escapeHtml(t('about.contactTitle'))}</h3>
    <p>${escapeHtml(t('about.contactCopy'))}</p>
    <div class="credits-contact-links">
      <a href="${escapeHtml(BGG_PROFILE_URL)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(t('about.boardGameGeek'))}</span><strong>${escapeHtml(BGG_USERNAME)}</strong></a>
      <a href="mailto:${escapeHtml(CONTACT_EMAIL)}"><span>${escapeHtml(t('about.email'))}</span><strong>${escapeHtml(CONTACT_EMAIL)}</strong></a>
    </div>
  </section>`;
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
  supportBtn.textContent = t('about.supportButton');
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

// Event data can provide moduleVariants when the same encounter should behave
// differently depending on optional modules in the current game. The base
// event remains the fallback. A matching variant overrides only its authored
// presentation/behavior fields; its requiredModules are matching rules and do
// not replace the base event's eligibility requirements.
function eventModuleVariantMatches(variant = {}) {
  if (!hasAllModules(variant.requiredModules || [])) return false;
  if (Array.isArray(variant.anyModules) && variant.anyModules.length && !variant.anyModules.some(id => hasModule(id))) return false;
  const blocked = variant.blockedModules || variant.forbiddenModules || [];
  if (blocked.some(id => hasModule(id))) return false;
  return true;
}

function prepareEventForModules(event) {
  if (!event || !Array.isArray(event.moduleVariants) || !event.moduleVariants.length) return event ? { ...event } : event;
  const matches = event.moduleVariants
    .filter(eventModuleVariantMatches)
    .sort((a, b) => ((b.requiredModules || []).length + (b.anyModules || []).length) - ((a.requiredModules || []).length + (a.anyModules || []).length));
  if (!matches.length) return { ...event };
  const chosen = matches[0];
  const { requiredModules, anyModules, blockedModules, forbiddenModules, id: variantId, ...overrides } = chosen;
  return { ...event, ...overrides, _moduleVariantId: variantId || null };
}

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
      lastCompletedNodeId: null,
      lastActorColor: null,
      nodeActors: {},
      nodeOutcomes: {},
      chapterHistory: [],
      status: 'inactive',
      scope: 'shared'
    };
  }
  const progress = state.arcProgress[arcId];
  // Forward-compatible migration for games saved before chapter-level actor
  // history existed. Old assignedColor is preserved only for truly personal
  // arcs; shared arcs ignore it when deciding who may trigger a later chapter.
  if (!Array.isArray(progress.completedNodeIds)) progress.completedNodeIds = [];
  if (!progress.nodeActors || typeof progress.nodeActors !== 'object') progress.nodeActors = {};
  if (!progress.nodeOutcomes || typeof progress.nodeOutcomes !== 'object') progress.nodeOutcomes = {};
  if (!Array.isArray(progress.chapterHistory)) progress.chapterHistory = [];
  if (!('lastCompletedNodeId' in progress)) progress.lastCompletedNodeId = null;
  if (!('lastActorColor' in progress)) progress.lastActorColor = null;
  if (!progress.scope) progress.scope = 'shared';
  return progress;
}

function markArcNodeStarted(arcId, assignedColor = null, scope = 'shared') {
  if (!arcId) return;
  const progress = getArcProgress(arcId);
  if (progress.status === 'inactive') progress.status = 'in_progress';
  progress.scope = scope || progress.scope || 'shared';
  // Only an explicitly personal arc is owned by one player for its full run.
  // Shared Character Arcs deliberately do NOT lock to their first player.
  if (assignedColor && !progress.assignedColor && progress.scope === 'personal') progress.assignedColor = assignedColor;
}

// Permanently retires a chapter and remembers both its outcome and the player
// involved in THAT chapter. Shared arcs use this history for later flavor text
// without making the whole arc belong to that player.
function markArcNodeCompleted(arcId, nodeId, outcome, assignedColor) {
  if (!arcId || !nodeId) return;
  const progress = getArcProgress(arcId);
  if (!progress.completedNodeIds.includes(nodeId)) progress.completedNodeIds.push(nodeId);
  progress.lastOutcome = outcome;
  progress.lastCompletedNodeId = nodeId;
  progress.lastActorColor = assignedColor || null;
  progress.nodeActors[nodeId] = assignedColor || null;
  progress.nodeOutcomes[nodeId] = outcome || null;
  const existingHistory = progress.chapterHistory.find(h => h.nodeId === nodeId);
  if (existingHistory) {
    existingHistory.outcome = outcome || null;
    existingHistory.color = assignedColor || null;
    existingHistory.completedAt = Date.now();
  } else {
    progress.chapterHistory.push({ nodeId, outcome: outcome || null, color: assignedColor || null, completedAt: Date.now() });
  }
  if (assignedColor && !progress.assignedColor && progress.scope === 'personal') progress.assignedColor = assignedColor;
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

function arcReferenceActorColor(arcId, compareToNodeId = null) {
  if (!arcId) return null;
  const progress = getArcProgress(arcId);
  if (compareToNodeId) return progress.nodeActors?.[compareToNodeId] || null;
  return progress.lastActorColor || null;
}

// A chapter may provide playerAwareText to change its title/instructions when
// the player who triggered this chapter is (or is not) the player involved in
// a specified earlier chapter. Any fields in the chosen variant can override
// the base event, including title, screenText, narrationScript and audioFile.
function prepareArcEventForPlayer(event, triggeringColor = null) {
  if (!event?.arcId || !event.playerAwareText) return { ...event };
  const config = event.playerAwareText;
  const referenceColor = arcReferenceActorColor(event.arcId, config.compareToNodeId || null);
  let variant = config.default || null;
  let relation = 'unknown';
  if (referenceColor && triggeringColor) {
    relation = referenceColor === triggeringColor ? 'same' : 'different';
    variant = relation === 'same' ? config.samePlayer : config.differentPlayer;
  }
  return {
    ...event,
    ...(variant || {}),
    _referenceActorColor: referenceColor || null,
    _playerAwareRelation: relation
  };
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
  { id: 'start' },
  { id: 'sheriff' },
  { id: 'bandits' },
  { id: 'choose' }
];

function gainStoryPoint(color, onDone) {
  if (!color) { onDone?.(); return; }
  // A Story Point can arrive while the previous reward reminder is still on
  // screen. Commit that reminder's "Do not show again" choice before the
  // notice is replaced so the preference cannot be lost.
  commitStoryTrackReminderPreference();
  ensurePlayerTrackState(color);
  const next = (state.storyTrack[color] + 1) % STORY_TRACK_SPACES.length;
  const space = STORY_TRACK_SPACES[next];

  // The fourth reward is "Choose a Point". At the table the marker returns
  // to Start after that reward is resolved, so keep the virtual marker in sync.
  state.storyTrack[color] = space.id === 'choose' ? 0 : next;
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyTrackAdvance', color, space: space.id });

  // This reminder is passive page state, never a queued modal/snackbar. It
  // temporarily replaces the Story Point marker row and therefore cannot
  // cover or move the event triggers below it. Narrative events proceed now.
  if (!state.settings?.hideStoryTrackReminders && space.id !== 'start') {
    state.storyTrackNotice = { color, spaceId: space.id, at: Date.now() };
  }
  save();
  onDone?.();
}

function storyTrackNoticeMarkup() {
  if (!isStoryTrackEnabled() || state.settings?.hideStoryTrackReminders || !state.storyTrackNotice) return '';
  const { color, spaceId } = state.storyTrackNotice;
  const space = STORY_TRACK_SPACES.find(item => item.id === spaceId);
  if (!space || space.id === 'start') return '';
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const displayName = player?.name?.trim() || player?.character?.trim() || localizedColorPlayer(color);
  const dotClass = PLAYER_COLORS.includes(color) ? `swatch-${color}` : 'swatch-none';
  return `<div class="story-track-area-reminder" role="status" aria-live="polite" tabindex="0" data-dismiss-story-track-reminder title="${t('strings.tap_to_dismiss')}">
    <div class="story-track-reminder-heading">
      <span class="player-color-swatch story-track-reminder-dot ${dotClass}" aria-hidden="true"></span>
      <strong>${escapeHtml(displayName)}</strong>
      <span class="story-track-reminder-label">${t('strings.story_point')}</span>
      <label class="story-track-reminder-never" title="${t('strings.hide_future_story_point_reminder_messages')}"><input type="checkbox" data-story-track-never> ${t('strings.do_not_show_again')}</label>
    </div>
    <div class="story-track-reminder-message"><strong>${escapeHtml(storyTrackTitle(space))}:</strong> ${escapeHtml(storyTrackText(space))}</div>
  </div>`;
}

function activePlayerStoryAlertColors() {
  const colors = new Set();
  const collect = event => {
    const color = event?.assignedColor || event?._assignedColor || event?.color || '';
    if (PLAYER_COLORS.includes(color)) colors.add(color);
  };
  (state.activeStories || []).forEach(collect);
  // World events are currently global, but include this for any future
  // player-owned unresolved event type that uses the same assignedColor field.
  (state.activeWorldEvents || []).forEach(collect);
  return colors;
}

function storyTrackMarkersMarkup() {
  const colors = (state.setup.playerColors || []).filter(Boolean);
  const alertColors = activePlayerStoryAlertColors();
  return `<div class="story-track-strip" aria-label="${t('strings.story_point_track_per_player')}">${colors.map(color => {
    ensurePlayerTrackState(color);
    const position = state.storyTrack[color] || 0;
    const space = STORY_TRACK_SPACES[position];
    const hasAlert = alertColors.has(color);
    const alertLabel = hasAlert ? t('strings.unresolved_story_chapter') : '';
    return `<button type="button" class="player-color-swatch story-track-chip swatch-${color}${hasAlert ? ' has-story-alert' : ''}" data-story-track-color="${color}" title="${escapeHtml(t('story.markerTitle', { player: playerLabel(color), space: storyTrackTitle(space), alert: alertLabel }))}">
      <span class="story-track-chip-number">${position + 1}</span>
      ${hasAlert ? '<span class="player-story-alert-badge" aria-hidden="true">!</span>' : ''}
    </button>`;
  }).join('')}</div>`;
}

function playerStoryAlertsOnlyMarkup() {
  const alertColors = activePlayerStoryAlertColors();
  const colors = (state.setup.playerColors || []).filter(color => alertColors.has(color));
  if (!colors.length) return '';
  return `<div class="story-track-strip player-story-alert-strip" aria-label="${t('strings.players_with_unresolved_story_chapters')}">${colors.map(color => {
    const name = playerNameOnly(color);
    return `<button type="button" class="player-color-swatch player-story-alert-only swatch-${color}" data-player-story-alert="${color}" title="${escapeHtml(t('story.alertTitle', { player: name }))}" aria-label="${escapeHtml(t('story.alertAria', { player: name }))}"><span>!</span></button>`;
  }).join('')}</div>`;
}

function renderStoryTrackArea() {
  const colors = (state.setup.playerColors || []).filter(Boolean);
  if (!colors.length) return '';
  if (!isStoryTrackEnabled()) {
    const alerts = playerStoryAlertsOnlyMarkup();
    return alerts ? `<div class="story-track-area story-alert-only-area">${alerts}</div>` : '';
  }
  const reminder = storyTrackNoticeMarkup();
  return `<div class="story-track-area">${reminder || storyTrackMarkersMarkup()}</div>`;
}

function commitStoryTrackReminderPreference() {
  const never = app.querySelector('[data-story-track-never]');
  if (!never) return false;
  state.settings.hideStoryTrackReminders = !!never.checked;
  save();
  return true;
}

function appPageOverlayOpen() {
  return !!app.querySelector('[data-settings-backdrop], [data-game-settings-backdrop], [data-reference-backdrop]');
}

function dismissStoryTrackNotice() {
  if (!state.storyTrackNotice) return;
  if (storyTrackNoticeTimer) clearTimeout(storyTrackNoticeTimer);
  storyTrackNoticeTimer = null;
  commitStoryTrackReminderPreference();
  state.storyTrackNotice = null;
  save();
  // Settings/reference overlays are rendered inside #app. Re-rendering the
  // page while one is open destroys that overlay, which previously made the
  // Settings dialog appear to close by itself when this five-second reminder
  // expired. Let the overlay's normal close path perform the next render.
  if (!appPageOverlayOpen()) render();
}

function scheduleStoryTrackNoticeTimeout() {
  if (storyTrackNoticeTimer) clearTimeout(storyTrackNoticeTimer);
  storyTrackNoticeTimer = null;
  if (!state.storyTrackNotice) return;
  const noticeAt = state.storyTrackNotice.at;

  const expire = () => {
    if (!state.storyTrackNotice || state.storyTrackNotice.at !== noticeAt) return;
    // If a genuine story/world event is covering the page, do not let the
    // reminder silently expire underneath it. Give the player a few seconds
    // to see the reminder after the event dialog closes.
    if (dialog?.open || appPageOverlayOpen()) {
      storyTrackNoticeTimer = setTimeout(() => {
        if (!dialog?.open && !appPageOverlayOpen()) storyTrackNoticeTimer = setTimeout(expire, 3500);
        else expire();
      }, 500);
      return;
    }
    dismissStoryTrackNotice();
  };
  storyTrackNoticeTimer = setTimeout(expire, 5000);
}

function bindStoryTrackArea() {
  const reminder = app.querySelector('[data-dismiss-story-track-reminder]');
  if (reminder) {
    reminder.addEventListener('click', event => {
      if (event.target.closest('[data-story-track-never]')) return;
      dismissStoryTrackNotice();
    });
    reminder.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        dismissStoryTrackNotice();
      }
    });
    const never = reminder.querySelector('[data-story-track-never]');
    never?.addEventListener('click', event => event.stopPropagation());
    never?.addEventListener('change', () => {
      // Persist immediately. The visible reminder can remain until its normal
      // timeout, but any later render/replacement already knows the choice.
      state.settings.hideStoryTrackReminders = !!never.checked;
      save();
    });
    scheduleStoryTrackNoticeTimeout();
  } else if (storyTrackNoticeTimer) {
    clearTimeout(storyTrackNoticeTimer);
    storyTrackNoticeTimer = null;
  }
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
  btn.title = everyPlayerHasColor ? '' : t('strings.assign_a_color_to_every_player_before_starting');
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
      <button type="button" class="player-color-swatch ${colorClass}" data-cycle-player-color="${index}" onclick="cyclePlayerColor(${index})" title="${t('strings.tap_to_cycle_color')}" aria-label="${escapeHtml(t('setup.cyclePlayerColor', { number: index + 1 }))}"></button>
      <input id="playerName_${index}" class="player-setup-input" value="${escapeHtml(player.name || '')}" placeholder="${t('strings.name')}" autocomplete="off" aria-label="${escapeHtml(t('setup.playerNameAria', { number: index + 1 }))}">
      <select id="playerCharacter_${index}" class="player-setup-input player-character-select" aria-label="${escapeHtml(t('setup.playerCharacterAria', { number: index + 1 }))}">
        ${characterOptions.map(name => `<option value="${escapeHtml(name)}" ${player.character === name ? 'selected' : ''}>${name ? escapeHtml(name) : escapeHtml(t('setup.character'))}</option>`).join('')}
      </select>
      <button type="button" class="player-remove-btn" data-remove-player="${index}" ${canRemove ? '' : 'disabled'} aria-label="${escapeHtml(t('setup.removePlayer', { number: index + 1 }))}">${TRASH_ICON_SVG}</button>
    </div>`;
  }).join('');
  const manInBlackRow = hasModule('wild_bunch_man_in_black') ? t('strings.man_in_black_2') : '';
  const goalsNote = hasModule('base_goals') ? t('strings.goals_after_choosing_each_character_take_that_character_s_4_goal_cards') : '';
  const addButton = state.setup.playerDetails.length < 6 ? t('strings.add_player') : '';
  return rows + manInBlackRow + addButton + goalsNote;
}

function playerLabel(color) {
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  return player?.name ? t('setup.playerWithColor', { name: player.name, color: localizedColorName(color) }) : localizedColorPlayer(color);
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
  const recent = state.triggeredLog.filter(t => t.type === 'primaryTrigger').slice(0, WANTED_MARSHAL_WINDOW);
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
  // The visible trigger sounds are small, short cues. Preload just the current
  // three so the first tap is responsive without eagerly loading every SFX.
  [...new Set(state.activeTriggers.map(trigger => trigger.soundFile).filter(Boolean))].forEach(preloadAudio);
}

function startGameFromSetup() {
  updateSetupFromUI(false);
  if (!isSetupReadyToStart()) {
    alert(t('setup.assignColors'));
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
  state.storyTrackLastReward = {};
  state.storyTrackNotice = null;
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
  render();
  // Starting the game is a user gesture, which is the most reliable moment
  // to begin HTML audio on mobile browsers. Start the track that matches the
  // frontier's actual current mood rather than blindly starting the default.
  ensureFrontierMusicPlaying();
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
  // Do not interrupt an app-level overlay such as Settings. These overlays
  // live inside #app, so a later page render after the world event would make
  // them disappear even though the player never closed them.
  if (dialog.open || assistDialog.open || appPageOverlayOpen()) return;
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

  // Story Point rewards update passive page UI only. They never delay or
  // queue the real narrative event that may result from this trigger.
  gainStoryPoint(triggeringColor, () => finishPrimaryTriggerNarrative(trigger, triggeringColor));
}

function deliverArcEvent(event, triggeringColor) {
  if (!event) return false;
  const scope = event.arcScope || 'shared';
  // Shared and personal chapters are owned by the player who triggered that
  // chapter. Global storyline chapters remain table-wide.
  if (scope !== 'global' && !triggeringColor) {
    promptForPlayerColor(t('events.whoTriggeredChapter'), event.title || t('events.storyArc'), t('events.chooseChapterPlayer'), color => {
      handleCreatedEvent(prepareArcEventForPlayer(event, color), 'characterArc', color);
      save();
    });
    return true;
  }
  handleCreatedEvent(prepareArcEventForPlayer(event, triggeringColor), 'characterArc', triggeringColor);
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
      arcScope: arc.scope || 'shared',
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
    // Only explicitly personal arcs stay locked to their original player.
    // Shared Character Arcs can be advanced by any player; the triggering
    // player owns only the chapter they just revealed.
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
  const progress = getArcProgress(pick.arcId);
  const inheritedColor = pick.arcScope === 'personal' ? (progress.assignedColor || null) : null;
  return deliverArcEvent(pick, inheritedColor);
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
  state.triggeredLog.unshift({
    time: Date.now(),
    type: 'worldEventStarted',
    id: event.id,
    label: event.title || event.id,
    tags: event.tags || []
  });
  state.triggeredLog = state.triggeredLog.slice(0, 200);
}

// event.type === 'storyTrigger' is a TASK: a player needs to go do something
// at the table before it resolves or expires, so it lives in activeStories
// until the player taps Resolved/Ignored. Everything else that comes out of
// an arc/storyline (instantEvent, or a chapter typed as worldEvent) resolves
// immediately - narration + effects fire right away and the node is retired
// on the spot, since there's no ongoing task to track.
function handleCreatedEvent(event, type, triggeringColor = null) {
  // Resolve any optional-module-specific version before the event is stored or
  // shown. This lets JSON alter text, buttons, rewards, effects, narration,
  // tags, etc. without hard-coding individual encounters in JavaScript.
  event = prepareEventForModules(event);
  event._deliveryType = type;
  if (triggeringColor) event._assignedColor = triggeringColor;
  const isTask = event.type === 'storyTrigger' || (type === 'characterArc' && !event.type);

  // Keep a readable history of the actual narrative encounters that occurred.
  // Primary triggers alone tell us what players did, but not which One-Offs or
  // timed World Events actually appeared; the end-game Gazette needs both.
  if (type === 'oneOff') {
    state.triggeredLog.unshift({
      time: Date.now(),
      type: 'oneOffEvent',
      id: event.id,
      label: event.title || event.id,
      color: triggeringColor || null,
      trigger: event.trigger || null,
      tags: event.tags || []
    });
    state.triggeredLog = state.triggeredLog.slice(0, 200);
  } else if (type === 'worldEvent' && event.type === 'worldEvent') {
    state.triggeredLog.unshift({
      time: Date.now(),
      type: 'worldEventStarted',
      id: event.id,
      label: event.title || event.id,
      tags: event.tags || []
    });
    state.triggeredLog = state.triggeredLog.slice(0, 200);
  }

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
      arcScope: event.arcScope || 'shared',
      // Shared Character Arc chapters belong to whoever triggered THIS
      // chapter. Personal arcs also have a chapter owner, while global
      // storyline tasks remain resolvable by any player.
      assignedColor: (event.arcScope || 'shared') === 'global' ? '' : (triggeringColor || ''),
      referenceActorColor: event._referenceActorColor || null,
      onResolved: event.onResolved || [],
      onExpired: event.onExpired || [],
      createdAt: Date.now()
    };
    state.activeStories.unshift(story);
    state.activeStories = state.activeStories.slice(0, db.settings.activeStoryLimit || 5);
    markArcNodeStarted(event.arcId, triggeringColor, event.arcScope || 'shared');
  } else if (event.type === 'worldEvent' && type === 'worldEvent') {
    state.activeWorldEvents.unshift({ ...event, turnsLeft: getDuration(event), createdAt: Date.now() });
    if (state.worldEventClock) {
      state.worldEventClock.pendingEventId = null;
      state.worldEventClock.nextAt = null;
    }
  } else if (event.arcId) {
    // instantEvent, or a storyline chapter typed as its own worldEvent - one-shot.
    markArcNodeStarted(event.arcId, triggeringColor, event.arcScope || 'shared');
    applyEffects(event.effects || [], { arcId: event.arcId, currentColor: triggeringColor, referenceColor: event._referenceActorColor || null });
    markArcNodeCompleted(event.arcId, event.id, 'resolved', triggeringColor);
  }
  showEventDialog(event);
}

function getDuration(event) {
  const durationEffect = event.effects?.find(e => e.type === 'duration_primary_triggers');
  return durationEffect?.count || event.durationPrimaryTriggers || 5;
}

// Active Story and World Event durations intentionally advance only when one
// of the three primary action cards is tapped. Resolving an active Story card
// does not spend another duration step, because that resolution can describe
// the same tabletop action that was just reported through a primary trigger.
// This keeps the countdown predictable and prevents accidental double-counting.
function tickStoryExpirations() {
  const expired = [];
  state.activeStories = state.activeStories.map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter(s => {
    if (s.turnsLeft <= 0) { expired.push(s); return false; }
    return true;
  });
  expired.forEach(s => {
    applyEffects(s.onExpired || [], { arcId: s.arcId, currentColor: s.assignedColor, referenceColor: s.referenceActorColor || null });
    markArcNodeCompleted(s.arcId, s.id, 'expired', s.assignedColor);
    state.triggeredLog.unshift({ time: Date.now(), type: 'storyExpired', id: s.id, label: s.title, color: s.assignedColor || null });
  });
}

function tickWorldExpirations() {
  const hadWorldEvents = state.activeWorldEvents.length > 0;
  state.activeWorldEvents = state.activeWorldEvents.map(w => ({ ...w, turnsLeft: w.turnsLeft - 1 })).filter(w => w.turnsLeft > 0);
  if (hadWorldEvents && !state.activeWorldEvents.length) scheduleNextWorldEvent(true);
}

function activeStoryScope(story) {
  if (!story) return 'shared';
  if (story.arcScope) return story.arcScope;
  const savedScope = story.arcId ? getArcProgress(story.arcId).scope : null;
  if (savedScope === 'global' || savedScope === 'personal' || savedScope === 'shared') return savedScope;
  const sourceNode = story.arcId ? allArcNodes().find(node => node.arcId === story.arcId && node.id === story.id) : null;
  return sourceNode?.arcScope || 'shared';
}

function storyResolverColor(story, resolvingColor = null) {
  return activeStoryScope(story) === 'global' ? (resolvingColor || null) : (story.assignedColor || null);
}

function promptResolveStory(storyId) {
  const story = state.activeStories.find(s => s.id === storyId);
  if (!story) return;
  if (activeStoryScope(story) === 'global' && isStoryTrackEnabled()) {
    promptForPlayerColor(t('events.whoResolved'), story.title, t('events.anyResolve'), color => resolveStory(storyId, color));
    return;
  }
  resolveStory(storyId, story.assignedColor || null);
}

function resolveStory(storyId, resolvingColor = null) {
  const story = state.activeStories.find(s => s.id === storyId);
  if (!story) return;
  const resolverColor = storyResolverColor(story, resolvingColor);
  applyEffects(story.onResolved || [], { arcId: story.arcId, currentColor: resolverColor, referenceColor: story.referenceActorColor || null });
  markArcNodeCompleted(story.arcId, story.id, 'resolved', resolverColor);
  state.activeStories = state.activeStories.filter(s => s.id !== storyId);
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyResolved', id: story.id, label: story.title, color: resolverColor || null });

  const afterStoryPoint = () => {
    const openedCounterChapter = checkCounterGatedNodes();
    queueDueWorldEvent();
    save();
    render();
    if (!openedCounterChapter) setTimeout(maybePresentPendingWorldEvent, 30);
  };
  if (isStoryTrackEnabled() && resolverColor) gainStoryPoint(resolverColor, afterStoryPoint);
  else afterStoryPoint();
}

function expireStory(storyId) {
  const story = state.activeStories.find(s => s.id === storyId);
  if (!story) return;
  applyEffects(story.onExpired || [], { arcId: story.arcId, currentColor: story.assignedColor, referenceColor: story.referenceActorColor || null });
  markArcNodeCompleted(story.arcId, story.id, 'expired', story.assignedColor);
  state.activeStories = state.activeStories.filter(s => s.id !== storyId);
  state.triggeredLog.unshift({ time: Date.now(), type: 'storyExpired', id: story.id, label: story.title, color: story.assignedColor || null });
  const openedCounterChapter = checkCounterGatedNodes();
  queueDueWorldEvent();
  save();
  render();
  if (!openedCounterChapter) setTimeout(maybePresentPendingWorldEvent, 30);
}

// `context.arcId` / `context.currentColor` / `context.referenceColor` let an
// effect branch on whether the player in THIS chapter is the same person who
// participated in a relevant earlier chapter. Shared arcs never need to lock
// the whole story to that earlier player.
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
      const referenceColor = context.referenceColor || (context.arcId ? arcReferenceActorColor(context.arcId, e.compareToNodeId || null) : null);
      const isSame = !!(referenceColor && context.currentColor && referenceColor === context.currentColor);
      applyEffects((isSame ? e.then : e.else) || [], { ...context, referenceColor });
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
  dialog.classList.add('player-color-prompt-dialog');
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
    btn.className = `player-color-swatch player-choice trigger-color-prompt-btn swatch-${color}`;
    btn.title = playerLabel(color);
    btn.setAttribute('aria-label', playerLabel(color));
    btn.onclick = () => {
      wrap.classList.remove('trigger-color-prompt-buttons');
      dialog.classList.remove('player-color-prompt-dialog');
      // Wait until the color-prompt dialog has completely closed before
      // opening the resulting event dialog. The shared dialog's global close
      // handler stops narration; reopening it synchronously here allowed that
      // old close event to immediately stop the NEW event's narration.
      dialog.addEventListener('close', () => onChosen(color), { once: true });
      dialog.close();
    };
    wrap.appendChild(btn);
  });
  if (!dialog.open) dialog.showModal();
}

function promptTriggerColor(triggerId) {
  const trigger = state.activeTriggers.find(t => t.id === triggerId);
  if (!trigger) return;
  promptForPlayerColor(t('events.whoTriggered'), trigger.label, t('events.tapTriggerPlayer'), color => tapPrimaryTrigger(triggerId, color));
}

function promptResolveWorldEvent(eventId) {
  const event = state.activeWorldEvents.find(w => w.id === eventId);
  if (!event) return;
  promptForPlayerColor(t('events.whoResolved'), event.title, t('events.tapResolvedPlayer'), color => resolveWorldEvent(eventId, color));
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

function normalizeEventCopyForComparison(value = '') {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .toLowerCase()
    .replace(/\+/g, t('strings.plus'))
    .replace(/\$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function eventCopyAlreadyCovers(mainText, extraText) {
  const main = normalizeEventCopyForComparison(mainText);
  const extra = normalizeEventCopyForComparison(extraText);
  if (!extra) return true;
  if (!main) return false;
  if (main.includes(extra) || extra.includes(main)) return true;

  // Reward/callout wording does not have to match the sentence verbatim. If
  // nearly all of its meaningful words are already in the main instruction,
  // showing the parchment callout merely repeats what the player just read.
  const ignored = new Set(['a','an','and','or','the','to','of','for','from','in','on','at','if','then','this','that','your','you','player','players','effect','reward']);
  const mainTokens = new Set(main.split(' ').filter(token => token.length > 1 && !ignored.has(token)));
  const extraTokens = [...new Set(extra.split(' ').filter(token => token.length > 1 && !ignored.has(token)))];
  if (!extraTokens.length) return true;
  const overlap = extraTokens.filter(token => mainTokens.has(token)).length / extraTokens.length;
  return overlap >= 0.75;
}

function eventDialogCalloutHtml(event) {
  const mainText = String(event?.screenText || '').trim();
  const parts = [];

  // `calloutText` is an escape hatch for authored content that genuinely adds
  // a second piece of information. It is intentionally never auto-generated.
  if (event?.calloutText && !eventCopyAlreadyCovers(mainText, event.calloutText)) {
    const label = escapeHtml(event.calloutLabel || t('dialogs.effect'));
    parts.push(`<strong>${label}:</strong> ${escapeHtml(event.calloutText)}`);
  }

  // Rewards are only separated into the callout when the main instruction did
  // not already tell the player about that reward.
  if (event?.rewardText && !eventCopyAlreadyCovers(mainText, event.rewardText)) {
    parts.push(`<strong>${t('strings.reward')}</strong> ${escapeHtml(event.rewardText)}`);
  }

  const effects = (event?.effects || []).filter(e => e?.type !== 'duration_primary_triggers');
  if (effects.length) {
    // Current event data states its mechanical instructions directly in
    // screenText, so do not automatically translate the state/effect payload
    // into a second summary box. A future event can explicitly opt in, or an
    // effect can provide authored displayText/calloutText when it truly adds
    // information that is not present in the main instruction.
    if (event?.showEffectCallout === true || !mainText) {
      const html = renderEffects(effects);
      if (html) parts.push(html);
    } else {
      const authoredEffects = effects
        .map(e => e?.displayText || e?.calloutText || '')
        .filter(text => text && !eventCopyAlreadyCovers(mainText, text));
      if (authoredEffects.length) {
        parts.push(`<strong>${t('strings.effect')}</strong><ul>${authoredEffects.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`);
      }
    }
  }

  return parts.join('');
}

function showEventDialog(event) {
  dialog.classList.remove('player-color-prompt-dialog');
  currentDialogEvent = event;
  document.getElementById('dialogType').textContent = event._deliveryType === 'worldEvent' ? t('dialogs.worldEvent') : event.arcTitle || t('dialogs.frontierEvent');
  document.getElementById('dialogTitle').textContent = event.title || t('dialogs.frontierEvent');
  document.getElementById('dialogText').textContent = event.screenText || t('dialogs.resolveAsInstructed');
  const reward = document.getElementById('dialogReward');
  reward.innerHTML = eventDialogCalloutHtml(event);
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
  // Open the modal first, then start narration. Besides matching the visible
  // dialog lifecycle, this avoids having playback begin while the dialog is
  // still transitioning from a preceding prompt. requestAnimationFrame gives
  // the browser one paint opportunity before audio starts.
  if (!dialog.open) dialog.showModal();
  if (event.audioFile && state.settings.voiceOn) {
    requestAnimationFrame(() => playVoice(event.audioFile));
  }
}

function renderDialogButtons(event) {
  const wrap = document.getElementById('dialogButtons');
  wrap.innerHTML = '';
  const buttons = event.resultButtons?.length ? event.resultButtons : [{ label: t('dialogs.dismiss') }];
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'primary-btn'; btn.textContent = typeof b === 'string' ? b : b.label;
    btn.onclick = () => {
      if (typeof b === 'object') applyEffects(b.effects || [], { arcId: event.arcId, currentColor: event._assignedColor, referenceColor: event._referenceActorColor || null });
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
  // Duration is already communicated by the live number + hourglass counter on
  // ongoing Story/World cards. Do not repeat "Lasts X primary triggers" in
  // the narrative dialog; keep the effect in state so expiration still works.
  const visibleEffects = (effects || []).filter(e => e?.type !== 'duration_primary_triggers');
  if (!visibleEffects.length) return '';
  return t('strings.effect_2') + visibleEffects.map(e => `<li>${effectToText(e)}</li>`).join('') + '</ul>';
}
function effectToText(e) {
  const count = Number(e?.count || 1);
  const amount = Number(e?.amount ?? 0);
  const useValue = e?.use ? uiValue(`events.effects.useValues.${e.use}`, String(e.use)) : '';
  const useSuffix = useValue ? t('events.effects.useSuffix', { use: useValue }) : '';
  const map = {
    spawn_bandits_current_space: () => t('events.effects.spawnBandits', { count }),
    simultaneous_npc_fight: () => t('events.effects.simultaneousNpcFight', { count, npc: e.npc ? uiValue(`events.effects.npcNames.${e.npc}`, String(e.npc)) : t('assist.fight.groups.npc') }),
    prospecting_bonus_die: () => t('events.effects.prospectingBonusDie', { count }),
    addWorldTag: () => t('events.effects.worldTag', { tag: e.tag || '' }),
    duration_primary_triggers: () => t('events.effects.duration', { count: e.count ?? '' }),
    start_world_event: () => t('events.effects.startWorldEvent', { eventId: e.eventId || '' }),
    if_same_color: () => t('events.effects.sameColor'),
    gain_story_point: () => t('events.effects.gainStoryPoint'),
    gainPlayerCounter: () => t('events.effects.gainPlayerCounter', { counter: e.counter ? uiValue(`events.effects.counterNames.${e.counter}`, String(e.counter)) : t('events.effects.point') }),
    reset_story_track: () => t('events.effects.resetStoryTrack'),
    gain_money: () => t('events.effects.gainMoney', { amount }),
    draw_poker: () => tp('events.effects.drawPoker', count, { count }),
    gain_wound: () => tp('events.effects.gainWound', count, { count }),
    gain_lp: () => t('events.effects.gainLP', { amount: e.amount || 1 }),
    gain_legendary_token: () => tp('events.effects.gainLegendaryToken', count, { count }),
    npc_draws: () => tp('events.effects.npcDraws', Number(e.cards || 1), { count: Number(e.cards || 1), use: useSuffix }),
    choice: () => t('events.effects.chooseOne'),
    choose_one: () => t('events.effects.chooseOne')
  };
  const mapped = map[e?.type];
  return e?.displayText || e?.calloutText || (mapped ? mapped() : t('events.resolveListedEffect'));
}

function render() {
  const homeLanguageSlot = document.getElementById('homeLanguageSelectorSlot');
  if (homeLanguageSlot && state?.screen !== 'home') homeLanguageSlot.innerHTML = '';
  document.body.classList.toggle('home-screen', state.screen === 'home');
  setActiveNav();
  refillTriggers();
  if (state.screen === 'home') return renderHome();
  if (state.screen === 'setup') return renderSetup();
  if (state.screen === 'gameSettings') return renderGameSettings();
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
      ? t('home.standardStories')
      : enabledStoryTypes.length === 0
        ? t('home.storiesOff')
        : t('home.customStories');
  const storyCount = Array.isArray(state.activeStories) ? state.activeStories.length : 0;
  const worldCount = Array.isArray(state.activeWorldEvents) ? state.activeWorldEvents.length : 0;

  const playerChips = players.map((player, index) => {
    const name = player?.name?.trim() || player?.character?.trim() || t('setup.playerNumber', { number: index + 1 });
    const color = PLAYER_COLORS.includes(player?.color) ? player.color : 'none';
    const character = player?.character?.trim();
    const title = character && character !== name ? `${name} — ${character}` : name;
    return `<span class="home-player-chip" title="${escapeHtml(title)}"><span class="home-player-dot swatch-${color}" aria-hidden="true"></span><span>${escapeHtml(name)}</span></span>`;
  }).join('');

  const activityParts = [];
  if (storyCount) activityParts.push(tp('home.activeStories', storyCount, { count: storyCount }));
  if (worldCount) activityParts.push(tp('home.worldEffects', worldCount, { count: worldCount }));
  const activityText = activityParts.length ? activityParts.join(' · ') : t('home.quiet');

  const showHomeLanguageSelector = !hasExplicitLanguageSelection();
  const languageName = currentLanguageName();

  const homeLanguageSlot = document.getElementById('homeLanguageSelectorSlot');
  if (homeLanguageSlot) {
    homeLanguageSlot.innerHTML = showHomeLanguageSelector ? `<button type="button" class="language-selector-button home-language-selector" id="homeLanguageSelector" aria-label="${escapeHtml(t('languageSelector.selectAria', { language: languageName }))}">
      <span class="language-selector-globe" aria-hidden="true">${LANGUAGE_GLOBE_SVG}</span>
      <span class="language-selector-name">${escapeHtml(languageName)}</span>
      <span class="language-selector-chevron" aria-hidden="true">▼</span>
    </button>` : '';
  }

  app.innerHTML = `<section class="hero home-hero ${isActiveGame ? 'has-active-game' : 'no-active-game'}">
    <div class="home-launcher">
      <div class="home-status-card">
        <div class="home-divider" aria-hidden="true"><span>★</span></div>

        ${isActiveGame ? `
          <p class="home-kicker">${t('strings.the_trail_continues')}</p>
          ${playerChips ? `<div class="home-player-chips" aria-label="${t('strings.players_in_the_current_game')}">${playerChips}</div>` : ''}
          <div class="home-game-facts" aria-label="${t('strings.current_game_summary')}">
            <span>${escapeHtml(tp('home.playerCount', playerCount, { count: playerCount }))}</span>
            <span>${targetLP} ${t('strings.lp')}</span>
            <span>${escapeHtml(storySummary)}</span>
          </div>
          <p class="home-context-line"><span aria-hidden="true">✦</span>${escapeHtml(activityText)}</p>
          <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary" id="resumeBtn">
            <span class="home-btn-mark" aria-hidden="true">◆</span>
            <span class="home-btn-label">${t('strings.continue_game')}</span>
            <span class="home-btn-arrow" aria-hidden="true">›</span>
          </button>` : t('strings.your_legend_awaits_gather_your_posse_and_make_your_mark_on_the_frontie')}
      </div>

      <div class="actions home-actions">
        ${isActiveGame ? t('strings.start_new_game') : t('strings.start_new_game_2')}
      </div>
    </div>
  </section>`;

  document.getElementById('newGameBtn')?.addEventListener('click', () => navigate('setup'));
  document.getElementById('resumeBtn')?.addEventListener('click', () => navigate('game'));
  document.getElementById('homeLanguageSelector')?.addEventListener('click', openLanguagePicker);
}

function renderStoryEventSetting(key, title, description) {
  normalizeStoryEventSettings();
  const cfg = state.setup.storyOptions[key];
  return `<div class="story-event-setting ${cfg.enabled ? '' : 'disabled'}" data-story-setting="${key}" title="${escapeHtml(description)}">
    <strong class="story-event-setting-title">${escapeHtml(title)}</strong>
    <label class="mini-switch" aria-label="${escapeHtml(t('story.settingEnabled', { title }))}">
      <input type="checkbox" id="storyEnabled_${key}" ${cfg.enabled ? 'checked' : ''}>
      <span></span>
    </label>
    <select class="story-frequency-select" data-story-frequency-select="${key}" aria-label="${escapeHtml(t('story.settingFrequency', { title }))}" ${cfg.enabled ? '' : 'disabled'}>
      ${STORY_FREQUENCY_OPTIONS.map(option => `<option value="${option.value}" ${cfg.frequency === option.value ? 'selected' : ''}>${escapeHtml(t(`story.frequency.${option.value}`))}</option>`).join('')}
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
      <button type="button" class="dialog-close-x" data-modal-close aria-label="${t('strings.close')}">&#10005;</button>

      <div class="setup-header">
        <div class="modal-title-header setup-title-block">
          <p class="eyebrow">${t('strings.game_setup')}</p>
          <h1 class="section-title setup-title">${t('strings.new_game')}</h1>
        </div>
        <div class="setup-trail" role="tablist" aria-label="${t('strings.setup_steps')}">
          <button type="button" class="trail-stop ${currentSetupPanel === 'modules' ? 'active' : ''}" data-panel="modules" role="tab" aria-selected="${currentSetupPanel === 'modules' ? 'true' : 'false'}"><span class="badge">1</span><span class="trail-label">${t('strings.modules')}</span></button>
          <button type="button" class="trail-stop ${currentSetupPanel === 'basics' ? 'active' : ''}" data-panel="basics" role="tab" aria-selected="${currentSetupPanel === 'basics' ? 'true' : 'false'}"><span class="badge">2</span><span class="trail-label">${t('strings.basics')}</span></button>
          <button type="button" class="trail-stop ${currentSetupPanel === 'setup' ? 'active' : ''}" data-panel="setup" role="tab" aria-selected="${currentSetupPanel === 'setup' ? 'true' : 'false'}"><span class="badge">3</span><span class="trail-label">${t('strings.setup')}</span></button>
        </div>
      </div>

      <div class="setup-content">

        <div class="setup-panel ${currentSetupPanel === 'modules' ? 'show' : ''}" id="panel-modules">
          <div class="module-groups">${MODULES.map(renderModuleGroup).join('')}</div>
          <div class="dialog-actions setup-panel-actions">
            <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary setup-next-btn" type="button" data-setup-next="basics">
              <span class="home-btn-mark" aria-hidden="true">◆</span>
              <span class="home-btn-label">${t('strings.next')}</span>
              <span class="home-btn-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div class="setup-panel ${currentSetupPanel === 'basics' ? 'show' : ''}" id="panel-basics">
          <details class="options-card" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.9H22l-5.8 4.2 2.2 7-6.4-4.4L5.6 20l2.2-7L2 8.9h7.6z"/></svg>
              <span class="options-card-title">${t('strings.victory_conditions')}</span>
              <span class="options-card-caret" aria-hidden="true"></span>
            </summary>
            <div class="options-card-body">
              <div class="lp-row">
                <button type="button" class="lp-step-btn" id="lpMinus" aria-label="${t('strings.decrease_target_lp')}">−</button>
                <span id="targetLPValue" class="target-lp-value" data-value="${state.setup.targetLP}">${state.setup.targetLP}</span>
                <button type="button" class="lp-step-btn" id="lpPlus" aria-label="${t('strings.increase_target_lp')}">+</button>
              </div>
              <p class="lp-caption">${t('strings.target_legend_points_to_win_the_game')}</p>
            </div>
          </details>

          <details class="options-card story-events-options" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/></svg>
              <span class="options-card-title">${t('strings.story_amp_events')}</span>
              <span class="options-card-caret" aria-hidden="true"></span>
            </summary>
            <div class="options-card-body">
              <label class="toggle-row check-row story-track-setting">
                <div class="toggle-text"><span class="t-title">${t('strings.track_story_points')}</span><span class="t-sub">${t('strings.track_each_player_s_story_track_and_show_compact_reward_reminders')}</span></div>
                <input type="checkbox" id="useStoryTrack" class="check-input">
              </label>
              <div class="story-event-settings">
                ${renderStoryEventSetting('oneOff', t('story.eventTypes.oneOff.title'), t('story.eventTypes.oneOff.description'))}
                ${renderStoryEventSetting('arcs', t('story.eventTypes.arcs.title'), t('story.eventTypes.arcs.description'))}
                ${renderStoryEventSetting('world', t('story.eventTypes.world.title'), t('story.eventTypes.world.description'))}
              </div>
            </div>
          </details>

          <details class="options-card" open>
            <summary class="options-card-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="9" r="2.6"/><path d="M15.5 14a4.6 4.6 0 0 1 5.5 4.4"/></svg>
              <span class="options-card-title">${t('strings.players')}</span>
              <span class="options-card-caret" aria-hidden="true"></span>
            </summary>
            <div class="options-card-body">
              <div class="player-setup-list" id="playerSetupRows">${renderPlayerSetupRows()}</div>
            </div>
          </details>
          <div class="dialog-actions setup-panel-actions">
            <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary setup-next-btn" type="button" data-setup-next="setup">
              <span class="home-btn-mark" aria-hidden="true">◆</span>
              <span class="home-btn-label">${t('strings.next')}</span>
              <span class="home-btn-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div class="setup-panel ${currentSetupPanel === 'setup' ? 'show' : ''}" id="panel-setup">
          <div id="setupNotes"></div>
          <div class="dialog-actions setup-panel-actions setup-start-actions">
            <button class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary setup-start-game-btn" id="beginGame">
              <span class="home-btn-mark" aria-hidden="true">◆</span>
              <span class="home-btn-label">${t('strings.start_game')}</span>
              <span class="home-btn-arrow" aria-hidden="true">›</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  </div>`;

  document.getElementById('useStoryTrack').checked = state.setup.useStoryTrack !== false;

  // --- trail step navigation ---
  const trailStops = Array.from(app.querySelectorAll('.trail-stop'));
  const showSetupPanel = panelName => {
    const stop = trailStops.find(item => item.dataset.panel === panelName);
    if (!stop) return;
    const index = trailStops.indexOf(stop);
    trailStops.forEach((s, i) => {
      s.classList.toggle('active', s === stop);
      s.classList.toggle('done', i < index);
      s.setAttribute('aria-selected', s === stop ? 'true' : 'false');
    });
    app.querySelectorAll('.setup-panel').forEach(p => p.classList.toggle('show', p.id === `panel-${panelName}`));
    state.setup.setupPanel = panelName;
    save();
    const content = app.querySelector('.setup-content');
    if (content) content.scrollTop = 0;
  };
  trailStops.forEach(stop => stop.addEventListener('click', () => showSetupPanel(stop.dataset.panel)));
  app.querySelectorAll('[data-setup-next]').forEach(btn => btn.addEventListener('click', () => {
    updateSetupFromUI(false);
    showSetupPanel(btn.dataset.setupNext);
  }));

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

function renderGameSettings() {
  if (!state.gameStarted) return navigate('home');
  normalizeStoryEventSettings();
  const returnScreen = gameSettingsReturnScreen && gameSettingsReturnScreen !== 'gameSettings' ? gameSettingsReturnScreen : 'game';
  app.innerHTML = `<div class="modal-screen-overlay" data-game-settings-backdrop>
    <section class="panel modal-screen-card game-settings-card">
      <button type="button" class="dialog-close-x" data-game-settings-close aria-label="${t('strings.close')}">&#10005;</button>
      <div class="modal-title-header game-settings-title-block">
        <p class="eyebrow">${t('strings.current_game')}</p>
        <h1 class="section-title setup-title">${t('strings.game_settings')}</h1>
      </div>

      <p class="game-settings-intro">${t('strings.adjust_story_features_without_changing_the_modules_used_to_start_this_ga')}</p>

      <details class="options-card story-events-options" open>
        <summary class="options-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/></svg>
          <span class="options-card-title">${t('strings.story_amp_events')}</span>
          <span class="options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body">
          <div class="story-event-settings">
            ${renderStoryEventSetting('oneOff', t('story.eventTypes.oneOff.title'), t('story.eventTypes.oneOff.description'))}
            ${renderStoryEventSetting('arcs', t('story.eventTypes.arcs.title'), t('story.eventTypes.arcs.description'))}
            ${renderStoryEventSetting('world', t('story.eventTypes.world.title'), t('story.eventTypes.world.description'))}
          </div>
        </div>
      </details>

      <details class="options-card" open>
        <summary class="options-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>
          <span class="options-card-title">${t('strings.story_points')}</span>
          <span class="options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body">
          <label class="toggle-row check-row story-track-setting">
            <div class="toggle-text"><span class="t-title">${t('strings.track_story_points')}</span><span class="t-sub">${t('strings.show_and_maintain_each_player_s_story_point_track_during_this_game')}</span></div>
            <input type="checkbox" id="useStoryTrack" class="check-input" ${isStoryTrackEnabled() ? 'checked' : ''}>
          </label>
          <label class="toggle-row check-row story-track-setting">
            <div class="toggle-text"><span class="t-title">${t('strings.story_point_reward_reminders')}</span><span class="t-sub">${t('strings.show_the_compact_reminder_when_a_story_point_advances_a_player_s_marker')}</span></div>
            <input type="checkbox" id="showStoryTrackReminders" class="check-input" ${state.settings?.hideStoryTrackReminders ? '' : 'checked'}>
          </label>
        </div>
      </details>

      <div class="dialog-actions game-settings-actions">
        <button type="button" class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary" id="gameSettingsDone">
          <span class="home-btn-mark" aria-hidden="true">◆</span>
          <span class="home-btn-label">${t('strings.done')}</span>
          <span class="home-btn-arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  </div>`;

  const applyGameSettings = () => {
    updateSetupFromUI(false);
    const showReminders = document.getElementById('showStoryTrackReminders')?.checked !== false;
    state.settings.hideStoryTrackReminders = !showReminders;
    if (!showReminders) state.storyTrackNotice = null;
    save();
  };

  app.querySelectorAll('[id^="storyEnabled_"]').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const card = toggle.closest('[data-story-setting]');
      const frequencySelect = card?.querySelector('.story-frequency-select');
      card?.classList.toggle('disabled', !toggle.checked);
      if (frequencySelect) frequencySelect.disabled = !toggle.checked;
      applyGameSettings();
    });
  });
  app.querySelectorAll('.story-frequency-select').forEach(select => select.addEventListener('change', applyGameSettings));
  document.getElementById('useStoryTrack')?.addEventListener('change', applyGameSettings);
  document.getElementById('showStoryTrackReminders')?.addEventListener('change', applyGameSettings);

  const closeSettings = () => {
    applyGameSettings();
    navigate(returnScreen);
  };
  document.getElementById('gameSettingsDone')?.addEventListener('click', closeSettings);
  document.querySelector('[data-game-settings-close]')?.addEventListener('click', closeSettings);
  document.querySelector('[data-game-settings-backdrop]')?.addEventListener('click', event => {
    if (event.target.hasAttribute('data-game-settings-backdrop')) closeSettings();
  });
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

function requiredChip() {
  const required = escapeHtml(t('setup.required'));
  return `<span class="lock-pill" title="${required}"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 1 6 0v3z"/></svg>${required}</span>`;
}

function renderModuleGroup(group) {
  const children = group.modules || [];
  const parentChecked = group.locked || isModuleSelected(group.id);
  const checkbox = group.selectable === false ? '' : `<input class="module-group-checkbox check-input" type="checkbox" data-group="${group.id}" value="${group.id}" ${parentChecked ? 'checked' : ''} ${group.locked ? 'disabled' : ''} aria-label="${escapeHtml(t('setup.enableModule', { module: moduleName(group) }))}">`;
  return `<article class="module-group ${group.locked ? 'locked' : ''} ${group.selectable === false ? 'category-group' : ''} ${children.length ? 'has-children' : 'no-children'}">
    <div class="module-group-header">
      ${checkbox}
      <button type="button" class="module-group-header-content" aria-label="${escapeHtml(t(children.length ? 'setup.expandModule' : 'setup.selectModule', { module: moduleName(group) }))}">
        <span class="m-body"><strong>${escapeHtml(moduleName(group))}${group.locked ? ' ' + requiredChip() : ''}</strong><small>${escapeHtml(moduleDetail(group))}</small></span>
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
  const checkbox = `<input class="module-child-checkbox check-input" type="checkbox" data-parent="${group.id}" value="${child.id}" ${checked ? 'checked' : ''} ${isLocked ? 'disabled' : ''} aria-label="${escapeHtml(t('setup.enableModule', { module: moduleName(child) }))}">`;
  return `<div class="module-child ${isLocked ? 'locked' : ''}">
    ${checkbox}
    <span class="m-body"><strong>${escapeHtml(moduleName(child))}${isLocked ? ' ' + requiredChip() : ''}</strong><small>${escapeHtml(moduleDetail(child))}</small></span>
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
function renderStepIcon() {
  return '<span class="step-type-bullet" aria-hidden="true">•</span>';
}

function getVisibleSetupSections() {
  const setupSections = db.setupAssist?.sections || SETUP_SECTIONS;
  return setupSections.map(section => ({
    ...section,
    steps: (section.steps || []).filter(isSetupStepVisible)
  })).filter(section => section.steps.length);
}


function setupStepKey(section, stepIndex, step, parentPath = []) {
  const lineage = parentPath.length ? `${parentPath.join('.')}::` : '';
  return `${section.title}::${lineage}${stepIndex}::${step.text || step.title || step.summary || ''}`.slice(0, 220);
}

function collectTrackableSetupSteps(section, steps = section?.steps || [], parentPath = []) {
  const out = [];
  (steps || []).forEach((step, stepIndex) => {
    const path = [...parentPath, stepIndex];
    if (Array.isArray(step.substeps) && step.substeps.length) {
      out.push(...collectTrackableSetupSteps(section, step.substeps, path));
      return;
    }
    if (step.checkable === false) return;
    out.push({ step, key: setupStepKey(section, stepIndex, step, parentPath), stepIndex, parentPath });
  });
  return out;
}

function isSetupLeafStepDone(section, step, stepIndex, parentPath = []) {
  const stepKey = setupStepKey(section, stepIndex, step, parentPath);
  return setupStepProgress.has(stepKey);
}

function isSetupStepSatisfied(section, step, stepIndex, parentPath = []) {
  if (Array.isArray(step.substeps) && step.substeps.length) {
    const visibleSubsteps = step.substeps.filter(isSetupStepVisible);
    if (!visibleSubsteps.length) return true;
    return visibleSubsteps.every((childStep, childIndex) => isSetupStepSatisfied(section, childStep, childIndex, [...parentPath, stepIndex]));
  }
  if (step.checkable === false) return true;
  return isSetupLeafStepDone(section, step, stepIndex, parentPath);
}

function isSetupSectionComplete(section) {
  if (!section?.steps?.length) return false;
  const handledChoiceGroups = new Set();
  let hasAnyTrackable = false;
  for (let stepIndex = 0; stepIndex < section.steps.length; stepIndex += 1) {
    const step = section.steps[stepIndex];
    const groupId = step.choiceGroup || '';
    if (groupId) {
      if (handledChoiceGroups.has(groupId)) continue;
      handledChoiceGroups.add(groupId);
      const options = section.steps
        .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
        .filter(item => item.candidate.choiceGroup === groupId);
      const hasGroupTrackable = options.some(item => collectTrackableSetupSteps(section, [item.candidate], []).length > 0);
      if (hasGroupTrackable) hasAnyTrackable = true;
      if (!options.some(item => isSetupStepSatisfied(section, item.candidate, item.candidateIndex))) return false;
      continue;
    }
    const trackableCount = collectTrackableSetupSteps(section, [step], []).length;
    if (trackableCount > 0) hasAnyTrackable = true;
    if (!isSetupStepSatisfied(section, step, stepIndex)) return false;
  }
  return hasAnyTrackable;
}

function setupProgressStats(sections) {
  let total = 0;
  let done = 0;
  sections.forEach(section => collectTrackableSetupSteps(section).forEach(item => {
    total += 1;
    if (setupStepProgress.has(item.key)) done += 1;
  }));
  return { total, done };
}

function findModuleLabel(moduleId) {
  for (const group of MODULES) {
    if (group.id === moduleId) return moduleName(group);
    const child = (group.modules || []).find(item => item.id === moduleId);
    if (child) return moduleName(child);
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
    .map(group => moduleName(group));
  const storyTypes = [
    storyEventsEnabled('oneOff') ? t('setup.oneOffs') : null,
    storyEventsEnabled('arcs') ? t('setup.storyArcs') : null,
    storyEventsEnabled('world') ? t('strings.world_events') : null
  ].filter(Boolean);
  return `<div class="setup-ready-summary">
    <span><strong>${players}</strong> ${t('strings.player')}${players === 1 ? '' : 's'}</span>
    <span><strong>${Number(state.setup.targetLP || 20)}</strong> ${t('strings.lp')}</span>
    <span>${escapeHtml(selectedGroups.join(' · '))}</span>
    <span>${storyTypes.length ? escapeHtml(storyTypes.join(' · ')) : t('setup.narrativeOff')}</span>
  </div>`;
}

function renderSetupNotes() {
  normalizeSetupModules();
  normalizeStoryEventSettings();
  const wrap = document.getElementById('setupNotes');
  if (!wrap) return;
  setupStepProgress = new Set(state.setup.setupProgress || []);
  state.setup.setupGuideMode = 'guided';
  const visibleSections = getVisibleSetupSections();
  if (!visibleSections.length) {
    wrap.innerHTML = `<p class="hint">${escapeHtml(t('setup.noSteps'))}</p>`;
    return;
  }

  const firstIncomplete = visibleSections.findIndex(section => !isSetupSectionComplete(section));
  let currentIndex = Math.max(0, Math.min(visibleSections.length - 1, Number(state.setup.setupGuideSection) || 0));
  if (firstIncomplete >= 0 && !Number.isFinite(Number(state.setup.setupGuideSection))) currentIndex = firstIncomplete;
  state.setup.setupGuideSection = currentIndex;

  wrap.innerHTML = renderGuidedSetup(visibleSections, currentIndex);
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
    <div class="setup-section-rail" aria-label="${t('strings.setup_sections')}">${rail}</div>
    <article class="setup-guide-current ${currentComplete ? 'complete' : ''}">
      <header class="setup-guide-current-head">
        <span class="step-number">${currentComplete ? '✓' : currentIndex + 1}</span>
        <div>
          <p class="eyebrow">${t('strings.setup_step')} ${currentIndex + 1}</p>
          <h3>${escapeHtml(current.title)}</h3>
          ${current.summary ? `<p>${escapeHtml(current.summary)}</p>` : ''}
        </div>
      </header>
      <ul class="setup-checklist guided-checklist">${current.steps.map((step, stepIndex) => renderSetupStep(step, current, stepIndex)).join('')}</ul>
      <div class="setup-guide-nav">
        <button type="button" class="secondary-btn" data-setup-prev ${currentIndex === 0 ? 'disabled' : ''}>${t('strings.back')}</button>
        <button type="button" class="primary-btn" data-setup-next ${currentIndex === sections.length - 1 ? 'disabled' : ''}>${t('strings.next')}</button>
      </div>
    </article>
  </div>`;
}

function scrollSetupGuideToTop(behavior = 'smooth') {
  requestAnimationFrame(() => {
    const rail = document.querySelector('#setupNotes .setup-section-rail');
    const activeStop = rail?.querySelector('.setup-section-stop.active');
    rail?.scrollIntoView({ behavior, block: 'start' });
    if (rail && activeStop) {
      const targetLeft = activeStop.offsetLeft - ((rail.clientWidth - activeStop.offsetWidth) / 2);
      rail.scrollTo({ left: Math.max(0, targetLeft), behavior });
    }
  });
}

function bindSetupNoteInteractions(wrap, visibleSections) {
  wrap.querySelectorAll('[data-setup-section]').forEach(btn => btn.addEventListener('click', () => {
    state.setup.setupGuideSection = Number(btn.dataset.setupSection);
    save();
    renderSetupNotes();
    scrollSetupGuideToTop();
  }));

  wrap.querySelector('[data-setup-prev]')?.addEventListener('click', () => {
    state.setup.setupGuideSection = Math.max(0, Number(state.setup.setupGuideSection || 0) - 1);
    save();
    renderSetupNotes();
    scrollSetupGuideToTop();
  });
  wrap.querySelector('[data-setup-next]')?.addEventListener('click', () => {
    state.setup.setupGuideSection = Math.min(visibleSections.length - 1, Number(state.setup.setupGuideSection || 0) + 1);
    save();
    renderSetupNotes();
    scrollSetupGuideToTop();
  });

  wrap.querySelectorAll('.step-image-toggle').forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const imagesEl = btn.closest('.setup-step-item, .setup-step-group')?.querySelector(':scope > .setup-step-images');
      const expanded = imagesEl?.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.textContent = expanded ? t('setup.hideReference') : t('setup.showReference');
    });
  });

  wrap.querySelectorAll('.setup-step-toggle').forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.preventDefault();
      const key = toggle.dataset.stepKey;
      if (!key) return;
      const willBeDone = !setupStepProgress.has(key);
      if (willBeDone) setupStepProgress.add(key); else setupStepProgress.delete(key);
      state.setup.setupProgress = Array.from(setupStepProgress);
      const currentIndex = Number(state.setup.setupGuideSection || 0);
      const currentSection = visibleSections[currentIndex];
      const completedCurrent = currentSection && isSetupSectionComplete(currentSection);
      save();
      if (willBeDone && completedCurrent && currentIndex < visibleSections.length - 1) {
        setTimeout(() => {
          state.setup.setupGuideSection = currentIndex + 1;
          save();
          renderSetupNotes();
          scrollSetupGuideToTop();
        }, 250);
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
  const stepTotal = collectTrackableSetupSteps(section).length;
  const stepDone = collectTrackableSetupSteps(section).filter(item => setupStepProgress.has(item.key)).length;
  return `<details class="setup-note ${complete ? 'complete' : ''}" ${index === (firstIncomplete >= 0 ? firstIncomplete : 0) ? 'open' : ''}>
    <summary>
      <span class="step-number">${complete ? '✓' : index + 1}</span>
      <span class="setup-note-heading"><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml(section.summary || '')}</small></span>
      <span class="step-progress">${stepDone}/${stepTotal}</span>
    </summary>
    <ul class="setup-checklist">${stepItems}</ul>
  </details>`;
}

function renderSetupStep(step, section, stepIndex, parentPath = []) {
  const stepKey = setupStepKey(section, stepIndex, step, parentPath);
  const images = (step.images || []).filter(isSetupVisualVisible);
  let imageHtml = '';
  if (images.length) {
    imageHtml = `<div class="setup-step-images">${images.map(renderSetupStepImage).join('')}</div>`;
  }
  const imageToggleHtml = images.length ? t('strings.show_reference') : '';
  const badgesHtml = renderSetupStepBadges(step);
  const metaHtml = badgesHtml || imageToggleHtml
    ? `<div class="setup-step-meta-row">${badgesHtml}${imageToggleHtml}</div>`
    : '';
  const actionButtons = [
    ...(step.actionButton ? [step.actionButton] : []),
    ...(step.actionButtons || [])
  ].filter(isSetupVisualVisible);
  const actionButtonsHtml = actionButtons.length ? `<div class="setup-step-actions">${actionButtons.map(renderSetupStepActionButton).join('')}</div>` : '';

  if (Array.isArray(step.substeps) && step.substeps.length) {
    const nested = step.substeps.filter(isSetupStepVisible).map((childStep, childIndex) => renderSetupStep(childStep, section, childIndex, [...parentPath, stepIndex])).join('');
    return `<li class="setup-step-group">
      <div class="setup-step-group-head">
        ${renderStepIcon(step)}
        <span class="setup-step-text"><strong>${formatSetupText(step.text)}</strong>${step.summary ? `<small class="setup-group-summary">${escapeHtml(step.summary)}</small>` : ''}</span>
      </div>
      ${metaHtml}${imageHtml}${actionButtonsHtml}
      <ul class="setup-substeps">${nested}</ul>
    </li>`;
  }

  const isDone = setupStepProgress.has(stepKey);
  return `<li class="setup-step-item ${isDone ? 'done' : ''}">
    <button type="button" class="setup-step-toggle" data-step-key="${escapeHtml(stepKey)}" aria-pressed="${isDone ? 'true' : 'false'}">
      ${renderStepIcon(step)}
      <span class="setup-step-text">${formatSetupText(step.text)}</span>
    </button>
    ${metaHtml}${imageHtml}${actionButtonsHtml}
  </li>`;
}
function renderSetupStepActionButton(action) {
  const label = action.label || action.text || t('setup.open');
  const opens = action.opens || action.assist || '';
  if (!opens) return '';
  return `<button type="button" class="setup-step-action-btn" data-open-assist="${escapeHtml(opens)}">${escapeHtml(label)}</button>`;
}

const IMAGE_GLYPH = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L5 18"/></svg>';

function renderSetupStepImage(image) {
  const isFullWidth = !!image.fullWidth;
  const figureClasses = ['setup-step-image', isFullWidth ? 'setup-step-image-full' : '', image.className || ''].filter(Boolean).join(' ');
  const imgClasses = ['setup-step-image-img', isFullWidth ? 'setup-step-image-full' : ''].filter(Boolean).join(' ');
  const label = image.alt || image.caption || t('setup.imageFallback');
  const thumbSrc = image.schematicSrc || image.src;
  return `<figure class="${figureClasses}">
    <button type="button" class="setup-step-image-btn" data-view-image="${escapeHtml(image.src)}" data-view-alt="${escapeHtml(image.alt || '')}" data-view-caption="${escapeHtml(image.caption || '')}" aria-label="${escapeHtml(t('setup.viewFullSize', { label }))}">
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
    <h1 class="trigger-heading">${t('strings.primary_actions')}</h1>
    <p>${t('strings.perform_one_of_these_actions_to_see_what_happens')}</p>
  </section>
  ${renderStoryTrackArea()}
  <section class="trigger-grid" aria-label="${t('strings.primary_action_triggers')}">
    ${state.activeTriggers.map(t => renderTriggerCard(t)).join('')}
  </section>
  ${hasStories ? `<section class="panel story-panel">
    <h2 class="story-section-title"><span>${t('strings.ongoing_stories')}</span><span class="story-section-count" aria-label="${escapeHtml(tp('story.ongoingCount', state.activeStories.length, { count: state.activeStories.length }))}">${state.activeStories.length}</span></h2>
    ${renderStoryList()}
  </section>` : ''}
  ${hasWorldEvents ? `<section class="panel story-panel">
    <h2 class="story-section-title"><span>${t('strings.current_world_event')}</span></h2>
    ${renderWorldList()}
  </section>` : ''}`;
  app.querySelectorAll('[data-trigger]').forEach(b => b.onclick = () => {
    const trigger = state.activeTriggers.find(item => item.id === b.dataset.trigger);
    playPrimaryTriggerSound(trigger);
    // Story Arcs are personal by default, so even when the virtual Story Track
    // is off we still need to know which player performed the trigger.
    if (isStoryTrackEnabled() || storyEventsEnabled('arcs')) promptTriggerColor(b.dataset.trigger);
    else tapPrimaryTrigger(b.dataset.trigger, null);
  });
  app.querySelectorAll('[data-resolve]').forEach(b => b.onclick = () => promptResolveStory(b.dataset.resolve));
  app.querySelectorAll('[data-resolve-world]').forEach(b => b.onclick = () => promptResolveWorldEvent(b.dataset.resolveWorld));
  app.querySelectorAll('[data-story-track-color]').forEach(b => b.onclick = () => {
    gainStoryPoint(b.dataset.storyTrackColor, () => { save(); render(); });
  });
  app.querySelectorAll('[data-player-story-alert]').forEach(b => b.onclick = () => {
    const target = app.querySelector(`[data-story-owner-color="${b.dataset.playerStoryAlert}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  bindStoryTrackArea();
  updateFrontierMoodMusic();
  if (queueDueWorldEvent()) save();
  setTimeout(maybePresentPendingWorldEvent, 40);
}

// Story Point markers and their temporary reminder share a fixed-height area
// above the trigger grid. renderStoryTrackArea() owns both states so changing
// between them never reflows the gameplay content below.

function playPrimaryTriggerSound(trigger) {
  if (!trigger?.soundFile) return;
  playSoundEffect(trigger.soundFile);
}

function renderTriggerCard(trigger) {
  const title = renderTriggerTitle(trigger);
  const image = trigger.image || imageForTrigger(trigger);
  return `<button class="trigger-card" data-trigger="${trigger.id}" aria-label="${escapeHtml(trigger.label)}">
    <span class="trigger-title-text">${title}</span>
    <span class="rule" aria-hidden="true"></span>
    <span class="trigger-image" style="background-image:url('${image}')" aria-hidden="true"></span>
    <span class="trigger-footer">${t('strings.tap_when_it_happens')}</span>
  </button>`;
}

function renderTriggerTitle(trigger) {
  const parts = trigger.titleParts || titlePartsFromLabel(trigger.label);
  return parts.map(part => {
    const cls = part.style && part.style !== 'normal' ? ` trigger-title-keyword ${part.style}` : ' trigger-title-line';
    return `<span class="${cls.trim()}">${escapeHtml(part.text)}</span>`;
  }).join('');
}

function titlePartsFromLabel(label = '') {
  const prefix = t('story.triggerPlayerPrefix');
  const clean = (label.toLowerCase().startsWith(prefix.toLowerCase()) ? label.slice(prefix.length) : label).replace(/\.$/, '');
  const keywordMap = uiValue('story.triggerKeywords', []).map(item => [item.word, item.style]);
  const found = keywordMap.find(([word]) => clean.toLowerCase().includes(word.toLowerCase()));
  if (!found) return [{ text: clean.toUpperCase(), style: 'normal' }];
  const [word, style] = found;
  const before = clean.slice(0, clean.toLowerCase().indexOf(word.toLowerCase())).trim();
  return [
    { text: (before || t('strings.a_player')).toUpperCase(), style: 'normal' },
    { text: word.toUpperCase(), style }
  ];
}

function imageForTrigger(trigger) {
  const text = `${trigger.label} ${(trigger.tags || []).join(' ')}`.toLowerCase();
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

function activeEventCounterMarkup(turnsLeft) {
  const count = Math.max(0, Number(turnsLeft) || 0);
  const label = tp('story.activeTriggersRemaining', count, { count });
  // Solid block hourglass silhouette, matching the compact tabletop-style icon
  // used in the UI reference. currentColor keeps it matched to the number.
  return `<span class="counter event-countdown" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="event-countdown-number">${count}</span><svg class="event-countdown-hourglass" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 3H20V8L14.5 12L20 16V21H4V16L9.5 12L4 8V3Z"/></svg></span>`;
}

function playerNameOnly(color) {
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  return player?.name?.trim() || localizedColorPlayer(color);
}

function storyOwnerDot(story) {
  if (activeStoryScope(story) === 'global' || !story.assignedColor || !PLAYER_COLORS.includes(story.assignedColor)) return '';
  const name = playerNameOnly(story.assignedColor);
  const label = t('story.onlyPlayerMayResolve', { player: name });
  return `<span class="story-owner-dot swatch-${story.assignedColor}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></span>`;
}

function renderStoryList() {
  if (!state.activeStories.length) return t('strings.no_ongoing_stories_keep_watching_the_three_primary_action_cards');
  return `<div class="story-list">${state.activeStories.map(s => {
    const scope = activeStoryScope(s);
    const hasChapterOwner = scope !== 'global' && !!s.assignedColor;
    return `<article class="story-row${hasChapterOwner ? ' story-row-personal' : ''}"${hasChapterOwner ? ` data-story-owner-color="${escapeHtml(s.assignedColor)}"` : ''}>
      <div class="story-main">
        <div class="story-heading${hasChapterOwner ? ' story-heading-personal' : ''}">
          ${hasChapterOwner ? storyOwnerDot(s) : ''}
          <div class="story-heading-text">
            <div class="story-meta story-source"><span>${escapeHtml(s.arcTitle || t('story.fallbackTitle'))}</span></div>
            <h3>${escapeHtml(s.title)}</h3>
          </div>
        </div>
        <p>${escapeHtml(s.screenText)}</p>
      </div>
      ${activeEventCounterMarkup(s.turnsLeft)}
      ${s.rewardText ? `<p class="story-reward"><strong>${escapeHtml(s.rewardText)}</strong></p>` : ''}
      <div class="story-actions"><button class="small-btn" data-resolve="${s.id}">${t('strings.resolved')}</button></div>
    </article>`;
  }).join('')}</div>`;
}

function renderWorldList() {
  if (!state.activeWorldEvents.length) return t('strings.no_current_world_event');
  return `<div class="story-list">${state.activeWorldEvents.map(w => `<article class="story-row">
    <div class="story-main">
      <div class="story-heading">
        <div class="story-heading-text"><h3>${escapeHtml(w.title)}</h3></div>
      </div>
      <p>${escapeHtml(w.screenText)}</p>
    </div>
    ${activeEventCounterMarkup(w.turnsLeft)}
    ${w.resolvable ? `<div class="story-actions"><button class="small-btn" data-resolve-world="${w.id}">${t('strings.resolve')}</button></div>` : ''}
  </article>`).join('')}</div>`;
}


function renderPokerHandsReference() {
  const pokerHands = [
    {
      name: t('strings.5_of_a_kind'),
      cards: uiValue('assist.poker.examples.fiveKind', []),
      winningCards: 5,
      detail: t('strings.five_cards_of_the_same_rank')
    },
    {
      name: t('strings.royal_flush'),
      cards: uiValue('assist.poker.examples.royalFlush', []),
      winningCards: 5,
      detail: t('strings.10_jack_queen_king_and_ace_all_in_the_same_suit')
    },
    {
      name: t('strings.straight_flush'),
      cards: uiValue('assist.poker.examples.straightFlush', []),
      winningCards: 5,
      detail: t('strings.five_consecutive_cards_all_in_the_same_suit')
    },
    {
      name: t('strings.4_of_a_kind'),
      cards: uiValue('assist.poker.examples.fourKind', []),
      winningCards: 4,
      detail: t('strings.four_cards_of_the_same_rank_plus_any_other_card')
    },
    {
      name: t('strings.full_house'),
      cards: uiValue('assist.poker.examples.fullHouse', []),
      winningCards: 5,
      detail: t('strings.three_cards_of_one_rank_plus_two_cards_of_another_rank')
    },
    {
      name: t('strings.flush'),
      cards: uiValue('assist.poker.examples.flush', []),
      winningCards: 5,
      detail: t('strings.five_cards_in_the_same_suit_that_are_not_consecutive')
    },
    {
      name: t('strings.straight'),
      cards: uiValue('assist.poker.examples.straight', []),
      winningCards: 5,
      detail: t('strings.five_consecutive_cards_in_any_suits_an_ace_may_be_high_or_low')
    },
    {
      name: t('strings.3_of_a_kind'),
      cards: uiValue('assist.poker.examples.threeKind', []),
      winningCards: 3,
      detail: t('strings.three_cards_of_the_same_rank_plus_two_unmatched_cards')
    },
    {
      name: t('strings.two_pair'),
      cards: uiValue('assist.poker.examples.twoPair', []),
      winningCards: 4,
      detail: t('strings.two_cards_of_one_rank_and_two_cards_of_another_rank')
    },
    {
      name: t('strings.pair'),
      cards: uiValue('assist.poker.examples.pair', []),
      winningCards: 2,
      detail: t('strings.two_cards_of_the_same_rank_plus_three_unmatched_cards')
    },
    {
      name: t('strings.high_card'),
      cards: uiValue('assist.poker.examples.highCard', []),
      winningCards: 1,
      detail: t('strings.when_no_other_hand_is_made_the_highest_card_determines_the_hand')
    }
  ];

  const cardMarkup = (card, winner) => {
    const match = String(card).match(/^(10|[2-9JQKA])([♠♣♥♦])$/);
    const rank = match?.[1] || card.slice(0, -1);
    const suit = match?.[2] || card.slice(-1);
    const suitClass = /[♥♦]/.test(suit) ? 'redsuit' : 'blacksuit';
    return `<span class="card ${suitClass}${winner ? ' winner' : ''}" aria-label="${card}">
      <span class="card-corner" aria-hidden="true"><span class="card-rank">${rank}</span><span class="card-suit">${suit}</span></span>
      <span class="card-center-suit" aria-hidden="true">${suit}</span>
    </span>`;
  };

  return `<div class="ref-card poker-hands-guide">
    <div class="poker-strength-heading">
      <span class="poker-strength-label">${t('strings.strongest')}</span>
      <span class="poker-strength-help">${t('strings.higher_hands_beat_every_hand_below_them_tap_a_hand_for_a_quick_definitio')}</span>
    </div>
    <div class="poker-strength-ladder">
      ${pokerHands.map((hand, handIndex) => `<details class="poker-hand-row">
        <summary class="poker-hand-summary">
          <span class="poker-hand-titleline">
            <span class="poker-hand-rank-number" aria-hidden="true">${handIndex + 1}</span>
            <span class="poker-hand-name">${hand.name}</span>
            <span class="poker-hand-chevron" aria-hidden="true"></span>
          </span>
          <span class="cards" aria-label="${escapeHtml(t('assist.poker.exampleAria', { hand: hand.name }))}">
            ${hand.cards.map((card, index) => cardMarkup(card, index < hand.winningCards)).join('')}
          </span>
        </summary>
        <div class="poker-hand-detail">${hand.detail}</div>
      </details>`).join('')}
    </div>
    <div class="poker-strength-footer"><span>↓</span><strong>${t('strings.weakest')}</strong></div>
  </div>`;
}

let fightFlowSelection = '';

function availableFightFlowTypes() {
  const types = [
    { value: 'player_arrest', group: 'player', label: t('strings.arrest'), kind: 'player' },
    { value: 'player_duel', group: 'player', label: t('strings.duel'), kind: 'player' },
    { value: 'player_rob', group: 'player', label: t('strings.rob'), kind: 'player' },
    { value: 'npc_bandit', group: 'npc', label: t('strings.bandit'), kind: 'npc', npcType: 'bandit', cards: 2 },
    { value: 'npc_bank_guard', group: 'npc', label: t('strings.bank_guard'), kind: 'npc', npcType: 'bank_guard', cards: 3 },
    { value: 'npc_sheriff', group: 'npc', label: t('strings.sheriff'), kind: 'npc', npcType: 'sheriff', cards: 4 },
    { value: 'npc_outlaw', group: 'npc', label: t('strings.outlaw'), kind: 'npc', npcType: 'other', cards: null, countSource: t('strings.the_outlaw_token'), requiredModules: ['ante_up_events'] },
    { value: 'npc_claim_jumper', group: 'npc', label: t('strings.claim_jumper'), kind: 'npc', npcType: 'other', cards: null, countSource: t('strings.the_claim_jumper_token'), requiredModules: ['ante_up_events'] },
    { value: 'npc_train_guard', group: 'npc', label: t('strings.train_guard'), kind: 'npc', npcType: 'other', cards: null, countSource: t('strings.the_train_encounter_card'), requiredModules: ['ante_up_train'] }
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
  const groups = ['player', 'npc'];
  return `<div class="fight-flow-selector-card">
    <label for="fightFlowType"><span>${t('strings.fight_type')}</span><select id="fightFlowType" data-fight-flow-type>
      <option value="" ${fightFlowSelection ? '' : 'selected'} disabled>${t('strings.choose_fight_type')}</option>
      ${groups.map(group => {
        const options = types.filter(type => type.group === group);
        if (!options.length) return '';
        return `<optgroup label="${escapeHtml(t(`assist.fight.groups.${group}`))}">${options.map(type => `<option value="${type.value}" ${type.value === fightFlowSelection ? 'selected' : ''}>${escapeHtml(type.label)}</option>`).join('')}</optgroup>`;
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
    <span class="fight-flow-info-dot" aria-hidden="true">${t('strings.i')}</span>
  </button>`;
}

function fightFlowTargetLabel(type) {
  return type ? `${t(`assist.fight.groups.${type.group}`)}: ${type.label}` : '';
}

function fightFlowNpcCardSummary(type) {
  if (!type || type.kind !== 'npc') return '';
  return Number.isFinite(type.cards) ? tp('assist.fight.drawCards', type.cards, { count: type.cards }) : t('strings.use_count_shown_on_token_card');
}

function fightFlowResultSummary(type, outcome) {
  if (!type) return '';
  const win = outcome === 'win';
  const summaries = {
    player_arrest: win ? t('strings.arrest_the_target') : t('strings.target_avoids_capture'),
    player_duel: win ? t('strings.gain_2_lp') : t('strings.take_1_wound'),
    player_rob: win ? t('strings.steal_from_the_target') : t('strings.robbery_fails'),
    npc_bandit: win ? t('strings.gain_1_mp_or_1_lp') : t('strings.take_1_wound'),
    npc_bank_guard: win ? t('strings.gain_3_wp_80') : t('strings.1_wound_gain_1_wp'),
    npc_sheriff: win ? (hasModule('wild_bunch_sheriff') ? t('strings.return_sheriff_reveal_new_sheriff') : t('strings.return_sheriff_to_office')) : t('strings.you_are_arrested'),
    npc_outlaw: win ? t('strings.gain_printed_reward') : t('strings.take_1_wound'),
    npc_claim_jumper: win ? t('strings.gain_printed_reward') : t('strings.take_1_wound'),
    npc_train_guard: win ? t('strings.gain_printed_reward') : t('assist.fight.resolveCardConsequences')
  };
  return summaries[type.value] || (win ? t('strings.resolve_the_win_result') : t('strings.resolve_the_loss_result'));
}

function renderFightFlowInlineDetail(stepKey, type, cls = '') {
  const info = fightFlowStepDetail(stepKey, type);
  if (!info) return '';
  return `<section class="fight-flow-inline-detail ${cls}">
    <div class="fight-flow-inline-heading">
      ${info.eyebrow ? `<small>${escapeHtml(info.eyebrow)}</small>` : ''}
      <strong>${escapeHtml(info.title || '')}</strong>
    </div>
    <div class="fight-flow-inline-copy">${info.html || ''}</div>
    ${info.autoSelect ? t('strings.auto_select_fight_card') : ''}
  </section>`;
}

function renderFightFlowStage(number, stageKey, eyebrow, title, summary, content, cls = '') {
  return `<details class="fight-flow-stage fight-flow-stage-${escapeHtml(stageKey)} ${cls}">
    <summary class="fight-flow-stage-summary">
      <span class="fight-flow-stage-number" aria-hidden="true">${number}</span>
      <span class="fight-flow-stage-copy">
        ${eyebrow ? `<small>${escapeHtml(eyebrow)}</small>` : ''}
        <strong>${escapeHtml(title)}</strong>
        ${summary ? `<span>${escapeHtml(summary)}</span>` : ''}
      </span>
      <span class="fight-flow-stage-chevron" aria-hidden="true"></span>
    </summary>
    <div class="fight-flow-stage-body">${content}</div>
  </details>`;
}

function renderFightFlowMiniCardFan(kind = 'fight', count = 1) {
  const safeCount = Math.max(1, Number(count) || 1);
  if (safeCount <= 1) {
    return `<span class="fight-flow-mini-card ${kind === 'fight' ? 'fight-flow-mini-fight' : 'fight-flow-mini-poker'}"><span>${kind === 'fight' ? '★' : '♠'}</span></span>`;
  }
  const angles = safeCount === 2
    ? [-4, 4]
    : safeCount === 3
      ? [-5, 0, 5]
      : safeCount === 4
        ? [-6, -2, 2, 6]
        : Array.from({ length: safeCount }, (_, i) => Math.round((-6) + (12 * i / Math.max(1, safeCount - 1))));
  return `<span class="fight-flow-mini-fan fight-flow-mini-fan-${kind} fight-flow-mini-fan-count-${safeCount}" style="--fan-count:${safeCount}" aria-hidden="true">${Array.from({ length: safeCount }, (_, index) => {
    const angle = angles[index] ?? 0;
    const icon = kind === 'fight' ? '' : '♠';
    const z = index + 1;
    return `<span class="fight-flow-mini-card fight-flow-mini-fan-card ${kind === 'fight' ? 'fight-flow-mini-fight' : 'fight-flow-mini-poker'}" style="--fan-angle:${angle}deg; z-index:${z}"><span>${icon}</span></span>`;
  }).join('')}</span>`;
}

function renderFightFlowCardDuel(type) {
  const playerFight = type.kind === 'player';
  const opponentLabel = playerFight ? t('strings.target_player') : type.label;
  const opponentCaption = playerFight ? t('assist.fight.choosePokerCard') : fightFlowNpcCardSummary(type);
  const playerVisual = renderFightFlowMiniCardFan('poker', 1);
  const opponentVisual = playerFight
    ? renderFightFlowMiniCardFan('poker', 1)
    : renderFightFlowMiniCardFan('fight', type.cards || 1);
  return `<div class="fight-flow-card-duel" aria-hidden="true">
    <div class="fight-flow-card-side">
      ${playerVisual}
      <strong>${escapeHtml(t('assist.fight.activePlayer'))}</strong>
      <small>${escapeHtml(t('assist.fight.choosePokerCard'))}</small>
    </div>
    <span class="fight-flow-versus">${escapeHtml(t('assist.fight.versus'))}</span>
    <div class="fight-flow-card-side">
      ${opponentVisual}
      <strong>${escapeHtml(opponentLabel)}</strong>
      <small>${escapeHtml(opponentCaption)}</small>
    </div>
  </div>`;
}

function renderFightFlowBrief(type) {
  const playerFight = type.kind === 'player';
  const cardFact = playerFight ? t('assist.fight.choosePokerCard') : fightFlowNpcCardSummary(type);
  const tieFact = playerFight ? t('strings.highest_value_wins_active_player_wins_ties') : t('strings.highest_value_wins_npc_wins_ties');
  return `<div class="fight-flow-brief">
    <div class="fight-flow-brief-heading">
      <span class="fight-flow-brief-icon" aria-hidden="true">⚔</span>
      <span><small>${escapeHtml(t(`assist.fight.groups.${type.group}`))}</small><strong>${escapeHtml(type.label)}</strong></span>
    </div>
    <div class="fight-flow-brief-facts">
      <span>${escapeHtml(cardFact)}</span>
      <span>${escapeHtml(tieFact)}</span>
    </div>
  </div>`;
}

function renderFightFlowResultCards(type) {
  const resultCard = (outcome, icon, title, summary, cls) => {
    const info = fightFlowStepDetail(`result-${outcome}`, type);
    return `<details class="fight-flow-result-card ${cls}">
      <summary>
        <span class="fight-flow-result-icon" aria-hidden="true">${icon}</span>
        <span class="fight-flow-result-copy"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(summary)}</span></span>
        <span class="fight-flow-result-chevron" aria-hidden="true"></span>
      </summary>
      <div class="fight-flow-result-detail">${info?.html || ''}</div>
    </details>`;
  };
  return `<div class="fight-flow-result-list">
    ${resultCard('win', '★', t('assist.fight.activePlayerWins'), fightFlowResultSummary(type, 'win'), 'fight-flow-result-win')}
    ${resultCard('lose', '✕', t('assist.fight.activePlayerLoses'), fightFlowResultSummary(type, 'lose'), 'fight-flow-result-loss')}
  </div>`;
}

function renderFightSequenceReference() {
  const type = selectedFightFlowType();
  const selector = renderFightFlowTypeSelector();
  if (!type) {
    return `<div class="fight-flowchart interactive-fight-flow" aria-label="${t('strings.interactive_fight_resolution_flowchart')}">
      ${selector}
      <div class="fight-flow-empty"><span aria-hidden="true">⚔</span><strong>${t('strings.select_a_fight_type_to_begin')}</strong><p>${t('strings.the_rest_of_the_flow_adapts_to_player_or_npc_fights_and_the_modules_enab')}</p></div>
    </div>`;
  }

  const playerFight = type.kind === 'player';
  const reactionSummary = playerFight ? t('strings.alternate_until_both_players_pass') : t('strings.active_player_reactions_then_npc_card_effect');
  const compareSummary = playerFight ? t('strings.highest_value_wins_active_player_wins_ties') : t('strings.highest_value_wins_npc_wins_ties');
  const startSummary = playerFight ? t('strings.alternate_until_both_players_pass') : t('assist.fight.activePlayerResolvesStart');
  const chooseSummary = playerFight ? t('strings.1_poker_card_facedown_or_decline_and_lose_immediately') : fightFlowNpcCardSummary(type);
  const revealSummary = `${t('assist.fight.revealBothCards')} · ${t('strings.apply_bonuses_abilities')} · ${playerFight ? t('strings.play_reaction_effects') : t('strings.reactions_fight_card_effect')}`;
  const resultSummary = `${t('assist.fight.activePlayerWins')} / ${t('assist.fight.activePlayerLoses')}`;
  const cleanupSummary = playerFight ? t('assist.fight.discardBothPoker') : t('strings.return_fight_cards_discard_played_poker_card');

  const startContent = `${renderFightFlowInlineDetail('start-effects', type)}${type.value === 'npc_bandit' && hasModule('wild_bunch_bandit_variant') ? renderFightFlowInlineDetail('bandit-variant', type, 'fight-flow-inline-accent') : ''}`;
  const chooseContent = `${renderFightFlowCardDuel(type)}${renderFightFlowInlineDetail('active-card', type)}${renderFightFlowInlineDetail('opponent-card', type, !playerFight ? 'fight-flow-inline-tool' : '')}`;
  const revealContent = `${renderFightFlowInlineDetail('reveal-cards', type)}${renderFightFlowInlineDetail('bonuses', type)}${renderFightFlowInlineDetail('reactions', type)}`;
  const compareContent = renderFightFlowInlineDetail('compare', type);
  const resultContent = renderFightFlowResultCards(type);
  const cleanupContent = `${renderFightFlowInlineDetail('end-effects', type)}${renderFightFlowInlineDetail('cleanup', type)}`;

  return `<div class="fight-flowchart interactive-fight-flow" aria-label="${t('strings.interactive_fight_resolution_flowchart')}">
    ${selector}
    ${renderFightFlowBrief(type)}
    <div class="fight-flow-stages">
      ${renderFightFlowStage(1, 'start', t('assist.fight.start'), t('strings.start_of_fight_2'), startSummary, startContent)}
      ${renderFightFlowStage(2, 'choose', '', t('strings.card_selection'), chooseSummary, chooseContent)}
      ${renderFightFlowStage(3, 'reveal', t('assist.fight.revealPhase'), t('assist.fight.revealBothCards'), revealSummary, revealContent)}
      ${renderFightFlowStage(4, 'compare', t('assist.fight.comparePhase'), t('strings.compare_final_values'), compareSummary, compareContent, 'fight-flow-stage-compare-emphasis')}
      ${renderFightFlowStage(5, 'result', t('assist.fight.resultPhase'), t('assist.fight.resultEyebrow'), resultSummary, resultContent, 'fight-flow-stage-result-emphasis')}
      ${renderFightFlowStage(6, 'cleanup', t('assist.fight.end'), t('strings.end_of_fight_2'), cleanupSummary, cleanupContent)}
    </div>
  </div>`;
}

function fightFlowResultDetail(type, outcome) {
  const win = outcome === 'win';
  const hasEvents = hasModule('ante_up_events');
  const longhornText = hasEvents ? t('strings.all_cattle_and_longhorn_tokens') : t('strings.all_cattle_tokens');
  const robberyTokenText = hasEvents ? t('strings.plus_1_cattle_or_longhorn_token') : t('strings.plus_1_cattle_token');
  const details = {
    player_arrest: win
      ? `<p><strong>${t('strings.active_player')}</strong> ${t('strings.gain_1_marshal_point')}</p><p><strong>${t('strings.target_player_2')}</strong> ${t('strings.gain_1_wound_and_draw_1_poker_card_place_the_target_miniature_at_the_she')}${longhornText} ${t('strings.half_of_their_gold_nuggets_rounded_up_and_half_of_their_money_rounded_up')}</p>`
      : t('strings.active_player_gain_1_wound_and_draw_1_poker_card_target_player_avoids_'),
    player_duel: win
      ? t('strings.active_player_gain_2_legendary_points_target_player_gain_1_wound_and_d')
      : t('strings.active_player_gain_1_wound_and_draw_1_poker_card_target_player_no_addi'),
    player_rob: win
      ? `<p><strong>${t('strings.active_player')}</strong> ${t('strings.gain_1_wanted_point_steal_half_of_the_target_s_money')} <em>${t('strings.or')}</em> ${t('strings.half_of_their_gold_nuggets_rounded_up')}${robberyTokenText}</p><p><strong>${t('strings.target_player_2')}</strong> ${t('strings.gain_1_wound_and_draw_1_poker_card')}</p>`
      : t('strings.active_player_gain_1_wound_and_draw_1_poker_card_target_player_avoids__2'),
    npc_bandit: win
      ? t('strings.gain_1_marshal_point_or_1_legendary_point_then_remove_the_bandit_from_')
      : t('strings.gain_1_wound_draw_1_poker_card_then_remove_the_bandit_from_play'),
    npc_bank_guard: win
      ? t('strings.gain_3_wanted_points_and_80')
      : t('strings.gain_1_wound_draw_1_poker_card_and_gain_1_wanted_point'),
    npc_sheriff: win
      ? `<p>${t('strings.place_the_sheriff_at_the')} <strong>${t('strings.sheriff_marshal_office')}</strong>.</p>${hasModule('wild_bunch_sheriff') ? t('strings.sheriff_variant_the_sheriff_lost_the_fight_so_discard_replace_the_curr') : ''}`
      : t('strings.the_player_is_arrested_gains_1_wound_and_draws_1_poker_card'),
    npc_outlaw: win
      ? t('strings.gain_the_reward_printed_on_the_outlaw_token_then_remove_the_token_from')
      : t('strings.gain_1_wound_draw_1_poker_card_then_remove_the_outlaw_token_from_play'),
    npc_claim_jumper: win
      ? t('strings.gain_the_reward_printed_on_the_claim_jumper_token_then_remove_the_toke')
      : t('strings.gain_1_wound_draw_1_poker_card_then_remove_the_claim_jumper_token_from'),
    npc_train_guard: win
      ? t('strings.gain_the_reward_printed_on_the_train_encounter_card')
      : t('strings.gain_1_wound_draw_1_poker_card_and_resolve_the_additional_consequences')
  };
  return details[type.value] || t('strings.resolve_the_result_listed_by_the_fight_or_encounter');
}

function fightFlowStepDetail(stepKey, type) {
  if (!type) return null;
  const playerFight = type.kind === 'player';
  const npcDrawText = Number.isFinite(type.cards)
    ? `${t('strings.another_player_draws')} <strong>${escapeHtml(tp('assist.fight.drawCards', type.cards, { count: type.cards }))}</strong> ${t('strings.chooses_1_and_places_it_facedown')}`
    : `${t('strings.another_player_draws_the_number_of_fight_cards_shown_on')} <strong>${escapeHtml(type.countSource || t('strings.the_npc_component'))}</strong>${t('strings.chooses_1_and_places_it_facedown')}`;
  const info = {
    'start-effects': {
      eyebrow: t('strings.start_of_fight_2'), title: t('strings.resolve_start_effects'),
      html: playerFight
        ? t('strings.the_active_player_resolves_a_start_of_fight_effect_then_the_target_pla')
        : t('strings.the_active_player_resolves_all_applicable_start_of_fight_effects_befor')
    },
    'bandit-variant': {
      eyebrow: t('strings.bandit_variant'), title: t('strings.reveal_bandit_effect'),
      html: t('strings.reveal_the_top_bandit_card_then_reveal_the_number_on_the_bottom_of_the')
    },
    'active-card': {
      eyebrow: t('strings.card_selection'), title: t('strings.active_player_chooses'),
      html: t('strings.the_active_player_chooses_1_poker_card_from_hand_and_places_it_facedow')
    },
    'opponent-card': {
      eyebrow: playerFight ? t('strings.target_player') : type.label,
      title: playerFight ? t('assist.fight.chooseCardOrDecline') : t('assist.fight.chooseNpcFightCard'),
      html: playerFight
        ? t('strings.the_target_player_chooses_1_poker_card_from_hand_and_places_it_facedow')
        : `<p>${npcDrawText}</p><p>${t('strings.the_active_player_s_poker_card_and_the_chosen_npc_fight_card_remain_face')}</p>`,
      autoSelect: !playerFight
    },
    'reveal-cards': {
      eyebrow: t('strings.reveal'), title: t('strings.reveal_both_cards'),
      html: t('strings.reveal_the_active_player_s_poker_card_and_the_opposing_poker_fight_car')
    },
    'bonuses': {
      eyebrow: t('strings.reveal'), title: t('strings.apply_bonuses_abilities'),
      html: playerFight
        ? t('strings.the_active_player_resolves_any_bonus_character_ability_or_item_ability')
        : t('strings.the_active_player_resolves_any_bonus_character_ability_or_item_ability_2')
    },
    'reactions': {
      eyebrow: t('strings.reveal'), title: playerFight ? t('strings.play_reaction_effects') : t('strings.reactions_fight_card_effect'),
      html: playerFight
        ? t('strings.the_active_player_may_play_a_reaction_effect_then_the_target_player_ma')
        : t('strings.the_active_player_resolves_applicable_reaction_effects_then_apply_the_')
    },
    'compare': {
      eyebrow: t('strings.compare'), title: t('strings.compare_final_values'),
      html: playerFight
        ? t('strings.after_all_modifiers_and_effects_the_highest_final_value_wins_if_the_va')
        : t('strings.after_all_modifiers_and_effects_the_highest_final_value_wins_if_the_va_2')
    },
    'result-win': {
      eyebrow: t('fight.resultLabel', { target: type.label }), title: t('strings.active_player_wins'), html: fightFlowResultDetail(type, 'win')
    },
    'result-lose': {
      eyebrow: t('fight.resultLabel', { target: type.label }), title: t('strings.active_player_loses'), html: fightFlowResultDetail(type, 'lose')
    },
    'end-effects': {
      eyebrow: t('strings.end_of_fight_2'), title: t('strings.resolve_end_effects'),
      html: playerFight
        ? t('strings.the_active_player_resolves_all_applicable_end_of_fight_effects_then_th')
        : t('strings.the_active_player_resolves_all_applicable_end_of_fight_effects')
    },
    'cleanup': {
      eyebrow: t('strings.end_of_fight_2'), title: t('strings.clean_up_played_cards'),
      html: playerFight
        ? t('strings.discard_all_poker_cards_played_in_this_fight')
        : t('strings.shuffle_the_fight_cards_drawn_for_this_fight_and_place_them_on_the_bot')
    }
  };
  return info[stepKey] || null;
}

function showFightFlowInfo(info, source, host) {
  if (!info) return;
  const overlay = document.createElement('div');
  overlay.className = 'fight-flow-info-viewer';
  overlay.innerHTML = `<div class="fight-flow-info-card">
    <p class="eyebrow">${escapeHtml(info.eyebrow || t('reference.fightFlow'))}</p>
    <h3>${escapeHtml(info.title || '')}</h3>
    <div class="fight-flow-info-copy">${info.html || ''}</div>
    ${info.autoSelect ? t('strings.auto_select_fight_card') : ''}
    <small>${t('strings.tap_anywhere_to_close')}</small>
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
  host.querySelectorAll('[data-fight-auto-select]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFightCardFromFlow(source);
    });
  });
}

function renderFightFlowAssist(returnTarget = fightFlowReturnTarget) {
  fightFlowReturnTarget = returnTarget || null;
  assistNestedReturn = fightFlowReturnTarget || null;
  setAssistHeader(t('strings.fight_flow'), t('strings.fight_helper'));
  assistBody.innerHTML = `<div class="assist-panel reference-assist-panel fight-flow-assist-panel"><div data-fight-flow-host>${renderFightSequenceReference()}</div></div>`;
  bindFightFlowInteractions(assistBody.querySelector('[data-fight-flow-host]'), 'assist');
  showAssistDialog();
}

function renderReferenceOverlay(returnTarget = null) {
  const fightReference = `
    <h4 class="reference-subheading">${t('strings.fight_flow')}</h4>
    <div data-fight-flow-host>${renderFightSequenceReference()}</div>`;
  const gamblingReference = `
    <h4 class="reference-subheading">${t('strings.gambling_flow')}</h4>
    <div data-gambling-flow-host>${renderGamblingSequenceReference()}</div>`;
  const turnAndActions = `
    <h4 class="reference-subheading">${t('strings.turn_summary')}</h4>
    ${renderTurnSummaryReference()}`;

  app.innerHTML = `<div class="modal-screen-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card">
      <button type="button" class="dialog-close-x" data-modal-close aria-label="${t('strings.close')}">&#10005;</button>
      <div class="modal-title-header">
        <p class="eyebrow">${t('strings.rules_reminders')}</p>
        <h1 class="section-title">${t('strings.quick_reference')}</h1>
      </div>
      <div class="utility-grid reference-sections">
        ${renderReferenceSection(t('strings.turn_actions'), turnAndActions)}
        ${renderReferenceSection(t('strings.fight'), fightReference)}
        ${renderReferenceSection(t('strings.gambling'), gamblingReference)}
        ${renderReferenceSection(t('strings.points'), renderPointReference())}
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
    hasModule('ante_up_train') ? t('strings.move_the_train') : '',
    t('strings.resolve_start_of_turn_effects'),
    t('strings.choose_income'),
    t('strings.choose_active_weapon_mount')
  ].filter(Boolean).join('');

  const actionItems = [
    t('strings.move_move_up_to_your_movement_value_2_default'),
    t('strings.card_play_a_poker_card_action_as_written'),
    t('strings.fight_another_player_initiate_a_fight_in_your_space'),
    t('strings.free_deliveries_rustle_after_ending_movement_at_ranch_wrangle_after_en'),
    t('strings.location_use_the_available_location_module_actions_view_actions'),
    hasModule('blood_money_risk_die') ? t('strings.risk_die_once_per_turn_roll_at_no_action_cost_to_draw_1_poker_card_gai') : ''
  ].filter(Boolean).join('');

  const endItems = [
    t('strings.resolve_end_of_turn_effects'),
    hasModule('blood_money_stories') ? t('strings.resolve_legendary_story_card_conditions') : '',
    t('strings.discard_down_to_hand_size_5_1_per_wound'),
    t('strings.if_wanted_gain_lp_from_the_wanted_track'),
    `<li>${t('strings.if_lp_is_at_least')} <strong>${targetLP}</strong>${t('strings.trigger_the_end_finish_the_current_round_then_play_1_final_full_round')}</li>`
  ].filter(Boolean).join('');

  const manInBlackItems = hasModule('wild_bunch_man_in_black') ? [
    t('strings.draw_and_resolve_top_to_bottom_1_card_from_the_man_in_black_deck'),
    t('strings.he_is_considered_a_player_for_gameplay_effects'),
    t('strings.he_cannot_gain_mp_wp_gp_sp_or_wounds'),
    t('strings.he_always_has_120_and_4_gold_nuggets'),
    t('strings.he_draws_3_fight_cards_in_fights_and_resolves_the_highest_value_card'),
    t('strings.he_decreases_the_value_of_poker_cards_played_against_him_by_1'),
    t('strings.he_wins_all_ties')
  ].join('') : '';

  const prospectingTrackItems = hasModule('prospecting_cards') ? [
    t('strings.when_a_player_lands_on_or_passes_a_gold_nugget_on_the_lp_track_return_'),
    t('strings.reveal_the_next_prospecting_card_and_add_the_designated_gold_nuggets_t')
  ].join('') : '';

  return `<div class="turn-summary-panels">
    ${renderTurnPhasePanel(t('strings.start'), t('strings.choose_2_10_1_card'), `<ul class="compact-list turn-phase-list">${startItems}</ul>`)}
    ${renderTurnPhasePanel(t('strings.actions'), t('strings.take_up_to_3_actions'), `<ul class="compact-list turn-phase-list">${actionItems}</ul>`)}
    ${renderTurnPhasePanel(t('strings.end'), t('strings.discard_to_hand_size'), `<ul class="compact-list turn-phase-list">${endItems}</ul>`)}
    ${manInBlackItems ? renderTurnPhasePanel(t('strings.end_of_round'), t('strings.man_in_black_turn'), `<ul class="compact-list turn-phase-list">${manInBlackItems}</ul>`) : ''}
    ${prospectingTrackItems ? renderTurnPhasePanel(t('strings.track_trigger'), t('strings.prospecting_deck'), `<ul class="compact-list turn-phase-list">${prospectingTrackItems}</ul>`) : ''}
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
  const gambleGames = [t('reference.poker'), hasFaro ? t('reference.faro') : '', hasHighStakes ? t('strings.high_stakes_poker') : ''].filter(Boolean);

  const locationActions = [
    {
      title: t('strings.acquire'),
      summary: t('strings.take_a_facedown_cattle_token_at_a_ranch'),
      body: t('strings.while_at_a_ranch_space_gain_1_facedown_cattle_token_if_you_are_not_alr')
    },
    hasModule('treasure_hunting_rumors') ? {
      title: t('strings.acquire_rumor'),
      summary: t('strings.buy_rumor_cards_in_town_for_30_each'),
      body: t('strings.while_inside_town_buy_any_number_of_rumor_cards_for_30_each_rumor_card')
    } : null,
    hasModule('ante_up_events') ? {
      title: t('strings.challenge'),
      summary: t('strings.challenge_the_high_roller_to_poker'),
      body: t('strings.while_adjacent_to_a_saloon_where_the_high_roller_token_is_present_init')
    } : null,
    hasModule('blood_money_deeds') ? {
      title: t('strings.claim'),
      summary: t('strings.purchase_a_deed_at_its_location'),
      body: t('strings.while_at_any_location_with_a_deed_card_pay_its_cost_and_take_the_deed_')
    } : null,
    {
      title: t('strings.deposit'),
      summary: t('strings.sell_gold_nuggets_at_the_bank'),
      body: t('strings.while_at_the_bank_space_sell_gold_nuggets_gain_20_1_lp_per_nugget')
    },
    hasModule('treasure_hunting_rumors') ? {
      title: t('strings.dig_up_treasure'),
      summary: t('strings.turn_3_matching_rumors_into_buried_treasure'),
      body: t('strings.when_your_miniature_is_on_the_board_space_indicated_by_3_rumor_cards_d')
    } : null,
    hasModule('fishing') ? {
      title: t('strings.fishing'),
      summary: t('strings.fish_while_on_a_river_space'),
      body: t('strings.while_on_a_river_space_discard_1_poker_card_j_q_k_10_a_11_plus_any_fis')
    } : null,
    hasSideboard ? {
      title: t('strings.frontier'),
      summary: t('strings.complete_a_frontier_token_challenge'),
      body: t('strings.while_on_a_space_with_a_frontier_token_discard_poker_cards_from_your_h')
    } : null,
    {
      title: t('strings.gamble'),
      summary: t('reference.gambleSummary', { games: gambleGames.join(', ').replace(/, ([^,]*)$/, t('reference.actions.orOneDollar')) }),
      body: t('reference.gambleBody', { games: gambleGames.join(', ').replace(/, ([^,]*)$/, t('reference.actions.orOneDollar')) }),
      tool: renderActionToolButton(t('strings.gambling_flow'), 'gambling')
    },
    {
      title: t('strings.heal'),
      summary: t('strings.remove_wounds_and_injuries_at_the_doctor'),
      body: t('strings.while_at_the_doctor_s_office_pay_10_to_lose_all_wounds_injuries_then_d')
    },
    {
      title: t('strings.heist'),
      summary: t('reference.heistSummary', { train: hasTrain ? t('strings.or_train') : '' }),
      body: `<p><strong>${t('strings.once_per_turn')}</strong> ${t('strings.while_at_the_bank')}${hasTrain ? t('strings.or_train') : ''}${t('strings.fight_the_guard')}</p>`,
      tool: renderActionToolButton(t('strings.fight_flow'), 'heist-fight')
    },
    hasModule('hunting') ? {
      title: t('strings.hunt'),
      summary: t('strings.use_a_hunt_action_marker_to_hunt_an_animal'),
      body: t('strings.while_on_a_space_with_a_hunt_action_marker_remove_the_marker_and_draw_')
    } : null,
    {
      title: t('strings.prospect'),
      summary: t('strings.roll_prospecting_dice_at_a_mine'),
      body: `<p>${t('strings.while_at_a_mine_roll_the_mining_dice_and_gain_the_results')}</p>${hasModule('prospecting_cards') ? t('strings.prospecting_deck_whenever_your_lp_marker_lands_on_or_passes_a_gold_nug') : ''}`,
      tool: renderActionToolButton(t('strings.dice_roller'), 'prospecting-dice')
    },
    {
      title: t('strings.purchase_upgrade'),
      summary: t('reference.purchaseSummary', { tradingPost: hasSideboard ? t('strings.or_trading_post') : '' }),
      body: `<p>${t('strings.while_adjacent_to_the_store')}${hasSideboard ? t('strings.or_trading_post') : ''}${t('strings.purchase_an_item_from_the_rack_or_pay_to_upgrade_an_owned_item')}</p>`
    },
    hasGangPosse ? {
      title: t('strings.recruit'),
      summary: t('strings.recruit_a_posse_or_gang_for_20'),
      body: t('strings.pay_20_at_the_sheriff_marshal_office_with_marshal_points_recruit_a_pos')
    } : null,
    hasRuins ? {
      title: t('strings.repair'),
      summary: t('strings.remove_a_ruin_token_for_2_sp'),
      body: t('strings.while_at_a_space_with_a_ruin_token_discard_1_poker_card_to_gain_2_sp_a')
    } : null,
    {
      title: t('strings.revel'),
      summary: hasTheatre ? t('reference.actions.theatre') : t('strings.pay_30_at_the_cabaret_for_1_lp'),
      body: hasTheatre
        ? t('strings.while_at_the_cabaret_buy_any_number_of_faceup_theatre_cards_and_gain_t')
        : t('strings.while_at_the_cabaret_pay_30_to_gain_1_lp')
    },
    hasSideboard ? {
      title: t('strings.trail'),
      summary: t('strings.move_between_matching_trail_heads'),
      body: t('strings.use_a_move_action_from_one_trail_head_location_to_the_matching_trail_h')
    } : null,
    hasModule('blood_money_traveling_trader') ? {
      title: t('strings.trader'),
      summary: t('strings.buy_an_item_from_the_traveling_trader'),
      body: t('strings.while_in_the_same_region_as_the_traveling_trader_pay_40_to_gain_an_ite')
    } : null,
    hasTrain ? {
      title: t('strings.travel_by_rail'),
      summary: t('strings.pay_10_to_travel_between_rail_stations'),
      body: t('strings.pay_10_to_place_your_miniature_on_the_opposite_rail_station_then_conti')
    } : null,
    {
      title: t('strings.work'),
      summary: t('strings.gain_10_at_any_location'),
      body: `<p>${t('strings.gain_10_at_any_location')}${hasRuins ? t('strings.without_a_ruin_token') : ''}.</p>`
    }
  ].filter(Boolean).sort((a, b) => a.title.localeCompare(b.title));

  const locationPanels = locationActions
    .map(action => renderLocationAction(action.title, action.summary, action.body, action.tool || ''))
    .join('');

  return `<div class="actions-reference-list">
    ${renderActionReferencePanel(t('strings.move'), t('strings.move_up_to_your_movement_value_2_default'), t('strings.move_up_to_your_movement_value_the_default_movement_value_is_2'))}
    ${renderActionReferencePanel(t('strings.fight'), t('strings.initiate_a_fight_with_a_player_in_your_space'), `<p>${t('strings.initiate_a_fight_in_your_space_with_another_player_arrest_duel_or_rob')}</p><div class="action-reference-tools">${renderActionToolButton(t('strings.fight_flow'), 'fight')}</div>`)}
    ${renderActionReferencePanel(t('strings.card'), t('strings.play_a_poker_card_action'), t('strings.play_a_poker_card_action_as_written_on_the_card'))}
    ${renderActionReferencePanel(t('strings.free_deliveries'), t('strings.rustle_or_wrangle_after_movement'), t('strings.rustle_after_ending_movement_at_a_ranch_wrangle_after_ending_movement_'))}
    ${renderActionReferencePanel(t('strings.location'), t('strings.actions_available_at_specific_locations'), `<div class="location-action-list">${locationPanels}</div>`, true)}
  </div>`;
}
function openActionsReference(source = 'reference') {
  actionsReturnTarget = source || null;
  renderActionsAssist();
}

function renderActionsAssist() {
  assistView = 'detail';
  assistNestedReturn = actionsReturnTarget === 'reference' ? 'reference' : null;
  setAssistHeader(t('strings.actions'), t('strings.quick_reference'));
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
    {
      title: t('strings.start_faro'),
      summary: t('strings.gamble_beside_a_saloon_same_town_players_may_join'),
      detail: t('strings.take_a_gamble_action_while_adjacent_to_a_saloon_any_other_player_in_the_')
    },
    {
      title: t('strings.reveal'),
      summary: t('strings.draw_4_fight_cards_show_3_and_keep_1_facedown'),
      detail: t('strings.the_dealer_draws_the_top_4_fight_cards_reveal_the_first_3_to_all_players')
    },
    {
      title: t('strings.bet'),
      summary: t('strings.place_up_to_2_bets_of_10_or_20_active_player_bets_last'),
      detail: t('strings.in_clockwise_order_with_the_active_player_placing_the_last_bet_each_play')
    },
    {
      title: t('strings.loser'),
      summary: t('strings.shuffle_the_4_cards_first_reveal_loses'),
      detail: t('strings.the_dealer_shuffles_all_4_cards_facedown_and_offers_the_active_player_a_')
    },
    {
      title: t('strings.winner_2'),
      summary: t('strings.second_reveal_pays_1_1_1_gp_decide_whether_to_press_on'),
      detail: t('strings.reveal_the_next_card_as_the_winner_matching_bets_pay_1_1_gain_money_equa')
    },
    {
      title: t('strings.jackpot'),
      summary: t('strings.third_reveal_pays_3_1_1_gp_all_other_remaining_bets_lose'),
      detail: t('strings.reveal_the_next_card_as_the_jackpot_matching_bets_gain_3_times_the_marke')
    }
  ];

  if (game === 'high_stakes') return [
    {
      title: t('strings.qualify_ante'),
      summary: t('strings.need_at_least_30_1_poker_card_ante_10_and_draw_1'),
      detail: t('strings.to_initiate_high_stakes_poker_the_active_player_must_have_at_least_30_an')
    },
    {
      title: t('strings.invite_players'),
      summary: t('strings.same_town_players_may_join_in_clockwise_order'),
      detail: t('strings.each_other_player_in_the_same_town_decides_in_clockwise_order_whether_to')
    },
    {
      title: t('strings.build_pot_set_dealer'),
      summary: t('strings.saloon_adds_40_if_solo_dealer_draws_5_cards'),
      detail: t('strings.the_saloon_adds_40_to_the_pot_if_no_other_player_joined_the_player_to_th')
    },
    {
      title: t('strings.deal_the_flop'),
      summary: t('strings.reveal_3_communal_poker_cards'),
      detail: t('strings.reveal_3_communal_poker_cards_faceup_these_are_the_flop')
    },
    {
      title: t('strings.add_20_or_fold'),
      summary: t('strings.players_act_clockwise_from_the_active_player_s_left_dealer_never_folds'),
      detail: t('strings.starting_with_the_player_to_the_left_of_the_active_player_and_proceeding')
    },
    {
      title: t('strings.check_for_early_end'),
      summary: t('strings.all_fold_clear_pot_lone_player_may_win_immediately'),
      detail: t('strings.if_all_players_fold_return_all_money_in_the_pot_to_the_supply_if_only_1_')
    },
    {
      title: t('strings.turn_river'),
      summary: t('strings.if_play_continues_reveal_2_more_communal_cards'),
      detail: t('strings.if_the_hand_continues_and_no_dealer_is_playing_the_saloon_adds_another_2')
    },
    {
      title: t('strings.make_the_best_hand'),
      summary: t('strings.reveal_2_hand_cards_use_any_3_communal_cards'),
      detail: t('strings.starting_to_the_left_of_the_active_player_and_proceeding_clockwise_each_'),
      pokerHands: true
    },
    {
      title: t('strings.winner_ties_rewards'),
      summary: t('strings.best_hand_wins_winner_gets_pot_1_lp_1_gp'),
      detail: t('strings.the_best_hand_wins_the_dealer_wins_ties_the_active_player_wins_ties_agai')
    }
  ];

  return [
    {
      title: t('strings.ante_draw'),
      summary: t('strings.gamble_beside_a_saloon_pay_10_and_draw_1_poker_card'),
      detail: t('strings.take_a_gamble_action_while_adjacent_to_a_saloon_the_active_player_pays_1')
    },
    {
      title: t('strings.invite_players'),
      summary: t('strings.any_player_in_the_same_town_may_buy_in_for_10'),
      detail: t('strings.each_other_player_in_the_same_town_may_join_a_joining_player_pays_10_to_')
    },
    {
      title: t('strings.set_dealer_if_solo'),
      summary: t('strings.if_nobody_joins_the_player_to_the_right_deals_against_you'),
      detail: t('strings.if_no_other_player_joined_the_player_to_the_right_of_the_active_player_b')
    },
    {
      title: t('strings.deal_the_flop'),
      summary: t('strings.reveal_the_top_3_poker_cards'),
      detail: t('strings.reveal_the_top_3_poker_cards_faceup_these_communal_cards_are_the_flop')
    },
    {
      title: t('strings.build_your_hand'),
      summary: t('strings.use_2_hand_cards_the_3_flop_cards'),
      detail: t('strings.make_the_best_5_card_hand_using_the_3_flop_cards_and_exactly_2_poker_car'),
      pokerHands: true
    },
    {
      title: t('strings.reveal_break_ties'),
      summary: t('strings.best_hand_wins_dealer_and_active_player_have_tie_priority'),
      detail: t('strings.reveal_chosen_cards_simultaneously_and_announce_each_hand_the_best_hand_')
    },
    {
      title: t('strings.award_the_pot'),
      summary: t('strings.winner_takes_pot_losers_draw_1_poker_card'),
      detail: t('strings.the_winner_takes_the_pot_and_any_additional_item_or_ability_rewards_if_t')
    }
  ];
}

function availableGamblingGames() {
  return [
    { value: 'poker', label: t('strings.poker') },
    hasModule('ante_up_faro') ? { value: 'faro', label: t('strings.faro') } : null,
    hasModule('ante_up_high_stakes_poker') ? { value: 'high_stakes', label: t('strings.high_stakes_poker') } : null
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
    return t('strings.game_poker');
  }
  return `<div class="fight-flow-selector-card gambling-flow-selector-card">
    <label for="gamblingFlowGame"><span>${t('strings.game')}</span><select id="gamblingFlowGame" data-gambling-flow-game>
      ${games.map(game => `<option value="${game.value}" ${gamblingFlowSelection === game.value ? 'selected' : ''}>${escapeHtml(game.label)}</option>`).join('')}
    </select></label>
  </div>`;
}

function renderGamblingFlowNode(step, index) {
  const icons = ['♠', '$', '🂠', '⚖', '★', '◆', '🃏', '♣', '★', '✓'];
  return `<div class="fight-flow-node gambling-flow-node" data-gambling-flow-step="${index}" tabindex="0" role="button">
    <span class="fight-flow-icon" aria-hidden="true">${icons[index] || '•'}</span>
    <span class="fight-flow-copy"><small>${t('strings.step')} ${index + 1}</small><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.summary || step.detail)}</span></span>
    <span class="fight-flow-info-dot" aria-hidden="true">${t('strings.i')}</span>
    ${step.pokerHands ? t('strings.poker_hands_2') : ''}
  </div>`;
}


function renderGamblingFlowBrief(game) {
  const gameLabel = gamblingFlowLabel(game);
  if (game === 'faro') {
    return `<div class="fight-flow-brief gambling-flow-brief">
      <div class="fight-flow-brief-heading">
        <span class="fight-flow-brief-icon" aria-hidden="true">♦</span>
        <span><small>${escapeHtml(t('strings.gambling_reference'))}</small><strong>${escapeHtml(gameLabel)}</strong></span>
      </div>
      <div class="fight-flow-brief-facts">
        <span>${escapeHtml(t('strings.place_up_to_2_bets_of_10_or_20_active_player_bets_last'))}</span>
        <span>${escapeHtml(t('strings.third_reveal_pays_3_1_1_gp_all_other_remaining_bets_lose'))}</span>
      </div>
    </div>`;
  }
  if (game === 'high_stakes') {
    return `<div class="fight-flow-brief gambling-flow-brief">
      <div class="fight-flow-brief-heading">
        <span class="fight-flow-brief-icon" aria-hidden="true">♠</span>
        <span><small>${escapeHtml(t('strings.gambling_reference'))}</small><strong>${escapeHtml(gameLabel)}</strong></span>
      </div>
      <div class="fight-flow-brief-facts">
        <span>${escapeHtml(t('strings.need_at_least_30_1_poker_card_ante_10_and_draw_1'))}</span>
        <span>${escapeHtml(t('strings.best_hand_wins_winner_gets_pot_1_lp_1_gp'))}</span>
      </div>
    </div>`;
  }
  return `<div class="fight-flow-brief gambling-flow-brief">
    <div class="fight-flow-brief-heading">
      <span class="fight-flow-brief-icon" aria-hidden="true">♣</span>
      <span><small>${escapeHtml(t('strings.gambling_reference'))}</small><strong>${escapeHtml(gameLabel)}</strong></span>
    </div>
    <div class="fight-flow-brief-facts">
      <span>${escapeHtml(t('strings.gamble_beside_a_saloon_pay_10_and_draw_1_poker_card'))}</span>
      <span>${escapeHtml(t('strings.winner_takes_pot_losers_draw_1_poker_card'))}</span>
    </div>
  </div>`;
}

function renderGamblingFlowDetail(step) {
  const handsButton = step.pokerHands ? `<button type="button" class="action-btn action-btn-secondary fight-flow-auto-btn gambling-inline-btn" data-open-poker-hands>${escapeHtml(t('strings.poker_hands'))}</button>` : '';
  return `<div class="fight-flow-inline-detail gambling-flow-inline-detail${handsButton ? ' gambling-flow-inline-tool' : ''}">
    <p>${escapeHtml(step.detail)}</p>
    ${handsButton}
  </div>`;
}

function renderGamblingFlowStage(index, step) {
  const stageKey = `gambling-${gamblingFlowSelection}-${index}`;
  const eyebrow = `${t('strings.step')} ${index + 1}`;
  return renderFightFlowStage(index + 1, stageKey, eyebrow, step.title, step.summary || '', renderGamblingFlowDetail(step), step.pokerHands ? 'gambling-flow-stage-poker-emphasis' : '');
}

function gamblingFlowLabel(game) {
  if (game === 'faro') return t('reference.faro');
  if (game === 'high_stakes') return t('strings.high_stakes_poker');
  return t('reference.poker');
}

function renderGamblingSequenceReference() {
  const game = normalizeGamblingFlowSelection();
  const steps = gamblingFlowSteps(game);
  return `<div class="fight-flowchart gambling-flowchart" aria-label="${escapeHtml(t('assist.gambling.flowAria', { game: gamblingFlowLabel(game) }))}">
    ${renderGamblingGameSelector()}
    ${renderGamblingFlowBrief(game)}
    <div class="fight-flow-stage-list gambling-flow-stage-list">
      ${steps.map((step, index) => renderGamblingFlowStage(index, step)).join('')}
    </div>
  </div>`;
}

function gamblingFlowStepInfo(index) {
  const game = normalizeGamblingFlowSelection();
  const step = gamblingFlowSteps(game)[Number(index)];
  if (!step) return null;
  return { eyebrow: t('assist.gambling.flowLabel', { game: gamblingFlowLabel(game) }), title: step.title, html: `<p>${escapeHtml(step.detail)}</p>` };
}

function openPokerHandsFromGambling(source = 'reference') {
  if (source === 'reference') {
    assistNestedReturn = 'reference';
    gamblingFlowReturnTarget = 'reference';
  } else {
    assistNestedReturn = 'gamblingFlow';
  }
  assistView = 'detail';
  renderReferenceStyleAssist(t('strings.poker_hands'), renderPokerHandsReference(), t('strings.gambling_reference'));
}

function bindGamblingFlowInteractions(host, source = 'reference') {
  if (!host) return;
  host.querySelector('[data-gambling-flow-game]')?.addEventListener('change', event => {
    gamblingFlowSelection = event.target.value;
    host.innerHTML = renderGamblingSequenceReference();
    bindGamblingFlowInteractions(host, source);
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
      title: t('strings.legendary_points_lp'),
      cls: 'gold',
      items: [
        { iconPath: 'assets/images/tokens/action-bank.png', action: t('strings.deposit_gold'), detail: t('strings.at_the_bank_gain_20_and_1_lp_for_each_gold_nugget_sold') },
        { iconPath: 'assets/images/tokens/action-revel.png', action: t('strings.revel'), detail: t('strings.at_the_cabaret_pay_30_to_gain_1_lp_you_may_repeat_during_the_same_revel_') },
        { iconPath: 'assets/images/tokens/action-outlaw.png', action: t('strings.win_fights'), detail: t('strings.defeat_bandits_or_story_npcs_when_the_fight_reward_allows_lp') },
        { icon: 'lp.png', action: t('strings.complete_stories'), detail: t('strings.story_cards_legendary_stories_event_triggers_and_app_story_objectives_ma') },
        { icon: 'deed.png', action: t('strings.use_deeds'), detail: t('strings.claim_or_use_deeds_when_a_property_reward_grants_lp') },
        { icon: 'generic.svg', action: t('strings.expansion_rewards'), detail: t('strings.hunting_fishing_crafting_and_other_expansion_content_may_award_lp_throug') }
      ]
    },
    {
      title: t('strings.marshal_points_mp'),
      cls: 'blue',
      items: [
        { iconPath: 'assets/images/tokens/action-ranch.png', action: t('strings.wrangle_cattle'), detail: t('strings.deliver_cattle_tokens_to_a_rail_station') },
        { iconPath: 'assets/images/tokens/action-sheriff.png', action: t('strings.arrest_outlaws'), detail: t('strings.arrest_wanted_players_or_resolve_lawman_rewards_that_grant_marshal_point') },
        { iconPath: 'assets/images/tokens/action-bandit.png', action: t('strings.defeat_bandits'), detail: t('strings.choose_marshal_points_when_the_bandit_reward_allows_mp_instead_of_lp') },
        { iconPath: 'assets/images/tokens/action-sheriff.png', action: t('strings.serve_the_law'), detail: t('strings.complete_sheriff_marshal_posse_or_law_themed_story_events_that_award_mp') }
      ]
    },
    {
      title: t('strings.wanted_points_wp'),
      cls: 'black',
      items: [
        { iconPath: 'assets/images/tokens/action-ranch.png', action: t('strings.rustle_cattle'), detail: t('strings.deliver_cattle_to_the_wrong_ranch_color') },
        { iconPath: 'assets/images/tokens/action-outlaw.png', action: t('strings.rob_heist'), detail: t('strings.rob_another_player_rob_the_bank_or_commit_heist_outlaw_actions_that_awar') },
        { iconPath: 'assets/images/tokens/action-outlaw.png', action: t('strings.fight_the_law'), detail: t('strings.attack_or_interfere_with_lawmen_when_a_rule_or_story_says_to_gain_wp') },
        { iconPath: 'assets/images/tokens/action-outlaw.png', action: t('strings.outlaw_events'), detail: t('strings.resolve_outlaw_gang_train_heist_or_bandit_story_events_that_grant_wp') }
      ]
    },
    {
      title: t('strings.gambler_points_gp'),
      cls: 'purple',
      requiredModules: ['ante_up_gambler'],
      items: [
        { iconPath: 'assets/images/tokens/action-cards.png', action: t('strings.gambling_rewards'), detail: t('strings.win_or_resolve_ante_up_gambling_activities_when_the_gambler_track_module') },
        { iconPath: 'assets/images/tokens/action-cards.png', action: t('strings.poker_faro'), detail: t('strings.play_poker_or_faro_events_that_award_gambler_points') },
        { iconPath: 'assets/images/tokens/action-cards.png', action: t('strings.gambling_stories'), detail: t('strings.complete_saloon_cabaret_card_shark_or_traveling_showman_story_events_tha') }
      ]
    },
    {
      title: t('strings.story_points_sp'),
      cls: 'silver',
      requiredModules: ['blood_money_stories'],
      items: [
        { icon: 'sp.png', action: t('strings.legendary_stories'), detail: t('strings.gain_story_points_from_blood_money_legendary_story_content_when_instruct') },
        { iconPath: 'assets/images/dice/risk.png', action: t('strings.risk_die_effects'), detail: t('strings.gain_story_points_from_the_risk_die_or_other_module_effects_when_instruc') },
        { icon: 'sp.png', action: t('strings.story_objectives'), detail: t('strings.complete_story_objectives_major_storyline_chapters_or_app_events_that_ex') }
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

function renderSettingsOverlay(returnTarget = null) {
  normalizeStoryEventSettings();
  const gameSettingsMarkup = state.gameStarted ? `
      <details class="options-card settings-dialog-section" open>
        <summary class="options-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/></svg>
          <span class="options-card-title">${t('strings.story_amp_events')}</span>
          <span class="options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body">
          <p class="settings-section-note"><!--Change how often new story content appears. Modules stay locked to the choices used when this game began; ongoing chapters and current world effects are not removed.--></p>
          <div class="story-event-settings">
            ${renderStoryEventSetting('oneOff', t('story.eventTypes.oneOff.title'), t('story.eventTypes.oneOff.description'))}
            ${renderStoryEventSetting('arcs', t('story.eventTypes.arcs.title'), t('story.eventTypes.arcs.description'))}
            ${renderStoryEventSetting('world', t('story.eventTypes.world.title'), t('story.eventTypes.world.description'))}
          </div>
        </div>
      </details>

      <details class="options-card settings-dialog-section" open>
        <summary class="options-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>
          <span class="options-card-title">${t('strings.story_points')}</span>
          <span class="options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body">
          <label class="toggle-row check-row story-track-setting">
            <div class="toggle-text"><span class="t-title">${t('strings.track_story_points')}</span><span class="t-sub">${t('strings.show_and_maintain_each_player_s_story_point_track_during_this_game')}</span></div>
            <input type="checkbox" id="useStoryTrack" class="check-input" ${isStoryTrackEnabled() ? 'checked' : ''}>
          </label>
          <label class="toggle-row check-row story-track-setting">
            <div class="toggle-text"><span class="t-title">${t('strings.story_point_reward_reminders')}</span><span class="t-sub">${t('strings.show_the_compact_reminder_when_a_story_point_advances_a_player_s_marker')}</span></div>
            <input type="checkbox" id="showStoryTrackReminders" class="check-input" ${state.settings?.hideStoryTrackReminders ? '' : 'checked'}>
          </label>
        </div>
      </details>` : t('strings.start_a_game_to_see_the_story_events_and_story_point_settings_for_that');

  app.innerHTML = `<div class="modal-screen-overlay" data-settings-backdrop>
    <section class="panel modal-screen-card settings-dialog-card">
      <button type="button" class="dialog-close-x" data-settings-close aria-label="${t('strings.close')}">&#10005;</button>
      <div class="modal-title-header settings-dialog-title-block">
        <p class="eyebrow">${t('strings.frontier_director')}</p>
        <h1 class="section-title">${t('strings.settings')}</h1>
      </div>

      <details class="options-card settings-dialog-section audio-settings-card" open>
        <summary class="options-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/></svg>
          <span class="options-card-title">${t('strings.audio')}</span>
          <span class="options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body">
          <div class="sound-compact-grid settings-sound-grid">
            ${soundControl('musicOn',t('settings.music'),'musicVolume')}
            ${soundControl('soundOn',t('settings.sounds'),'soundVolume')}
            ${soundControl('voiceOn',t('settings.voice'),'voiceVolume')}
          </div>
        </div>
      </details>

      ${gameSettingsMarkup}

      <details class="options-card settings-dialog-section settings-language">
        <summary class="options-card-head">
          <span class="settings-language-icon" aria-hidden="true">${LANGUAGE_GLOBE_SVG}</span>
          <span class="options-card-title">${escapeHtml(t('languageSelector.title'))}</span>
          <span class="settings-language-caret options-card-caret" aria-hidden="true"></span>
        </summary>
        <div class="options-card-body settings-language-body">
          <button type="button" class="settings-language-button" id="settingsLanguageSelector" aria-label="${escapeHtml(t('languageSelector.selectAria', { language: currentLanguageName() }))}">
            <span class="settings-language-copy">
              <span class="settings-language-label">${escapeHtml(t('languageSelector.current'))}</span>
              <strong class="settings-language-current">${escapeHtml(currentLanguageName())}</strong>
            </span>
            <span class="settings-language-action">${escapeHtml(t('languageSelector.change'))}</span>
            <span class="settings-language-chevron" aria-hidden="true">›</span>
          </button>
        </div>
      </details>

      <div class="dialog-actions settings-dialog-actions">
        <button type="button" class="primary-btn home-major-btn home-leather-btn home-leather-btn-primary" id="settingsDone">
          <span class="home-btn-mark" aria-hidden="true">◆</span>
          <span class="home-btn-label">${t('strings.done')}</span>
          <span class="home-btn-arrow" aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  </div>`;

  document.getElementById('settingsLanguageSelector')?.addEventListener('click', openLanguagePicker);

  [['musicOn', 'musicVolume'], ['soundOn', 'soundVolume'], ['voiceOn', 'voiceVolume']].forEach(([flag, volumeKey]) => {
    const checkbox = document.getElementById(flag);
    const slider = document.getElementById(volumeKey);
    if (!checkbox || !slider) return;
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

  const applyCurrentGameSettings = () => {
    if (!state.gameStarted) return;
    updateSetupFromUI(false);
    const showReminders = document.getElementById('showStoryTrackReminders')?.checked !== false;
    state.settings.hideStoryTrackReminders = !showReminders;
    if (!showReminders) state.storyTrackNotice = null;
    save();
  };

  if (state.gameStarted) {
    app.querySelectorAll('[id^="storyEnabled_"]').forEach(toggle => {
      toggle.addEventListener('change', () => {
        const card = toggle.closest('[data-story-setting]');
        const frequencySelect = card?.querySelector('.story-frequency-select');
        card?.classList.toggle('disabled', !toggle.checked);
        if (frequencySelect) frequencySelect.disabled = !toggle.checked;
        applyCurrentGameSettings();
      });
    });
    app.querySelectorAll('.story-frequency-select').forEach(select => select.addEventListener('change', applyCurrentGameSettings));
    document.getElementById('useStoryTrack')?.addEventListener('change', applyCurrentGameSettings);
    document.getElementById('showStoryTrackReminders')?.addEventListener('change', applyCurrentGameSettings);
  }

  const closeSettings = () => {
    applyCurrentGameSettings();
    reopenDrawerAfterOverlay(returnTarget);
    // If a timed World Event became due while Settings was open, present it
    // only after the player intentionally closes Settings.
    setTimeout(maybePresentPendingWorldEvent, 40);
  };
  document.getElementById('settingsDone')?.addEventListener('click', closeSettings);
  document.querySelector('[data-settings-close]')?.addEventListener('click', closeSettings);
  document.querySelector('[data-settings-backdrop]')?.addEventListener('click', event => {
    if (event.target.hasAttribute('data-settings-backdrop')) closeSettings();
  });
}

// Backward-compatible alias for any older internal call sites.
function renderAudioSettings(returnTarget = null) {
  renderSettingsOverlay(returnTarget);
}

function soundControl(flag, label, volume) {
  const on = !!state.settings[flag];
  return `<article class="ref-card sound-control-block">
    <h3>${label}</h3>
    <div class="sound-control-row">
      <input type="checkbox" id="${flag}" class="sound-toggle" ${on ? 'checked' : ''} aria-label="${escapeHtml(t('settings.onOffAria', { label }))}">
      <input id="${volume}" type="range" min="0" max="1" step="0.01" value="${state.settings[volume]}" ${on ? '' : 'disabled'} aria-label="${escapeHtml(t('settings.volumeAria', { label }))}">
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
  if (state?.gameStarted && state?.screen === 'game') ensureFrontierMusicPlaying();
  else playMusic();
}
function applyAudioSettings() {
  musicPlayer.volume = state?.settings?.musicVolume ?? .2;
  if (musicPlayerB) musicPlayerB.volume = state?.settings?.musicVolume ?? .2;
  sfxPlayer.volume = state?.settings?.soundVolume ?? .6;
  voicePlayer.volume = state?.settings?.voiceVolume ?? .8;
}
function currentFrontierMusicSource() {
  const moodKey = state?.gameStarted ? computeFrontierMood().key : 'quiet';
  return MOOD_MUSIC[moodKey] || MOOD_MUSIC.quiet;
}

function activeMusicPlayer() {
  return activeMusicSlot === 'B' && musicPlayerB ? musicPlayerB : musicPlayer;
}

function ensureFrontierMusicPlaying() {
  if (!state?.settings?.musicOn || !state?.gameStarted || state?.screen !== 'game') return;
  const moodKey = computeFrontierMood().key;
  const src = MOOD_MUSIC[moodKey] || MOOD_MUSIC.quiet;
  currentMoodMusicKey = moodKey;

  let active = activeMusicPlayer();
  // If no player owns the correct current track (common after a reload), use
  // the active slot directly instead of requiring a crossfade from silence.
  if (!active.src || !active.src.endsWith(src)) {
    if (musicPlayerB) musicPlayerB.pause();
    musicPlayer.pause();
    activeMusicSlot = 'A';
    active = musicPlayer;
    active.src = src;
    active.currentTime = 0;
  }
  active.loop = true;
  active.volume = state.settings.musicVolume ?? 0.2;
  if (active.paused) active.play().catch(() => {});
}

function playMusic() {
  if (!state?.settings?.musicOn) return;
  if (state?.gameStarted && state?.screen === 'game') {
    ensureFrontierMusicPlaying();
    return;
  }
  if (!musicPlayer.src) musicPlayer.src = MOOD_MUSIC.quiet;
  musicPlayer.volume = state.settings.musicVolume ?? 0.2;
  musicPlayer.play().catch(() => {});
}

// Event-trigger sound effects are now defined directly in data/triggers.json.
// Music remains continuous; SFX fire only when the corresponding trigger is tapped.

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
  const src = MOOD_MUSIC[moodKey] || MOOD_MUSIC.quiet;

  // A prior play() may have been blocked by the browser. Do not treat matching
  // mood metadata as proof that audio is actually running.
  if (moodKey === currentMoodMusicKey) {
    if (state.settings.musicOn) ensureFrontierMusicPlaying();
    return;
  }
  currentMoodMusicKey = moodKey;
  if (!state.settings.musicOn) return;
  ensureSecondMusicPlayer();
  const active = activeMusicSlot === 'A' ? musicPlayer : musicPlayerB;
  const incoming = activeMusicSlot === 'A' ? musicPlayerB : musicPlayer;

  // If the outgoing track is silent/paused, a direct start is more reliable
  // than pretending to crossfade from something the user cannot hear.
  if (!active.src || active.paused) {
    active.pause();
    incoming.pause();
    activeMusicSlot = 'A';
    musicPlayer.src = src;
    musicPlayer.loop = true;
    musicPlayer.volume = state.settings.musicVolume ?? 0.2;
    musicPlayer.currentTime = 0;
    musicPlayer.play().catch(() => {});
    return;
  }
  if (active.src.endsWith(src)) {
    ensureFrontierMusicPlaying();
    return;
  }

  const targetVolume = state.settings.musicVolume ?? 0.2;
  incoming.src = src;
  incoming.loop = true;
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
function playVoice(src) {
  if (!src || !state.settings.voiceOn) return;
  try {
    voicePlayer.pause();
    if (!voicePlayer.src.endsWith(src)) voicePlayer.src = src;
    voicePlayer.currentTime = 0;
    const playback = voicePlayer.play();
    if (playback?.catch) playback.catch(() => {});
  } catch (_) {}
}
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
  fight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4l15 15M19 4L4 19M6 3l3 3-3 3M18 3l-3 3 3 3"/></svg>',
  gambling: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c-2.5 3.6-6 5.6-6 9a4 4 0 0 0 7 2.6V18H9v3h6v-3h-4v-3.4A4 4 0 0 0 18 12c0-3.4-3.5-5.4-6-9z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/></svg>',
  randomizers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3c5 0 5 10 10 10h5M18 14l3 3-3 3M3 17h3c2.2 0 3.4-1.8 4.6-4M18 4l3 3-3 3M14 7h7"/></svg>',
  other: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
};

function assistGroupIcon(groupId) {
  return `<span class="assist-group-heading-icon">${ASSIST_GROUP_ICONS[groupId] || ASSIST_GROUP_ICONS.other}</span>`;
}

function openAssistMenu() {
  assistOpenedDirectly = false;
  assistView = 'menu';
  assistNestedReturn = null;
  fightFlowReturnTarget = null;
  gamblingFlowReturnTarget = null;
  setAssistHeader(t('strings.game_assist'), t('strings.quick_helpers'));
  const groups = [
    { id: 'fight', title: t('assist.groups.fight'), items: [
      { id: 'fightCards', title: t('strings.draw'), desc: t('assist.fight.autoDrawNpc') },
      { id: 'fightFlow', title: t('strings.fight_flow'), desc: t('strings.step_by_step_fight_guide') }
    ]},
    { id: 'gambling', title: t('assist.groups.gambling'), items: [
      { id: 'pokerHands', title: t('strings.poker_hands'), desc: t('strings.which_hand_beats_which') },
      { id: 'pokerFlow', title: t('strings.poker'), desc: t('strings.step_by_step_poker_guide') },
      ...(hasModule('ante_up_faro') ? [{ id: 'faroFlow', title: t('strings.faro'), desc: t('strings.step_by_step_faro_guide') }] : []),
      ...(hasModule('ante_up_high_stakes_poker') ? [{ id: 'highStakesPokerFlow', title: t('strings.high_stakes_poker'), desc: t('strings.step_by_step_high_stakes_guide') }] : [])
    ]},
    { id: 'dice', title: t('assist.groups.dice'), items: [
      { id: 'prospectDiceMenu', title: t('strings.prospecting_dice'), desc: t('strings.roll_prospecting_dice') },
      ...(hasModule('blood_money_risk_die') ? [{ id: 'riskDiceMenu', title: t('strings.risk_die'), desc: t('strings.roll_the_risk_die') }] : [])
    ]},
    { id: 'randomizers', title: t('assist.groups.randomizers'), items: [
      { id: 'firstPlayer', title: t('strings.first_player'), desc: t('strings.choose_first_player') },
      { id: 'randomPlayer', title: t('strings.random_player'), desc: t('strings.pick_a_random_player_color') },
      { id: 'storeRandomizer', title: t('strings.store_randomizer'), desc: hasModule('ante_up_sideboard') ? t('strings.fill_general_store_trading_post') : t('strings.fill_general_store') }
    ]}
  ];
  // Reserved for future module-specific helpers. The section remains hidden
  // until a useful helper is deliberately added here.
  const otherAssistItems = [];
  if (otherAssistItems.length) groups.push({ id: 'other', title: t('assist.groups.other'), items: otherAssistItems });

  assistBody.innerHTML = groups.map(group => `<div class="assist-group">
    <h3 class="assist-group-title">${assistGroupIcon(group.id)}<span>${escapeHtml(group.title)}</span></h3>
    <div class="assist-choice-list">${group.items.map(item => `<button type="button" class="assist-choice assist-choice-no-icon" data-assist-open="${item.id}"><span class="assist-choice-copy"><strong>${item.title}</strong><small>${item.desc}</small></span></button>`).join('')}</div>
  </div>`).join('');
  assistBody.querySelectorAll('[data-assist-open]').forEach(btn => btn.onclick = () => { assistOpenedDirectly = false; openAssist(btn.dataset.assistOpen); });
  showAssistDialog();
}

// A lightweight wrapper for showing static reference-style content (steps,
// tables, lists) inside the Assist dialog, reusing the exact same content
// generators as the full Rules screen so the two never drift apart.
function renderReferenceStyleAssist(title, contentHtml, type = t('assist.referenceType')) {
  setAssistHeader(title, type);
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel reference-assist-panel">${contentHtml}</div>`;
  bindAssistBack();
  showAssistDialog();
}

// Opens the dice roller preset to a specific die type/count - used by the
// "Prospecting Dice" and "Risk Die" Assist menu buttons so each starts
// fresh with the expected default rather than whatever was left over from
// an earlier session.
function setProspectDiceType(type) {
  // Western Legends never needs Prospecting and Risk dice in the same roll.
  // Switching types replaces the current dice with that type's normal default.
  Object.keys(prospectDieTimers).forEach(key => {
    clearTimeout(prospectDieTimers[key]);
    delete prospectDieTimers[key];
  });
  if (type === 'risk' && hasModule('blood_money_risk_die')) {
    prospectDiceState = { dice: [{ type: 'risk', face: DICE_TYPES.risk.outcomes[0] }], selectedType: 'risk' };
  } else {
    prospectDiceState = { dice: [{ type: 'prospecting', face: 'gold' }, { type: 'prospecting', face: 'gold' }], selectedType: 'prospecting' };
  }
}

function openDiceAssist(defaultType) {
  setProspectDiceType(defaultType);
  renderProspectingAssist();
}

function openAssist(kind) {
  assistView = 'detail';
  if (kind === 'fightCards') return renderFightCardAssist();
  if (kind === 'fightFlow') { fightFlowReturnTarget = null; return renderFightFlowAssist(null); }
  if (kind === 'pokerHands') return renderReferenceStyleAssist(t('strings.poker_hands'), renderPokerHandsReference(), t('strings.gambling_reference'));
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

function setAssistHeader(title, type = t('strings.trail_helper')) {
  document.getElementById('assistTitle').textContent = title;
  document.getElementById('assistType').textContent = type;
}

function showAssistDialog() {
  if (assistTitle.textContent !== t('reference.firstPlayer')) assistDialog.classList.remove('first-player-dialog');
  if (!assistDialog.open) assistDialog.showModal();
}

function closeAssist() {
  assistDialog.classList.remove('first-player-dialog');
  if (assistDialog.open) assistDialog.close();
}

function handleAssistCloseRequest() {
  if (!assistDialog.open) return;
  // First Player is a full-screen utility. Its X is a true Close rather than
  // the usual detail-view Back behavior used by the other Assist screens.
  if (assistDialog.classList.contains('first-player-dialog')) {
    assistReturnAfterClose = false;
    assistOpenedDirectly = false;
    assistReturnTarget = null;
    closeAssist();
    return;
  }
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
  if (assistOpenedDirectly) {
    assistOpenedDirectly = false;
    assistReturnAfterClose = false;
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
  bandit: { labelKey: 'assist.fight.npcLabels.bandit', count: 2 },
  bank_guard: { labelKey: 'assist.fight.npcLabels.bank_guard', count: 3 },
  sheriff: { labelKey: 'assist.fight.npcLabels.sheriff', count: 4 },
  other: { labelKey: 'assist.fight.npcLabels.other', count: 2 }
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
  const alt = showFront ? t('assist.fight.cardAlt', { rank }) : t('reference.fightCardBack');
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
    ? t('strings.use_the_fight_card_count_shown_on_the_train_encounter_card')
    : t('assist.fight.useCountOnComponent', { component: type.countSource || t('strings.the_npc_component') });
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
  setAssistHeader(t('strings.draw_fight_cards'), t('strings.fight_helper'));
  const st = ensureFightCardState();
  const chosenRank = st.chosenIndex != null ? st.cards[st.chosenIndex]?.rank : null;
  const customCount = st.npcType === 'other';
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    <div class="fight-card-opponent-control ${customCount ? 'has-custom-count' : 'fixed-count'}">
      <label><span>${t('strings.npc')}</span><select data-fc-opponent>
        ${Object.entries(FIGHT_CARD_NPC_PRESETS).map(([value, preset]) => `<option value="${value}" ${st.npcType === value ? 'selected' : ''}>${escapeHtml(t(preset.labelKey))}${value === 'other' ? '' : tp('assist.fight.cardCountSuffix', preset.count, { count: preset.count })}</option>`).join('')}
      </select></label>
      ${customCount ? `<div class="fight-card-count-control">
        <span>${t('strings.fight_cards')}</span>
        <div class="dice-count-control"><button type="button" class="small-btn" data-fc-minus aria-label="${t('strings.draw_one_fewer_fight_card')}">−</button><strong>${st.count}</strong><button type="button" class="small-btn" data-fc-plus aria-label="${t('strings.draw_one_more_fight_card')}">+</button></div>
      </div>` : ''}
    </div>
    ${st.flowTargetLabel ? `<div class="fight-card-flow-context"><strong>${escapeHtml(st.flowTargetLabel)}</strong><span>${escapeHtml(st.flowCountHint)}</span></div>` : ''}
    <p class="assist-hint">${st.hasDrawn ? t('strings.tap_a_face_down_card_to_peek_at_it_tap_any_revealed_card_to_view_it_full') : t('strings.tap_draw_to_draw_this_many_fight_cards_and_reveal_the_npc_s_best_play')}</p>
    <div class="fight-card-grid" data-fight-card-area>${st.cards.map((c, i) => renderFightCardEl(i)).join('')}</div>
    ${chosenRank ? `<div class="dialog-reward fight-card-chosen-note"><strong>${t('strings.npc_plays_the')} ${escapeHtml(chosenRank)}:</strong> ${escapeHtml(fightCardAbilityText(chosenRank))}</div>` : ''}
    <details class="fight-context-toggles">
      <summary>${t('strings.advanced_refine_the_npc_s_decision')}</summary>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-weapon ${st.opponentHasWeapon ? 'checked' : ''}> ${t('strings.opponent_has_a_card_reducing_weapon')}</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-maxwounds ${st.opponentAtMaxWounds ? 'checked' : ''}> ${t('strings.opponent_already_has_3_wounds_the_max')}</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-stakes ${st.highStakesNpc ? 'checked' : ''}> ${t('strings.this_npc_u2019s_defeat_reward_is_especially_valuable_bank_guard_sheriff_')}</label>
      <label class="fight-weapon-toggle"><input type="checkbox" data-fc-nopoker ${st.opponentHasNoPokerCards ? 'checked' : ''}> ${t('strings.opponent_has_no_poker_cards_to_discard')}</label>
    </details>
    <button type="button" class="primary-btn assist-action-btn-centered" data-fc-draw>${st.hasDrawn ? t('reference.redraw') : t('reference.draw')}</button>
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
    if (entry.revealed) showFullscreenImage(fightCardFrontSrc(entry.rank), t('assist.fight.cardAlt', { rank: entry.rank }), '');
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
  setAssistHeader(t('strings.gambling_flow'), t('strings.gambling_helper'));
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
    labelKey: 'assist.dice.types.prospecting.label',
    requiredModule: null,
    outcomes: ['gold', 'gold', 'gold', 'money', 'reroll', 'miss'],
    images: {
      gold: 'assets/images/dice/face-nugget.png',
      money: 'assets/images/dice/face-money.png',
      reroll: 'assets/images/dice/face-reroll.png',
      miss: 'assets/images/dice/face-null.png'
    },
    labelKeys: { gold: 'gold', money: 'money', reroll: 'reroll', miss: 'miss' },
    slotMap: { front: 'gold', back: 'gold', right: 'gold', left: 'money', top: 'reroll', bottom: 'miss' }
  },
  risk: {
    labelKey: 'assist.dice.types.risk.label',
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
    labelKeys: { blank: 'blank', wound: 'wound', doublewound: 'doublewound', storypoint: 'storypoint', woundstorypoint: 'woundstorypoint' },
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
    const label = diceFaceLabel(typeKey, outcomeKey);
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
  setAssistHeader(st.selectedType === 'risk' ? t('strings.risk_die') : t('strings.prospecting_dice'), t('strings.dice_roller'));
  const typeOptions = availableDiceTypes();
  const showTypeSelect = typeOptions.length > 1;
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    ${showTypeSelect ? `<label class="dice-type-select-label">${escapeHtml(t('assist.dice.dieType'))}
      <select data-dice-type-select>${typeOptions.map(([key]) => `<option value="${key}" ${st.selectedType === key ? 'selected' : ''}>${escapeHtml(diceTypeLabel(key))}</option>`).join('')}</select>
    </label>` : ''}
    <div class="dice-count-control"><button type="button" class="small-btn" data-prospect-minus>−</button><strong>${st.dice.length}</strong><button type="button" class="small-btn" data-prospect-plus>+</button></div>
    <div class="prospect-dice-area" data-roll-prospect aria-label="${t('strings.roll_dice')}">
      ${st.dice.map((d, index) => `<div class="prospect-die-3d" data-die-index="${index}" data-face="${d.face}" data-die-type="${d.type}">
        <div class="prospect-die-cube-wrap">${dieCubeMarkup(d.type)}</div>
        <div class="prospect-die-label">${escapeHtml(diceFaceLabel(d.type, d.face))}</div>
      </div>`).join('')}
    </div>
    <button type="button" class="primary-btn assist-action-btn-centered" data-roll-all>${t('strings.roll_all_dice')}</button>
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
    assistBody.querySelector('[data-dice-type-select]').onchange = event => { setProspectDiceType(event.target.value); renderProspectingAssist(); };
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
    if (label) label.textContent = diceFaceLabel(type, nextFace);
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
      if (label) label.textContent = diceFaceLabel(type, nextFace);
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
  if (type === 'weapon') return t('reference.weapon');
  if (type === 'mount') return t('reference.mount');
  return t('reference.misc');
}

function itemImageSrc(item) {
  if (item.image) return item.image;
  const slug = (item.id || '').replace(/_/g, '');
  return `assets/images/cards/item-${slug}.png`;
}

function storeSlotImgHtml(item, showFront) {
  const src = showFront ? itemImageSrc(item) : CARD_BACK_SRC;
  const alt = showFront ? escapeHtml(item.name) : t('reference.itemCardBack');
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
    return `<div class="store-slot store-slot-empty" data-slot="${area}:${index}"><span class="store-slot-empty-label">${t('strings.empty')}</span></div>`;
  }
  const showFront = !!revealed;
  const rerollBtn = showFront
    ? `<button type="button" class="store-slot-reroll" data-reroll-slot="${area}:${index}" title="${t('strings.draw_a_different_item')}" aria-label="${escapeHtml(t('assist.store.rerollItem', { item: item.name }))}">⟲</button>`
    : '';
  return `<div class="store-slot ${showFront ? 'store-slot-' + item.type : 'store-slot-back'}" data-slot="${area}:${index}">
    <div class="store-slot-face" ${showFront ? `data-view-card="${area}:${index}" role="button" tabindex="0" aria-label="${escapeHtml(t('assist.store.viewItemFullSize', { item: item.name }))}"` : ''}>${storeSlotFaceInnerHtml(item, showFront)}</div>
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
    face.setAttribute('aria-label', t('assist.store.viewItemFullSize', { item: item.name }));
    if (!rerollBtn) {
      rerollBtn = document.createElement('button');
      rerollBtn.type = 'button';
      rerollBtn.className = 'store-slot-reroll';
      container.appendChild(rerollBtn);
    }
    rerollBtn.dataset.rerollSlot = `${area}:${index}`;
    rerollBtn.title = t('strings.draw_a_different_item');
    rerollBtn.setAttribute('aria-label', t('assist.store.rerollItem', { item: item.name }));
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
  setAssistHeader(t('strings.store_randomizer'), t('strings.setup_helper'));
  const generalSlots = db.items?.storeLayout?.generalStore?.slots || 6;
  const tradingActive = isTradingPostActive();
  const tradingSlots = tradingActive ? (db.items?.storeLayout?.tradingPost?.slots || 6) : 0;
  const hasLayout = !!currentStoreLayout;
  const generalItems = hasLayout ? currentStoreLayout.generalStore : Array.from({ length: generalSlots }, () => ({ __pending: true }));
  const tradingItems = hasLayout ? currentStoreLayout.tradingPost : Array.from({ length: tradingSlots }, () => ({ __pending: true }));

  // A "pending" placeholder has no real name/type yet — it only ever renders as a card back.
  const generalHtml = renderStoreArea(t('strings.general_store'), generalItems, 'generalStore', hasLayout);
  const tradingHtml = tradingActive
    ? renderStoreArea(t('strings.trading_post'), tradingItems, 'tradingPost', hasLayout)
    : t('strings.trading_post_is_inactive_for_this_setup_enable_the_buzzard_gulch_sideb');
  const hint = !hasLayout
    ? t('strings.tap_randomize_to_reveal_the_store')
    : t('strings.tap_a_card_to_view_it_full_size_or_tap_to_draw_a_different_item_the_firs');
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel store-randomizer">
    <p class="assist-hint">${hint}</p>
    ${generalHtml}
    ${tradingHtml}
    <button type="button" class="secondary-btn" data-store-randomize-all>${hasLayout ? t('reference.rerandomize') : t('reference.randomize')}</button>
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
  setAssistHeader(t('strings.random_player'), t('strings.randomizer'));
  const colors = (state.setup.playerColors || PLAYER_COLORS.slice(0, state.setup.players || 4)).filter(Boolean);
  const picked = colors[Math.floor(Math.random() * colors.length)] || 'white';
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel">
    <div class="random-player-result"><span class="player-color large" style="background:${picked}"></span><strong>${picked.toUpperCase()} ${t('strings.player')}</strong></div>
    <button type="button" class="primary-btn" data-random-again>${t('strings.pick_again')}</button>
  </div>`;
  bindAssistBack();
  assistBody.querySelector('[data-random-again]').onclick = renderRandomPlayerAssist;
  showAssistDialog();
}

function renderFirstPlayerAssist() {
  // Clean up any previous selector session before creating another one.
  if (firstPlayerAssistCleanup) {
    firstPlayerAssistCleanup();
    firstPlayerAssistCleanup = null;
  }

  setAssistHeader(t('strings.first_player'), t('strings.touch_randomizer'));
  assistDialog.classList.add('first-player-dialog');
  assistBody.innerHTML = t('strings.3_everyone_place_one_finger_on_the_screen_hold_steady_while_the_timer_');

  const stage = document.getElementById('firstPlayerStage');
  const canvas = document.getElementById('firstPlayerCanvas');
  const timer = document.getElementById('firstPlayerTimer');
  const hint = document.getElementById('firstPlayerHint');
  const ctx = canvas.getContext('2d');

  // Give each finger a different randomly ordered color each time the helper
  // opens. The colors are intentionally bright against the dark selector.
  const palette = [
    '#d84b3a', // red
    '#3a79b8', // blue
    '#e1b93f', // gold
    '#6f9f55', // green
    '#8a5ca8', // purple
    '#f08a45', // orange
    '#45a6a0', // teal
    '#d66e98', // rose
    '#5aa9e6', // sky
    '#eee6d3'  // cream
  ];
  for (let i = palette.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }

  const touches = new Map(); // id -> { x, y, color, bornAt, phase }
  let paletteIndex = 0;
  let rafId = 0;
  let countdownIntervalId = 0;
  let countdownDeadline = 0;
  let isSelecting = false;
  let selectedId = null;
  let selectedColor = palette[0];
  let selectedPos = null;
  let selectStartAt = 0;
  let pointerDown = false;
  let destroyed = false;

  const firstPlayerTokenImage = new Image();
  firstPlayerTokenImage.decoding = 'async';
  firstPlayerTokenImage.src = 'assets/images/tokens/firstplayer.png';

  const BASE_RADIUS = 48;
  const PULSE_AMPLITUDE = 8;
  const SELECT_ANIM_MS = 950;
  const STAR_RADIUS = 42;

  const tryVibrate = pattern => {
    try {
      if (navigator && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
    } catch (_) {}
  };

  const resize = () => {
    if (destroyed) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${Math.floor(rect.width)}px`;
    canvas.style.height = `${Math.floor(rect.height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const maxRadiusToCover = (x, y) => {
    const rect = canvas.getBoundingClientRect();
    return Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    ) + 24;
  };

  const stopCountdown = () => {
    if (countdownIntervalId) window.clearInterval(countdownIntervalId);
    countdownIntervalId = 0;
    countdownDeadline = 0;
  };

  const updateCountdownDisplay = () => {
    if (!countdownDeadline || isSelecting) return;
    const msLeft = Math.max(0, countdownDeadline - Date.now());
    timer.textContent = String(Math.min(3, Math.max(0, Math.ceil(msLeft / 1000))));
  };

  const selectRandom = () => {
    if (isSelecting || touches.size === 0) return;
    stopCountdown();
    isSelecting = true;

    const ids = Array.from(touches.keys());
    selectedId = ids[Math.floor(Math.random() * ids.length)];
    const selected = touches.get(selectedId);
    selectedColor = selected?.color || palette[0];
    selectedPos = selected ? { x: selected.x, y: selected.y } : { x: 0, y: 0 };
    selectStartAt = performance.now();

    // Freeze input and the winning position before anyone lifts or slides a
    // finger. This is what makes the result remain visually unambiguous.
    canvas.style.pointerEvents = 'none';
    timer.textContent = '';
    timer.classList.add('selected');
    hint.textContent = t('assist.firstPlayer.selected');
    stage.classList.add('is-selected');
    tryVibrate([30, 45, 90]);
  };

  const startCountdown = () => {
    stopCountdown();
    if (touches.size === 0 || isSelecting) return;
    countdownDeadline = Date.now() + 3000;
    timer.classList.remove('selected');
    timer.textContent = '3';
    countdownIntervalId = window.setInterval(() => {
      if (destroyed) return;
      const msLeft = Math.max(0, countdownDeadline - Date.now());
      updateCountdownDisplay();
      if (msLeft <= 0) selectRandom();
    }, 50);
  };

  const getPosFromTouch = touch => {
    const rect = canvas.getBoundingClientRect();
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const addTouch = (id, x, y) => {
    if (touches.has(id)) {
      const t = touches.get(id);
      t.x = x;
      t.y = y;
      return;
    }
    const color = palette[paletteIndex % palette.length];
    paletteIndex += 1;
    touches.set(id, {
      id,
      x,
      y,
      color,
      bornAt: performance.now(),
      phase: Math.random() * Math.PI * 2
    });
    tryVibrate(12);
  };

  const onTouchStart = event => {
    event.preventDefault();
    if (isSelecting) return;
    for (const touch of Array.from(event.changedTouches || [])) {
      const { x, y } = getPosFromTouch(touch);
      addTouch(touch.identifier, x, y);
    }
    startCountdown();
  };

  const onTouchMove = event => {
    event.preventDefault();
    if (isSelecting) return;
    for (const touch of Array.from(event.changedTouches || [])) {
      const t = touches.get(touch.identifier);
      if (!t) continue;
      const { x, y } = getPosFromTouch(touch);
      t.x = x;
      t.y = y;
    }
  };

  const onTouchEnd = event => {
    event.preventDefault();
    if (isSelecting) return;
    for (const touch of Array.from(event.changedTouches || [])) touches.delete(touch.identifier);
    if (touches.size === 0) {
      stopCountdown();
      timer.textContent = '3';
      hint.textContent = t('assist.firstPlayer.instruction');
    } else {
      startCountdown();
    }
  };

  // Desktop/testing fallback. Touch pointers are ignored here because the
  // multi-touch Touch Events path above handles mobile devices separately.
  const onPointerDown = event => {
    if (event.pointerType === 'touch' || isSelecting) return;
    pointerDown = true;
    const rect = canvas.getBoundingClientRect();
    addTouch('mouse', event.clientX - rect.left, event.clientY - rect.top);
    startCountdown();
  };
  const onPointerMove = event => {
    if (event.pointerType === 'touch' || !pointerDown || isSelecting) return;
    const t = touches.get('mouse');
    if (!t) return;
    const rect = canvas.getBoundingClientRect();
    t.x = event.clientX - rect.left;
    t.y = event.clientY - rect.top;
  };
  const onPointerUp = event => {
    if (event.pointerType === 'touch' || isSelecting) return;
    pointerDown = false;
    touches.delete('mouse');
    stopCountdown();
    timer.textContent = '3';
  };

  const drawFirstPlayerToken = (x, y, radius, alpha = 1) => {
    if (radius <= 0) return;
    if (firstPlayerTokenImage.complete && firstPlayerTokenImage.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(36,18,6,.45)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(firstPlayerTokenImage, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(36,18,6,.55)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? radius : radius * 0.44;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#d9a928';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(4, radius * 0.11);
    ctx.strokeStyle = '#4c2b11';
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, radius * 0.035);
    ctx.strokeStyle = '#fff2bd';
    ctx.stroke();
    ctx.restore();
  };

  const renderFrame = now => {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050403';
    ctx.fillRect(0, 0, w, h);

    if (!isSelecting) {
      for (const t of touches.values()) {
        const age = (now - t.bornAt) / 1000;
        const pulse = Math.sin(age * 2.8 + t.phase) * PULSE_AMPLITUDE;
        const radius = BASE_RADIUS + pulse;

        const glow = ctx.createRadialGradient(t.x, t.y, radius * .2, t.x, t.y, radius * 1.45);
        glow.addColorStop(0, `${t.color}dd`);
        glow.addColorStop(1, `${t.color}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, radius * 1.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, Math.max(20, radius * .58), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,248,233,.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, Math.max(20, radius * .58) + 1, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (selectedPos) {
      const elapsed = now - selectStartAt;
      const progress = Math.min(1, elapsed / SELECT_ANIM_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      const fillRadius = BASE_RADIUS + eased * (maxRadiusToCover(selectedPos.x, selectedPos.y) - BASE_RADIUS);

      // The selected player's color grows outward from their finger until the
      // entire selector is filled, exactly identifying who was selected.
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(selectedPos.x, selectedPos.y, fillRadius, 0, Math.PI * 2);
      ctx.fill();

      // Keep a subtle target under the winning finger while the reveal grows.
      const markerRadius = BASE_RADIUS * .62;
      ctx.fillStyle = 'rgba(28,14,7,.82)';
      ctx.beginPath();
      ctx.arc(selectedPos.x, selectedPos.y, markerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,248,233,.68)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // The First Player token appears at the exact winning finger location.
      const starProgress = Math.max(0, Math.min(1, (progress - .28) / .48));
      const starEase = 1 - Math.pow(1 - starProgress, 3);
      drawFirstPlayerToken(selectedPos.x, selectedPos.y, STAR_RADIUS * starEase, starProgress);

      if (progress >= 1) {
        for (const id of Array.from(touches.keys())) if (id !== selectedId) touches.delete(id);
      }
    }

    rafId = window.requestAnimationFrame(renderFrame);
  };

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    stopCountdown();
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    touches.clear();
    canvas.style.pointerEvents = 'auto';
    stage.removeEventListener('touchstart', onTouchStart);
    stage.removeEventListener('touchmove', onTouchMove);
    stage.removeEventListener('touchend', onTouchEnd);
    stage.removeEventListener('touchcancel', onTouchEnd);
    stage.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('resize', resize);
  };
  firstPlayerAssistCleanup = cleanup;

  window.addEventListener('resize', resize);
  stage.addEventListener('touchstart', onTouchStart, { passive: false });
  stage.addEventListener('touchmove', onTouchMove, { passive: false });
  stage.addEventListener('touchend', onTouchEnd, { passive: false });
  stage.addEventListener('touchcancel', onTouchEnd, { passive: false });
  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  assistBody.querySelector('[data-first-player-reset]')?.addEventListener('click', () => renderFirstPlayerAssist());

  // The selector used to measure itself before showModal(), when its stage was
  // still 0x0. That left the first-open canvas effectively unusable until
  // Start Over rebuilt it while the dialog was already visible. Show first,
  // then size on the next paint so touch input works immediately.
  showAssistDialog();
  requestAnimationFrame(() => {
    resize();
    rafId = window.requestAnimationFrame(renderFrame);
  });
}
function renderSimpleAssist(kind) {
  const labels = {
    train: [t('assist.simple.train.title'), t('strings.use_this_for_train_movement_train_heists_and_train_encounter_reminders')],
    hunt: [t('assist.simple.hunt.title'), t('strings.use_this_for_hunt_markers_animal_draws_strength_checks_and_harvest_rewar')],
    fish: [t('assist.simple.fish.title'), t('strings.use_this_for_fish_draws_bait_lure_checks_and_fish_delivery_hooks')],
    forage: [t('strings.foraging_crafting_assist'), t('strings.use_this_for_resource_draws_craft_costs_and_delivery_story_hooks')]
  };
  const [title, text] = labels[kind] || [t('assist.simple.default.title'), t('strings.this_assist_can_be_expanded_later')];
  setAssistHeader(title, t('assist.moduleHelper'));
  assistBody.innerHTML = `${assistBackButton()}<div class="assist-panel"><p>${escapeHtml(text)}</p><p class="assist-hint">${t('strings.placeholder_ready_for_the_next_build_out')}</p></div>`;
  bindAssistBack();
  showAssistDialog();
}

function finalTallyContestants() {
  const contestants = (state.setup.playerColors || []).filter(Boolean);
  if (hasModule('wild_bunch_man_in_black')) contestants.push(MAN_IN_BLACK_ID);
  return contestants;
}

function finalTallyPlayerLabel(color) {
  if (color === MAN_IN_BLACK_ID) return t('strings.man_in_black');
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const character = player?.character?.trim();
  const name = player?.name?.trim();
  const colorLabel = localizedColorPlayer(color);
  if (character && name) return `${character} (${name})`;
  if (character) return character;
  if (name) return `${colorLabel} (${name})`;
  return colorLabel;
}

function finalTallyPlayerDisplay(color) {
  if (color === MAN_IN_BLACK_ID) return { eyebrow: '', title: t('strings.man_in_black') };
  const player = (state.setup.playerDetails || []).find(p => p.color === color);
  const character = player?.character?.trim();
  const name = player?.name?.trim();
  const colorLabel = localizedColorPlayer(color);
  return { eyebrow: name || '', title: character || colorLabel };
}



function finalScoringStepTitle(step) {
  return uiValue(`finalScoring.steps.${step.id}.title`, t('finalScoring.defaultTitle'));
}

function finalScoringStepSummary(step) {
  return uiValue(`finalScoring.steps.${step.id}.summary`, t('finalScoring.defaultSummary'));
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
  return `<section class="final-scoring-reference final-scoring-accordion" aria-label="${t('strings.final_scoring_reminders')}">
    <div class="final-scoring-accordion-heading">
      <strong>${t('strings.final_scoring')}</strong>
    </div>
    <div class="final-scoring-panels">${steps.map((step, index) => `<details class="final-scoring-item">
      <summary><span class="step-number final-scoring-step-number">${index + 1}</span><span class="final-scoring-item-copy"><strong>${escapeHtml(finalScoringStepTitle(step))}</strong><small>${escapeHtml(finalScoringStepSummary(step))}</small></span></summary>
      <div class="final-scoring-item-detail"><p>${escapeHtml(step.text)}</p></div>
    </details>`).join('')}</div>
  </section>`;
}

function finalTieBreakerReference() {
  const tiebreakers = (db.finalScoring?.tiebreakers || []).slice(1);
  if (!tiebreakers.length) return '';
  return `<details class="final-tiebreak-details">
    <summary>${t('strings.tie_breakers')}</summary>
    <ol>${tiebreakers.map(s => `<li>${escapeHtml(s.text)}</li>`).join('')}</ol>
  </details>`;
}

function renderFinalTally() {
  const colors = finalTallyContestants();
  app.innerHTML = `<div class="modal-screen-overlay end-game-overlay" data-modal-backdrop>
    <section class="panel modal-screen-card final-tally-card">
      <button type="button" class="dialog-close-x" data-final-close aria-label="${t('strings.back_to_game')}">&#10005;</button>
      <div class="modal-title-header">
        <p class="eyebrow">${t('strings.end_game')}</p>
        <h1 class="section-title">${t('strings.final_tally')}</h1>
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
            <input type="number" inputmode="numeric" class="final-tally-input" data-final-score="${color}" min="0" value="${state.finalScores?.[color] ?? ''}" placeholder="${t('strings.lp')}" aria-label="${escapeHtml(t('finalScoring.finalLpAria', { player: finalTallyPlayerLabel(color) }))}">
            <span class="final-winner-star hidden" data-winner-star="${color}" title="${t('strings.winner_2')}" aria-label="${t('strings.winner_2')}">★</span>
          </div>`;
        }).join('') || t('strings.no_players_were_assigned_colors_this_game')}
      </div>
      <div class="final-tie-panel hidden" id="finalTiePanel"></div>
      <p class="form-error hidden" id="finalTallyError" role="alert"></p>
      <div class="dialog-actions setup-final-actions final-tally-actions">
        <button class="secondary-btn" id="cancelTally">${t('strings.back')}</button>
        <button class="primary-btn" id="generateNewspaperBtn">${t('strings.newspaper')}</button>
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
      tiePanel.innerHTML = t('strings.man_in_black_tie_rule_man_in_black_wins_the_tie');
      tiePanel.classList.remove('hidden');
      return;
    }
    if (tied.length === 1) {
      tieSelection = '';
      resolvedWinnerColors = tied.slice();
      const winner = tied[0];
      app.querySelector(`[data-winner-star="${winner}"]`)?.classList.remove('hidden');
      app.querySelector(`[data-final-player="${winner}"]`)?.classList.add('winner-row');
      tiePanel.innerHTML = `<div class="auto-winner-note"><span class="sheriff-star" aria-hidden="true">★</span><span><small>${t('strings.highest_lp')}</small><strong>${escapeHtml(finalTallyPlayerLabel(winner))} ${t('strings.wins')}</strong></span></div>`;
      tiePanel.classList.remove('hidden');
      return;
    }

    const savedWinners = Array.isArray(state.finalWinnerColors) ? state.finalWinnerColors : (state.finalWinnerColor ? [state.finalWinnerColor] : []);
    const savedSingle = savedWinners.length === 1 && tied.includes(savedWinners[0]) ? savedWinners[0] : '';
    const savedShared = savedWinners.length > 1 && tied.every(color => savedWinners.includes(color));
    const selectedSingle = tieSelection && tieSelection !== 'shared' && tied.includes(tieSelection) ? tieSelection : savedSingle;
    const selectedShared = tieSelection === 'shared' || (!tieSelection && savedShared);
    tiePanel.innerHTML = `<div class="tie-heading"><span class="sheriff-star" aria-hidden="true">★</span><span><small>${t('strings.highest_lp_is_tied')}</small><strong>${t('strings.resolve_the_tie')}</strong></span></div>
      <p>${t('strings.use_the_normal_tie_breakers_then_choose_the_winner_if_the_tie_remains_ch')}</p>
      ${finalTieBreakerReference()}
      <div class="tie-choice-grid">
        ${tied.map(color => {
          const display = finalTallyPlayerDisplay(color);
          return `<label class="tie-choice"><input type="radio" name="finalTieWinner" value="${color}" ${selectedSingle === color ? 'checked' : ''}><span>${escapeHtml(display.title)}</span></label>`;
        }).join('')}
        <label class="tie-choice shared"><input type="radio" name="finalTieWinner" value="shared" ${selectedShared ? 'checked' : ''}><span>${t('strings.shared_victory')}</span></label>
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
      error.textContent = t('finalScoring.enterScores');
      error.classList.remove('hidden');
      return;
    }
    updateWinnerDisplay();
    if (!resolvedWinnerColors.length) {
      error.textContent = t('finalScoring.resolveTieBeforePaper');
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
    return new Intl.DateTimeFormat(uiValue('app.locale', undefined), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  } catch {
    return new Date().toLocaleDateString(uiValue('app.locale', undefined));
  }
}

function renderEndGame() {
  const article = generateNewspaperArticle();
  const paperTitle = db.newspaper?.title || t('strings.frontier_gazette');
  const paperEdition = db.newspaper?.edition || '';
  app.innerHTML = `<section class="panel newspaper-page"><div class="newsprint" id="newspaper">
    <header class="newspaper-masthead-wrap">
      <img class="newspaper-masthead" src="assets/images/newspaper/frontier-gazette-masthead.png" alt="${escapeHtml(t('newspaper.mastheadAlt', { title: paperTitle }))}">
    </header>
    <p class="newspaper-date">${escapeHtml(formatNewspaperDate())}</p>
    <p class="newspaper-edition">${escapeHtml(paperEdition)}</p>
    ${article}
  </div><div class="actions newspaper-actions">
    <button class="secondary-btn" id="backGame">${t('strings.back')}</button>
    <button class="primary-btn" onclick="window.print()">${t('strings.save')}</button>
    <button class="danger-btn" id="finishGame">${t('strings.finish_game')}</button>
  </div></section>`;
  document.getElementById('backGame').onclick = () => navigate('game');
  document.getElementById('finishGame').onclick = () => {
    if (!confirm(t('strings.finish_this_game_and_clear_its_saved_data_print_or_save_the_newspaper_fi'))) return;
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
  const tension = computeWorldTension();
  let key, label;
  if (tension.total < 3) { key = 'quiet'; label = t('newspaper.moodLabels.quiet'); }
  else if (tension.total >= 5 && tension.fights / tension.total >= 0.5) { key = 'bloodshed'; label = t('newspaper.moodLabels.bloodshed'); }
  else if (tension.net >= 3) { key = 'lawless'; label = t('newspaper.moodLabels.lawless'); }
  else if (tension.net <= -3) { key = 'orderly'; label = t('newspaper.moodLabels.orderly'); }
  else if (Math.abs(tension.net) <= 1 && tension.wanted + tension.marshal >= 4) { key = 'tense'; label = t('newspaper.moodLabels.tense'); }
  else { key = 'opportunity'; label = t('newspaper.moodLabels.opportunity'); }
  return { key, label, ...tension };
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

// Every mood gets its own headline options, lead paragraph, a short
// section-intro line that flavors the "Watched by the Frontier" roundup,
// and closing lines - so the whole article reads in one consistent voice
// instead of a mood-neutral template with a single tacked-on sentence.
// Which point type dominated (Gambling / Legendary / Story), layered on
// top of the mood as a second flavor sentence - independent of whether the
// week was lawless, orderly, or quiet.
function frontierFlavorSentence(tension) {
  const flavors = [
    [tension.totals.gambling, t('strings.the_gambling_halls_did_a_brisk_trade_and_more_than_one_fortune_changed_h')],
    [tension.totals.legendary, t('newspaper.flavors.legendary')],
    [tension.storyPoints, t('strings.story_after_story_unfolded_across_the_territory_each_one_adding_a_little')]
  ].filter(([val]) => val > 0).sort((a, b) => b[0] - a[0]);
  return flavors.length ? t('newspaper.flavorLead', { flavor: flavors[0][1] }) : '';
}

function newspaperGameSeed() {
  const logPart = (state.triggeredLog || []).slice().reverse().map(entry => `${entry.type}:${entry.id || ''}:${entry.color || ''}`).join('|');
  const scorePart = Object.entries(state.finalScores || {}).sort(([a], [b]) => a.localeCompare(b)).map(([color, score]) => `${color}:${score}`).join('|');
  const source = `${logPart}#${scorePart}#${state.setup?.players || 0}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function newspaperStablePick(list, salt = 0) {
  if (!Array.isArray(list) || !list.length) return '';
  return list[(newspaperGameSeed() + salt) % list.length];
}

function newspaperTextSalt(source = {}, salt = 0) {
  const key = String(source?.id || source?.title || source?.label || 'newspaper');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = ((hash * 31) + key.charCodeAt(i)) >>> 0;
  return hash + salt;
}

function newspaperAuthoredText(source, actor = '', salt = 0) {
  const choices = Array.isArray(source?.newspaperText)
    ? source.newspaperText.filter(value => typeof value === 'string' && value.trim())
    : [];
  if (!choices.length) return '';
  const picked = newspaperStablePick(choices, newspaperTextSalt(source, salt));
  const subject = actor || t('strings.a_passing_rider');
  const templated = picked
    .replace(/\{actor\}/g, subject)
    .replace(/\{actorPossessive\}/g, newspaperPossessive(subject));
  const personalized = newspaperPersonalizeNarration(templated, actor).trim();
  return /[.!?]$/.test(personalized) ? personalized : `${personalized}.`;
}


function newspaperJoin(items = [], conjunction = 'and') {
  const clean = items.filter(Boolean);
  if (!clean.length) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ${conjunction} ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, ${conjunction} ${clean[clean.length - 1]}`;
}

const NEWSPAPER_ACTIVITY_BUCKETS = [
  {
    key: 'fight',
    test: log => log.category === 'fight' || (log.tags || []).some(tag => ['fight', 'duel', 'bandit'].includes(tag))
  },
  {
    key: 'outlaw',
    test: log => log.category === 'outlaw' || triggerBalanceBucket(log) === 'wanted'
  },
  {
    key: 'law',
    test: log => log.category === 'law' || triggerBalanceBucket(log) === 'marshal'
  },
  {
    key: 'gambling',
    test: log => (log.tags || []).some(tag => ['poker', 'gambling', 'gambler', 'cabaret', 'revel', 'saloon'].includes(tag))
      || /poker|revel|faro/i.test(`${log.id || ''} ${log.label || ''}`)
  },
  {
    key: 'gold',
    test: log => (log.tags || []).some(tag => ['gold', 'prospect', 'mine'].includes(tag))
      || /prospect|gold/i.test(`${log.id || ''} ${log.label || ''}`)
  },
  {
    key: 'cattle',
    test: log => (log.tags || []).some(tag => ['cattle', 'ranch'].includes(tag))
  },
  {
    key: 'travel',
    test: log => (log.tags || []).some(tag => ['move', 'travel', 'rail', 'train', 'railroad'].includes(tag))
      || /move|travel|rail/i.test(`${log.id || ''} ${log.label || ''}`)
  },
  {
    key: 'wilderness',
    test: log => (log.tags || []).some(tag => ['hunt', 'hunting', 'forage', 'frontier', 'wildlife'].includes(tag))
      || /hunt|forag|outside town/i.test(`${log.id || ''} ${log.label || ''}`)
  },
  {
    key: 'commerce',
    test: log => (log.tags || []).some(tag => ['item', 'trader', 'work', 'craft', 'resource', 'deed', 'commerce'].includes(tag))
      || /buy|purchase|trader|work|craft|deed/i.test(`${log.id || ''} ${log.label || ''}`)
  }
];

function newspaperActivityBucket(log) {
  const bucket = NEWSPAPER_ACTIVITY_BUCKETS.find(candidate => candidate.test(log));
  const key = bucket?.key || 'other';
  return { ...(bucket || { key }), label: t(`newspaper.activity.${key}.label`), phrase: t(`newspaper.activity.${key}.phrase`) };
}

function newspaperActivityCounts(logs = []) {
  const counts = new Map();
  logs.forEach(log => {
    const bucket = newspaperActivityBucket(log);
    if (!counts.has(bucket.key)) counts.set(bucket.key, { ...bucket, count: 0 });
    counts.get(bucket.key).count += 1;
  });
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function newspaperPlayerLabel(color) {
  return color ? finalTallyPlayerLabel(color) : t('newspaper.unidentifiedRider');
}

function newspaperOneOffLogs() {
  const direct = (state.triggeredLog || []).filter(log => log.type === 'oneOffEvent').map(log => ({ ...log }));
  // Compatibility for games already in progress when v1.1.48 is installed:
  // older builds recorded many resolved One-Offs only as raw ids in
  // newspaperNotes. Resolve those ids back to their human-facing event title.
  const legacy = (state.newspaperNotes || []).map(note => {
    const event = (db.oneOffs || []).find(item => item.id === note.text);
    if (!event) return null;
    return { time: note.time || 0, type: 'oneOffEvent', id: event.id, label: event.title || event.id, color: null, trigger: event.trigger || null, tags: event.tags || [] };
  }).filter(Boolean);
  legacy.forEach(log => {
    const duplicate = direct.some(item => item.id === log.id && Math.abs((item.time || 0) - (log.time || 0)) < 5000);
    if (!duplicate) direct.push(log);
  });
  return direct.sort((a, b) => (a.time || 0) - (b.time || 0));
}

function newspaperWorldEventIds() {
  const ids = (state.triggeredLog || []).filter(log => log.type === 'worldEventStarted').map(log => log.id).filter(Boolean);
  (state.activeWorldEvents || []).forEach(event => {
    if (event?.id && !ids.includes(event.id)) ids.push(event.id);
  });
  return ids;
}

function newspaperStartedCharacterArcs() {
  return (db.arcs || []).filter(arc => {
    const progress = state.arcProgress?.[arc.id];
    const active = (state.activeStories || []).some(story => story.arcId === arc.id);
    return active || (progress && (progress.status !== 'inactive' || (progress.chapterHistory || []).length));
  });
}

function newspaperOverallSummary(primaryTriggers) {
  const counts = newspaperActivityCounts(primaryTriggers);
  const leaders = counts.slice(0, 2);
  const oneOffCount = newspaperOneOffLogs().length;
  const worldIds = newspaperWorldEventIds();
  const characterArcCount = newspaperStartedCharacterArcs().length;
  const parts = [];
  if (leaders.length) {
    const activities = leaders.map(item => item.phrase);
    parts.push(t('newspaper.overall.leaders', { activities: newspaperJoin(activities) }));
  }
  if (oneOffCount) parts.push(tp('newspaper.overall.oneOff', oneOffCount, { count: oneOffCount }));
  if (worldIds.length) parts.push(tp('newspaper.overall.world', worldIds.length, { count: worldIds.length }));
  if (characterArcCount) parts.push(tp('newspaper.overall.arcs', characterArcCount, { count: characterArcCount }));
  if (!parts.length) return t('strings.the_day_left_only_a_light_trail_in_the_companion_s_record_before_the_pre');
  const sentence = newspaperJoin(parts, 'while');
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

function newspaperLedgerSection(primaryTriggers) {
  const counts = newspaperActivityCounts(primaryTriggers).slice(0, 5);
  if (!counts.length) return '';
  return `<aside class="newspaper-ledger">
    <h3>${t('strings.gazette_ledger')}</h3>
    <p>${t('strings.recorded_action_reports')}</p>
    <ul>${counts.map(item => `<li><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></li>`).join('')}</ul>
  </aside>`;
}

function newspaperCleanNarration(script = '') {
  return String(script || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“”']+/, '')
    .replace(/["“”']+$/, '')
    .trim();
}

function newspaperFirstNarrationSentence(script = '') {
  const text = newspaperCleanNarration(script);
  if (!text) return '';
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match ? match[1] : text).trim();
}

function newspaperPossessive(label = '') {
  if (!label) return '';
  return /s$/i.test(label) ? `${label}’` : `${label}’s`;
}

function newspaperPersonalizeNarration(text = '', actor = '') {
  if (!text) return '';
  const namedActor = actor && actor !== t('newspaper.passingRider') && actor !== t('newspaper.territory') ? actor : '';
  const subject = namedActor || t('strings.the_rider');
  const possessive = namedActor ? newspaperPossessive(namedActor) : t('strings.the_rider_s');
  return String(text)
    .replace(/\byour\b/gi, possessive)
    .replace(/\byou\b/gi, subject);
}

function newspaperNarrativeSentence(script = '', actor = '') {
  let text = newspaperFirstNarrationSentence(script);
  if (!text) return '';
  text = newspaperPersonalizeNarration(text, actor).trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function newspaperOneOffEventForLog(log) {
  const base = (db.oneOffs || []).find(event => event.id === log?.id);
  if (!base) return null;
  // Re-resolve the module variant that would be active for this game so the
  // Gazette uses the same flavor text the player actually saw.
  return prepareEventForModules({ ...base });
}

function newspaperOneOffNarrative(log) {
  const event = newspaperOneOffEventForLog(log);
  if (!event) return '';
  const actor = log?.color ? newspaperPlayerLabel(log.color) : '';
  const authored = newspaperAuthoredText(event, actor);
  if (authored) return authored;
  const narration = newspaperNarrativeSentence(event.narrationScript, actor);
  if (narration) return narration;
  const bucket = newspaperActivityBucket({ ...log, tags: event.tags || log?.tags || [] });
  return t('newspaper.player.defaultIncident', { activity: bucket.phrase });
}

function newspaperPlayerRecapSection(primaryTriggers) {
  const configuredPlayers = (state.setup?.playerDetails || []).filter(player => player.color);
  if (!configuredPlayers.length) return '';
  const storyResolved = (state.triggeredLog || []).filter(log => log.type === 'storyResolved');
  const storyExpired = (state.triggeredLog || []).filter(log => log.type === 'storyExpired');
  const oneOffs = newspaperOneOffLogs();

  const paragraphs = configuredPlayers.map(player => {
    const color = player.color;
    const label = newspaperPlayerLabel(color);
    const logs = primaryTriggers.filter(log => log.color === color);
    if (!logs.length) return `<p><strong>${escapeHtml(label)}.</strong> ${t('strings.the_companion_recorded_a_quieter_trail_for_this_rider_with_no_dominant_l')}</p>`;
    const top = newspaperActivityCounts(logs).slice(0, 2);
    const activityText = top.length
      ? t('newspaper.player.activity', { activity: newspaperJoin(top.map(item => item.phrase)) })
      : t('strings.kept_a_varied_trail_across_the_territory');
    const resolvedCount = storyResolved.filter(log => log.color === color).length;
    const expiredCount = storyExpired.filter(log => log.color === color).length;
    const oneOffCount = oneOffs.filter(log => log.color === color).length;
    const extras = [];
    if (resolvedCount) extras.push(tp('newspaper.player.resolvedTales', resolvedCount, { count: resolvedCount }));
    if (expiredCount) extras.push(tp('newspaper.player.expired', expiredCount, { count: expiredCount }));
    if (oneOffCount) extras.push(tp('newspaper.player.oneOffs', oneOffCount, { count: oneOffCount }));
    const extraText = extras.length ? `${newspaperJoin(extras).charAt(0).toUpperCase()}${newspaperJoin(extras).slice(1)}.` : '';
    return `<p><strong>${escapeHtml(label)}.</strong> ${escapeHtml(activityText)} ${escapeHtml(extraText)}</p>`;
  });

  return `<article class="news-article newspaper-player-recap">
    <h2>${t('strings.riders_leave_their_mark')}</h2>
    ${paragraphs.join('')}
  </article>`;
}

function newspaperOneOffSection() {
  const logs = newspaperOneOffLogs();
  if (!logs.length) return '';
  const byColor = new Map();
  logs.forEach(log => {
    const key = log.color || '_unknown';
    if (!byColor.has(key)) byColor.set(key, []);
    byColor.get(key).push(log);
  });

  const paragraphs = [...byColor.entries()].map(([color, playerLogs]) => {
    const person = color === '_unknown' ? '' : newspaperPlayerLabel(color);
    const unique = [];
    const seen = new Set();
    playerLogs.forEach(log => {
      if (!log?.id || seen.has(log.id)) return;
      seen.add(log.id);
      unique.push(log);
    });
    const selected = unique.slice(0, 3);
    const intro = person
      ? t('newspaper.oneOff.personIntro', { person })
      : t('strings.other_reports_reached_the_gazette_from_across_the_territory');
    const details = selected.map(newspaperOneOffNarrative).filter(Boolean);
    const remaining = Math.max(0, unique.length - selected.length);
    const tail = remaining
      ? tp('newspaper.oneOff.remaining', remaining, { count: remaining })
      : '';
    return `<p>${escapeHtml([intro, ...details, tail].filter(Boolean).join(' '))}</p>`;
  }).join('');

  return `<article class="news-article">
    <h2>${t('strings.dispatches_from_the_range')}</h2>
    ${paragraphs}
  </article>`;
}

function worldEventNewsPhrase(event) {
  const tags = new Set(event?.tags || []);
  const title = event?.title || t('newspaper.unnamedEvent');
  let key = 'default';
  if (tags.has('weather')) key = 'weather';
  else if (tags.has('gold') || tags.has('prospect')) key = 'gold';
  else if (tags.has('sheriff') || tags.has('wanted')) key = 'sheriff';
  else if (tags.has('bandit') || tags.has('fight')) key = 'bandit';
  else if (tags.has('poker')) key = 'poker';
  else if (tags.has('cattle')) key = 'cattle';
  else if (tags.has('doctor')) key = 'doctor';
  else if (tags.has('rail') || tags.has('train') || tags.has('railroad') || tags.has('ante_up')) key = 'rail';
  else if (tags.has('mine')) key = 'mine';
  else if (tags.has('trader')) key = 'trader';
  else if (tags.has('saloon')) key = 'saloon';
  else if (tags.has('ranch')) key = 'ranch';
  else if (tags.has('hunt') || tags.has('hunting')) key = 'hunting';
  else if (tags.has('town') || tags.has('positive')) key = 'town';
  return t(`newspaper.worldPhrases.${key}`, { title });
}

function newspaperWorldEventSection() {
  const ids = newspaperWorldEventIds();
  if (!ids.length) return '';
  const events = ids.map(id => db.worldEvents.find(event => event.id === id)).filter(Boolean);
  if (!events.length) return '';
  const sentences = events.map((event, index) =>
    newspaperAuthoredText(event, t('strings.the_territory'), index * 17)
      || `${worldEventNewsPhrase(event)}.`
  );
  return `<article class="news-article">
    <h2>${t('strings.world_events_shape_the_territory')}</h2>
    <p>${escapeHtml(sentences.join(' '))}</p>
  </article>`;
}
function newspaperArcNarrationForPiece(node, actorColor, progress, referenceActorColor = null) {
  if (!node) return '';
  let variant = null;
  const aware = node.playerAwareText;
  if (aware) {
    const reference = referenceActorColor
      || (aware.compareToNodeId ? progress?.nodeActors?.[aware.compareToNodeId] : null)
      || null;
    if (actorColor && reference) {
      variant = actorColor === reference ? aware.samePlayer : aware.differentPlayer;
    }
    if (!variant) variant = aware.default || null;
  }
  return variant?.narrationScript || node.narrationScript || '';
}

function newspaperArcAuthoredTextForPiece(node, actorColor, progress, referenceActorColor = null, actor = '', salt = 0) {
  if (!node) return '';
  let variant = null;
  const aware = node.playerAwareText;
  if (aware) {
    const reference = referenceActorColor
      || (aware.compareToNodeId ? progress?.nodeActors?.[aware.compareToNodeId] : null)
      || null;
    if (actorColor && reference) {
      variant = actorColor === reference ? aware.samePlayer : aware.differentPlayer;
    }
  }
  const source = Array.isArray(variant?.newspaperText) && variant.newspaperText.length ? variant : node;
  return newspaperAuthoredText(source, actor, salt);
}


function newspaperArcOutcomeSentence(piece, actor, includeGlobal, index) {
  if (includeGlobal) {
    if (piece.kind === 'active') return t('strings.arc_global_active');
    if (piece.outcome === 'expired') return t('strings.arc_global_expired');
    return index === 0
      ? t('strings.arc_global_started')
      : t('strings.arc_global_progress');
  }

  if (piece.kind === 'active') return t('newspaper.arc.active', { actor });
  if (piece.outcome === 'expired') return t('newspaper.arc.expired', { actor });
  const resolvedPhrases = uiValue('newspaper.arc.resolved', []).map(template => String(template).replaceAll('{actor}', actor));
  return resolvedPhrases[index % resolvedPhrases.length];
}

function newspaperArcJourney(arc, includeGlobal = false) {
  const progress = state.arcProgress?.[arc.id] || null;
  const history = (progress?.chapterHistory || []).slice();
  const active = (state.activeStories || []).filter(story => story.arcId === arc.id);
  if (!history.length && !active.length) return '';

  const nodeList = includeGlobal ? (arc.chapters || []) : (arc.nodes || []);
  const pieces = history
    .map(entry => {
      const node = nodeList.find(item => item.id === entry.nodeId);
      if (!node) return null;
      return {
        kind: 'history',
        time: entry.completedAt || 0,
        node,
        outcome: entry.outcome,
        color: entry.color || null,
        referenceActorColor: node.playerAwareText?.compareToNodeId
          ? (progress?.nodeActors?.[node.playerAwareText.compareToNodeId] || null)
          : null
      };
    })
    .filter(Boolean)
    .concat(active.map(story => ({
      kind: 'active',
      time: story.createdAt || Date.now(),
      node: nodeList.find(item => item.id === story.id) || { id: story.id, title: story.title, screenText: story.screenText },
      color: story.assignedColor || null,
      referenceActorColor: story.referenceActorColor || null
    })))
    .sort((a, b) => a.time - b.time);

  const sentences = [];
  pieces.forEach((piece, index) => {
    const actor = piece.color ? newspaperPlayerLabel(piece.color) : (includeGlobal ? t('strings.the_territory') : t('strings.a_passing_rider'));
    const narration = newspaperArcNarrationForPiece(piece.node, piece.color, progress, piece.referenceActorColor);
    const scene = newspaperArcAuthoredTextForPiece(
      piece.node,
      piece.color,
      progress,
      piece.referenceActorColor,
      actor,
      index * 23
    ) || newspaperNarrativeSentence(narration, actor);
    if (scene) sentences.push(scene);
    else if (!includeGlobal) sentences.push(t('newspaper.arc.drawnIn', { actor }));
    else sentences.push(t('strings.arc_global_deeper'));
    sentences.push(newspaperArcOutcomeSentence(piece, actor, includeGlobal, index));
  });

  if (progress?.status === 'complete' && !active.length) sentences.push(t('strings.arc_complete'));
  else sentences.push(includeGlobal
    ? t('strings.arc_global_unfinished')
    : t('strings.arc_unwritten'));

  return sentences.join(' ');
}

function newspaperCharacterArcSection() {
  const arcs = newspaperStartedCharacterArcs();
  if (!arcs.length) return '';
  const articles = arcs.map(arc => `<article class="newspaper-story-card">
      <h3>${escapeHtml(arc.title)}</h3>
      <p>${escapeHtml(newspaperArcJourney(arc, false))}</p>
    </article>`).join('');
  return `<section class="newspaper-story-section">
    <h2>${t('strings.lives_and_legends')}</h2>
    <p class="newspaper-section-deck">${t('strings.the_gazette_followed_these_recurring_frontier_figures_as_their_fortunes_')}</p>
    <div class="newspaper-story-grid">${articles}</div>
  </section>`;
}

function newspaperGlobalStorylineSection() {
  const stories = (db.storylines || []).filter(story => {
    const progress = state.arcProgress?.[story.id];
    const active = (state.activeStories || []).some(item => item.arcId === story.id);
    return active || (progress && (progress.status !== 'inactive' || (progress.chapterHistory || []).length));
  });
  if (!stories.length) return '';
  const paragraphs = stories.map(story => `<p><strong>${escapeHtml(story.title)}.</strong> ${escapeHtml(newspaperArcJourney(story, true))}</p>`).join('');
  return `<article class="news-article">
    <h2>${t('strings.territory_wide_tales')}</h2>
    ${paragraphs}
  </article>`;
}

function finalScoreboardSection() {
  const scores = state.finalScores;
  if (!scores || !Object.keys(scores).length) return '';
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let winnerColors = Array.isArray(state.finalWinnerColors) ? state.finalWinnerColors.filter(color => color in scores) : [];
  if (!winnerColors.length && state.finalWinnerColor && state.finalWinnerColor in scores) winnerColors = [state.finalWinnerColor];
  if (!winnerColors.length) winnerColors = [ranked[0][0]];
  const winnerScore = scores[winnerColors[0]] ?? ranked[0][1];
  const rows = ranked.map(([color, score], index) => `<li class="${winnerColors.includes(color) ? 'winner' : ''}"><span>${index + 1}. ${escapeHtml(finalTallyPlayerLabel(color))}</span><strong>${score} ${t('strings.lp')}</strong></li>`).join('');
  const winnerText = winnerColors.length === 1
    ? t('newspaper.score.winner', { winner: finalTallyPlayerLabel(winnerColors[0]), score: winnerScore })
    : t('newspaper.score.shared', { winners: newspaperJoin(winnerColors.map(color => finalTallyPlayerLabel(color))), score: winnerScore });
  return `<aside class="newspaper-scorebox">
    <p class="newspaper-callout-kicker">${t('strings.final_standings')}</p>
    <h2>${t('strings.final_tally')}</h2>
    <p class="newspaper-winner">${escapeHtml(winnerText)}</p>
    <ol>${rows}</ol>
  </aside>`;
}

function generateFinalWord() {
  const mood = computeFrontierMood();
  const bank = newspaperMoodBank(mood.key);
  const sentences = [newspaperStablePick(bank.closings, 31)];
  const flavor = frontierFlavorSentence(mood);
  if (flavor) sentences.push(flavor);

  const primaryTriggers = (state.triggeredLog || []).filter(log => log.type === 'primaryTrigger');
  const leadingActivity = newspaperActivityCounts(primaryTriggers)[0];
  if (leadingActivity && leadingActivity.count >= 2) {
    sentences.push(t('newspaper.final.leading', { activity: leadingActivity.phrase }));
  }

  const worldCount = newspaperWorldEventIds().length;
  const arcCount = newspaperStartedCharacterArcs().length;
  const oneOffCount = newspaperOneOffLogs().length;
  const texture = [];
  if (worldCount) texture.push(tp('newspaper.final.worldCount', worldCount, { count: worldCount }));
  if (arcCount) texture.push(tp('newspaper.final.arcCount', arcCount, { count: arcCount }));
  if (oneOffCount) texture.push(tp('newspaper.final.oneOffCount', oneOffCount, { count: oneOffCount }));
  if (texture.length) sentences.push(t('newspaper.final.texture', { texture: newspaperJoin(texture) }));

  const scores = state.finalScores || {};
  const winnerColors = (state.finalWinnerColors || []).filter(color => color in scores);
  if (winnerColors.length === 1) {
    sentences.push(t('newspaper.final.soloWinner', { winner: finalTallyPlayerLabel(winnerColors[0]) }));
  } else if (winnerColors.length > 1) {
    sentences.push(t('newspaper.final.sharedWinner', { winners: newspaperJoin(winnerColors.map(color => finalTallyPlayerLabel(color))) }));
  }
  return sentences.join(' ');
}

function generateNewspaperArticle() {
  const mood = computeFrontierMood();
  const bank = newspaperMoodBank(mood.key);
  const primaryTriggers = (state.triggeredLog || []).filter(log => log.type === 'primaryTrigger');
  const humanPlayerNames = (state.setup.playerDetails || []).map((player, index) => player.name || player.character || t('setup.playerNumber', { number: index + 1 }));
  const playerNames = humanPlayerNames.concat(hasModule('wild_bunch_man_in_black') ? [t('strings.man_in_black')] : []);
  const headline = newspaperStablePick(bank.headlines, 7);
  const lead = newspaperStablePick(bank.leads, 13);
  const participants = playerNames.length ? newspaperJoin(playerNames) : t('newspaper.tableRiders');

  return `<article class="news-article newspaper-lead-story">
      <h2>${escapeHtml(headline)}</h2>
      <p class="newspaper-deck">${escapeHtml(lead)}</p>
      <p>${escapeHtml(tp('newspaper.lead.recorded', primaryTriggers.length, { participants, count: primaryTriggers.length, summary: newspaperOverallSummary(primaryTriggers) }))}</p>
    </article>
    ${finalScoreboardSection()}
    ${newspaperLedgerSection(primaryTriggers)}
    ${newspaperPlayerRecapSection(primaryTriggers)}
    ${newspaperWorldEventSection()}
    ${newspaperOneOffSection()}
    ${newspaperCharacterArcSection()}
    ${newspaperGlobalStorylineSection()}
    <article class="news-article newspaper-final-word">
      <h2>${t('strings.final_word')}</h2>
      <p>${escapeHtml(generateFinalWord())}</p>
    </article>
    <div class="newspaper-clear" aria-hidden="true"></div>`;
}

const APP_VERSION = '1.1.0-beta';
let swRegistration = null;
let appUpdateAvailable = false;
let deferredInstallPrompt = null;
let installHelpMessage = '';

function isPwaInstalled() {
  return window.matchMedia?.(t('strings.display_mode_standalone')).matches
    || window.navigator.standalone === true
    || document.referrer.startsWith('android-app://');
}

function installFallbackMessage() {
  const ua = navigator.userAgent || '';
  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (isIos) return t('install.ios');
  return t('install.browser');
}

async function requestPwaInstall() {
  installHelpMessage = '';
  if (isPwaInstalled()) {
    refreshVersionBlockStatus();
    return;
  }

  if (!deferredInstallPrompt) {
    installHelpMessage = installFallbackMessage();
    refreshVersionBlockStatus();
    return;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome !== 'accepted') {
      installHelpMessage = t('install.canceled');
    }
  } catch (err) {
    installHelpMessage = installFallbackMessage();
  }
  refreshVersionBlockStatus();
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installHelpMessage = '';
  refreshVersionBlockStatus();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installHelpMessage = '';
  refreshVersionBlockStatus();
});

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
  if (isPwaInstalled()) {
    document.getElementById('menuBtn')?.classList.add('has-update-dot');
    document.querySelector('[data-open-credits-support]')?.classList.add('has-update-dot');
  }
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
  if (!isPwaInstalled()) {
    const help = installHelpMessage
      ? `<p class="app-install-help">${escapeHtml(installHelpMessage)}</p>`
      : '';
    return `<button type="button" class="primary-btn app-update-btn" id="installAppBtn">${t('strings.install_app')}</button>${help}`;
  }
  return appUpdateAvailable
    ? t('strings.update_available_tap_to_update')
    : t('strings.check_for_updates');
}

function renderVersionBlock() {
  return `<div class="app-version-block">
    <span class="app-version-label">${t('strings.version')} ${escapeHtml(APP_VERSION)}</span>
    <div id="appUpdateStatus">${renderUpdateStatus()}</div>
  </div>`;
}
function wireVersionBlock() {
  document.getElementById('installAppBtn')?.addEventListener('click', requestPwaInstall);
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
  app.innerHTML = `<section class="panel"><h1>${t('strings.unable_to_start')}</h1><p>${err.message}</p><p>${t('strings.run_this_app_from_a_local_web_server_so_the_json_files_can_load')}</p></section>`;
});
