import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
        isLight
          ? 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
          : 'border-white/10 bg-white/[0.05] text-amber-300 hover:bg-white/10',
        className,
      )}
    >
      {isLight ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
    </button>
  )
}


