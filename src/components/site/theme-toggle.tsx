'use client'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return <button type="button" aria-label="Гэрэлтэй эсвэл харанхуй горимд шилжүүлэх" title="Гэрэлтэй / харанхуй горим" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="grid size-9 shrink-0 place-items-center rounded-full text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-blue-500"><Moon className="size-5 dark:hidden" /><Sun className="hidden size-5 dark:block" /></button>
}
