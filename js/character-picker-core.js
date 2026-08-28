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


  function characterSelectionState(currentCharacterId = '', viewedCharacterId = '') {
    const selected = !!(currentCharacterId && viewedCharacterId && currentCharacterId === viewedCharacterId);
    return { selected, action: selected ? 'deselect' : 'select' };
  }

  function characterMapFrame(points = []) {
    const valid = (Array.isArray(points) ? points : [])
      .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map(point => ({
        x: Math.max(0, Math.min(100, point.x)),
        y: Math.max(0, Math.min(100, point.y))
      }));

    if (!valid.length) {
      return { mode: 'full', scale: 1, offsetX: 0, offsetY: 0 };
    }

    const xs = valid.map(point => point.x);
    const ys = valid.map(point => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    const spread = Math.max(width, height);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    let mode = 'full';
    let scale = 1;
    if (valid.length === 1 || spread <= 20) {
      mode = 'close';
      scale = 2.25;
    } else if (spread <= 45) {
      mode = 'fit';
      const paddedWidth = Math.max(48, width + 18);
      const paddedHeight = Math.max(48, height + 18);
      scale = Math.min(2.1, 100 / paddedWidth, 100 / paddedHeight);
      scale = Math.max(1.2, scale);
    }

    if (scale === 1) return { mode, scale, offsetX: 0, offsetY: 0 };

    const minOffset = 100 - (100 * scale);
    const clampOffset = value => Math.max(minOffset, Math.min(0, value));
    const offsetX = clampOffset(50 - (centerX * scale));
    const offsetY = clampOffset(50 - (centerY * scale));

    return { mode, scale, offsetX, offsetY };
  }


  function resolveCharacterMapLocations(character = {}, boardsDb = {}) {
    const ids = Array.isArray(character?.starting?.mapLocationIds) ? character.starting.mapLocationIds : [];
    const boards = boardsDb?.boards && typeof boardsDb.boards === 'object' ? boardsDb.boards : {};
    const lookup = new Map();
    Object.entries(boards).forEach(([boardId, board]) => {
      Object.entries(board?.locations || {}).forEach(([locationId, location]) => {
        if (!lookup.has(locationId)) lookup.set(locationId, { boardId, location });
      });
    });

    return ids.map(id => {
      const match = lookup.get(id);
      if (!match) return null;
      const points = (Array.isArray(match.location?.points) ? match.location.points : [])
        .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
      if (!points.length) return null;
      return { id, boardId: match.boardId, points };
    }).filter(Boolean);
  }

  function characterMapRequiredBoardIds(locations = []) {
    const seen = new Set();
    const result = [];
    (Array.isArray(locations) ? locations : []).forEach(location => {
      const boardId = location?.boardId;
      if (!boardId || seen.has(boardId)) return;
      seen.add(boardId);
      result.push(boardId);
    });
    return result;
  }

  function rotatedPoint(x, y, angleDegrees) {
    const radians = (Number(angleDegrees) || 0) * Math.PI / 180;
    if (!radians) return { x, y };
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return { x: (x * cos) - (y * sin), y: (x * sin) + (y * cos) };
  }

  function characterMapWorldLayout(boardsDb = {}, boardIds = [], aspectRatios = {}) {
    const registry = boardsDb?.boards && typeof boardsDb.boards === 'object' ? boardsDb.boards : {};
    const requested = (Array.isArray(boardIds) ? boardIds : []).map(boardId => {
      const board = registry[boardId];
      if (!board) return null;
      const x = Number(board?.layout?.x) || 0;
      const y = Number(board?.layout?.y) || 0;
      const width = Math.max(0.01, Number(board?.layout?.width) || 100);
      const ratio = Math.max(0.01, Number(aspectRatios?.[boardId]) || Number(board?.layout?.aspectRatio) || 1);
      const height = width * ratio;
      const rotation = Number(board?.layout?.rotation) || 0;
      const corners = [
        rotatedPoint(0, 0, rotation),
        rotatedPoint(width, 0, rotation),
        rotatedPoint(0, height, rotation),
        rotatedPoint(width, height, rotation)
      ].map(point => ({ x: x + point.x, y: y + point.y }));
      return {
        id: boardId,
        image: board.image || '',
        labelKey: board.labelKey || '',
        moduleId: board.moduleId || '',
        rawX: x,
        rawY: y,
        width,
        height,
        rotation,
        bounds: {
          minX: Math.min(...corners.map(point => point.x)),
          maxX: Math.max(...corners.map(point => point.x)),
          minY: Math.min(...corners.map(point => point.y)),
          maxY: Math.max(...corners.map(point => point.y))
        }
      };
    }).filter(Boolean);

    if (!requested.length) return { boards: [], width: 0, height: 0, minX: 0, minY: 0 };

    const minX = Math.min(...requested.map(board => board.bounds.minX));
    const minY = Math.min(...requested.map(board => board.bounds.minY));
    const maxX = Math.max(...requested.map(board => board.bounds.maxX));
    const maxY = Math.max(...requested.map(board => board.bounds.maxY));
    const boards = requested.map(board => ({
      ...board,
      x: board.rawX - minX,
      y: board.rawY - minY,
      bounds: {
        minX: board.bounds.minX - minX,
        maxX: board.bounds.maxX - minX,
        minY: board.bounds.minY - minY,
        maxY: board.bounds.maxY - minY
      }
    }));

    return { boards, width: maxX - minX, height: maxY - minY, minX, minY };
  }

  function characterMapWorldPoints(locations = [], worldLayout = {}) {
    const boardById = new Map((worldLayout?.boards || []).map(board => [board.id, board]));
    const result = [];
    (Array.isArray(locations) ? locations : []).forEach(location => {
      const board = boardById.get(location?.boardId);
      if (!board) return;
      (location.points || []).forEach((point, pointIndex) => {
        const localX = board.width * (Math.max(0, Math.min(100, Number(point.x) || 0)) / 100);
        const localY = board.height * (Math.max(0, Math.min(100, Number(point.y) || 0)) / 100);
        const rotated = rotatedPoint(localX, localY, board.rotation);
        result.push({
          id: location.id,
          boardId: location.boardId,
          pointIndex,
          x: board.x + rotated.x,
          y: board.y + rotated.y
        });
      });
    });
    return result;
  }

  function characterMapClampTransform(transform = {}, worldSize = {}, viewportSize = {}, overscroll = 24) {
    const scale = Math.max(0.01, Number(transform.scale) || 1);
    const worldWidth = Math.max(0, Number(worldSize.width) || 0) * scale;
    const worldHeight = Math.max(0, Number(worldSize.height) || 0) * scale;
    const viewportWidth = Math.max(0, Number(viewportSize.width) || 0);
    const viewportHeight = Math.max(0, Number(viewportSize.height) || 0);
    let x = Number(transform.x) || 0;
    let y = Number(transform.y) || 0;

    if (worldWidth <= viewportWidth) x = (viewportWidth - worldWidth) / 2;
    else x = Math.max(viewportWidth - worldWidth - overscroll, Math.min(overscroll, x));

    if (worldHeight <= viewportHeight) y = (viewportHeight - worldHeight) / 2;
    else y = Math.max(viewportHeight - worldHeight - overscroll, Math.min(overscroll, y));

    return { scale, x, y };
  }

  function characterMapWorldFrame(worldSize = {}, points = [], viewportSize = {}) {
    const worldWidth = Math.max(1, Number(worldSize.width) || 1);
    const worldHeight = Math.max(1, Number(worldSize.height) || 1);
    const viewportWidth = Math.max(1, Number(viewportSize.width) || 1);
    const viewportHeight = Math.max(1, Number(viewportSize.height) || 1);
    const margin = Math.min(28, Math.max(12, Math.min(viewportWidth, viewportHeight) * 0.05));
    const usableWidth = Math.max(1, viewportWidth - (margin * 2));
    const usableHeight = Math.max(1, viewportHeight - (margin * 2));
    const fullFitScale = Math.min(usableWidth / worldWidth, usableHeight / worldHeight);
    const valid = (Array.isArray(points) ? points : [])
      .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

    let mode = 'full';
    let centerX = worldWidth / 2;
    let centerY = worldHeight / 2;
    let targetWidth = worldWidth;
    let targetHeight = worldHeight;

    if (valid.length) {
      const minX = Math.min(...valid.map(point => point.x));
      const maxX = Math.max(...valid.map(point => point.x));
      const minY = Math.min(...valid.map(point => point.y));
      const maxY = Math.max(...valid.map(point => point.y));
      const width = maxX - minX;
      const height = maxY - minY;
      const spread = Math.max(width / worldWidth, height / worldHeight);
      centerX = (minX + maxX) / 2;
      centerY = (minY + maxY) / 2;

      if (valid.length === 1 || spread <= 0.20) {
        mode = 'close';
        targetWidth = Math.min(worldWidth, Math.max(worldWidth * 0.42, width + (worldWidth * 0.16)));
        targetHeight = Math.min(worldHeight, Math.max(worldHeight * 0.42, height + (worldHeight * 0.16)));
      } else if (spread <= 0.45) {
        mode = 'fit';
        targetWidth = Math.min(worldWidth, Math.max(worldWidth * 0.52, width + (worldWidth * 0.18)));
        targetHeight = Math.min(worldHeight, Math.max(worldHeight * 0.52, height + (worldHeight * 0.18)));
      }
    }

    const targetScale = Math.min(usableWidth / targetWidth, usableHeight / targetHeight);
    const scale = Math.max(fullFitScale, Math.min(fullFitScale * 3.25, targetScale));
    const raw = {
      scale,
      x: (viewportWidth / 2) - (centerX * scale),
      y: (viewportHeight / 2) - (centerY * scale)
    };
    const clamped = characterMapClampTransform(raw, { width: worldWidth, height: worldHeight }, { width: viewportWidth, height: viewportHeight }, margin);
    return {
      mode,
      ...clamped,
      minScale: fullFitScale,
      maxScale: Math.max(scale, fullFitScale * 5)
    };
  }

  return Object.freeze({
    slugifyCharacterName,
    availableCharacterNames,
    characterStartingBonuses,
    resolveStartingBonusItems,
    resolveStartingItems,
    characterCardSources,
    characterThumbnailSource,
    characterSelectionState,
    characterMapFrame,
    resolveCharacterMapLocations,
    characterMapRequiredBoardIds,
    characterMapWorldLayout,
    characterMapWorldPoints,
    characterMapClampTransform,
    characterMapWorldFrame
  });
});
