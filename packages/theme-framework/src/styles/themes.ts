import { ThemeDefinition, ThemeMode } from '../types/theme';

export const lightTheme: ThemeDefinition = {
  name: 'Light',
  mode: 'light' as ThemeMode,
  colors: {
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222.2, 84%, 4.9%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(222.2, 84%, 4.9%)',
    popover: 'hsl(0, 0%, 100%)',
    popoverForeground: 'hsl(222.2, 84%, 4.9%)',
    primary: 'hsl(222.2, 47.4%, 11.2%)',
    primaryForeground: 'hsl(210, 40%, 98%)',
    secondary: 'hsl(210, 40%, 96%)',
    secondaryForeground: 'hsl(222.2, 84%, 4.9%)',
    muted: 'hsl(210, 40%, 96%)',
    mutedForeground: 'hsl(215.4, 16.3%, 46.9%)',
    accent: 'hsl(168, 100%, 42%)',
    accentForeground: 'hsl(0, 0%, 100%)',
    accentBlue: 'hsl(198, 100%, 40%)',
    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(210, 40%, 98%)',
    border: 'hsl(214.3, 31.8%, 91.4%)',
    input: 'hsl(214.3, 31.8%, 91.4%)',
    ring: 'hsl(168, 100%, 42%)',
    sidebar: 'hsl(0, 0%, 98%)',
    sidebarForeground: 'hsl(222.2, 84%, 4.9%)',
    sidebarPrimary: 'hsl(168, 100%, 42%)',
    sidebarPrimaryForeground: 'hsl(0, 0%, 100%)',
    sidebarAccent: 'hsl(210, 40%, 96%)',
    sidebarAccentForeground: 'hsl(222.2, 84%, 4.9%)',
    sidebarBorder: 'hsl(214.3, 31.8%, 91.4%)',
    sidebarRing: 'hsl(168, 100%, 42%)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, hsl(168, 100%, 42%) 0%, hsl(198, 100%, 40%) 100%)',
    secondary: 'linear-gradient(135deg, hsl(210, 40%, 96%) 0%, hsl(214.3, 31.8%, 91.4%) 100%)',
    accent: 'linear-gradient(135deg, hsl(168, 100%, 42%) 0%, hsl(198, 100%, 40%) 100%)',
  },
  effects: {
    glow: '0 0 20px hsla(168, 100%, 42%, 0.3)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    blur: 'blur(8px)',
  },
};

export const darkTheme: ThemeDefinition = {
  name: 'Dark',
  mode: 'dark' as ThemeMode,
  colors: {
    background: 'hsl(218, 87%, 9%)',
    foreground: 'hsl(0, 0%, 100%)',
    card: 'hsl(235, 30%, 22%)',
    cardForeground: 'hsl(0, 0%, 100%)',
    popover: 'hsl(218, 87%, 9%)',
    popoverForeground: 'hsl(0, 0%, 100%)',
    primary: 'hsl(218, 87%, 9%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(235, 35%, 16%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(226, 19%, 43%)',
    mutedForeground: 'hsl(0, 0%, 85%)',
    accent: 'hsl(168, 100%, 42%)',
    accentForeground: 'hsl(0, 0%, 0%)',
    accentBlue: 'hsl(198, 100%, 40%)',
    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(226, 19%, 43%)',
    input: 'hsl(235, 30%, 22%)',
    ring: 'hsl(168, 100%, 42%)',
    sidebar: 'hsl(235, 30%, 22%)',
    sidebarForeground: 'hsl(0, 0%, 100%)',
    sidebarPrimary: 'hsl(168, 100%, 42%)',
    sidebarPrimaryForeground: 'hsl(0, 0%, 0%)',
    sidebarAccent: 'hsl(235, 35%, 16%)',
    sidebarAccentForeground: 'hsl(168, 100%, 42%)',
    sidebarBorder: 'hsl(226, 19%, 43%)',
    sidebarRing: 'hsl(168, 100%, 42%)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, hsl(235, 30%, 22%) 0%, hsl(235, 35%, 16%) 100%)',
    secondary: 'linear-gradient(135deg, hsl(226, 19%, 43%) 0%, hsl(235, 35%, 16%) 100%)',
    accent: 'linear-gradient(135deg, hsl(168, 100%, 42%) 0%, hsl(198, 100%, 40%) 100%)',
  },
  effects: {
    glow: '0 0 20px hsla(168, 100%, 42%, 0.4)',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    blur: 'blur(12px)',
  },
};

export const fuTheme: ThemeDefinition = {
  name: 'FU (PitchMe)',
  mode: 'fu' as ThemeMode,
  colors: {
    background: 'hsl(240, 10%, 3.9%)',
    foreground: 'hsl(0, 0%, 100%)',
    card: 'hsl(240, 10%, 7%)',
    cardForeground: 'hsl(0, 0%, 100%)',
    popover: 'hsl(240, 10%, 3.9%)',
    popoverForeground: 'hsl(0, 0%, 100%)',
    primary: 'hsl(271, 91%, 65%)', // Electric purple
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(240, 10%, 7%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(240, 5%, 15%)',
    mutedForeground: 'hsl(240, 5%, 65%)',
    accent: 'hsl(198, 100%, 50%)', // Electric blue
    accentForeground: 'hsl(0, 0%, 0%)',
    accentBlue: 'hsl(198, 100%, 50%)',
    destructive: 'hsl(0, 84%, 60%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
    border: 'hsl(240, 10%, 15%)',
    input: 'hsl(240, 10%, 7%)',
    ring: 'hsl(271, 91%, 65%)',
    sidebar: 'hsl(240, 10%, 7%)',
    sidebarForeground: 'hsl(0, 0%, 100%)',
    sidebarPrimary: 'hsl(271, 91%, 65%)',
    sidebarPrimaryForeground: 'hsl(0, 0%, 100%)',
    sidebarAccent: 'hsl(240, 10%, 15%)',
    sidebarAccentForeground: 'hsl(198, 100%, 50%)',
    sidebarBorder: 'hsl(240, 10%, 15%)',
    sidebarRing: 'hsl(271, 91%, 65%)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, hsl(198, 100%, 50%) 0%, hsl(271, 91%, 65%) 100%)', // Blue to Pink
    secondary: 'linear-gradient(135deg, hsl(271, 91%, 65%) 0%, hsl(328, 85%, 60%) 100%)', // Purple to Pink
    accent: 'linear-gradient(135deg, hsl(198, 100%, 50%) 0%, hsl(271, 91%, 65%) 50%, hsl(328, 85%, 60%) 100%)', // Full spectrum
  },
  effects: {
    glow: '0 0 30px hsla(271, 91%, 65%, 0.6), 0 0 60px hsla(198, 100%, 50%, 0.4)',
    shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    blur: 'blur(16px)',
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  fu: fuTheme,
} as const;

export const themeOrder: ThemeMode[] = ['light', 'dark', 'fu'];