import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="group inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--veyra-line)] bg-[var(--veyra-surface)] px-2.5 text-xs font-semibold text-[var(--veyra-ink-soft)] shadow-sm transition-all duration-150 hover:border-[var(--veyra-line-strong)] hover:bg-[var(--veyra-paper-deep)] hover:text-[var(--veyra-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--veyra-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--veyra-paper)]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--veyra-line)] bg-[var(--veyra-paper-deep)] text-[var(--veyra-ink)] transition-colors group-hover:border-[var(--veyra-line-strong)]">
        {isDark ? (
          <Sun
            className="h-3.5 w-3.5"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ) : (
          <Moon
            className="h-3.5 w-3.5"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        )}
      </span>

      <span className="hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}