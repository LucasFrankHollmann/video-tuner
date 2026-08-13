import Presets from "./Presets.jsx";

/**
 * Bloco de controle: label + valor, slider e presets.
 * Trabalha sempre na unidade "de tela" (x para velocidade, % para volume);
 * a conversao fica no App.
 */
export default function Control({
  id,
  label,
  display,
  value,
  min,
  max,
  step,
  presets,
  onChange,
  hint
}) {
  return (
    <section className="control">
      <div className="row">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <Presets items={presets} value={value} onSelect={onChange} />
      {hint ? <p className="hint">{hint}</p> : null}
    </section>
  );
}
