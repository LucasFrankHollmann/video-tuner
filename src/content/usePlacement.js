import { useEffect } from "react";

const MARGIN = 12;

/** O div absoluto precisa de um bloco de contencao: se o pai for static, viramos relative. */
function ensurePositioned(el) {
  if (getComputedStyle(el).position !== "static") return () => {};
  const previous = el.style.position;
  el.style.position = "relative";
  return () => {
    el.style.position = previous;
  };
}

/**
 * Coloca o div do overlay no canto pedido do video.
 *
 * O div e reparentado para o container do video e posicionado com
 * position:absolute — como o offset e relativo ao pai, scroll da pagina e
 * fullscreen nao exigem recalculo; so mudanca de layout, coberta pelos
 * ResizeObserver.
 *
 * @param {HTMLElement} hostEl
 * @param {HTMLVideoElement | null} video video ativo (null esconde o overlay)
 * @param {string} corner top-left | top-right | bottom-left | bottom-right
 */
export function usePlacement(hostEl, video, corner) {
  useEffect(() => {
    const parent = video?.parentElement;
    if (!video || !parent) {
      hostEl.style.display = "none";
      return undefined;
    }

    const restorePosition = ensurePositioned(parent);
    if (hostEl.parentNode !== parent) parent.appendChild(hostEl);
    hostEl.style.display = "block";

    const place = () => {
      const box = video.getBoundingClientRect();
      const host = parent.getBoundingClientRect();
      // Offset do video dentro do pai, em coordenadas do pai.
      const left = box.left - host.left + parent.scrollLeft;
      const top = box.top - host.top + parent.scrollTop;
      const [vertical, horizontal] = corner.split("-");

      if (horizontal === "left") {
        hostEl.style.left = `${Math.round(left + MARGIN)}px`;
        hostEl.style.right = "auto";
      } else {
        hostEl.style.left = "auto";
        hostEl.style.right = `${Math.round(host.width - (left + box.width) + MARGIN)}px`;
      }

      if (vertical === "top") {
        hostEl.style.top = `${Math.round(top + MARGIN)}px`;
        hostEl.style.bottom = "auto";
      } else {
        hostEl.style.top = "auto";
        hostEl.style.bottom = `${Math.round(host.height - (top + box.height) + MARGIN)}px`;
      }
    };

    place();

    const observer = new ResizeObserver(place);
    observer.observe(video);
    observer.observe(parent);
    window.addEventListener("resize", place);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      restorePosition();
    };
  }, [hostEl, video, corner]);
}
