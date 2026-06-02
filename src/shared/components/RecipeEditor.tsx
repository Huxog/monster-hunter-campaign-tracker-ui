import { Select, Input } from './Field';

export interface RecipeEntry {
  id: string;
  quantity: number;
}

interface RecipeEditorProps {
  value: RecipeEntry[];
  onChange: (entries: RecipeEntry[]) => void;
  materials: { id: string; name: string }[];
}

export function RecipeEditor({ value, onChange, materials }: RecipeEditorProps) {
  const usedIds = new Set(value.map((r) => r.id));

  function addRow() {
    const next = materials.find((m) => !usedIds.has(m.id));
    if (!next) return;
    onChange([...value, { id: next.id, quantity: 1 }]);
  }

  function updateId(index: number, id: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, id } : row)));
  }

  function updateQuantity(index: number, qty: number) {
    onChange(
      value.map((row, i) => (i === index ? { ...row, quantity: Math.max(1, qty || 1) } : row)),
    );
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const canAdd = materials.some((m) => !usedIds.has(m.id));

  if (materials.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        No materials available — add some first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              theme="light"
              value={row.id}
              onChange={(e) => updateId(i, e.target.value)}
            >
              {materials.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  disabled={usedIds.has(m.id) && m.id !== row.id}
                >
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-24 shrink-0">
            <Input
              theme="light"
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) => updateQuantity(i, parseInt(e.target.value, 10))}
              aria-label="Quantity"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="shrink-0 rounded p-1.5 text-muted transition-colors hover:bg-ember/10 hover:text-ember"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={!canAdd}
        className="mt-1 w-fit rounded px-3 py-1.5 text-xs font-medium text-primary border border-primary/20 transition-colors hover:bg-surface hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add material
      </button>
    </div>
  );
}
