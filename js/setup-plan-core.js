(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WLSetupPlanCore = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function clone(value) {
    if (value === undefined) return undefined;
    return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function slug(value, fallback = 'step') {
    const clean = String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 56);
    return clean || fallback;
  }

  function normalizeStepIds(steps, prefix = '') {
    const seen = new Map();
    return (steps || []).map((rawStep, index) => {
      const step = clone(rawStep || {});
      const base = slug(step.id || step.text || step.title || step.summary || `step_${index + 1}`);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      step.id = step.id ? slug(step.id) : `${prefix}${base}${count > 1 ? `_${count}` : ''}`;
      if (Array.isArray(step.substeps)) step.substeps = normalizeStepIds(step.substeps, `${step.id}.`);
      return step;
    });
  }

  function normalizeSections(sections) {
    const seen = new Map();
    return (sections || []).map((rawSection, index) => {
      const section = clone(rawSection || {});
      const base = slug(section.id || section.title || `section_${index + 1}`, `section_${index + 1}`);
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      section.id = count > 1 ? `${base}_${count}` : base;
      section.steps = normalizeStepIds(section.steps || []);
      return section;
    });
  }

  function stepVisible(step, predicate) {
    return typeof predicate === 'function' ? predicate(step) !== false : true;
  }

  function filterVisibleStep(step, predicate) {
    if (!stepVisible(step, predicate)) return null;
    const next = clone(step);
    if (Array.isArray(next.substeps)) {
      next.substeps = next.substeps.map(child => filterVisibleStep(child, predicate)).filter(Boolean);
    }
    return next;
  }

  function filterVisibleSections(sections, predicate) {
    return (sections || []).map(section => ({
      ...clone(section),
      steps: (section.steps || []).map(step => filterVisibleStep(step, predicate)).filter(Boolean)
    })).filter(section => section.steps.length);
  }

  function removeBaseConflicts(baseSections, mode) {
    if (!mode || mode.id === 'standard') return clone(baseSections || []);
    const constraints = mode.setupConstraints || {};
    const out = clone(baseSections || []);

    // Mode store inventories are exact and replace the generic/manual store flow.
    if (constraints.stores) {
      const idx = out.findIndex(section => section.id === 'stores');
      if (idx >= 0) out.splice(idx, 1);
    }

    const decks = out.find(section => section.id === 'decks');
    if (decks) {
      decks.steps = (decks.steps || []).filter(step => {
        const text = String(step.text || '');
        if (constraints.pokerDeck && /Prepare the Poker deck/i.test(text)) return false;
        if (constraints.storyCards && /Core Story Cards|Legendary Story Cards/i.test(text)) return false;
        if (constraints.events && /Add the Unique Event cards/i.test(text)) return false;
        return true;
      });
    }

    if (constraints.deeds === false) {
      const tokens = out.find(section => section.id === 'tokens');
      if (tokens) tokens.steps = (tokens.steps || []).filter(step => !/Deed/i.test(String(step.text || '')));
    }

    if (constraints.startingLocations?.mode && constraints.startingLocations.mode !== 'character_card') {
      const miniatures = out.find(section => section.id === 'miniatures');
      if (miniatures) miniatures.steps = (miniatures.steps || []).filter(step => !/places? their miniature at the Starting Location on their character card/i.test(String(step.text || '')));
    }

    // A typed alternate board composition owns placement of the Ante Up board pieces.
    // Keep the main-board setup, but suppress the normal side-board arrangement so the
    // mode-specific board_setup section can place/reveal those boards in the right layout.
    if (constraints.boardComposition && constraints.boardComposition !== 'standard') {
      const playArea = out.find(section => section.id === 'play_area');
      if (playArea) playArea.steps = (playArea.steps || []).filter(step => !/Buzzard Gulch Frontier Board next to the main board|Gambler Track above the main board/i.test(String(step.text || '')));
    }
    return out;
  }

  function insertModeSections(baseSections, modeSections) {
    const sections = clone(baseSections || []);
    const source = (modeSections || []).filter(section => section && section.id !== 'characters');
    const stores = source.find(section => section.id === 'stores');
    if (stores) {
      const playIndex = sections.findIndex(section => section.id === 'play_area');
      sections.splice(Math.max(0, playIndex + 1), 0, { ...clone(stores), id: 'stores' });
    }

    const board = source.find(section => section.id === 'board_setup');
    if (board) {
      const playIndex = sections.findIndex(section => section.id === 'play_area');
      sections.splice(Math.max(0, playIndex + 1), 0, { ...clone(board), id: 'mode_board_setup' });
    }

    const deckRelated = source.filter(section => ['story_system', 'legendary_items', 'events', 'poker_deck', 'decks_variants'].includes(section.id));
    if (deckRelated.length) {
      const deckIndex = sections.findIndex(section => section.id === 'decks');
      sections.splice(deckIndex >= 0 ? deckIndex + 1 : sections.length, 0, ...deckRelated.map(clone));
    }

    const other = source.filter(section => !['stores', 'board_setup', 'story_system', 'legendary_items', 'events', 'poker_deck', 'decks_variants', 'characters'].includes(section.id));
    const readyIndex = sections.findIndex(section => section.id === 'ready');
    sections.splice(readyIndex >= 0 ? readyIndex : sections.length, 0, ...other.map(clone));
    return sections;
  }

  function resolveSetupPlan({ baseSections = [], mode = null, modeSections = [], isStepVisible = null } = {}) {
    const modeId = mode?.id || 'standard';
    let sections = normalizeSections(baseSections);
    if (modeId !== 'standard') {
      sections = removeBaseConflicts(sections, mode);
      sections = insertModeSections(sections, normalizeSections(modeSections));
    }
    sections = normalizeSections(sections);
    sections = filterVisibleSections(sections, isStepVisible);
    return { version: 1, modeId, sections };
  }

  function stableStepKey(section, step, parentIds = []) {
    const sectionId = slug(section?.id || section?.title || 'section', 'section');
    const ids = [...(parentIds || []), slug(step?.id || step?.text || 'step')];
    return `${sectionId}/${ids.join('/')}`;
  }

  function legacyStepKey(section, stepIndex, step, parentIndexes = []) {
    const lineage = parentIndexes.length ? `${parentIndexes.join('.')}::` : '';
    return `${section.title}::${lineage}${stepIndex}::${step.text || step.title || step.summary || ''}`.slice(0, 220);
  }

  function flattenTrackableSteps(sections) {
    const out = [];
    function visit(section, steps, parentIds = [], parentIndexes = []) {
      (steps || []).forEach((step, stepIndex) => {
        if (Array.isArray(step.substeps) && step.substeps.length) {
          visit(section, step.substeps, [...parentIds, step.id], [...parentIndexes, stepIndex]);
          return;
        }
        if (step.checkable === false) return;
        out.push({
          section,
          step,
          key: stableStepKey(section, step, parentIds),
          stepIndex,
          parentIds,
          parentIndexes
        });
      });
    }
    (sections || []).forEach(section => visit(section, section.steps || []));
    return out;
  }

  function migrateProgressKeys(values, sections) {
    const source = new Set(values || []);
    const migrated = new Set();
    flattenTrackableSteps(sections).forEach(item => {
      const legacy = legacyStepKey(item.section, item.stepIndex, item.step, item.parentIndexes);
      if (source.has(item.key) || source.has(legacy)) migrated.add(item.key);
    });
    // Preserve unknown stable keys for forward compatibility, but drop old text keys.
    source.forEach(value => { if (/^[a-z0-9_-]+\/[a-z0-9_./-]+$/.test(value)) migrated.add(value); });
    return [...migrated];
  }

  return {
    clone,
    slug,
    normalizeSections,
    resolveSetupPlan,
    stableStepKey,
    legacyStepKey,
    flattenTrackableSteps,
    migrateProgressKeys
  };
});
