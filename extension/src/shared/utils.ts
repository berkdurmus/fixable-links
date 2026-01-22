import { v4 as uuidv4 } from 'uuid';
import { ComputedStyleInfo, ElementInfo } from './types';

/**
 * Generate a unique ID
 */
export const generateId = (): string => uuidv4();

/**
 * Get XPath for an element
 */
export const getXPath = (element: Element): string => {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling: Element | null = current.previousElementSibling;

    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.nodeName.toLowerCase();
    const part = index > 1 ? `${tagName}[${index}]` : tagName;
    parts.unshift(part);

    current = current.parentElement;
  }

  return '/' + parts.join('/');
};

/**
 * Get a unique CSS selector for an element
 */
export const getUniqueSelector = (element: Element): string => {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.slice(0, 2).join('.');
      }
    }

    const siblings = current.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const index = Array.from(siblings).indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
};

/**
 * Extract computed styles from an element
 */
export const getComputedStyleInfo = (element: Element): ComputedStyleInfo => {
  const styles = window.getComputedStyle(element);

  return {
    fontFamily: styles.fontFamily,
    fontWeight: styles.fontWeight,
    fontSize: styles.fontSize,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    textAlign: styles.textAlign,
    fontStyle: styles.fontStyle,
    textDecoration: styles.textDecoration,
    width: styles.width,
    height: styles.height,
    paddingTop: styles.paddingTop,
    paddingRight: styles.paddingRight,
    paddingBottom: styles.paddingBottom,
    paddingLeft: styles.paddingLeft,
    marginTop: styles.marginTop,
    marginRight: styles.marginRight,
    marginBottom: styles.marginBottom,
    marginLeft: styles.marginLeft,
  };
};

/**
 * Create ElementInfo from a DOM element
 */
export const createElementInfo = (element: Element, id?: string): ElementInfo => {
  return {
    id: id || generateId(),
    tagName: element.tagName,
    xpath: getXPath(element),
    selector: getUniqueSelector(element),
    textContent: element.textContent?.trim() || '',
    computedStyles: getComputedStyleInfo(element),
    boundingRect: element.getBoundingClientRect(),
  };
};

/**
 * Convert RGB to Hex
 */
export const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`.toUpperCase();
};

/**
 * Parse hex color to RGB components
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Extract opacity from rgba
 */
export const getOpacityFromRgba = (rgba: string): number => {
  const match = rgba.match(/^rgba?\([\d\s,]+,\s*([\d.]+)\)/);
  return match ? parseFloat(match[1]) * 100 : 100;
};

/**
 * Parse font size to number
 */
export const parseFontSize = (fontSize: string): number => {
  return parseInt(fontSize.replace('px', ''), 10) || 16;
};

/**
 * Parse spacing value to number
 */
export const parseSpacing = (value: string): number => {
  return parseInt(value.replace('px', ''), 10) || 0;
};

/**
 * Format timestamp to relative time
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return `${minutes} min. ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get the closest font weight label
 */
export const getFontWeightLabel = (weight: string): string => {
  const weightNum = parseInt(weight, 10);
  const weights: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semibold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };

  return weights[weightNum] || 'Regular';
};

/**
 * Get the font family display name
 */
export const getFontFamilyLabel = (fontFamily: string): string => {
  const families: Record<string, string> = {
    'sf pro text': 'SF Pro Text',
    'inter': 'Inter',
    'roboto': 'Roboto',
    'helvetica neue': 'Helvetica',
    'georgia': 'Georgia',
    'times new roman': 'Times New Roman',
  };

  const lower = fontFamily.toLowerCase();
  for (const [key, label] of Object.entries(families)) {
    if (lower.includes(key)) {
      return label;
    }
  }

  return fontFamily.split(',')[0].replace(/["']/g, '').trim();
};
