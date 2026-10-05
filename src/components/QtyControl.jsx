export default function QtyControl({ value, min, step = 1, onChange, size = 'md' }) {
  const lot = step || 1;

  const decrease = () => {
    const next = Math.max(min, (Number(value) || min) - lot);
    onChange(next);
  };

  const increase = () => {
    onChange((Number(value) || min) + lot);
  };

  const handleInput = (e) => {
    const n = parseInt(e.target.value, 10);
    if (!Number.isNaN(n)) onChange(n);
  };

  return (
    <div className={`qty-control${size === 'sm' ? ' qty-sm' : ''}`}>
      <button type="button" onClick={decrease} aria-label="Decrease">
        −
      </button>
      <input
        type="number"
        min={min}
        step={lot}
        value={value}
        onChange={handleInput}
      />
      <button type="button" onClick={increase} aria-label="Increase">
        +
      </button>
    </div>
  );
}
