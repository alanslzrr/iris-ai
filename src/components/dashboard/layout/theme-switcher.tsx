"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateThemeMode } from "@/lib/theme-utils";
import { usePreferencesStore } from "@/stores/preferences/preferences-store";

export function ThemeSwitcher() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const handleValueChange = async () => {
    const newTheme = themeMode === "dark" ? "light" : "dark";
    updateThemeMode(newTheme);
    setThemeMode(newTheme);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
      onClick={handleValueChange}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
} 