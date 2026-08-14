/**
 * Ajustes validos apenas dentro do harness de captura (scripts/render-assets.ps1).
 *
 * No Chrome headless com --virtual-time-budget nao ha frames de compositor, e
 * requestAnimationFrame nunca dispara. O hit test do overlay agenda o trabalho
 * em rAF, entao sem isso o overlay nunca apareceria nas imagens. Trocar por
 * setTimeout mantem o comportamento e roda no tempo virtual.
 *
 * Nada aqui vai para a extensao: e carregado so pelas paginas de assets/.
 */
(() => {
  window.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(performance.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
})();
