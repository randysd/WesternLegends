(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WLCharacterPickerCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function slugifyCharacterName(name = '') {
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[“”‘’'\"]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  function availableCharacterNames(allNames = [], takenNames = [], currentName = '') {
    const taken = new Set((takenNames || []).filter(Boolean));
    if (currentName) taken.delete(currentName);
    return (allNames || []).filter(name => !taken.has(name));
  }

  function characterStartingBonuses(character = {}) {
    const structured = character?.starting?.bonuses;
    if (Array.isArray(structured)) return structured.filter(bonus => bonus && typeof bonus === 'object');

    // Backward compatibility for the first character-picker data format.
    const bonuses = [];
    if (Number.isFinite(Number(character.startingMoney))) {
      bonuses.push({ type: 'money', amount: Number(character.startingMoney) });
    }
    if (Array.isArray(character.startingItems)) {
      character.startingItems.filter(Boolean).forEach(itemId => bonuses.push({ type: 'item', itemId }));
    }
    return bonuses;
  }

  function resolveStartingBonusItems(character = {}, itemsDb = {}) {
    const allItems = [
      ...(Array.isArray(itemsDb.items) ? itemsDb.items : []),
      ...(Array.isArray(itemsDb.legendary_items) ? itemsDb.legendary_items : [])
    ];
    const byId = new Map(allItems.map(item => [item.id, item]));
    return characterStartingBonuses(character)
      .filter(bonus => bonus.type === 'item' && bonus.itemId)
      .map(bonus => ({ bonus, item: byId.get(bonus.itemId) }))
      .filter(entry => entry.item);
  }

  function resolveStartingItems(character = {}, itemsDb = {}) {
    return resolveStartingBonusItems(character, itemsDb).map(entry => entry.item);
  }

  function characterCardSources(character = {}) {
    const slug = character.slug || slugifyCharacterName(character.name || 'character');
    return {
      front: character.frontImage || `assets/images/cards/character-${slug}-front.png`,
      back: character.backImage || `assets/images/cards/character-${slug}-back.png`
    };
  }

  function characterThumbnailSource(character = {}) {
    const slug = character.slug || slugifyCharacterName(character.name || 'character');
    return character.thumbnailImage || `assets/images/characters/thumbs/${slug}.png`;
  }

  return Object.freeze({
    slugifyCharacterName,
    availableCharacterNames,
    characterStartingBonuses,
    resolveStartingBonusItems,
    resolveStartingItems,
    characterCardSources,
    characterThumbnailSource
  });
});
