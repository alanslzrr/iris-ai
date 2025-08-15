import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ThemeMode = "light" | "dark"
export type ThemePreset = "default" | "brutalist" | "soft-pop" | "tangerine"
export type SidebarVariant = "sidebar" | "floating" | "inset"
export type SidebarCollapsible = "offcanvas" | "icon" | "none"
export type ContentLayout = "centered" | "full"

export const THEME_MODE_VALUES: ThemeMode[] = ["light", "dark"]
export const THEME_PRESET_VALUES: ThemePreset[] = ["default", "brutalist", "soft-pop", "tangerine"]
export const SIDEBAR_VARIANT_VALUES: SidebarVariant[] = ["sidebar", "floating", "inset"]
export const SIDEBAR_COLLAPSIBLE_VALUES: SidebarCollapsible[] = ["offcanvas", "icon", "none"]
export const CONTENT_LAYOUT_VALUES: ContentLayout[] = ["centered", "full"]

interface PreferencesState {
  themeMode: ThemeMode
  themePreset: ThemePreset
  sidebarVariant: SidebarVariant
  sidebarCollapsible: SidebarCollapsible
  contentLayout: ContentLayout
  setThemeMode: (mode: ThemeMode) => void
  setThemePreset: (preset: ThemePreset) => void
  setSidebarVariant: (variant: SidebarVariant) => void
  setSidebarCollapsible: (collapsible: SidebarCollapsible) => void
  setContentLayout: (layout: ContentLayout) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      themeMode: "light",
      themePreset: "default",
      sidebarVariant: "sidebar",
      sidebarCollapsible: "icon",
      contentLayout: "centered",
      setThemeMode: (themeMode) => set({ themeMode }),
      setThemePreset: (themePreset) => set({ themePreset }),
      setSidebarVariant: (sidebarVariant) => set({ sidebarVariant }),
      setSidebarCollapsible: (sidebarCollapsible) => set({ sidebarCollapsible }),
      setContentLayout: (contentLayout) => set({ contentLayout }),
    }),
    {
      name: "preferences",
    }
  )
) 