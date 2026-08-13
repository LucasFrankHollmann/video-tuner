import { useEffect, useState } from "react";
import { engine } from "./engine.js";

// Videos menores que isso sao quase sempre thumbnails/anuncios: nao ganham overlay.
const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;
// Folga para o ponteiro atravessar o vao entre o video e o painel.
const HIDE_DELAY = 260;

const inside = (rect, x, y) =>
  rect.width > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

/**
 * Descobre qual video esta sob o ponteiro.
 *
 * O teste e geometrico (e nao pelo composedPath do evento) porque players
 * cobrem o video com barras de controle proprias — pelo path o overlay
 * sumiria assim que o mouse encostasse nos controles do site.
 *
 * @param {HTMLElement} hostEl div do overlay: manter o ponteiro sobre ele
 *   preserva o video ativo.
 */
export function useHoveredVideo(hostEl) {
  const [video, setVideo] = useState(null);

  useEffect(() => {
    let point = { x: -1, y: -1 };
    let queued = false;
    let hideTimer = null;

    const cancelHide = () => {
      clearTimeout(hideTimer);
      hideTimer = null;
    };

    const scheduleHide = () => {
      if (hideTimer) return;
      hideTimer = setTimeout(() => {
        hideTimer = null;
        setVideo(null);
      }, HIDE_DELAY);
    };

    function evaluate() {
      const { x, y } = point;

      if (inside(hostEl.getBoundingClientRect(), x, y)) {
        cancelHide();
        return;
      }

      let best = null;
      let bestArea = Infinity;
      for (const el of engine.cachedMedia()) {
        if (el.tagName !== "VIDEO") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < MIN_WIDTH || rect.height < MIN_HEIGHT) continue;
        if (!inside(rect, x, y)) continue;
        const area = rect.width * rect.height;
        // Video-em-video: o menor e o que esta de fato sob o ponteiro.
        if (area < bestArea) {
          best = el;
          bestArea = area;
        }
      }

      if (best) {
        cancelHide();
        engine.focus(best);
        setVideo((current) => (current === best ? current : best));
      } else {
        scheduleHide();
      }
    }

    const onMove = (event) => {
      point = { x: event.clientX, y: event.clientY };
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        evaluate();
      });
    };

    const onLeave = () => scheduleHide();

    document.addEventListener("pointermove", onMove, true);
    // Sem capture e no <html>: dispara so quando o ponteiro deixa a janela.
    // Com capture no document, cada saida de elemento interno agendaria o hide.
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove, true);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      cancelHide();
    };
  }, [hostEl]);

  return video;
}
