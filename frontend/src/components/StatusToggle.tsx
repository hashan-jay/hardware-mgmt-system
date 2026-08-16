interface Props {
  value: 'Working' | 'NotWorking';
  onChange: (value: 'Working' | 'NotWorking') => void;
  disabled?: boolean;
}

export default function StatusToggle({ value, onChange, disabled }: Props) {
  const isWorking = value === 'Working';

  return (
    <div className="relative grid grid-cols-2 rounded-full bg-[var(--bg)] p-1">
      <span
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-out ${
          isWorking ? 'left-1 bg-[var(--ok)]' : 'left-[calc(50%+0px)] bg-[var(--danger)]'
        }`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('Working')}
        className={`relative z-10 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${
          isWorking ? 'text-white' : 'text-[var(--muted)]'
        }`}
      >
        Working
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('NotWorking')}
        className={`relative z-10 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${
          isWorking ? 'text-[var(--muted)]' : 'text-white'
        }`}
      >
        Not Working
      </button>
    </div>
  );
}
