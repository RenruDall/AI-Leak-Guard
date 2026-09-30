// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
/* Settings: user settings (sync storage) merged with organisation policy (managed storage). */
(function (root) {
  const DEFAULTS = { enabled: true, lang: "auto", disabled: [], customTerms: [] };

  // Managed storage can answer slowly (or not at all) when no policy is installed, so cap the wait.
  function getArea(area, timeoutMs) {
    return new Promise(resolve => {
      const timer = timeoutMs ? setTimeout(() => resolve({}), timeoutMs) : null;
      try {
        chrome.storage[area].get(null, v => {
          if (timer) clearTimeout(timer);
          resolve(chrome.runtime.lastError ? {} : (v || {}));
        });
      } catch (e) { resolve({}); }
    });
  }

  async function load() {
    const [user, managed] = await Promise.all([getArea("sync"), getArea("managed", 800)]);
    const s = Object.assign({}, DEFAULTS, user);
    const hasPolicy = Object.keys(managed).length > 0;
    return {
      enabled: managed.forceEnabled === true ? true : s.enabled !== false,
      lang: s.lang,
      disabled: (s.disabled || []).filter(c => !(managed.lockedCategories || []).includes(c)),
      customTerms: [...new Set([...(managed.customTerms || []), ...(s.customTerms || [])])],
      allowSendAnyway: managed.allowSendAnyway !== false,
      managed: hasPolicy ? managed : null,
      user: s
    };
  }

  function save(patch) {
    return new Promise(resolve => chrome.storage.sync.set(patch, () => resolve()));
  }

  function bumpStat(key) {
    try {
      chrome.storage.local.get({ stats: {} }, v => {
        const st = v.stats || {};
        st[key] = (st[key] || 0) + 1;
        chrome.storage.local.set({ stats: st });
      });
    } catch (e) { /* extension reloaded */ }
  }

  root.ALG_SETTINGS = { DEFAULTS, load, save, bumpStat };
})(typeof self !== "undefined" ? self : this);
