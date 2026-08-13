/** Video Tuner - service worker: atalhos de teclado globais. */

const STEP = 0.25;

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const message =
    command === "speed-up"
      ? { type: "nudgeSpeed", value: STEP }
      : command === "speed-down"
        ? { type: "nudgeSpeed", value: -STEP }
        : { type: "setSpeed", value: 1 };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (_) {
    // Sem content script na aba (chrome://, web store, etc.)
  }
});
