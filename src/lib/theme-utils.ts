"use client"

export function updateThemeMode(mode: "light" | "dark") {
  const root = document.documentElement
  
  if (mode === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function updateThemePreset(preset: string) {
  const root = document.documentElement
  
  // Remove all existing theme presets
  root.removeAttribute("data-theme-preset")
  
  // Add the new theme preset if it's not "default"
  if (preset !== "default") {
    root.setAttribute("data-theme-preset", preset)
  }
}

export function getThemeMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function getThemePreset(): string {
  if (typeof window === "undefined") return "default"
  return document.documentElement.getAttribute("data-theme-preset") || "default"
} 