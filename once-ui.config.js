// once-ui.config.js
// Once UI configuration file

export const fonts = {
  primary: {
    variable: 'font-primary',
    family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  secondary: {
    variable: 'font-secondary', 
    family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  tertiary: {
    variable: 'font-tertiary',
    family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
  },
  code: {
    variable: 'font-code',
    family: 'JetBrains Mono, monospace',
  },
};

export const colors = {
  primary: 'hsl(222.2 47.4% 11.2%)',
  secondary: 'hsl(210 40% 96.1%)',
  accent: 'hsl(210 40% 96.1%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  muted: 'hsl(210 40% 96.1%)',
  border: 'hsl(194 9% 28%)',
};

export const theme = {
  fonts,
  colors,
  borderRadius: {
    DEFAULT: '8px',
  },
};

// Once UI style configuration for modern dark theme - Updated with new brand colors
export const style = {
  theme: "dark", // system | dark | light
  neutral: "gray", // sand | gray | slate
  brand: "gray", // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
  accent: "gray", // blue | indigo | violet | magenta | pink | red | orange | yellow | moss | green | emerald | aqua | cyan
  solid: "color", // color | contrast
  solidStyle: "flat", // flat | plastic
  border: "conservative", // rounded | playful | conservative
  surface: "translucent", // filled | translucent
  transition: "all", // all | micro | macro
  scaling: "100" // 90 | 95 | 100 | 105 | 110
};

// Data visualization configuration
export const dataStyle = {
  variant: "gradient", // flat | gradient | outline
  mode: "categorical", // categorical | divergent | sequential
  height: 24, // default chart height
  axis: {
    stroke: "var(--neutral-alpha-weak)",
  },
  tick: {
    fill: "var(--neutral-on-background-weak)",
    fontSize: 11,
    line: false
  }
}; 