(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.WLContextualMusic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizedTags(trigger) {
    return Array.isArray(trigger?.tags) ? trigger.tags.map(tag => String(tag).toLowerCase()) : [];
  }

  function ruleMatchesTrigger(trigger, rule) {
    if (!trigger || !rule || rule.enabled === false) return false;
    const match = rule.match || {};
    const id = String(trigger.id || '').toLowerCase();
    const category = String(trigger.category || '').toLowerCase();
    const tags = normalizedTags(trigger);
    const ids = (match.ids || []).map(value => String(value).toLowerCase());
    const categories = (match.categories || []).map(value => String(value).toLowerCase());
    const ruleTags = (match.tags || []).map(value => String(value).toLowerCase());

    return ids.includes(id)
      || categories.includes(category)
      || ruleTags.some(tag => tags.includes(tag));
  }

  function matchingContexts(trigger, rules) {
    return (Array.isArray(rules) ? rules : [])
      .map((rule, index) => ({ rule, index }))
      .filter(item => ruleMatchesTrigger(trigger, item.rule) && Array.isArray(item.rule.tracks) && item.rule.tracks.length)
      .sort((a, b) => (Number(b.rule.priority) || 0) - (Number(a.rule.priority) || 0) || a.index - b.index)
      .map(item => item.rule);
  }

  function chooseTrackForTrigger(trigger, rules, random = Math.random) {
    const rule = matchingContexts(trigger, rules)[0];
    if (!rule) return null;
    const tracks = rule.tracks.filter(Boolean);
    if (!tracks.length) return null;
    const roll = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
    const src = tracks[Math.floor(roll * tracks.length)];
    return { context: rule.id || '', src };
  }

  return { ruleMatchesTrigger, matchingContexts, chooseTrackForTrigger };
});
