/**
 * Video Tuner - content script
 * Aplica velocidade e volume (com boost via WebAudio) nos videos da pagina.
 */
(() => {
  if (window.__videoTunerLoaded) return;
  window.__videoTunerLoaded = true;

  const DEFAULTS = { speed: 1, volume: 1, rememberPerSite: true };
  const MAX_BOOST = 6;

  const state = { ...DEFAULTS };

  /** @type {WeakMap<HTMLMediaElement, {ctx: AudioContext, gain: GainNode, ok: boolean}>} */
  const chains = new WeakMap();
  /** @type {Set<HTMLMediaElement>} */
  const known = new Set();

  const siteKey = () => `site:${location.hostname}`;

  // ---------------------------------------------------------------- elementos

  function collect(root = document) {
    const found = [];
    for (const el of root.querySelectorAll("video, audio")) found.push(el);
    // Shadow DOM (players customizados)
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) found.push(...collect(el.shadowRoot));
    }
    return found;
  }

  function media() {
    const list = collect();
    for (const el of list) {
      if (!known.has(el)) {
        known.add(el);
        // Sites como o YouTube reescrevem playbackRate ao trocar de video.
        el.addEventListener("loadeddata", () => applyTo(el));
        el.addEventListener("play", () => applyTo(el));
      }
    }
    return list;
  }

  // ------------------------------------------------------------------- volume

  function chainFor(el) {
    let chain = chains.get(el);
    if (chain) return chain;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      chain = { ctx, gain, ok: true };
    } catch (err) {
      // Midia cross-origin sem CORS ou source ja criado: sem boost disponivel.
      chain = { ctx: null, gain: null, ok: false };
    }
    chains.set(el, chain);
    return chain;
  }

  function applyVolume(el, volume) {
    if (volume <= 1) {
      // Sem boost: caminho nativo, nao toca no WebAudio se ainda nao existe.
      const chain = chains.get(el);
      if (chain && chain.ok) chain.gain.gain.value = 1;
      el.volume = Math.max(0, volume);
      return;
    }

    const chain = chainFor(el);
    if (!chain.ok) {
      el.volume = 1; // fallback: no maximo o volume nativo
      return;
    }
    if (chain.ctx.state === "suspended") chain.ctx.resume().catch(() => {});
    el.volume = 1;
    chain.gain.gain.value = Math.min(volume, MAX_BOOST);
  }

  // ------------------------------------------------------------------ aplicar

  function applyTo(el) {
    try {
      if (el.playbackRate !== state.speed) el.playbackRate = state.speed;
      applyVolume(el, state.volume);
    } catch (_) {
      /* elemento removido */
    }
  }

  function applyAll() {
    for (const el of media()) applyTo(el);
  }

  // ---------------------------------------------------------- persistir/ler

  async function loadState() {
    const stored = await chrome.storage.local.get(["global", siteKey()]);
    const global = { ...DEFAULTS, ...(stored.global || {}) };
    const site = stored[siteKey()];
    Object.assign(state, global, global.rememberPerSite && site ? site : {});
    applyAll();
  }

  async function saveState() {
    const stored = await chrome.storage.local.get("global");
    const global = { ...DEFAULTS, ...(stored.global || {}) };
    const payload = { global: { ...global, speed: state.speed, volume: state.volume } };
    if (global.rememberPerSite) {
      payload[siteKey()] = { speed: state.speed, volume: state.volume };
    }
    await chrome.storage.local.set(payload);
  }

  // ------------------------------------------------------------------ overlay

  let overlayEl = null;
  let overlayTimer = null;

  function flash(text) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.style.cssText = [
        "position:fixed",
        "z-index:2147483647",
        "top:24px",
        "left:50%",
        "transform:translateX(-50%)",
        "padding:10px 18px",
        "border-radius:10px",
        "background:rgba(17,17,20,.9)",
        "color:#fff",
        "font:600 15px/1 system-ui,sans-serif",
        "pointer-events:none",
        "opacity:0",
        "transition:opacity .15s"
      ].join(";");
    }
    if (!overlayEl.isConnected) document.documentElement.appendChild(overlayEl);
    overlayEl.textContent = text;
    overlayEl.style.opacity = "1";
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => {
      overlayEl.style.opacity = "0";
    }, 900);
  }

  // ---------------------------------------------------------------- comandos

  function setSpeed(value) {
    state.speed = Math.min(16, Math.max(0.07, Math.round(value * 100) / 100));
    applyAll();
    saveState();
    flash(`${state.speed.toFixed(2)}x`);
  }

  function setVolume(value) {
    state.volume = Math.min(MAX_BOOST, Math.max(0, Math.round(value * 100) / 100));
    applyAll();
    saveState();
    flash(`Volume ${Math.round(state.volume * 100)}%`);
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.type) {
      case "get":
        sendResponse({
          speed: state.speed,
          volume: state.volume,
          count: media().length,
          boostAvailable: media().some((el) => {
            const c = chains.get(el);
            return !c || c.ok;
          })
        });
        break;
      case "setSpeed":
        setSpeed(msg.value);
        sendResponse({ ok: true, speed: state.speed });
        break;
      case "setVolume":
        setVolume(msg.value);
        sendResponse({ ok: true, volume: state.volume });
        break;
      case "nudgeSpeed":
        setSpeed(state.speed + msg.value);
        sendResponse({ ok: true, speed: state.speed });
        break;
      case "reload":
        loadState();
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false });
    }
    return true;
  });

  // ------------------------------------------------------------- observadores

  new MutationObserver(() => applyAll()).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Alguns players (YouTube SPA) trocam de video sem recarregar a pagina.
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      loadState();
    }
  }, 1000);

  loadState();
})();
