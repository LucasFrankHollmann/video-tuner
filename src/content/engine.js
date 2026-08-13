/**
 * Video Tuner - motor do content script.
 *
 * Velocidade e volume sao **por video**: cada elemento tem seu proprio ajuste e
 * nada e persistido. Um video que nunca foi ajustado nao e tocado — segue o
 * padrao do proprio site.
 */

const MAX_BOOST = 6;

/** Ajustes explicitos feitos pelo usuario. Ausencia = video no padrao do site. */
const tuned = new WeakMap();
/** Valores de antes do primeiro ajuste, para o "voltar ao padrao" ser fiel. */
const original = new WeakMap();
/** @type {WeakMap<HTMLMediaElement, {ctx: AudioContext, gain: GainNode, ok: boolean}>} */
const chains = new WeakMap();
/** @type {WeakMap<HTMLMediaElement, {speed: number, volume: number}>} */
const inherited = new WeakMap();
/** @type {Set<HTMLMediaElement>} */
const known = new Set();

// Ultimo video tocado (hover ou ajuste): alvo dos atalhos de teclado.
let focused = null;

// ------------------------------------------------------------------ store

const listeners = new Set();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Estado de um video. Sem ajuste explicito, reflete o que o proprio player
 * esta usando. O objeto e memoizado porque o React compara por referencia.
 */
function getState(el) {
  const own = tuned.get(el);
  if (own) return own;

  const speed = el.playbackRate;
  const volume = Math.min(el.volume, MAX_BOOST);
  const cached = inherited.get(el);
  if (cached && cached.speed === speed && cached.volume === volume) return cached;

  const next = { speed, volume, fromSite: true };
  inherited.set(el, next);
  return next;
}

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

/** Ultimo resultado de media(): a varredura completa e caro demais por frame. */
let mediaCache = [];

function media() {
  const list = collect();
  mediaCache = list;
  for (const el of list) {
    if (known.has(el)) continue;
    known.add(el);

    // Sites como o YouTube reescrevem playbackRate ao trocar de video.
    el.addEventListener("loadeddata", () => applyTo(el));
    el.addEventListener("play", () => applyTo(el));
    // O player mudou por conta propria: o overlay precisa refletir.
    el.addEventListener("ratechange", notify);
    el.addEventListener("volumechange", notify);
    // Elemento reaproveitado para outra midia (navegacao em SPA): o ajuste era
    // daquele video, nao deste.
    el.addEventListener("emptied", () => {
      original.delete(el);
      if (tuned.delete(el)) notify();
    });
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
  const own = tuned.get(el);
  if (!own) return; // video sem ajuste: nao mexemos no que o site definiu
  try {
    if (el.playbackRate !== own.speed) el.playbackRate = own.speed;
    applyVolume(el, own.volume);
  } catch (_) {
    /* elemento removido */
  }
}

function applyAll() {
  for (const el of media()) applyTo(el);
}

// ---------------------------------------------------------------- comandos

function tune(el, patch) {
  if (!el) return;
  const current = getState(el);
  if (!original.has(el)) {
    original.set(el, { speed: el.playbackRate, volume: el.volume });
  }
  tuned.set(el, {
    speed: patch.speed ?? current.speed,
    volume: patch.volume ?? current.volume
  });
  focused = el;
  applyTo(el);
  notify();
}

function setSpeed(el, value) {
  tune(el, { speed: Math.min(16, Math.max(0.07, Math.round(value * 100) / 100)) });
}

function setVolume(el, value) {
  tune(el, { volume: Math.min(MAX_BOOST, Math.max(0, Math.round(value * 100) / 100)) });
}

function reset(el) {
  if (!el || !tuned.has(el)) return;
  const before = original.get(el) || { speed: 1, volume: 1 };
  tuned.delete(el);
  original.delete(el);
  try {
    el.playbackRate = before.speed;
    applyVolume(el, before.volume); // tambem zera o ganho do WebAudio
  } catch (_) {
    /* elemento removido */
  }
  notify();
}

// ------------------------------------------------------------------ overlay

let flashEl = null;
let flashTimer = null;

function flash(text) {
  if (!flashEl) {
    flashEl = document.createElement("div");
    flashEl.style.cssText = [
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
  if (!flashEl.isConnected) document.documentElement.appendChild(flashEl);
  flashEl.textContent = text;
  flashEl.style.opacity = "1";
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    flashEl.style.opacity = "0";
  }, 900);
}

// ------------------------------------------------------------------- atalhos

/**
 * Alvo dos atalhos: o video sob o ponteiro; na falta dele, o maior video
 * visivel que esteja tocando.
 */
function shortcutTarget() {
  if (focused && focused.isConnected) return focused;

  let best = null;
  let bestArea = 0;
  for (const el of media()) {
    if (el.tagName !== "VIDEO" || el.paused) continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
    const area = rect.width * rect.height;
    if (area > bestArea) {
      best = el;
      bestArea = area;
    }
  }
  return best;
}

function listenForMessages() {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const target = shortcutTarget();
    if (!target) {
      sendResponse({ ok: false });
      return true;
    }

    switch (msg.type) {
      case "nudgeSpeed":
        setSpeed(target, getState(target).speed + msg.value);
        flash(`${getState(target).speed.toFixed(2)}x`);
        sendResponse({ ok: true, speed: getState(target).speed });
        break;
      case "resetSpeed":
        setSpeed(target, 1);
        flash("1.00x");
        sendResponse({ ok: true, speed: 1 });
        break;
      default:
        sendResponse({ ok: false });
    }
    return true;
  });
}

function watchDom() {
  new MutationObserver(() => applyAll()).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

export function start() {
  listenForMessages();
  watchDom();
  media();
}

export const engine = {
  MAX_BOOST,
  subscribe,
  getState,
  setSpeed,
  setVolume,
  reset,
  focus: (el) => {
    focused = el;
  },
  // Lista ja conhecida, sem revarrer o DOM. O MutationObserver mantem
  // atualizada, entao serve para o hit test do overlay a cada frame.
  cachedMedia: () => mediaCache
};
