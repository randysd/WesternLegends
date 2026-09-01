(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WLVisualSetup = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function stableKey(setupCore, section, step, parentIds) {
    return setupCore?.stableStepKey ? setupCore.stableStepKey(section, step, parentIds) : `${section.id}/${[...(parentIds || []), step.id].join('/')}`;
  }

  function buildScenes(plan, setupCore) {
    const scenes = [];
    (plan?.sections || []).forEach(section => {
      function actionButtonsFrom(step) {
        const buttons = [];
        if (step?.actionButton) buttons.push(step.actionButton);
        if (Array.isArray(step?.actionButtons)) buttons.push(...step.actionButtons);
        return buttons.filter(button => button && (button.opens || button.action || button.label));
      }

      function choiceRepresentatives(steps) {
        const groups = new Map();
        (steps || []).forEach(step => {
          if (!step?.choiceGroup) return;
          if (!groups.has(step.choiceGroup)) groups.set(step.choiceGroup, []);
          groups.get(step.choiceGroup).push(step);
        });
        const representatives = new Map();
        groups.forEach((candidates, groupId) => {
          const representative = candidates.find(candidate => Array.isArray(candidate.substeps) && candidate.substeps.length) || candidates[0];
          representatives.set(groupId, {
            step: representative,
            actionButtons: candidates.flatMap(actionButtonsFrom)
          });
        });
        return representatives;
      }

      function walk(steps, parentIds = []) {
        const choices = choiceRepresentatives(steps);
        (steps || []).forEach(step => {
          const choice = step?.choiceGroup ? choices.get(step.choiceGroup) : null;
          if (choice && choice.step !== step) return;
          const children = Array.isArray(step.substeps) ? step.substeps : [];
          const allLeaf = children.length && children.every(child => !Array.isArray(child.substeps) || child.substeps.length === 0);
          if (children.length && !allLeaf) {
            walk(children, [...parentIds, step.id]);
            return;
          }
          const completionKeys = children.length
            ? children.filter(child => child.checkable !== false).map(child => stableKey(setupCore, section, child, [...parentIds, step.id]))
            : (step.checkable === false ? [] : [stableKey(setupCore, section, step, parentIds)]);
          scenes.push({
            id: `${section.id}/${[...parentIds, step.id].join('/')}`,
            section,
            step,
            parentIds,
            completionKeys,
            actionButtons: choice?.actionButtons || actionButtonsFrom(step),
            items: children.map(child => child.text || child.title || child.summary || ''),
            galleryImages: [
              ...(step.images || []),
              ...children.flatMap(child => child.images || [])
            ],
            autoComplete: step.autoComplete || null
          });
        });
      }
      walk(section.steps || []);
    });
    return scenes;
  }

  function visibleBoardIdsForIndex(scenes, index, availableBoardIds = []) {
    const available = new Set(availableBoardIds || []);
    const configuredBoards = new Set();
    (scenes || []).forEach(item => (item?.step?.visual?.revealBoards || []).forEach(id => configuredBoards.add(id)));
    const revealed = new Set();
    for (let i = 0; i <= Math.max(0, Number(index) || 0) && i < (scenes || []).length; i += 1) {
      (scenes[i]?.step?.visual?.revealBoards || []).forEach(id => { if (!available.size || available.has(id)) revealed.add(id); });
    }
    // Compatibility fallback: boards with no authored reveal step remain visible.
    (availableBoardIds || []).forEach(id => { if (!configuredBoards.has(id)) revealed.add(id); });
    return (availableBoardIds || []).filter(id => revealed.has(id));
  }

  function textTarget(step, mode) {
    const text = String(step?.text || '').toLowerCase();
    if (step?.visual?.focus) return step.visual.focus;
    if (/sheriff/.test(text)) return 'darkrock-sheriff';
    if (/train miniature/.test(text)) return mode?.setupConstraints?.boardComposition === 'border_town' ? 'buzzard-gulch-rail' : 'spikes-view-rail';
    if (/general store/.test(text)) return 'general-store-stand';
    if (/trading post/.test(text)) return 'trading-post-stand';
    if (/traveling trader/.test(text)) return 'traveling-trader-stand';
    if (/gold nugget|mining location/.test(text)) return 'sunny-hills-mine';
    if (/cattle|ranch/.test(text)) return 'sunny-hills-ranch';
    if (/bandit/.test(text)) return 'bandit-hideout-any';
    if (/first player|player mat|faro|story disk|scoring cube|player aid/.test(text)) return 'player-area';
    if (/story card|story board/.test(text)) return 'story-area';
    if (/legendary/.test(text)) return 'legendary-track';
    if (/deck|card|money|title|rumor|joker|poker|fight/.test(text)) return 'left-decks';
    if (/token|supply|wound/.test(text)) return 'bottom-supply';
    return step?.visual?.target || 'top-supply';
  }

  function inferredAssetId(step) {
    const text = String(step?.text || '').toLowerCase();
    if (/sheriff/.test(text)) return 'sheriff';
    if (/bandit/.test(text)) return 'bandit';
    if (/train miniature/.test(text)) return 'train';
    if (/first player/.test(text)) return 'first-player';
    if (/gold nugget/.test(text)) return 'gold-nugget';
    if (/deed/.test(text)) return 'deed-token';
    if (/legendary token/.test(text)) return 'legendary-token';
    if (/event marker|event token/.test(text)) return 'event-token';
    if (/traveling trader miniature/.test(text)) return 'trader';
    if (/poker/.test(text)) return 'poker-deck';
    if (/fight/.test(text)) return 'fight-deck';
    if (/event deck/.test(text)) return 'event-deck';
    if (/train deck/.test(text)) return 'train-deck';
    if (/injur/.test(text)) return 'injury-deck';
    if (/store/.test(text)) return 'store';
    if (/miniature/.test(text)) return 'player-marker';
    if (/cube/.test(text)) return 'player-cube';
    return 'generic';
  }

  function visibleImages(step, isVisualVisible) {
    return (step?.images || []).filter(image => typeof isVisualVisible !== 'function' || isVisualVisible(image));
  }

  function derivePlacements(sceneItem, options = {}) {
    const { step } = sceneItem;
    if (Array.isArray(step?.visual?.placements)) {
      return step.visual.placements
        .filter(placement => typeof options.isVisualVisible !== 'function' || options.isVisualVisible(placement))
        .map((placement, index) => ({ ...placement, _index: index }));
    }
    const images = visibleImages(step, options.isVisualVisible);
    const target = textTarget(step, options.mode);
    if (images.length) return images.slice(0, 7).map((image, index) => ({ src: image.src, label: image.caption || image.alt || '', target, kind: 'image', fanIndex: index, _index: index }));
    return [{ asset: inferredAssetId(step), target, label: step?.visual?.label || '', kind: 'asset', _index: 0 }];
  }

  function placementPoints(scene, core, placement, options = {}) {
    if (placement.dynamicTarget === 'target-lp') return [core.lpTrackPoint(scene, options.targetLP)];
    if (placement.position && Number.isFinite(Number(placement.position.x)) && Number.isFinite(Number(placement.position.y))) {
      return [core.scenePointFromPlacement(options.visualData || {}, scene, placement.position, {
        space: placement.positionSpace || placement.coordinateSpace || placement.position?.space || 'scene',
        boardId: placement.positionBoardId || placement.position?.boardId,
        frame: placement.positionFrame || placement.position?.frame
      })].filter(Boolean);
    }
    const targets = placement.targets || (placement.target ? [placement.target] : []);
    const points = [];
    targets.forEach(target => {
      if (typeof target === 'object' && Number.isFinite(Number(target.x)) && Number.isFinite(Number(target.y))) {
        const scenePoint = core.scenePointFromPlacement(options.visualData || {}, scene, target, {
          space: target.space || placement.coordinateSpace || 'scene',
          boardId: target.boardId || placement.positionBoardId,
          frame: target.frame || placement.positionFrame
        });
        if (scenePoint) points.push(scenePoint);
      } else {
        const resolved = core.resolveLocation(scene, target);
        if (resolved?.points?.length) points.push(...resolved.points);
      }
    });
    return points;
  }

  function placementSize(asset, placement, scene, options = {}) {
    const explicit = placement.size ? core.sceneSizeFromSpec(options.visualData || {}, scene, placement.size, asset, {
      space: placement.sizeSpace || placement.coordinateSpace || placement.size?.space || 'scene',
      boardId: placement.sizeBoardId || placement.size?.boardId,
      frame: placement.sizeFrame || placement.size?.frame
    }) : null;
    if (explicit && (Number.isFinite(Number(explicit.width)) || Number.isFinite(Number(explicit.height)))) return explicit;
    const physical = core.physicalSizeForAsset(options.visualData || {}, asset);
    if (physical && (Number.isFinite(Number(physical.width)) || Number.isFinite(Number(physical.height)))) return physical;
    const kind = asset?.kind || placement.kind;
    if (kind === 'board-overlay') return { width: 18, height: 12 };
    if (kind === 'card') return { width: 6.6, height: 9.3 };
    if (kind === 'token' || kind === 'proxy-image' || kind === 'token-proxy') return { width: 5.2, height: 5.2 };
    if (kind === 'pawn') return { width: 3.8, height: 6.2 };
    if (kind === 'cube') return { width: 4.3, height: 4.3 };
    if (kind === 'stand') return { width: 40 };
    if (kind === 'player-mat') return { width: 30, height: 18 };
    return { width: 5.4, height: 5.4 };
  }

  function mount(container, options = {}) {
    if (!container || !root?.document) return { destroy() {}, replay() {}, recenter() {} };
    const core = root.WLVisualSetupCore;
    const setupCore = root.WLSetupPlanCore;
    if (!core) throw new Error('WLVisualSetupCore is required');
    const t = typeof options.t === 'function' ? options.t : (key => key);
    const formatText = typeof options.formatText === 'function' ? options.formatText : (text => escapeHtml(text));
    const completed = options.completedKeys instanceof Set ? options.completedKeys : new Set(options.completedKeys || []);
    const scenes = buildScenes(options.plan || { sections: [] }, setupCore);
    const compositionId = options.mode?.setupConstraints?.boardComposition || options.compositionId || 'standard';
    const scene = core.buildSceneGeometry(options.boards || {}, options.visualData || {}, compositionId, { boardIds: options.boardIds, includeAnchorsInBounds: false, margin: 3 });
    const cameraConfig = options.visualData?.camera || {};
    const reduceMotion = !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let destroyed = false;
    let currentIndex = 0;
    let camera = { x: (scene.bounds.minX + scene.bounds.maxX) / 2, y: (scene.bounds.minY + scene.bounds.maxY) / 2, scale: 1 };
    let manuallyMoved = false;
    let animationToken = 0;
    const pointers = new Map();
    let gesture = null;

    function firstIncompleteIndex() {
      const idx = scenes.findIndex(item => item.completionKeys.some(key => !completed.has(key)));
      return idx >= 0 ? idx : Math.max(0, scenes.length - 1);
    }
    const requestedIndex = scenes.findIndex(item => item.id === options.currentStepId);
    currentIndex = requestedIndex >= 0 ? requestedIndex : firstIncompleteIndex();

    container.innerHTML = `<div class="visual-setup-shell">
      <section class="visual-setup-instruction" aria-live="polite"></section>
      <div class="visual-setup-viewport" tabindex="0" aria-label="${escapeHtml(t('visualSetup.boardViewport'))}">
        <div class="visual-setup-world">
          <div class="visual-setup-board-layer"></div>
          <div class="visual-setup-component-layer"></div>
          <div class="visual-setup-halo-layer" aria-hidden="true"></div>
          <div class="visual-setup-interactive-layer"></div>
        </div>
        <button type="button" class="visual-setup-recenter" data-visual-recenter hidden>${escapeHtml(t('visualSetup.recenter'))}</button>
      </div>
      <div class="visual-setup-progress"><span></span></div>
      <nav class="visual-setup-nav" aria-label="${escapeHtml(t('visualSetup.navigation'))}">
        <button type="button" class="secondary-btn" data-visual-back>${escapeHtml(t('strings.back'))}</button>
        <button type="button" class="secondary-btn" data-visual-replay>${escapeHtml(t('visualSetup.replay'))}</button>
        <button type="button" class="primary-btn" data-visual-next>${escapeHtml(t('strings.next'))}</button>
      </nav>
    </div>`;

    const instruction = container.querySelector('.visual-setup-instruction');
    const viewport = container.querySelector('.visual-setup-viewport');
    const world = container.querySelector('.visual-setup-world');
    const boardLayer = container.querySelector('.visual-setup-board-layer');
    const componentLayer = container.querySelector('.visual-setup-component-layer');
    const interactiveLayer = container.querySelector('.visual-setup-interactive-layer');
    const haloLayer = container.querySelector('.visual-setup-halo-layer');
    const recenterBtn = container.querySelector('[data-visual-recenter]');
    const progressBar = container.querySelector('.visual-setup-progress span');

    function viewportSize() {
      const rect = viewport.getBoundingClientRect();
      return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    }

    function visibleBoardIds() {
      const availableIds = Object.keys(scene.boards);
      const revealed = visibleBoardIdsForIndex(scenes, currentIndex, availableIds);
      return revealed.length ? revealed : availableIds;
    }

    function cameraScene() {
      return core.cameraSceneForBoards(scene, visibleBoardIds(), { margin: 0 });
    }

    function renderBoards(animateCurrent = false) {
      const availableIds = Object.keys(scene.boards);
      const visibleIds = new Set(visibleBoardIds());
      const revealingNow = new Set(currentScene()?.step?.visual?.revealBoards || []);
      boardLayer.innerHTML = availableIds.filter(id => visibleIds.has(id)).map(id => {
        const board = scene.boards[id];
        const incoming = animateCurrent && revealingNow.has(id) ? ' incoming' : '';
        return `<img class="visual-setup-board${incoming}" src="${escapeHtml(board.image)}" alt="" style="left:${board.x}px;top:${board.y}px;width:${board.width}px;height:${board.height}px;transform:rotate(${board.rotation || 0}deg)">`;
      }).join('');
      const active = cameraScene();
      world.style.width = `${active.panBounds.width}px`;
      world.style.height = `${active.panBounds.height}px`;
    }

    function currentScene() { return scenes[Math.max(0, Math.min(scenes.length - 1, currentIndex))] || null; }

    function resolvePlacement(placement, sceneIndex, incoming = false) {
      const active = cameraScene();
      const points = placementPoints(active, core, placement, options);
      const point = points[placement.pointIndex || 0] || points[0] || { x: (active.bounds.minX + active.bounds.maxX) / 2, y: (active.bounds.minY + active.bounds.maxY) / 2 };
      const fanOffset = Number(placement.fanIndex || 0);
      const offset = placement.offset || {};
      const x = point.x + Number(offset.x || 0) + (fanOffset % 4) * 1.15;
      const y = point.y + Number(offset.y || 0) + Math.floor(fanOffset / 4) * 1.2;
      const asset = placement.src ? { type: 'image', src: placement.src, kind: placement.kind === 'image' ? 'card' : placement.kind } : core.resolveAsset(options.visualData || {}, placement.asset, placement.context || {});
      const size = placementSize(asset, placement, active, options);
      return { placement, asset, x, y, size, incoming, sceneIndex };
    }

    function playerDynamicPlacements(sceneItem) {
      const text = String(sceneItem?.step?.text || '');
      if (!/Starting Location|places? their miniature/i.test(text)) return [];
      const chars = new Map((options.characters || []).map(character => [character.id, character]));
      return (options.players || []).map((player, index) => {
        const character = chars.get(player.characterId);
        const target = character?.starting?.mapLocationIds?.[0] || character?.startingLocationId || 'player-area';
        return { asset: 'player-marker', target, context: { color: player.color || 'white' }, label: player.name || `P${index + 1}`, offset: { x: index * 1.4, y: 0 } };
      });
    }

    function allPlacementsThrough(index, animateCurrent) {
      const list = [];
      for (let i = 0; i <= index; i += 1) {
        const sceneItem = scenes[i];
        const placements = [...derivePlacements(sceneItem, options), ...playerDynamicPlacements(sceneItem)];
        placements.forEach(placement => {
          if (placement.persist === false && i < index) return;
          list.push(resolvePlacement(placement, i, animateCurrent && i === index));
        });
      }
      return list;
    }

    function assetMarkup(item) {
      const classes = ['visual-setup-component', item.incoming ? 'incoming' : '', `kind-${item.asset?.kind || 'generic'}`].filter(Boolean).join(' ');
      const hasW = Number.isFinite(Number(item.size.width));
      const hasH = Number.isFinite(Number(item.size.height));
      const topLeft = item.placement.origin === 'top-left';
      const left = topLeft ? item.x : (hasW ? item.x - Number(item.size.width) / 2 : item.x);
      const top = topLeft ? item.y : (hasH ? item.y - Number(item.size.height) / 2 : item.y);
      const rotation = Number(item.placement.rotation || 0);
      let style = `left:${left}px;top:${top}px;--visual-delay:${Math.min(6, item.placement._index || 0) * 90}ms;--visual-rotation:${rotation}deg;--visual-origin-transform:translate(0,0);`;
      if (hasW) style += `width:${Number(item.size.width)}px;`;
      if (hasH) style += `height:${Number(item.size.height)}px;`; else if (item.asset?.type === 'image') style += 'height:auto;';
      if (item.asset?.type === 'image') return `<img class="${classes}" src="${escapeHtml(item.asset.src)}" alt="${escapeHtml(item.placement.label || item.asset.label || '')}" style="${style}">`;
      const color = escapeHtml(item.asset?.color || item.placement?.context?.color || 'saddlebrown');
      const label = escapeHtml(item.placement.label || item.asset?.label || '');
      return `<span class="${classes} visual-setup-proxy proxy-${escapeHtml(item.asset?.kind || 'generic')}" style="${style}--proxy-color:${color};" aria-label="${label}">${item.asset?.kind === 'pawn' ? '<i></i>' : ''}<b>${label ? label.slice(0, 2) : ''}</b></span>`;
    }

    function galleryItems(sceneItem) {
      const images = (sceneItem.galleryImages || []).filter(image => typeof options.isVisualVisible !== 'function' || options.isVisualVisible(image)).map(image => ({ src: image.src, label: image.caption || image.alt || '' }));
      if (images.length) return images;
      return (sceneItem.items || []).filter(Boolean).map(label => ({ label }));
    }

    function openGallery(sceneItem) {
      const items = galleryItems(sceneItem);
      if (!items.length) return;
      const overlay = root.document.createElement('div');
      overlay.className = 'modal-screen-overlay visual-setup-gallery-overlay';
      overlay.innerHTML = `<section class="panel visual-setup-gallery" role="dialog" aria-modal="true"><button type="button" class="dialog-close-x" data-gallery-close aria-label="${escapeHtml(t('strings.close'))}">&#10005;</button><h3>${escapeHtml(sceneItem.step.text || sceneItem.section.title)}</h3><div class="visual-setup-gallery-grid">${items.map(item => item.src ? `<figure><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label)}"><figcaption>${escapeHtml(item.label)}</figcaption></figure>` : `<figure class="visual-setup-gallery-card"><div>${escapeHtml(item.label)}</div><figcaption>${escapeHtml(item.label)}</figcaption></figure>`).join('')}</div></section>`;
      root.document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector('[data-gallery-close]')?.addEventListener('click', close);
      overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    }

    function renderInstruction() {
      const item = currentScene();
      if (!item) { instruction.innerHTML = `<p>${escapeHtml(t('setup.noSteps'))}</p>`; return; }
      const list = (!item.step?.visual?.hideItems && item.items?.length) ? `<ul class="visual-setup-detail-list">${item.items.map(text => `<li>${formatText(text)}</li>`).join('')}</ul>` : '';
      const cards = galleryItems(item);
      const actions = item.step?.visual?.interactive ? '' : ((item.actionButtons || []).length ? `<div class="visual-setup-actions">${item.actionButtons.map(action => `<button type="button" class="setup-step-action-btn"${action.opens ? ` data-open-assist="${escapeHtml(action.opens)}"` : ''}>${escapeHtml(action.label || action.text || '')}</button>`).join('')}</div>` : '');
      const instructionText = item.step?.visual?.instruction || item.step.text || item.section.title || '';
      instruction.innerHTML = `<div class="visual-setup-step-meta"><span>${escapeHtml(t('visualSetup.stepOf', { current: currentIndex + 1, total: scenes.length }))}</span><span>·</span><span>${escapeHtml(item.section.title || '')}</span></div><h3>${formatText(instructionText)}</h3>${item.step.summary ? `<p>${formatText(item.step.summary)}</p>` : ''}${actions}${list}${cards.length > 1 ? `<button type="button" class="visual-setup-view-cards" data-visual-view-cards>${escapeHtml(t('visualSetup.viewCards'))}</button>` : ''}`;
      instruction.querySelector('[data-visual-view-cards]')?.addEventListener('click', () => openGallery(item));
      progressBar.style.width = `${scenes.length ? ((currentIndex + 1) / scenes.length) * 100 : 0}%`;
      container.querySelector('[data-visual-back]').disabled = currentIndex <= 0;
      container.querySelector('[data-visual-next]').disabled = scenes.length === 0;
    }

    function currentTargets() {
      const item = currentScene();
      if (!item) return [];
      if (item.step?.visual?.focusMode === 'full') return [];
      const explicit = item.step?.visual?.focusTargets || (item.step?.visual?.focus ? [item.step.visual.focus] : []);
      const placements = [...derivePlacements(item, options), ...playerDynamicPlacements(item)];
      const active = cameraScene();
      if (!explicit.length) return placements.flatMap(placement => placementPoints(active, core, placement, options));
      const points = [];
      explicit.forEach(target => {
        if (typeof target === 'object') points.push(target);
        else {
          const found = core.resolveLocation(active, target);
          if (found?.points?.length) points.push(...found.points);
        }
      });
      return points;
    }

    function renderInteractive() {
      interactiveLayer.innerHTML = '';
      const item = currentScene();
      if (item?.step?.visual?.interactive !== 'general-store-randomizer' || typeof options.mountStoreRandomizer !== 'function') return;
      const active = cameraScene();
      const config = item.step.visual.interactivePlacement || {};
      let target = null;
      if (config.position && Number.isFinite(Number(config.position.x)) && Number.isFinite(Number(config.position.y))) {
        target = core.scenePointFromPlacement(options.visualData || {}, active, config.position, {
          space: config.positionSpace || config.coordinateSpace || config.position?.space || 'scene',
          boardId: config.positionBoardId || config.position?.boardId,
          frame: config.positionFrame || config.position?.frame
        });
      } else {
        target = core.resolveLocation(active, config.target || item.step.visual.focus || 'top-board-stand')?.points?.[0];
      }
      if (!target) return;
      const host = root.document.createElement('div');
      host.className = 'visual-setup-store-randomizer-host';
      host.dataset.visualInteractiveHost = 'true';
      host.style.left = `${Number(target.x)}px`;
      host.style.top = `${Number(target.y)}px`;
      const interactiveSize = config.physicalProfile
        ? core.physicalProfileSize(options.visualData || {}, config.physicalProfile)
        : null;
      const hostWidth = Number.isFinite(Number(config.width)) ? Number(config.width) : Number(interactiveSize?.width);
      const hostHeight = Number.isFinite(Number(config.height)) ? Number(config.height) : Number(interactiveSize?.height);
      if (Number.isFinite(hostWidth)) host.style.width = `${hostWidth}px`;
      if (Number.isFinite(hostHeight)) host.style.height = `${hostHeight}px`;
      interactiveLayer.appendChild(host);
      options.mountStoreRandomizer(host, { revealLabel: t('strings.reveal'), dealLabel: t('strings.deal_new_store') });
    }

    function renderScene(animateCurrent = true) {
      animationToken += 1;
      renderInstruction();
      renderBoards(animateCurrent && !reduceMotion);
      const placements = allPlacementsThrough(currentIndex, animateCurrent && !reduceMotion);
      componentLayer.innerHTML = placements.map(assetMarkup).join('');
      renderInteractive();
      const targets = currentTargets();
      haloLayer.innerHTML = currentScene()?.step?.visual?.skipHalo ? '' : targets.slice(0, 8).map(point => `<span class="visual-setup-halo" style="left:${point.x}px;top:${point.y}px"></span>`).join('');
      if (reduceMotion) componentLayer.querySelectorAll('.incoming').forEach(el => el.classList.remove('incoming'));
      focusCurrent(!reduceMotion);
    }

    function applyCamera(animate = true) {
      const viewportRect = viewportSize();
      const active = cameraScene();
      const base = core.baseFitScale(active, viewportRect);
      world.style.transition = animate && !reduceMotion ? 'transform 420ms cubic-bezier(.2,.8,.2,1)' : 'none';
      const worldScale = base * camera.scale;
      world.style.transform = `translate(${viewportRect.width / 2}px, ${viewportRect.height / 2}px) scale(${worldScale}) translate(${-camera.x}px, ${-camera.y}px)`;
      recenterBtn.hidden = !manuallyMoved;
    }

    function focusCurrent(animate = true) {
      const viewportRect = viewportSize();
      const targets = currentTargets();
      camera = core.frameTargets(cameraScene(), targets, viewportRect, { ...cameraConfig, padding: currentScene()?.step?.visual?.padding ?? cameraConfig.padding });
      manuallyMoved = false;
      applyCamera(animate);
      options.onNavigate?.(currentScene()?.id || '');
    }

    function replay() {
      renderScene(true);
    }

    function recenter() {
      focusCurrent(true);
    }

    container.querySelector('[data-visual-back]').addEventListener('click', () => {
      if (currentIndex <= 0) return;
      currentIndex -= 1;
      renderScene(true);
    });
    container.querySelector('[data-visual-replay]').addEventListener('click', replay);
    container.querySelector('[data-visual-next]').addEventListener('click', () => {
      const item = currentScene();
      if (!item) return;
      item.completionKeys.forEach(key => completed.add(key));
      options.onComplete?.(item.completionKeys.slice(), item);
      if (currentIndex < scenes.length - 1) currentIndex += 1;
      renderScene(true);
    });
    recenterBtn.addEventListener('click', recenter);

    function beginGesture() {
      const values = [...pointers.values()];
      if (values.length === 1) gesture = { type: 'pan', start: values[0], camera: { ...camera } };
      else if (values.length >= 2) {
        const [a, b] = values;
        gesture = { type: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y), camera: { ...camera } };
      }
    }

    viewport.addEventListener('pointerdown', event => {
      if (event.target.closest('button') || event.target.closest('.visual-setup-store-randomizer-host')) return;
      viewport.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      beginGesture();
    });
    viewport.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const values = [...pointers.values()];
      const vp = viewportSize();
      const active = cameraScene();
      const base = core.baseFitScale(active, vp);
      if (values.length === 1 && gesture?.type === 'pan') {
        const point = values[0];
        const dx = point.x - gesture.start.x, dy = point.y - gesture.start.y;
        camera = core.clampCamera(active, { x: gesture.camera.x - dx / (base * gesture.camera.scale), y: gesture.camera.y - dy / (base * gesture.camera.scale), scale: gesture.camera.scale }, vp, cameraConfig);
      } else if (values.length >= 2) {
        const [a, b] = values;
        if (gesture?.type !== 'pinch') beginGesture();
        const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const ratio = gesture?.distance ? distance / gesture.distance : 1;
        camera = core.clampCamera(active, { ...gesture.camera, scale: gesture.camera.scale * ratio }, vp, cameraConfig);
      }
      manuallyMoved = true;
      applyCamera(false);
    });
    const endPointer = event => {
      pointers.delete(event.pointerId);
      if (pointers.size) beginGesture(); else gesture = null;
    };
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('wheel', event => {
      event.preventDefault();
      const vp = viewportSize();
      camera = core.clampCamera(cameraScene(), { ...camera, scale: camera.scale * Math.exp(-event.deltaY * 0.0015) }, vp, cameraConfig);
      manuallyMoved = true;
      applyCamera(false);
    }, { passive: false });

    const resize = () => { if (!destroyed) applyCamera(false); };
    root.addEventListener?.('resize', resize);
    requestAnimationFrame(() => renderScene(true));

    return {
      destroy() { destroyed = true; root.removeEventListener?.('resize', resize); container.innerHTML = ''; },
      replay,
      recenter,
      get currentStepId() { return currentScene()?.id || ''; },
      get scenes() { return scenes.slice(); }
    };
  }

  return { buildScenes, visibleBoardIdsForIndex, derivePlacements, mount };
});
