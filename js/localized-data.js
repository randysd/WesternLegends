/*
 * Localization data guard for Western Legends Companion.
 *
 * Root data/*.json files are the authoritative source for game mechanics.
 * For mixed data files, a selected-language data/<lang>/*.json file is used
 * only as a source of translatable presentation fields. Mechanical fields in
 * translated files are deliberately ignored.
 *
 * This makes new mechanical metadata (for example `changes`) universal: add
 * it once to data/triggers.json or another root data file and every language
 * receives it automatically.
 */
(() => {
  'use strict';

  const MIXED_LOCALIZED_FILES = new Set([
    'settings.json',
    'triggers.json',
    'one-off-events.json',
    'character-arcs.json',
    'major-storylines.json',
    'world-events.json',
    'newspaper-generator.json',
    'setup-assist.json',
    'items.json',
    'final-scoring.json',
    'characters.json'
  ]);

  const LOCALIZABLE_KEYS = new Set([
    'label', 'title', 'screenText', 'narrationScript', 'newspaperText',
    'text', 'name', 'summary', 'description', 'caption', 'alt', 'edition',
    'weightingNotes', 'emptyText', 'placeholder', 'ariaLabel', 'helpText',
    'location', 'ability', 'tags', 'strength', 'focus'
  ]);

  // The location and style of highlighted words can legitimately differ by
  // language, so titleParts is localized as one complete value.
  const LOCALIZED_WHOLE_KEYS = new Set(['titleParts']);
  const nativeFetch = window.fetch.bind(window);

  function clone(value) {
    if (value === undefined) return undefined;
    return typeof structuredClone === 'function'
      ? structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }

  function extractLocaleOverlay(value, parentKey = '') {
    if (LOCALIZED_WHOLE_KEYS.has(parentKey)) return clone(value);

    if (Array.isArray(value)) {
      if (!value.length || value.every(item => item == null || (typeof item !== 'object'))) return undefined;

      const result = [];
      value.forEach((item, index) => {
        const child = extractLocaleOverlay(item);
        if (child === undefined) return;

        if (child && !Array.isArray(child) && typeof child === 'object') {
          if (item && !Array.isArray(item) && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'id')) {
            result.push({ id: item.id, ...child });
          } else {
            // Clean locale overlays may already contain a sparse _index marker.
            // Preserve that original index instead of renumbering the compact array.
            const overlayIndex = item && !Array.isArray(item) && typeof item === 'object' && Number.isInteger(item._index)
              ? item._index
              : index;
            result.push({ _index: overlayIndex, ...child });
          }
        } else {
          result.push(child);
        }
      });
      return result.length ? result : undefined;
    }

    if (value && typeof value === 'object') {
      const result = {};
      Object.entries(value).forEach(([key, item]) => {
        if (LOCALIZABLE_KEYS.has(key) || LOCALIZED_WHOLE_KEYS.has(key)) {
          result[key] = clone(item);
          return;
        }
        const child = extractLocaleOverlay(item, key);
        if (child !== undefined) result[key] = child;
      });
      return Object.keys(result).length ? result : undefined;
    }

    return undefined;
  }

  function mergeLocaleOverlay(base, overlay) {
    if (overlay === undefined || overlay === null) return clone(base);

    if (Array.isArray(overlay)) {
      if (!Array.isArray(base)) return clone(overlay);

      const sparse = overlay.length > 0 && overlay.every(item =>
        item && typeof item === 'object' && !Array.isArray(item) &&
        (Object.prototype.hasOwnProperty.call(item, 'id') || Number.isInteger(item._index))
      );
      if (!sparse) return clone(overlay);

      const result = clone(base);
      const byId = new Map();
      result.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item) && Object.prototype.hasOwnProperty.call(item, 'id')) {
          byId.set(item.id, index);
        }
      });

      overlay.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(item, 'id')) {
          const index = byId.get(item.id);
          if (index !== undefined) {
            result[index] = mergeLocaleOverlay(result[index], item);
          }
          return;
        }

        const index = item._index;
        if (index >= 0 && index < result.length) {
          const values = { ...item };
          delete values._index;
          result[index] = mergeLocaleOverlay(result[index], values);
        }
      });
      return result;
    }

    if (overlay && typeof overlay === 'object') {
      const result = (base && typeof base === 'object' && !Array.isArray(base)) ? clone(base) : {};
      Object.entries(overlay).forEach(([key, item]) => {
        if (key === '_index') return;
        result[key] = Object.prototype.hasOwnProperty.call(result, key)
          ? mergeLocaleOverlay(result[key], item)
          : clone(item);
      });
      return result;
    }

    return clone(overlay);
  }

  function localizedMixedRequest(url) {
    const parsed = new URL(url, window.location.href);
    const match = parsed.pathname.match(/\/data\/([^/]+)\/([^/]+\.json)$/);
    if (!match) return null;

    const language = match[1];
    const filename = match[2];
    if (!language || language === 'en' || !MIXED_LOCALIZED_FILES.has(filename)) return null;

    return {
      parsed,
      language,
      filename,
      sharedUrl: new URL(`data/${filename}`, window.location.href).toString()
    };
  }

  window.fetch = async function westernLegendsLocalizedFetch(input, init) {
    const requestedUrl = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    const request = requestedUrl ? localizedMixedRequest(requestedUrl) : null;
    if (!request) return nativeFetch(input, init);

    const [sharedResponse, localizedResponse] = await Promise.all([
      nativeFetch(request.sharedUrl, init),
      nativeFetch(input, init)
    ]);

    // Preserve the original failure behavior so app.js can surface the same
    // localized load error it does today.
    if (!sharedResponse.ok) return sharedResponse;
    if (!localizedResponse.ok) return localizedResponse;

    const [shared, localized] = await Promise.all([
      sharedResponse.json(),
      localizedResponse.json()
    ]);
    const overlay = extractLocaleOverlay(localized);
    const merged = mergeLocaleOverlay(shared, overlay);

    return new Response(JSON.stringify(merged), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  };

  // Expose only for lightweight regression tests / console diagnostics.
  window.WLLocalizedData = Object.freeze({
    extractLocaleOverlay,
    mergeLocaleOverlay
  });
})();
