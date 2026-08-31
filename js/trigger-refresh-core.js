(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.WLTriggerRefreshCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function cloneTriggers(triggers) {
    return (Array.isArray(triggers) ? triggers : []).map(trigger => ({ ...trigger }));
  }

  function createTriggerRefreshSnapshot(state) {
    return {
      activeTriggers: cloneTriggers(state?.activeTriggers),
      seenTriggerIds: Array.isArray(state?.seenTriggerIds) ? [...state.seenTriggerIds] : []
    };
  }

  function restoreTriggerState(state, snapshot) {
    if (!state || !snapshot) return;
    state.activeTriggers = cloneTriggers(snapshot.activeTriggers);
    state.seenTriggerIds = Array.isArray(snapshot.seenTriggerIds) ? [...snapshot.seenTriggerIds] : [];
  }

  function refreshTriggerState(state, { slots = 3, drawOne, now = Date.now } = {}) {
    if (!state || typeof drawOne !== 'function') {
      return { refreshed: false, snapshot: createTriggerRefreshSnapshot(state || {}) };
    }

    const snapshot = createTriggerRefreshSnapshot(state);
    const blockedIds = new Set(snapshot.activeTriggers.map(trigger => trigger?.id).filter(Boolean));
    const targetSlots = Math.max(0, Number(slots) || 0);

    state.activeTriggers = [];
    if (!Array.isArray(state.seenTriggerIds)) state.seenTriggerIds = [];

    while (state.activeTriggers.length < targetSlots) {
      const pick = drawOne(new Set(blockedIds));
      if (!pick?.id || blockedIds.has(pick.id)) {
        restoreTriggerState(state, snapshot);
        return { refreshed: false, snapshot };
      }

      state.activeTriggers.push({ ...pick, dealtAt: now() });
      state.seenTriggerIds.push(pick.id);
      blockedIds.add(pick.id);
    }

    return { refreshed: true, snapshot };
  }

  function refreshSingleTriggerState(state, { index = -1, drawOne, now = Date.now } = {}) {
    if (!state || typeof drawOne !== 'function') {
      return { refreshed: false, snapshot: createTriggerRefreshSnapshot(state || {}), index: -1 };
    }

    const snapshot = createTriggerRefreshSnapshot(state);
    const targetIndex = Number(index);
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= snapshot.activeTriggers.length) {
      return { refreshed: false, snapshot, index: targetIndex };
    }

    const blockedIds = new Set(snapshot.activeTriggers.map(trigger => trigger?.id).filter(Boolean));
    if (!Array.isArray(state.seenTriggerIds)) state.seenTriggerIds = [];

    const pick = drawOne(new Set(blockedIds));
    if (!pick?.id || blockedIds.has(pick.id)) {
      restoreTriggerState(state, snapshot);
      return { refreshed: false, snapshot, index: targetIndex };
    }

    state.activeTriggers = cloneTriggers(snapshot.activeTriggers);
    state.activeTriggers[targetIndex] = { ...pick, dealtAt: now() };
    state.seenTriggerIds.push(pick.id);

    return { refreshed: true, snapshot, index: targetIndex };
  }

  function isDeliberateTriggerDownSwipe({ dx = 0, dy = 0, durationMs = Infinity } = {}) {
    const horizontal = Math.abs(Number(dx) || 0);
    const vertical = Number(dy) || 0;
    const duration = Number(durationMs);
    if (vertical < 58) return false;
    if (!Number.isFinite(duration) || duration < 0 || duration > 600) return false;
    return vertical >= horizontal * 1.65;
  }

  return {
    createTriggerRefreshSnapshot,
    refreshTriggerState,
    refreshSingleTriggerState,
    isDeliberateTriggerDownSwipe,
    restoreTriggerState
  };
});
