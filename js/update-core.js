(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.WLUpdateCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function versionParts(value) {
    return String(value || '')
      .trim()
      .replace(/^v/i, '')
      .split(/[.-]/)
      .slice(0, 3)
      .map(part => Number.parseInt(part, 10) || 0);
  }

  function compareVersions(left, right) {
    const a = versionParts(left);
    const b = versionParts(right);
    for (let index = 0; index < 3; index += 1) {
      const av = a[index] || 0;
      const bv = b[index] || 0;
      if (av < bv) return -1;
      if (av > bv) return 1;
    }
    return 0;
  }

  function isVersionNewer(currentVersion, publishedVersion) {
    return compareVersions(currentVersion, publishedVersion) < 0;
  }

  async function fetchPublishedVersion(fetchFn, manifestUrl = 'version.json', cacheBust = Date.now()) {
    if (typeof fetchFn !== 'function') throw new Error('A fetch function is required.');
    const separator = String(manifestUrl).includes('?') ? '&' : '?';
    const url = `${manifestUrl}${separator}updateCheck=${encodeURIComponent(cacheBust)}`;
    const response = await fetchFn(url, { cache: 'no-store' });
    if (!response?.ok) throw new Error(`Unable to load ${manifestUrl}`);
    const manifest = await response.json();
    const version = String(manifest?.version || '').trim();
    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
      throw new Error('Published version manifest is invalid.');
    }
    return version;
  }

  return { compareVersions, isVersionNewer, fetchPublishedVersion };
});
