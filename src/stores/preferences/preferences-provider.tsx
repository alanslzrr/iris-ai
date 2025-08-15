"use client"

import { useEffect } from "react"
import { usePreferencesStore } from "./preferences-store"
import { updateThemeMode, updateThemePreset } from "@/lib/theme-utils"

interface PreferencesProviderProps {
  children: React.ReactNode
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { themeMode, themePreset } = usePreferencesStore()

  useEffect(() => {
    updateThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    updateThemePreset(themePreset)
  }, [themePreset])

  return <>{children}</>
} 