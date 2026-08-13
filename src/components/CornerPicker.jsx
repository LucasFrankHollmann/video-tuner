import { CORNERS } from "../settings.js";

/** Grade 2x2 espelhando os cantos do video. */
export default function CornerPicker({ value, onChange }) {
  return (
    <div className="corners" role="radiogroup" aria-label="Canto do overlay">
      {CORNERS.map((corner) => (
        <button
          key={corner.value}
          type="button"
          role="radio"
          aria-checked={corner.value === value}
          className={`corner${corner.value === value ? " active" : ""}`}
          onClick={() => onChange(corner.value)}
        >
          <span className={`corner-dot corner-${corner.value}`} />
          {corner.label}
        </button>
      ))}
    </div>
  );
}
