(() => {
  "use strict";

  const STORAGE_KEY = "dnd.wiki.tableClosed";
  const EXPIRY_MS = 6 * 60 * 60 * 1000;
  const POLL_BASE_MS = 15000;
  const POLL_JITTER_MS = 3000;
  const POLL_SLOW_MS = 60000;
  const SLOW_AFTER_MS = 10 * 60 * 1000;
  const HEALTHZ_URL = "/healthz";
  const QUERY_FLAG = "table";
  const QUERY_VALUE = "closed";

  function tableClosedWatch(deps) {
    const {
      fetch: fetchFn,
      setTimeout: setTimer,
      clearTimeout: clearTimer,
      addEventListener: on,
      removeEventListener: off,
      document: doc,
      location: loc,
      sessionStorage: storage,
      now = () => Date.now(),
    } = deps;

    let pollTimer = null;
    let banner = null;
    let activeSince = null;

    function readRecord() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.since !== "number") return null;
        return parsed;
      } catch (_err) {
        return null;
      }
    }

    function writeRecord(since) {
      storage.setItem(STORAGE_KEY, JSON.stringify({ since }));
    }

    function clearRecord() {
      storage.removeItem(STORAGE_KEY);
    }

    function isExpired(record) {
      return !record || now() - record.since >= EXPIRY_MS;
    }

    function queryRequestsClosed() {
      try {
        const params = new URLSearchParams(loc.search || "");
        return params.get(QUERY_FLAG) === QUERY_VALUE;
      } catch (_err) {
        return false;
      }
    }

    function pollDelayMs() {
      const elapsed = activeSince ? now() - activeSince : 0;
      const base = elapsed >= SLOW_AFTER_MS ? POLL_SLOW_MS : POLL_BASE_MS;
      return base + Math.random() * POLL_JITTER_MS;
    }

    function clearPollTimer() {
      if (pollTimer === null) return;
      clearTimer(pollTimer);
      pollTimer = null;
    }

    function removeBanner() {
      banner?.remove();
      banner = null;
    }

    function ensureBanner() {
      if (banner) return banner;
      banner = doc.createElement("div");
      banner.id = "table-closed-banner";
      banner.className = "table-closed-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      const text = doc.createElement("p");
      text.className = "table-closed-banner__text";
      text.textContent =
        "The table is closed. You'll be taken back in automatically when it opens.";
      const tryBtn = doc.createElement("button");
      tryBtn.type = "button";
      tryBtn.className = "table-closed-banner__try";
      tryBtn.textContent = "Try now";
      tryBtn.addEventListener("click", () => {
        clearPollTimer();
        void checkNow();
      });
      banner.append(text, tryBtn);
      doc.body.prepend(banner);
      return banner;
    }

    function stopWatching() {
      clearPollTimer();
      removeBanner();
      clearRecord();
      activeSince = null;
      off("visibilitychange", onVisibility);
      off("online", onOnline);
    }

    function schedulePoll() {
      clearPollTimer();
      if (activeSince === null || doc.hidden) return;
      pollTimer = setTimer(() => {
        pollTimer = null;
        void checkNow();
      }, pollDelayMs());
    }

    async function checkNow() {
      if (activeSince === null) return;
      const record = readRecord();
      if (isExpired(record)) {
        stopWatching();
        return;
      }
      try {
        const response = await fetchFn(HEALTHZ_URL, {
          cache: "no-store",
          credentials: "same-origin",
          redirect: "manual",
        });
        if (response.status === 200 && response.type !== "opaqueredirect") {
          stopWatching();
          loc.replace("/");
          return;
        }
      } catch (_err) {
        /* keep waiting */
      }
      schedulePoll();
    }

    function onVisibility() {
      if (doc.hidden) {
        clearPollTimer();
        return;
      }
      void checkNow();
    }

    function onOnline() {
      if (activeSince === null) return;
      void checkNow();
    }

    function startWatching(since) {
      activeSince = since;
      writeRecord(since);
      ensureBanner();
      on("visibilitychange", onVisibility);
      on("online", onOnline);
      if (!doc.hidden) void checkNow();
    }

    function boot() {
      const fromQuery = queryRequestsClosed();
      let record = readRecord();
      if (fromQuery) {
        const since = now();
        writeRecord(since);
        record = { since };
      }
      if (!record || isExpired(record)) {
        if (record) clearRecord();
        return;
      }
      startWatching(record.since);
    }

    boot();

    return {
      checkNow,
      stopWatching,
      _getState: () => ({ activeSince, pollScheduled: pollTimer !== null }),
    };
  }

  globalThis.__tableClosedWatch = tableClosedWatch;
  if (
    typeof globalThis.window !== "undefined" &&
    globalThis.document &&
    !globalThis.__TABLE_CLOSED_TEST__
  ) {
    tableClosedWatch({
      fetch: globalThis.fetch.bind(globalThis),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      addEventListener: globalThis.addEventListener.bind(globalThis),
      removeEventListener: globalThis.removeEventListener.bind(globalThis),
      document: globalThis.document,
      location: globalThis.location,
      sessionStorage: globalThis.sessionStorage,
    });
  }
})();
