import CornerPicker from "../components/CornerPicker.jsx";
import Toggle from "../components/Toggle.jsx";
import { useSettings } from "../useSettings.js";

export default function App() {
  const { settings, loaded, update } = useSettings();

  return (
    <div className={loaded ? "" : "loading"}>
      <header>
        <h1>Video Tuner</h1>
        <span className="status">configuracao</span>
      </header>

      <section className="group">
        <h2>Controles no overlay</h2>
        <Toggle
          id="showSpeed"
          label="Velocidade"
          hint="0.25x a 8x"
          checked={settings.showSpeed}
          onChange={(showSpeed) => update({ showSpeed })}
        />
        <Toggle
          id="showVolume"
          label="Volume"
          hint="0% a 600% (acima de 100% via WebAudio)"
          checked={settings.showVolume}
          onChange={(showVolume) => update({ showVolume })}
        />
        {!settings.showSpeed && !settings.showVolume ? (
          <p className="warn">Sem nenhum controle marcado, o overlay nao aparece.</p>
        ) : null}
      </section>

      <section className="group">
        <h2>Canto do overlay</h2>
        <CornerPicker value={settings.corner} onChange={(corner) => update({ corner })} />
      </section>

      <p className="hint">
        O ajuste vale so para o video em que foi feito — os outros seguem o padrao do site. Passe o
        mouse sobre um video para ver o overlay e sobre o overlay para expandir.
      </p>
    </div>
  );
}
