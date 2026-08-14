/**
 * Stub da API chrome.* para renderizar as imagens da loja fora da extensao.
 *
 * As paginas de captura carregam o codigo real (dist/content.js e o bundle da
 * tela de configuracao); so a camada de storage e falsa, para o navegador
 * comum nao quebrar em `chrome.storage`.
 *
 * Aceita ?corner=, ?showSpeed= e ?showVolume= para variar o estado exibido.
 */
(() => {
  const params = new URLSearchParams(location.search);
  const flag = (name, fallback) => {
    const value = params.get(name);
    return value === null ? fallback : value !== "false";
  };

  const settings = {
    showSpeed: flag("showSpeed", true),
    showVolume: flag("showVolume", true),
    corner: params.get("corner") || "bottom-left"
  };

  window.chrome = {
    storage: {
      local: {
        get: () => Promise.resolve({ settings }),
        set: () => Promise.resolve()
      },
      onChanged: { addListener() {}, removeListener() {} }
    },
    runtime: { onMessage: { addListener() {} } }
  };
})();
