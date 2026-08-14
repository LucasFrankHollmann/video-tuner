/** Video Tuner - service worker: atalhos de teclado globais. */

const STEP = 0.25;

chrome.commands.onCommand.addListener(async (command) => {
  // Sem permissao "tabs"/"activeTab" o query nao devolve url/title, mas o id
  // vem — e o sendMessage e autorizado pelo host_permissions <all_urls>.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const message =
    command === "speed-up"
      ? { type: "nudgeSpeed", value: STEP }
      : command === "speed-down"
        ? { type: "nudgeSpeed", value: -STEP }
        : { type: "resetSpeed" };

  try {
    // Vai para todos os frames; cada content script decide se tem um video alvo.
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (_) {
    // Sem content script na aba (chrome://, web store, etc.)
  }
});
