// Design System Colors
export const colors = {
  // Primary colors
  primaryText: '#130F18',
  secondaryText: '#646464',
  tertiaryText: '#9CA3AF',
  
  // Action colors
  primaryAction: '#10B981', // Mint green
  primaryActionHover: '#059669',
  
  // Selection colors
  selectionBorder: '#3B82F6', // Blue
  selectionBorderHover: '#60A5FA',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundHover: '#F3F4F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  statusOpen: '#10B981',
  statusClosed: '#EF4444',
  statusMerged: '#8B5CF6',
  
  // Element type colors
  elementBadge: '#F3F4F6',
} as const;

// Typography
export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  sizes: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
  },
  
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeights: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
} as const;

// Border radius
export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// Z-index layers
export const zIndex = {
  overlay: 10000,
  tooltip: 10001,
  modal: 10002,
} as const;

// API endpoints
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.plsfix-clone.com' 
  : 'http://localhost:3001';

// Element type labels
export const elementTypeLabels: Record<string, string> = {
  H1: 'Heading 1',
  H2: 'Heading 2',
  H3: 'Heading 3',
  H4: 'Heading 4',
  H5: 'Heading 5',
  H6: 'Heading 6',
  P: 'Paragraph',
  SPAN: 'Text',
  DIV: 'Container',
  A: 'Link',
  BUTTON: 'Button',
  IMG: 'Image',
  INPUT: 'Input',
  TEXTAREA: 'Text Area',
  SELECT: 'Select',
  UL: 'List',
  OL: 'Ordered List',
  LI: 'List Item',
  NAV: 'Navigation',
  HEADER: 'Header',
  FOOTER: 'Footer',
  MAIN: 'Main',
  SECTION: 'Section',
  ARTICLE: 'Article',
  ASIDE: 'Aside',
};

// Font families available in the editor
export const fontFamilies = [
  { value: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', label: 'SF Pro Text' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'monospace', label: 'Monospace' },
];

// Font weights
export const fontWeights = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];
