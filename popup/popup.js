const speedEl = document.getElementById("speed");
const volumeEl = document.getElementById("volume");
const speedOut = document.getElementById("speedOut");
const volumeOut = document.getElementById("volumeOut");
const statusEl = document.getElementById("status");
const perSiteEl = document.getElementById("perSite");

let tabId = null;

async function send(message) {
  if (tabId == null) return null;
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_) {
    statusEl.textContent = "sem video nesta aba";
    return null;
  }
}

function renderSpeed(value) {
  speedEl.value = Math.min(4, Math.max(0.25, value));
  speedOut.textContent = `${value.toFixed(2)}x`;
  markPresets("speed", value);
}

function renderVolume(value) {
  const pct = Math.round(value * 100);
  volumeEl.value = pct;
  volumeOut.textContent = `${pct}%`;
  markPresets("volume", pct);
}

function markPresets(target, value) {
  for (const btn of document.querySelectorAll(`.presets[data-target="${target}"] button`)) {
    btn.classList.toggle("active", Number(btn.dataset.value) === Number(value));
  }
}

speedEl.addEventListener("input", async () => {
  const value = Number(speedEl.value);
  renderSpeed(value);
  await send({ type: "setSpeed", value });
});

volumeEl.addEventListener("input", async () => {
  const value = Number(volumeEl.value) / 100;
  renderVolume(value);
  await send({ type: "setVolume", value });
});

for (const group of document.querySelectorAll(".presets")) {
  group.addEventListener("click", async (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    const raw = Number(btn.dataset.value);
    if (group.dataset.target === "speed") {
      renderSpeed(raw);
      await send({ type: "setSpeed", value: raw });
    } else {
      renderVolume(raw / 100);
      await send({ type: "setVolume", value: raw / 100 });
    }
  });
}

document.getElementById("reset").addEventListener("click", async () => {
  renderSpeed(1);
  renderVolume(1);
  await send({ type: "setSpeed", value: 1 });
  await send({ type: "setVolume", value: 1 });
});

perSiteEl.addEventListener("change", async () => {
  const { global = {} } = await chrome.storage.local.get("global");
  await chrome.storage.local.set({ global: { ...global, rememberPerSite: perSiteEl.checked } });
});

(async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id ?? null;

  const { global = {} } = await chrome.storage.local.get("global");
  perSiteEl.checked = global.rememberPerSite !== false;

  const info = await send({ type: "get" });
  if (!info) {
    renderSpeed(1);
    renderVolume(1);
    return;
  }
  renderSpeed(info.speed);
  renderVolume(info.volume);
  statusEl.textContent = info.count === 1 ? "1 midia" : `${info.count} midias`;
})();
