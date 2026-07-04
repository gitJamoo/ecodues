"use client";

interface Charity { id: string; name: string; description: string; category: string }

interface CharityPickerProps {
  charities: Charity[];
  value: string | null;
  onChange: (id: string) => void;
}

export function CharityPicker({ charities, value, onChange }: CharityPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {charities.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`text-left rounded-xl border p-4 transition-colors ${
            value === c.id
              ? "border-primary ring-1 ring-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium leading-snug">{c.name}</p>
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">{c.category}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
        </button>
      ))}
    </div>
  );
}
