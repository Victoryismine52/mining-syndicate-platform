export type ThemeMode = 'light' | 'dark' | 'fu';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  accentBlue: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface ThemeDefinition {
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  gradients?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  effects?: {
    glow?: string;
    shadow?: string;
    blur?: string;
  };
}

export interface ThemeContextType {
  currentTheme: ThemeMode;
  themes: Record<ThemeMode, ThemeDefinition>;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isFu: boolean;
}