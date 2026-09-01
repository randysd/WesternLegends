(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WLVisualSetupCore = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function boardHeight(boardId, board, visual) {
    const physical = board?.physicalSizeMm;
    const physicalRatio = Number(physical?.width) > 0 && Number(physical?.height) > 0
      ? Number(physical.height) / Number(physical.width)
      : 0;
    const ratio = physicalRatio || Number(visual?.boardAspectRatios?.[boardId] || 0.65);
    return Number(board?.layout?.width || 100) * ratio;
  }

  function rotatePoint(point, center, degrees) {
    const angle = Number(degrees || 0) * Math.PI / 180;
    if (!angle) return { x: point.x, y: point.y };
    const dx = point.x - center.x, dy = point.y - center.y;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  }

  function boardCorners(board) {
    const center = { x: board.x + board.width / 2, y: board.y + board.height / 2 };
    return [
      { x: board.x, y: board.y },
      { x: board.x + board.width, y: board.y },
      { x: board.x + board.width, y: board.y + board.height },
      { x: board.x, y: board.y + board.height }
    ].map(point => rotatePoint(point, center, board.rotation));
  }

  function boundsFromPoints(points, margin = 0) {
    const usable = (points || []).filter(point => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)));
    if (!usable.length) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    const minX = Math.min(...usable.map(point => Number(point.x))) - margin;
    const minY = Math.min(...usable.map(point => Number(point.y))) - margin;
    const maxX = Math.max(...usable.map(point => Number(point.x))) + margin;
    const maxY = Math.max(...usable.map(point => Number(point.y))) + margin;
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  function unionBounds(a, b) {
    if (!a) return b;
    if (!b) return a;
    const minX = Math.min(a.minX, b.minX), minY = Math.min(a.minY, b.minY);
    const maxX = Math.max(a.maxX, b.maxX), maxY = Math.max(a.maxY, b.maxY);
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  function boundsForBoards(scene, boardIds, margin = 0) {
    const ids = new Set((boardIds || []).filter(Boolean));
    const selected = Object.values(scene?.boards || {}).filter(board => !ids.size || ids.has(board.id));
    return boundsFromPoints(selected.flatMap(boardCorners), Number(margin || 0));
  }

  function anchorStaticPoints(anchors) {
    return Object.values(anchors || {})
      .filter(anchor => Number.isFinite(Number(anchor?.x)) && Number.isFinite(Number(anchor?.y)))
      .map(anchor => ({ x: Number(anchor.x), y: Number(anchor.y) }));
  }

  function buildSceneGeometry(boardsData, visual, compositionId = 'standard', options = {}) {
    const config = visual?.compositions?.[compositionId] || visual?.compositions?.standard || { boards: Object.keys(boardsData?.boards || {}) };
    const active = options.boardIds || config.boards || [];
    const sceneBoards = {};
    active.forEach(boardId => {
      const board = boardsData?.boards?.[boardId];
      if (!board) return;
      const baseLayout = board.layout || {};
      const overrideLayout = config?.layouts?.[boardId] || {};
      const layout = { ...baseLayout, ...overrideLayout };
      const width = Number(layout.width || 100);
      const physical = board.physicalSizeMm;
      const physicalRatio = Number(physical?.width) > 0 && Number(physical?.height) > 0
        ? Number(physical.height) / Number(physical.width)
        : 0;
      const ratio = physicalRatio || Number(visual?.boardAspectRatios?.[boardId] || 0.65);
      const height = width * ratio;
      const x = Number(layout.x || 0);
      const y = Number(layout.y || 0);
      sceneBoards[boardId] = { id: boardId, image: board.image, labelKey: board.labelKey, x, y, width, height, rotation: Number(layout.rotation || 0), locations: board.locations || {} };
    });
    const margin = Number(options.margin || 0);
    const shell = { compositionId, config, boards: sceneBoards, anchors: visual?.anchors || {} };
    const boardBounds = boundsForBoards(shell, active, margin);
    const staticAnchorBounds = boundsFromPoints(anchorStaticPoints(shell.anchors), margin);
    const panBounds = anchorStaticPoints(shell.anchors).length ? unionBounds(boardBounds, staticAnchorBounds) : boardBounds;
    const bounds = options.includeAnchorsInBounds ? panBounds : boardBounds;
    return { ...shell, bounds, boardBounds, panBounds };
  }

  function cameraSceneForBoards(scene, boardIds, options = {}) {
    const bounds = boundsForBoards(scene, boardIds, Number(options.margin || 0));
    const staticAnchors = anchorStaticPoints(scene?.anchors);
    const anchorBounds = staticAnchors.length ? boundsFromPoints(staticAnchors, Number(options.margin || 0)) : null;
    return { ...scene, bounds, boardBounds: bounds, panBounds: anchorBounds ? unionBounds(bounds, anchorBounds) : bounds };
  }

  function convertBoardPoint(board, point) {
    const raw = {
      x: board.x + (Number(point.x || 0) / 100) * board.width,
      y: board.y + (Number(point.y || 0) / 100) * board.height
    };
    return rotatePoint(raw, { x: board.x + board.width / 2, y: board.y + board.height / 2 }, board.rotation);
  }

  function dynamicAnchorPoint(scene, anchor) {
    const offset = Number(anchor.offset || 0);
    if (anchor.relativeTo === 'visible-bounds') {
      const bounds = scene.bounds;
      const xRatio = Number(anchor.xRatio ?? 0.5), yRatio = Number(anchor.yRatio ?? 0.5);
      if (anchor.edge === 'right') return { x: bounds.maxX + offset, y: bounds.minY + bounds.height * yRatio };
      if (anchor.edge === 'left') return { x: bounds.minX - offset, y: bounds.minY + bounds.height * yRatio };
      if (anchor.edge === 'top') return { x: bounds.minX + bounds.width * xRatio, y: bounds.minY - offset };
      if (anchor.edge === 'bottom') return { x: bounds.minX + bounds.width * xRatio, y: bounds.maxY + offset };
    }
    if (anchor.relativeToBoard) {
      const board = scene.boards?.[anchor.relativeToBoard];
      if (!board) return null;
      const bounds = boundsFromPoints(boardCorners(board), 0);
      const xRatio = Number(anchor.xRatio ?? 0.5), yRatio = Number(anchor.yRatio ?? 0.5);
      if (anchor.edge === 'right') return { x: bounds.maxX + offset, y: bounds.minY + bounds.height * yRatio };
      if (anchor.edge === 'left') return { x: bounds.minX - offset, y: bounds.minY + bounds.height * yRatio };
      if (anchor.edge === 'top') return { x: bounds.minX + bounds.width * xRatio, y: bounds.minY - offset };
      if (anchor.edge === 'bottom') return { x: bounds.minX + bounds.width * xRatio, y: bounds.maxY + offset };
    }
    return null;
  }

  function resolveLocation(scene, locationId) {
    if (!scene || !locationId) return null;
    const anchor = scene.anchors?.[locationId];
    if (anchor) {
      const dynamic = dynamicAnchorPoint(scene, anchor);
      if (dynamic) return { id: locationId, boardId: null, points: [dynamic] };
      if (Number.isFinite(Number(anchor.x)) && Number.isFinite(Number(anchor.y))) return { id: locationId, boardId: null, points: [{ x: Number(anchor.x), y: Number(anchor.y) }] };
    }
    for (const board of Object.values(scene.boards || {})) {
      const location = board.locations?.[locationId];
      if (!location) continue;
      const points = (location.points || []).map(point => convertBoardPoint(board, point));
      return { id: locationId, boardId: board.id, points };
    }
    return null;
  }

  function lpTrackPoint(scene, targetLP, boardPercentY = 94.5) {
    const board = scene?.boards?.main;
    const lp = Number(targetLP || 20);
    const boardPercentX = 3 * lp + 3.5;
    if (!board) return { x: boardPercentX, y: boardPercentY, boardPercentX, boardPercentY };
    const point = convertBoardPoint(board, { x: boardPercentX, y: boardPercentY });
    return { ...point, boardPercentX, boardPercentY };
  }

  function mmToSceneUnits(mm, visual) {
    const referenceMm = Number(visual?.physicalScale?.referenceBoardWidthMm || 0);
    const referenceUnits = Number(visual?.physicalScale?.sceneUnitsPerReferenceBoardWidth || 100);
    if (!(referenceMm > 0) || !Number.isFinite(Number(mm))) return Number(mm || 0);
    return Number(mm) * referenceUnits / referenceMm;
  }

  function physicalProfileSize(visual, profileId) {
    const profile = visual?.physicalComponents?.[profileId];
    if (!profile) return null;
    const out = {};
    if (Number.isFinite(Number(profile.widthMm))) out.width = mmToSceneUnits(profile.widthMm, visual);
    if (Number.isFinite(Number(profile.heightMm))) out.height = mmToSceneUnits(profile.heightMm, visual);
    if (Number.isFinite(Number(profile.diameterMm))) {
      const diameter = mmToSceneUnits(profile.diameterMm, visual);
      out.width = diameter;
      out.height = diameter;
    }
    if (Number.isFinite(Number(profile.edgeMm))) {
      const edge = mmToSceneUnits(profile.edgeMm, visual);
      out.width = edge;
      out.height = edge;
    }
    if (Number.isFinite(Number(profile.lengthMm)) && !Number.isFinite(Number(profile.widthMm))) {
      out.width = mmToSceneUnits(profile.lengthMm, visual);
    }
    if (Number.isFinite(Number(profile.baseDiameterMm))) out.width = mmToSceneUnits(profile.baseDiameterMm, visual);
    if (Number.isFinite(Number(profile.heightMm))) out.height = mmToSceneUnits(profile.heightMm, visual);
    return Object.keys(out).length ? out : null;
  }

  function physicalSizeForAsset(visual, asset) {
    const profileId = asset?.physicalProfile;
    return profileId ? physicalProfileSize(visual, profileId) : null;
  }


  function sceneUnitScale(scene, boardId = 'main', frame) {
    const board = scene?.boards?.[boardId || frame?.boardId || 'main'];
    const widthUnits = Number(frame?.widthUnits || 0);
    const heightUnits = Number(frame?.heightUnits || 0);
    const scaleX = board && widthUnits > 0 ? Number(board.width || 0) / widthUnits : 1;
    const scaleY = board && heightUnits > 0 ? Number(board.height || 0) / heightUnits : (board && widthUnits > 0 ? Number(board.width || 0) / widthUnits : scaleX);
    return { scaleX: Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1, scaleY: Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1 };
  }

  function resolveReferenceFrame(visual, frameId) {
    if (!frameId) return null;
    return visual?.referenceFrames?.[frameId] || null;
  }

  function scenePointFromPlacement(visual, scene, point, options = {}) {
    if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) return null;
    const space = options.space || point.space || 'scene';
    if (space === 'scene') return { x: Number(point.x), y: Number(point.y) };
    if (space === 'board-percent') {
      const board = scene?.boards?.[options.boardId || point.boardId || 'main'];
      return board ? convertBoardPoint(board, point) : { x: Number(point.x), y: Number(point.y) };
    }
    if (space === 'reference-px') {
      const frame = resolveReferenceFrame(visual, options.frame || point.frame);
      const scale = sceneUnitScale(scene, options.boardId || point.boardId || frame?.boardId || 'main', frame);
      return { x: Number(point.x) * scale.scaleX, y: Number(point.y) * scale.scaleY };
    }
    if (space === 'inches') {
      const frame = resolveReferenceFrame(visual, options.frame || point.frame);
      const inchesPerBoardWidth = Number(options.inchesPerBoardWidth || point.inchesPerBoardWidth || visual?.sceneUnits?.inchesPerBoardWidth || 0);
      const board = scene?.boards?.[options.boardId || point.boardId || frame?.boardId || 'main'];
      const scale = board && inchesPerBoardWidth > 0 ? Number(board.width || 0) / inchesPerBoardWidth : 1;
      return { x: Number(point.x) * scale, y: Number(point.y) * scale };
    }
    return { x: Number(point.x), y: Number(point.y) };
  }

  function sceneSizeFromSpec(visual, scene, size, asset = null, options = {}) {
    const spec = size || {};
    const space = options.space || spec.space || 'scene';
    if (space === 'scene') return { ...spec };
    if (space === 'reference-px') {
      const frame = resolveReferenceFrame(visual, options.frame || spec.frame);
      const scale = sceneUnitScale(scene, options.boardId || spec.boardId || frame?.boardId || 'main', frame);
      const out = {};
      if (Number.isFinite(Number(spec.width))) out.width = Number(spec.width) * scale.scaleX;
      if (Number.isFinite(Number(spec.height))) out.height = Number(spec.height) * scale.scaleY;
      return out;
    }
    if (space === 'inches') {
      const inchesPerBoardWidth = Number(options.inchesPerBoardWidth || spec.inchesPerBoardWidth || visual?.sceneUnits?.inchesPerBoardWidth || 0);
      const board = scene?.boards?.[options.boardId || spec.boardId || 'main'];
      const scale = board && inchesPerBoardWidth > 0 ? Number(board.width || 0) / inchesPerBoardWidth : 1;
      const out = {};
      if (Number.isFinite(Number(spec.width))) out.width = Number(spec.width) * scale;
      if (Number.isFinite(Number(spec.height))) out.height = Number(spec.height) * scale;
      return out;
    }
    if (space === 'board-percent') {
      const board = scene?.boards?.[options.boardId || spec.boardId || 'main'];
      const out = {};
      if (board) {
        if (Number.isFinite(Number(spec.width))) out.width = (Number(spec.width) / 100) * Number(board.width || 0);
        if (Number.isFinite(Number(spec.height))) out.height = (Number(spec.height) / 100) * Number(board.height || 0);
      }
      return out;
    }
    return { ...spec };
  }

  function baseFitScale(scene, viewport) {
    const width = Math.max(1, Number(viewport?.width || 1));
    const height = Math.max(1, Number(viewport?.height || 1));
    return Math.min(width / Math.max(1, scene.bounds.width), height / Math.max(1, scene.bounds.height));
  }

  function clampCamera(scene, camera, viewport, options = {}) {
    const minScale = Number(options.minScale ?? 1);
    const maxScale = Number(options.maxScale ?? 4.2);
    const scale = clamp(Number(camera?.scale || 1), minScale, maxScale);
    const base = baseFitScale(scene, viewport);
    const visibleW = Number(viewport?.width || 1) / (base * scale);
    const visibleH = Number(viewport?.height || 1) / (base * scale);
    const clampBounds = scene.panBounds || scene.bounds;
    const midX = (scene.bounds.minX + scene.bounds.maxX) / 2;
    const midY = (scene.bounds.minY + scene.bounds.maxY) / 2;
    const minX = clampBounds.minX + visibleW / 2, maxX = clampBounds.maxX - visibleW / 2;
    const minY = clampBounds.minY + visibleH / 2, maxY = clampBounds.maxY - visibleH / 2;
    const x = minX > maxX ? midX : clamp(Number(camera?.x ?? midX), minX, maxX);
    const y = minY > maxY ? midY : clamp(Number(camera?.y ?? midY), minY, maxY);
    return { x, y, scale };
  }

  function frameTargets(scene, targets, viewport, options = {}) {
    const points = (targets || []).filter(point => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)));
    if (!points.length) {
      return clampCamera(scene, { x: (scene.bounds.minX + scene.bounds.maxX) / 2, y: (scene.bounds.minY + scene.bounds.maxY) / 2, scale: 1 }, viewport, options);
    }
    let minX = Math.min(...points.map(p => Number(p.x))), maxX = Math.max(...points.map(p => Number(p.x)));
    let minY = Math.min(...points.map(p => Number(p.y))), maxY = Math.max(...points.map(p => Number(p.y)));
    const targetMinSize = Number(options.targetMinSize || 11);
    if (maxX - minX < targetMinSize) { const mid = (minX + maxX) / 2; minX = mid - targetMinSize / 2; maxX = mid + targetMinSize / 2; }
    if (maxY - minY < targetMinSize) { const mid = (minY + maxY) / 2; minY = mid - targetMinSize / 2; maxY = mid + targetMinSize / 2; }
    const padding = clamp(Number(options.padding ?? 0.18), 0, 0.42);
    const base = baseFitScale(scene, viewport);
    const usableW = Math.max(1, Number(viewport.width) * (1 - padding * 2));
    const usableH = Math.max(1, Number(viewport.height) * (1 - padding * 2));
    const desired = Math.min(usableW / ((maxX - minX) * base), usableH / ((maxY - minY) * base));
    return clampCamera(scene, { x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale: desired }, viewport, options);
  }

  function resolveAsset(visual, assetId, context = {}) {
    const configured = visual?.assets?.[assetId];
    if (configured) {
      const result = { ...configured, id: assetId };
      if (result.type === 'proxy' && context.color) result.color = context.color;
      return result;
    }
    const fallback = visual?.assets?.generic || { type: 'proxy', kind: 'generic', label: 'Component' };
    return { ...fallback, id: assetId || 'generic', color: context.color || fallback.color };
  }

  return { clamp, boardHeight, rotatePoint, boardCorners, boundsForBoards, buildSceneGeometry, cameraSceneForBoards, convertBoardPoint, resolveLocation, lpTrackPoint, mmToSceneUnits, physicalProfileSize, physicalSizeForAsset, scenePointFromPlacement, sceneSizeFromSpec, resolveReferenceFrame, baseFitScale, clampCamera, frameTargets, resolveAsset };
});
