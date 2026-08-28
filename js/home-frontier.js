(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    window.WLHomeFrontier = api;
    api.install();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MOOD_ASSET_ROOT = 'assets/images/moods/';
  const RECENT_ACTION_LIMIT = 12;
  const MIN_SPECIFIC_SCORE = 1.55;
  const MIN_SPECIFIC_MATCHES = 2;
  const MIN_SPECIFIC_LEAD = 0.42;

  const PLAYER_CHIP_COLORS = {
    white:  { accent: '#858682', tint: 'rgba(255,255,255,.78)', bg: 'rgba(255,252,244,.90)', name: '#4f4032' },
    red:    { accent: '#b94333', tint: 'rgba(185,67,51,.15)', bg: '#b94333', name: '#ffffff' },
    yellow: { accent: '#b88107', tint: 'rgba(184,129,7,.20)', bg: '#b88107', name: '#ffffff' },
    blue:   { accent: '#376f94', tint: 'rgba(55,111,148,.16)', bg: '#376f94', name: '#ffffff' },
    purple: { accent: '#7a4f86', tint: 'rgba(122,79,134,.15)', bg: '#7a4f86', name: '#ffffff' },
    black:  { accent: '#3d3935', tint: 'rgba(61,57,53,.24)', bg: '#3d3935', name: '#ffffff' },
    none:   { accent: '#8c765e', tint: 'rgba(140,118,94,.09)', bg: 'rgba(238,228,210,.84)', name: '#6b533d' }
  };

  const CHARACTER_DEFS = [
    {
      key: 'poker', phraseKey: 'home.frontierPhrases.poker', image: 'mood-poker.png', label: 'Poker Dominates',
      terms: ['poker', 'faro', 'gambl', 'high stakes', 'high_stakes'],
      description: 'Poker tables are busy and fortunes are changing hands across the frontier.'
    },
    {
      key: 'revelry', phraseKey: 'home.frontierPhrases.revelry', image: 'mood-revelry.png', label: 'Saloons & Revelry',
      terms: ['revel', 'cabaret', 'theatre', 'saloon'],
      description: 'The saloons are lively as revelry and nightlife set the frontier\'s pace.'
    },
    {
      key: 'range', phraseKey: 'home.frontierPhrases.range', image: 'mood-range.png', label: 'Open Range',
      terms: ['cattle', 'ranch', 'wrangle', 'herd', 'longhorn'],
      description: 'Cattle and ranch activity are shaping life across the open range.'
    },
    {
      key: 'prospect', phraseKey: 'home.frontierPhrases.prospect', image: 'mood-prospect.png', label: 'Gold Rush',
      terms: ['prospect', 'mine', 'gold'],
      description: 'Prospectors are chasing strikes and gold fever is spreading across the frontier.'
    },
    {
      key: 'trade', phraseKey: 'home.frontierPhrases.trade', image: 'mood-trade.png', label: 'Trade & Commerce',
      terms: ['store', 'shop', 'buy', 'purchase', 'trade', 'trader', 'work', 'item', 'sell'],
      description: 'Goods, work, and trade are keeping the frontier economy moving.'
    },
    {
      key: 'railroad', phraseKey: 'home.frontierPhrases.railroad', image: 'mood-railroad.png', label: 'The Iron Road',
      terms: ['train', 'railroad', 'rail road'],
      description: 'Rail activity is on the rise as the iron road shapes events across the territory.'
    },
    {
      key: 'explore', phraseKey: 'home.frontierPhrases.explore', image: 'mood-explore.png', label: 'Exploration',
      terms: ['move', 'travel', 'mountain pass', 'mountain', 'explore', 'trail'],
      description: 'Long rides and new trails are carrying legends into every corner of the frontier.'
    },
    {
      key: 'posse', phraseKey: 'home.frontierPhrases.posse', image: 'mood-posse.png', label: 'Posse Up',
      terms: ['posse', 'gang', 'recruit'],
      description: 'Posses and gangs are gathering strength as alliances take shape.'
    },
    {
      key: 'intrigue', phraseKey: 'home.frontierPhrases.intrigue', image: 'mood-intrigue.png', label: 'Frontier Intrigue',
      terms: ['story', 'arc', 'claim', 'deed', 'rumor', 'rumour'],
      description: 'Deals, claims, and unfolding stories are tying the frontier together.'
    },
    {
      key: 'legendary', phraseKey: 'home.frontierPhrases.legendary', image: 'mood-legendary.png', label: 'Legendary Deeds',
      terms: ['legendary', 'legend token', 'legendary token', 'legendary item'],
      description: 'Bold deeds are becoming the stories the frontier will remember.'
    }
  ];

  const MOOD_FALLBACKS = {
    quiet: {
      image: 'mood-quiet.png', phraseKey: 'home.frontierPhrases.quiet', label: 'Quiet Frontier',
      description: 'A brief calm hangs over the frontier, but the next legend is never far away.'
    },
    lawless: {
      image: 'mood-outlaw.png', phraseKey: 'home.frontierPhrases.lawless', label: 'Lawless',
      description: 'Outlaws are gaining influence and danger is spreading across the territory.'
    },
    orderly: {
      image: 'mood-law.png', phraseKey: 'home.frontierPhrases.orderly', label: 'Law & Order',
      description: 'The law has the upper hand and the frontier is feeling its reach.'
    },
    tense: {
      image: 'mood-standoff.png', phraseKey: 'home.frontierPhrases.tense', label: 'Standoff',
      description: 'Law and outlaw forces are locked in a tense struggle for the frontier.'
    },
    opportunity: {
      image: 'mood-frontier.png', phraseKey: 'home.frontierPhrases.opportunity', label: 'Opportunity',
      description: 'The frontier is open for business, fortune, and the making of new legends.'
    }
  };

  function escapeDefault(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function activityText(entry) {
    const tags = Array.isArray(entry?.tags) ? entry.tags.join(' ') : '';
    return [entry?.id, entry?.label, entry?.category, tags]
      .filter(Boolean)
      .join(' ')
      .replaceAll('_', ' ')
      .toLowerCase();
  }

  function scoreCharacters(logs) {
    const recent = (Array.isArray(logs) ? logs : [])
      .filter(entry => !entry?.type || entry.type === 'primaryTrigger')
      .slice(0, RECENT_ACTION_LIMIT);

    const scores = CHARACTER_DEFS.map(def => ({ def, score: 0, matches: 0 }));
    recent.forEach((entry, index) => {
      const text = activityText(entry);
      const weight = Math.max(0.55, 1 - index * 0.045);
      scores.forEach(item => {
        if (item.def.terms.some(term => text.includes(term))) {
          item.score += weight;
          item.matches += 1;
        }
      });
    });
    return scores.sort((a, b) => b.score - a.score);
  }

  function selectCharacter(logs) {
    const scores = scoreCharacters(logs);
    const best = scores[0];
    const runnerUp = scores[1];
    if (!best || best.matches < MIN_SPECIFIC_MATCHES || best.score < MIN_SPECIFIC_SCORE) return null;
    if (runnerUp && runnerUp.score > 0 && best.score - runnerUp.score < MIN_SPECIFIC_LEAD) return null;
    return best.def;
  }

  function normalizeMoodKey(value) {
    if (typeof value === 'string' && value) return value;
    if (value && typeof value === 'object') return value.key || value.mood || value.id || 'quiet';
    return 'quiet';
  }

  function frontierSummaryFor(moodValue, logs) {
    const moodKey = normalizeMoodKey(moodValue);
    const fallback = MOOD_FALLBACKS[moodKey] || MOOD_FALLBACKS.opportunity;
    const character = selectCharacter(logs);
    return {
      moodKey,
      moodLabel: fallback.label,
      moodPhraseKey: fallback.phraseKey || '',
      characterKey: character?.key || null,
      characterLabel: character?.label || '',
      characterPhraseKey: character?.phraseKey || '',
      image: character?.image || fallback.image,
      imagePath: `${MOOD_ASSET_ROOT}${character?.image || fallback.image}`,
      description: character?.description || fallback.description
    };
  }

  function playerChipMarkup(player, index, ctx = {}) {
    const esc = ctx.escapeHtml || escapeDefault;
    const colors = ctx.playerColors || [];
    const color = colors.includes(player?.color) ? player.color : 'none';
    const characterName = ctx.characterDisplayName?.(player?.characterId) || '';
    const name = player?.name?.trim() || characterName || ctx.defaultPlayerLabel?.(index + 1) || `Player ${index + 1}`;
    const record = ctx.characterDataRecord?.(player?.characterId) || null;
    const source = record ? (ctx.characterThumbnailSource?.(record) || '') : '';
    const thumbStyle = record ? (ctx.characterThumbnailStyle?.(record) || '') : '';
    const title = characterName && characterName !== name ? `${name} — ${characterName}` : name;
    const hasAlert = !!ctx.alertColors?.has?.(color);
    const avatar = source
      ? `<span class="home-player-avatar" style="${esc(thumbStyle)}"><img src="${esc(source)}" alt="" aria-hidden="true"></span>`
      : `<span class="home-player-avatar home-player-avatar-fallback" aria-hidden="true"></span>`;

    const palette = PLAYER_CHIP_COLORS[color] || PLAYER_CHIP_COLORS.none;
    const chipStyle = `--home-player-accent:${palette.accent};--home-player-tint:${palette.tint};--home-player-bg:${palette.bg};--home-player-name:${palette.name || palette.accent};`;
    return `<span class="home-player-chip home-player-chip-${esc(color)}" style="${esc(chipStyle)}" title="${esc(title)}">${avatar}<span class="home-player-chip-name">${esc(name)}</span>${hasAlert ? '<span class="home-player-alert-badge" aria-hidden="true">!</span>' : ''}</span>`;
  }

  function factsMarkup(targetLP, storySummary, escaper = escapeDefault) {
    const esc = escaper || escapeDefault;
    return `<span class="home-fact home-lp-fact"><span class="home-fact-icon home-lp-star" aria-hidden="true">★</span><strong>${esc(targetLP)}</strong><span>LP</span></span><span class="home-fact-separator" aria-hidden="true"></span><span class="home-fact home-story-fact"><span class="home-fact-icon home-story-book" aria-hidden="true">▤</span><span>${esc(storySummary)}</span></span>`;
  }

  function eventTitle(event, fallback) {
    return event?.title || event?.arcTitle || event?.label || fallback;
  }

  function ongoingEventsMarkup(worldEvents, stories, ctx = {}) {
    const world = Array.isArray(worldEvents) ? worldEvents : [];
    const arcs = Array.isArray(stories) ? stories : [];
    if (!world.length && !arcs.length) return '';
    const esc = ctx.escapeHtml || escapeDefault;
    const labels = {
      ongoing: ctx.labels?.ongoing || 'Ongoing Events',
      world: ctx.labels?.world || 'World Effect',
      arc: ctx.labels?.arc || 'Character Arc'
    };
    const rows = [
      ...world.map(event => `<div class="home-ongoing-item home-ongoing-world"><span class="home-ongoing-type">${esc(labels.world)}</span><span class="home-ongoing-title">${esc(eventTitle(event, labels.world))}</span></div>`),
      ...arcs.map(event => `<div class="home-ongoing-item home-ongoing-arc"><span class="home-ongoing-type">${esc(labels.arc)}</span><span class="home-ongoing-title">${esc(eventTitle(event, labels.arc))}</span></div>`)
    ].join('');
    return `<section class="home-ongoing-section" aria-label="${esc(labels.ongoing)}"><div class="home-subsection-title"><span></span><strong>${esc(labels.ongoing)}</strong><span></span></div><div class="home-ongoing-list">${rows}</div></section>`;
  }

  function frontierSummaryMarkup(summary, escaper = escapeDefault, translator = safeTranslate) {
    const esc = escaper || escapeDefault;
    const translate = typeof translator === 'function' ? translator : safeTranslate;
    const moodHeading = translate(summary.moodPhraseKey || '', summary.moodLabel || '');
    const characterHeading = summary.characterLabel
      ? translate(summary.characterPhraseKey || '', summary.characterLabel)
      : '';
    const heading = characterHeading
      ? `${esc(moodHeading)} <span class="home-frontier-dot" aria-hidden="true">•</span> ${esc(characterHeading)}`
      : esc(moodHeading);
    const imagePath = esc(summary.imagePath || `${MOOD_ASSET_ROOT}mood-frontier.png`);
    return `<section class="home-frontier-summary" data-frontier-summary aria-label="Current frontier"><img class="home-frontier-art" src="${imagePath}" alt="" aria-hidden="true"><div class="home-frontier-copy"><div class="home-frontier-heading">${heading}</div><p>${esc(summary.description)}</p></div><span class="home-frontier-chevron" aria-hidden="true">›</span></section>`;
  }

  function safeTranslate(key, fallback) {
    try {
      if (typeof t === 'function') {
        const value = t(key);
        if (value && value !== key) return value;
      }
    } catch (_) {}
    return fallback;
  }

  function currentStorySummary() {
    try {
      normalizeStoryEventSettings();
      const enabled = ['oneOff', 'arcs', 'world'].filter(key => storyEventsEnabled(key));
      if (enabled.length === 3 && enabled.every(key => storyEventFrequency(key) === 'standard')) return t('home.standardStories');
      if (enabled.length === 0) return t('home.storiesOff');
      return t('home.customStories');
    } catch (_) {
      return 'Standard Stories';
    }
  }

  function enhanceActiveHome() {
    if (typeof state === 'undefined' || !state?.gameStarted || typeof document === 'undefined') return;
    const card = document.querySelector('.home-status-card');
    if (!card) return;

    const players = Array.isArray(state.setup?.playerDetails) ? state.setup.playerDetails : [];
    const esc = typeof escapeHtml === 'function' ? escapeHtml : escapeDefault;
    let alerts = new Set();
    try { alerts = typeof activePlayerStoryAlertColors === 'function' ? activePlayerStoryAlertColors() : new Set(); } catch (_) {}

    const chips = card.querySelector('.home-player-chips');
    if (chips) {
      chips.innerHTML = players.map((player, index) => playerChipMarkup(player, index, {
        escapeHtml: esc,
        playerColors: typeof PLAYER_COLORS !== 'undefined' ? PLAYER_COLORS : [],
        characterDisplayName: typeof characterDisplayName === 'function' ? characterDisplayName : () => '',
        characterDataRecord: typeof characterDataRecord === 'function' ? characterDataRecord : () => null,
        characterThumbnailSource: typeof characterThumbnailSource === 'function' ? characterThumbnailSource : () => '',
        characterThumbnailStyle: typeof characterThumbnailStyle === 'function' ? characterThumbnailStyle : () => '',
        alertColors: alerts,
        defaultPlayerLabel: number => safeTranslate('setup.playerNumber', `Player ${number}`).replace('{number}', number)
      })).join('');
    }

    // The home card is intentionally a brief at-a-glance resume panel. LP/story
    // settings and ongoing-event details live elsewhere in the app and make this
    // summary unnecessarily tall, so remove the original renderHome rows here.
    const facts = card.querySelector('.home-game-facts');
    if (facts) facts.remove();
    const oldContext = card.querySelector('.home-context-line');
    if (oldContext) oldContext.remove();
    card.querySelector('.home-ongoing-section')?.remove();
    card.querySelector('.home-frontier-summary')?.remove();

    let moodValue = 'quiet';
    try { if (typeof computeFrontierMood === 'function') moodValue = computeFrontierMood(); } catch (_) {}
    const summary = frontierSummaryFor(moodValue, state.triggeredLog || []);
    const resume = card.querySelector('#resumeBtn');
    if (resume) resume.insertAdjacentHTML('beforebegin', frontierSummaryMarkup(summary, esc));
  }

  function install() {
    if (typeof window === 'undefined') return;
    if (typeof renderHome !== 'function') return;
    if (window.__wlHomeFrontierInstalled) return;
    window.__wlHomeFrontierInstalled = true;
    const originalRenderHome = renderHome;
    renderHome = function () {
      const result = originalRenderHome.apply(this, arguments);
      try { enhanceActiveHome(); } catch (err) { console.warn('[Home Frontier] Enhancement skipped:', err); }
      return result;
    };

    // If app.js completed an initial synchronous home render before this
    // deferred extension executed, enhance that already-rendered card too.
    const enhanceExistingHome = () => {
      try { enhanceActiveHome(); } catch (err) { console.warn('[Home Frontier] Initial enhancement skipped:', err); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceExistingHome, { once: true });
    else setTimeout(enhanceExistingHome, 0);
  }

  return {
    CHARACTER_DEFS,
    MOOD_FALLBACKS,
    activityText,
    scoreCharacters,
    selectCharacter,
    frontierSummaryFor,
    playerChipMarkup,
    factsMarkup,
    ongoingEventsMarkup,
    frontierSummaryMarkup,
    enhanceActiveHome,
    install
  };
});
