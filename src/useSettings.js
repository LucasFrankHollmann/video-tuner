import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, readSettings, watchSettings, writeSettings } from "./settings.js";

/** Configuracao global reativa, compartilhada pelo popup e pelo overlay. */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    readSettings().then((value) => {
      if (!alive) return;
      setSettings(value);
      setLoaded(true);
    });
    const unwatch = watchSettings((value) => {
      if (alive) setSettings(value);
    });
    return () => {
      alive = false;
      unwatch();
    };
  }, []);

  // O storage devolve o valor novo pelo watchSettings, mas atualizamos aqui
  // tambem para a UI nao esperar o round-trip.
  const update = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }));
    writeSettings(patch);
  }, []);

  return { settings, loaded, update };
}
