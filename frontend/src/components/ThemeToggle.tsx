import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className="inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 shadow-lg backdrop-blur"
      >
        {isDark ? (
          <Moon size={16} className="text-[var(--brand)]" />
        ) : (
          <Sun size={16} className="text-[var(--accent)]" />
        )}
        <span className="text-sm font-medium text-[var(--ink)]">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        <span
          className={`relative block h-6 w-10 shrink-0 overflow-hidden rounded-full transition-colors duration-300 ${
            isDark ? 'bg-[var(--brand)]' : 'bg-[var(--line)]'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left,right] duration-300 ${
              isDark ? 'right-0.5 left-auto' : 'left-0.5 right-auto'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
