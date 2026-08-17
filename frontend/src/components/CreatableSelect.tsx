import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

export interface SelectOption {
  id: number;
  label: string;
}

interface Props {
  label?: string;
  placeholder: string;
  options: SelectOption[];
  value: number | null;
  disabled?: boolean;
  addLabel: string;
  onChange: (id: number | null) => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CreatableSelect({
  label,
  placeholder,
  options,
  value,
  disabled,
  addLabel,
  onChange,
  onCreate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.id === value);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const startAdding = () => {
    setOpen(false);
    setAdding(true);
    setCreateError('');
  };

  const cancelAdding = () => {
    setAdding(false);
    setNewName('');
    setCreateError('');
  };

  const saveNew = async () => {
    const name = newName.trim();
    if (!name || busy) return;

    const existing = options.find((option) => option.label.toLowerCase() === name.toLowerCase());
    if (existing) {
      onChange(existing.id);
      cancelAdding();
      return;
    }

    setBusy(true);
    setCreateError('');
    try {
      await onCreate(name);
      cancelAdding();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Could not add ${label?.toLowerCase() || 'item'}.`;
      setCreateError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-[180px] flex-1">
      {label ? <span className="mb-1 block text-sm font-medium">{label}</span> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-left disabled:cursor-not-allowed disabled:bg-[var(--bg)] disabled:text-[var(--muted)]"
      >
        <span className={selected ? '' : 'text-[var(--muted)]'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className="shrink-0 text-[var(--muted)]" />
      </button>

      {open && !disabled && (
        <div className="absolute z-40 mt-1 w-full min-w-[220px] overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--muted)]">Nothing saved yet. Add one below.</p>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setAdding(false);
                    setCreateError('');
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg)] ${
                    option.id === value ? 'bg-[rgba(15,107,92,0.08)] font-medium text-[var(--brand)]' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-[var(--line)] p-2">
            <button
              type="button"
              onClick={startAdding}
              className="inline-flex items-center gap-1 text-sm text-[var(--brand)] hover:underline"
            >
              <Plus size={14} /> {addLabel}
            </button>
          </div>
        </div>
      )}

      {adding && !disabled && (
        <div className="mt-2 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] p-2">
          <input
            ref={inputRef}
            className="w-full rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
            placeholder={`New ${label?.toLowerCase() || 'item'} name`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                void saveNew();
              }
              if (e.key === 'Escape') cancelAdding();
            }}
          />
          {createError && <p className="text-xs text-[var(--danger)]">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={() => void saveNew()}
              className="rounded-md bg-[var(--brand)] px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelAdding}
              className="rounded-md border border-[var(--line)] bg-white px-2 py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
