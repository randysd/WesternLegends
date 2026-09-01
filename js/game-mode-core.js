(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WLGameModeCore = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function clone(value) {
    if (value === undefined) return undefined;
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function modeById(data, id) {
    return (data?.modes || []).find(mode => mode?.id === id) || null;
  }

  function isNamedMode(mode) {
    return !!mode && mode.id !== 'standard';
  }

  function normalizeSetupGameMode(setup, data) {
    if (!setup || typeof setup !== 'object') return setup;
    if (!Object.prototype.hasOwnProperty.call(setup, 'gameModeId')) {
      setup.gameModeId = 'standard';
      setup.gameModeVersion = Number(modeById(data, 'standard')?.version || 1);
    } else if (!Number.isFinite(Number(setup.gameModeVersion))) {
      const found = modeById(data, setup.gameModeId);
      if (found) setup.gameModeVersion = Number(found.version || 1);
    }
    if (!Array.isArray(setup.gameModeContent)) setup.gameModeContent = [];
    if (!Array.isArray(setup.gameModeSetupProgress)) setup.gameModeSetupProgress = [];
    return setup;
  }

  function canonicalModuleId(id, aliases = {}) {
    return aliases?.[id] || id;
  }

  function moduleGroupForId(id, modules = [], aliases = {}) {
    const canonical = canonicalModuleId(id, aliases);
    const direct = modules.find(group => group.id === canonical);
    if (direct) return direct;
    return modules.find(group => (group.modules || []).some(child => child.id === canonical)) || null;
  }

  function packageForModuleId(id, context = {}) {
    const canonical = canonicalModuleId(id, context.aliases || {});
    const direct = (context.modules || []).find(group => group.id === canonical);
    if (direct) return direct.id;
    const parent = (context.modules || []).find(group => (group.modules || []).some(child => child.id === canonical));
    if (!parent) return canonical;
    // Non-selectable category groups contain independently owned pieces such as
    // the Carbine promo, Big Box, and Dark Knight. Preserve the child ID as the
    // ownership package instead of collapsing it into "promos"/"variants".
    if (parent.selectable === false || parent.id === 'promos' || parent.id === 'variants') return canonical;
    return parent.id;
  }

  function requiredPackages(mode) {
    return Array.isArray(mode?.content?.requiredPackages) ? mode.content.requiredPackages.slice() : [];
  }

  function relevantPackages(mode) {
    if (!isNamedMode(mode)) return [];
    return [...new Set([...(mode.content?.requiredPackages || []), ...(mode.content?.optionalPackages || [])])];
  }

  function ownedPackageSet(setup) {
    return new Set(Array.isArray(setup?.gameModeContent) ? setup.gameModeContent : []);
  }

  function recordRequiredPackages(record, context = {}) {
    if (!record) return ['base'];
    if (record.sourceModule) return [packageForModuleId(record.sourceModule, context)];
    const required = Array.isArray(record.requiredModules) ? record.requiredModules : [];
    return required.length ? [...new Set(required.map(id => packageForModuleId(id, context)))] : ['base'];
  }

  function recordIsOwned(record, ownedPackages, context = {}) {
    const owned = ownedPackages instanceof Set ? ownedPackages : new Set(ownedPackages || []);
    return recordRequiredPackages(record, context).every(pkg => pkg === 'base' || owned.has(pkg));
  }

  function allowedCharacterIds(mode, context = {}) {
    if (!isNamedMode(mode)) return (context.standardCharacterIds || []).slice();
    const records = Array.isArray(context.characters) ? context.characters : [];
    const byId = new Map(records.map(record => [record.id, record]));
    const owned = context.ownedPackages instanceof Set ? context.ownedPackages : new Set(context.ownedPackages || []);
    const policy = mode.setupConstraints?.characters || {};
    let ids;
    if (Array.isArray(policy.include)) ids = policy.include.slice();
    else {
      const excluded = new Set(policy.exclude || []);
      ids = records.map(record => record.id).filter(id => id && !excluded.has(id));
    }
    return [...new Set(ids)].filter(id => {
      const record = byId.get(id);
      return !!record && recordIsOwned(record, owned, context);
    });
  }

  function filterOwnedItemIds(ids, records, ownedPackages, context = {}) {
    const byId = new Map((records || []).map(record => [record.id, record]));
    return (ids || []).filter(id => {
      const record = byId.get(id);
      return !!record && recordIsOwned(record, ownedPackages, context);
    });
  }

  function allowedLegendaryItemIds(mode, context = {}) {
    if (!isNamedMode(mode)) return [];
    const policy = mode.setupConstraints?.legendaryItems || {};
    const records = context.legendaryItems || [];
    const owned = context.ownedPackages instanceof Set ? context.ownedPackages : new Set(context.ownedPackages || []);
    if (Array.isArray(policy.include)) return filterOwnedItemIds(policy.include, records, owned, context);
    const excluded = new Set(policy.exclude || []);
    return records.filter(record => record?.id && !excluded.has(record.id) && recordIsOwned(record, owned, context)).map(record => record.id);
  }

  function validateRequiredContent(mode, ownedPackages) {
    if (!isNamedMode(mode)) return [];
    const owned = ownedPackages instanceof Set ? ownedPackages : new Set(ownedPackages || []);
    return requiredPackages(mode).filter(pkg => !owned.has(pkg));
  }

  function requiredModules(mode) {
    return Array.isArray(mode?.setupConstraints?.modules?.required) ? mode.setupConstraints.modules.required.slice() : [];
  }

  function isModuleLocked(mode, moduleId) {
    if (!isNamedMode(mode)) return false;
    return requiredModules(mode).includes(moduleId)
      || (mode.setupConstraints?.modules?.disabled || []).includes(moduleId);
  }

  function derivedModulesForMode(mode, ownedPackages, context = {}) {
    if (!isNamedMode(mode)) return null;
    const owned = ownedPackages instanceof Set ? ownedPackages : new Set(ownedPackages || []);
    const out = new Set(['base', 'base_core']);
    relevantPackages(mode).forEach(pkg => { if (owned.has(pkg)) out.add(pkg); });

    const addModule = moduleId => {
      if (!moduleId) return;
      const packageId = packageForModuleId(moduleId, context);
      if (packageId !== 'base' && !owned.has(packageId)) return;
      out.add(moduleId);
      const parent = moduleGroupForId(moduleId, context.modules || [], context.aliases || {});
      if (parent && parent.id !== moduleId && parent.selectable !== false) out.add(parent.id);
    };
    requiredModules(mode).forEach(addModule);
    Object.entries(mode.setupConstraints?.modules?.ownershipModules || {}).forEach(([pkg, moduleIds]) => {
      if (!owned.has(pkg)) return;
      (moduleIds || []).forEach(addModule);
    });
    return [...out];
  }

  function switchMode(setup, nextMode, context = {}) {
    const next = clone(setup || {});
    const players = Array.isArray(next.playerDetails) ? next.playerDetails.map(player => ({ ...player })) : [];
    next.gameModeId = nextMode?.id || 'standard';
    next.gameModeVersion = Number(nextMode?.version || 1);
    next.gameModeSetupProgress = [];
    next.setupProgress = [];
    next.setupGuideSection = 0;
    next.setupVisualStepId = '';

    if (!isNamedMode(nextMode)) {
      next.gameModeContent = [];
      next.playerDetails = players;
      return next;
    }

    const relevant = new Set(relevantPackages(nextMode));
    const requestedOwned = context.ownedPackages instanceof Set ? context.ownedPackages : new Set(context.ownedPackages || []);
    next.gameModeContent = [...requestedOwned].filter(pkg => relevant.has(pkg));
    next.targetLP = Number(nextMode.recommended?.defaultTargetLP || 20);
    const owned = new Set(next.gameModeContent);
    next.modules = derivedModulesForMode(nextMode, owned, context) || next.modules || ['base', 'base_core'];
    next.activeModules = Object.fromEntries((next.modules || []).map(id => [id, true]));
    const allowed = new Set(allowedCharacterIds(nextMode, { ...context, ownedPackages: owned }));
    next.playerDetails = players.map(player => ({ ...player, characterId: player.characterId && allowed.has(player.characterId) ? player.characterId : '' }));
    return next;
  }

  function packageContributions(mode, packageId, context = {}) {
    if (!isNamedMode(mode)) return { characters: [], items: [], legendaryItems: [], modules: [] };
    const charPolicy = mode.setupConstraints?.characters || {};
    const charAllowed = Array.isArray(charPolicy.include)
      ? new Set(charPolicy.include)
      : new Set((context.characters || []).map(record => record.id).filter(id => !(charPolicy.exclude || []).includes(id)));
    const characters = (context.characters || []).filter(record => charAllowed.has(record.id) && packageForModuleId(record.sourceModule || 'base', context) === packageId).map(record => record.name || record.id);
    const storeIds = new Set();
    Object.values(mode.setupConstraints?.stores || {}).forEach(ids => { if (Array.isArray(ids)) ids.forEach(id => storeIds.add(id)); });
    const items = (context.items || []).filter(record => storeIds.has(record.id) && recordRequiredPackages(record, context).includes(packageId)).map(record => record.name || record.id);
    const legendaryAllowed = new Set(allowedLegendaryItemIds(mode, { ...context, ownedPackages: new Set(relevantPackages(mode)) }));
    const legendaryItems = (context.legendaryItems || []).filter(record => legendaryAllowed.has(record.id) && recordRequiredPackages(record, context).includes(packageId)).map(record => record.name || record.id);
    const modules = (mode.setupConstraints?.modules?.ownershipModules?.[packageId] || []).slice();
    return { characters, items, legendaryItems, modules };
  }

  function displayLabelById(records, id) {
    return (records || []).find(record => record.id === id)?.name || id;
  }

  function pokerLabelById(cards, id) {
    return (cards || []).find(card => card.id === id)?.label || id;
  }

  function itemCardVisualById(records, id) {
    const label = displayLabelById(records, id);
    const filename = String(id || '').replace(/_/g, '');
    return { src: `assets/images/cards/item-${filename}.png`, alt: label, caption: label };
  }

  function composeSetupSections(mode, context = {}) {
    if (!isNamedMode(mode)) return [];
    const owned = context.ownedPackages instanceof Set ? context.ownedPackages : new Set(context.ownedPackages || []);
    const sections = clone(mode.setupInstructions || []);
    const addSection = (id, title, summary, steps) => {
      const clean = (steps || []).filter(Boolean);
      if (clean.length) sections.push({ id, title, summary, steps: clean });
    };

    addSection('special_rules', 'Special Rules', 'Read the rules that change this Game Mode.', (mode.playRules || []).map(rule => ({ text: `${rule.title}: ${rule.text}` })));

    const story = mode.setupConstraints?.storyCards;
    if (story) {
      const triggers = (story.triggerLabels || []).join(' OR ');
      addSection('story_system', 'Story System', 'Prepare the physical Story Card deck.', [{ text: `Use the Core Story Card variant${triggers ? `, using only Story Cards with these trigger(s): ${triggers}.` : '.'}` }]);
    }

    addSection('characters', 'Characters', 'Assign a legal character to every player.', [{ text: 'Choose a character for every player from the eligible Game Mode character pool.', autoComplete: 'all_players_have_characters' }]);

    const stores = mode.setupConstraints?.stores;
    if (stores) {
      const storeLabels = { general: 'General Store', tradingPost: 'Trading Post', travelingTrader: 'Traveling Trader', generalTradingCombined: 'General Store + Trading Post' };
      const steps = [];
      Object.entries(stores).forEach(([key, ids]) => {
        const label = storeLabels[key] || key;
        if (ids === null) {
          steps.push({ text: `${label} is not used in this Game Mode.` });
          return;
        }
        const filtered = filterOwnedItemIds(ids, context.items || [], owned, context);
        steps.push({ text: `Set up the ${label} with the listed available items.`, summary: `${filtered.length} item${filtered.length === 1 ? '' : 's'}`, substeps: filtered.map(id => ({ text: displayLabelById(context.items, id), images: [itemCardVisualById(context.items, id)] })) });
      });
      addSection('stores', 'Stores', 'Build the mode-specific store inventory.', steps);
    }

    const legendary = mode.setupConstraints?.legendaryItems;
    if (legendary) {
      const allowed = allowedLegendaryItemIds(mode, { ...context, ownedPackages: owned });
      const steps = [];
      if (legendary.purchaseAllowed === false) steps.push({ text: 'Legendary Items cannot be purchased and must be obtained through game effects.' });
      steps.push({ text: legendary.allOwnedExcept ? 'Build the Legendary Item deck from all available owned Legendary Items except the excluded cards.' : 'Build the Legendary Item deck with the listed available cards.', summary: `${allowed.length} card${allowed.length === 1 ? '' : 's'}`, substeps: allowed.map(id => ({ text: displayLabelById(context.legendaryItems, id) })) });
      addSection('legendary_items', 'Legendary Item Deck', 'Prepare the Legendary Item deck.', steps);
    }

    if (mode.setupConstraints?.events?.instruction) addSection('events', 'Events', 'Modify the physical Event deck.', [{ text: mode.setupConstraints.events.instruction }]);

    const poker = mode.setupConstraints?.pokerDeck;
    if (poker) {
      const steps = [{ text: 'Create the Base Blood Money Poker deck by swapping in all alternate Poker cards from the Western Legends expansions.' }];
      if (owned.has('fistful_of_extras')) steps.push({ text: 'Use the Jokers from Fistful of Extras.' });
      if ((poker.remove || []).length) steps.push({ text: 'Remove these Poker cards:', substeps: poker.remove.map(id => ({ text: pokerLabelById(context.pokerCards, id) })) });
      if ((poker.add || []).length) steps.push({ text: 'Add these Poker cards:', substeps: poker.add.map(id => ({ text: pokerLabelById(context.pokerCards, id) })) });
      addSection('poker_deck', 'Poker Deck', 'Apply this Game Mode’s Poker-card substitutions.', steps);
    }

    const deckSteps = [];
    if (mode.setupConstraints?.deeds === false) deckSteps.push({ text: 'Deed cards are not used in this Game Mode.' });
    if (mode.setupConstraints?.deeds === true) deckSteps.push({ text: 'Use the Deed cards.' });
    if (mode.setupConstraints?.injuries === false) deckSteps.push({ text: 'Injury cards are not used in this Game Mode.' });
    if (mode.setupConstraints?.injuries === true) deckSteps.push({ text: 'Use the Injury deck.' });
    if (mode.setupConstraints?.goals === true) deckSteps.push({ text: 'Use the Goal Cards variant.' });
    addSection('decks_variants', 'Decks & Variants', 'Confirm the remaining mode-specific components.', deckSteps);

    if (mode.setupConstraints?.twoPlayer?.instruction) addSection('two_player', '2-Player Setup', 'Use this section only when playing with two players.', [{ text: mode.setupConstraints.twoPlayer.instruction, maxPlayers: 2 }]);
    return sections;
  }

  return {
    clone,
    modeById,
    isNamedMode,
    normalizeSetupGameMode,
    canonicalModuleId,
    packageForModuleId,
    requiredPackages,
    relevantPackages,
    ownedPackageSet,
    recordRequiredPackages,
    recordIsOwned,
    allowedCharacterIds,
    filterOwnedItemIds,
    allowedLegendaryItemIds,
    validateRequiredContent,
    requiredModules,
    isModuleLocked,
    derivedModulesForMode,
    switchMode,
    packageContributions,
    composeSetupSections
  };
});
