export const themeConfig = {
  light: {
    background: '#f8fafb',
    surface: '#ffffff',
    surfaceHover: '#f1f4f6',
    text: '#252a33',
    textSecondary: '#6b7685',
    border: '#e5e9ed',
    brand: '#0d9e4a',
    brandLight: '#f0fdf6',
  },
  dark: {
    background: '#0d0f13',
    surface: '#171b22',
    surfaceHover: '#252a33',
    text: '#f1f4f6',
    textSecondary: '#9ba5b1',
    border: '#363d49',
    brand: '#16c05e',
    brandLight: '#032d17',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
