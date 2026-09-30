"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const selected = mounted && (theme === "dark" || theme === "light") ? theme : "system";
  const Icon = selected === "dark" ? Moon : selected === "light" ? Sun : Monitor;
  return (
    <div className="relative flex min-h-10 items-center rounded-lg border border-border bg-card text-muted-foreground">
      <Icon aria-hidden="true" className="pointer-events-none absolute left-3 size-4" />
      <select aria-label="Color theme" disabled={!mounted} value={selected} onChange={event => setTheme(event.target.value)} className="h-10 max-w-[7.5rem] cursor-pointer rounded-lg bg-transparent pl-9 pr-2 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait">
        <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
      </select>
    </div>
  );
}
