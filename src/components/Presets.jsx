export default function Presets({ items, value, onSelect }) {
  return (
    <div className="presets">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={Number(item.value) === Number(value) ? "active" : ""}
          onClick={() => onSelect(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
