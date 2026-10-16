import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-surface)] px-2.5 text-xs font-semibold text-[var(--veyra-ink-soft)] shadow-sm transition-colors hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--veyra-ring)]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--veyra-line)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)]">
        {isDark ? (
          <Sun className="h-3.5 w-3.5" />
        ) : (
          <Moon className="h-3.5 w-3.5" />
        )}
      </span>

      <span className="hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}