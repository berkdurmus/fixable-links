export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const colors = {
  // Primary colors
  background: '#FFFFFF',
  backgroundDark: '#0a0a0a',
  surface: '#F9FAFB',
  surfaceDark: '#1a1a1a',
  
  // Text colors
  textPrimary: '#130F18',
  textSecondary: '#646464',
  textMuted: '#9CA3AF',
  textWhite: '#FFFFFF',
  
  // Brand colors
  primary: '#10B981', // Mint green
  primaryHover: '#059669',
  primaryLight: 'rgba(16, 185, 129, 0.1)',
  
  // Selection colors
  selection: '#3B82F6',
  selectionLight: 'rgba(59, 130, 246, 0.1)',
  selectionBorder: '#3B82F6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Border colors
  border: '#E5E7EB',
  borderDark: '#2d2d2d',
  
  // Panel colors
  panelBackground: '#FFFFFF',
  panelBorder: '#E5E7EB',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  fontSizeXs: '11px',
  fontSizeSm: '12px',
  fontSizeBase: '13px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  fontSizeXl: '20px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
};

export const PANEL_WIDTH = 380;
