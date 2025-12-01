// src/components/KPIDashboard/utils/styles.js

/**
 * Convert hex color to RGB for opacity adjustments
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Lighten a hex color by a percentage
 */
const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, rgb.r + amt);
  const g = Math.min(255, rgb.g + amt);
  const b = Math.min(255, rgb.b + amt);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Get tab background color based on position
 * Now returns inline style object instead of Tailwind class
 * @param {Object} position - The position object from database (with color property)
 * @param {string} tabKey - The position key (fallback if no position object)
 * @returns {Object} Inline style object for background color
 */
export const getTabColorStyle = (position, tabKey = null) => {
  // If we have a position object with color from database, use it
  if (position && position.color) {
    return { backgroundColor: position.color };
  }
  
  // Fallback to default colors if no database color
  const defaultColors = {
    'general-manager': '#dbeafe',
    'branch-manager': '#d1fae5',
    'client-specialist': '#fce7f3',
    'field-supervisor': '#fef3c7',
    'specialist': '#e0e7ff',
    'asset-risk-manager': '#fed7aa',
    'headcount': '#f3f4f6'
  };
  
  return { backgroundColor: defaultColors[tabKey] || '#ffffff' };
};

/**
 * Get tab background color as Tailwind class (for compatibility)
 * @param {string} tabKey - The position key
 * @returns {string} Tailwind CSS class for background color
 */
export const getTabColor = (tabKey) => {
  // This is kept for backward compatibility
  // Returns empty string since we're using inline styles now
  return '';
};

/**
 * Get header background color (darker shade) based on position
 * @param {Object} position - The position object from database (with color property)
 * @param {string} tabKey - The position key (fallback)
 * @returns {Object} Inline style object for header background color
 */
export const getHeaderColorStyle = (position, tabKey = null) => {
  let baseColor;
  
  // Get base color from position or fallback
  if (position && position.color) {
    baseColor = position.color;
  } else {
    const defaultColors = {
      'general-manager': '#dbeafe',
      'branch-manager': '#d1fae5',
      'client-specialist': '#fce7f3',
      'field-supervisor': '#fef3c7',
      'specialist': '#e0e7ff',
      'asset-risk-manager': '#fed7aa',
      'headcount': '#f3f4f6'
    };
    baseColor = defaultColors[tabKey] || '#ffffff';
  }
  
  // Darken the color by reducing RGB values slightly
  const rgb = hexToRgb(baseColor);
  if (rgb) {
    const darkenAmount = 15;
    const r = Math.max(0, rgb.r - darkenAmount);
    const g = Math.max(0, rgb.g - darkenAmount);
    const b = Math.max(0, rgb.b - darkenAmount);
    const darkerColor = `rgb(${r}, ${g}, ${b})`;
    return { backgroundColor: darkerColor };
  }
  
  return { backgroundColor: baseColor };
};

/**
 * Get header background color as Tailwind class (for compatibility)
 * @param {string} tabKey - The position key
 * @returns {string} Tailwind CSS class for header background color
 */
export const getHeaderColor = (tabKey) => {
  // This is kept for backward compatibility
  // Returns empty string since we're using inline styles now
  return '';
};

/**
 * Custom slider styles for cross-browser compatibility
 * These styles create colored progress tracks and custom thumb appearance
 */
export const sliderStyles = `
  /* Basic slider reset and styling */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    margin: 10px 0;
    background: transparent;
  }
  
  /* Remove default focus outline */
  input[type=range]:focus {
    outline: none;
  }
  
  /* Thumb styling - the draggable handle */
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: white;
    border: 2px solid #ddd;
    cursor: pointer;
    margin-top: -7px; /* offset for proper vertical centering */
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    z-index: 3;
    transition: border-color 0.2s ease;
  }
  
  input[type=range]::-moz-range-thumb {
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: white;
    border: 2px solid #ddd;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    z-index: 3;
    transition: border-color 0.2s ease;
  }
  
  /* Hover states for the thumb */
  input[type=range]:active::-webkit-slider-thumb,
  input[type=range]:hover::-webkit-slider-thumb {
    border-color: #aaa;
  }
  
  input[type=range]:active::-moz-range-thumb,
  input[type=range]:hover::-moz-range-thumb {
    border-color: #aaa;
  }
  
  /* Track styling - the background bar */
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    cursor: pointer;
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  input[type=range]::-moz-range-track {
    width: 100%;
    height: 8px;
    cursor: pointer;
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  /* Green sliders */
  input.slider-green::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-green::-moz-range-track {
    background: linear-gradient(to right, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Yellow sliders */
  input.slider-yellow::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-yellow::-moz-range-track {
    background: linear-gradient(to right, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Orange sliders */
  input.slider-orange::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-orange::-moz-range-track {
    background: linear-gradient(to right, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Red sliders */
  input.slider-red::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-red::-moz-range-track {
    background: linear-gradient(to right, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Blue sliders */
  input.slider-blue::-webkit-slider-runnable-track {
    background: linear-gradient(to right, #4a90e2 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-blue::-moz-range-track {
    background: linear-gradient(to right, #4a90e2 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Inverse sliders - green */
  input.slider-green-inverse::-webkit-slider-runnable-track {
    background: linear-gradient(to left, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-green-inverse::-moz-range-track {
    background: linear-gradient(to left, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Inverse sliders - yellow */
  input.slider-yellow-inverse::-webkit-slider-runnable-track {
    background: linear-gradient(to left, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-yellow-inverse::-moz-range-track {
    background: linear-gradient(to left, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Inverse sliders - orange */
  input.slider-orange-inverse::-webkit-slider-runnable-track {
    background: linear-gradient(to left, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-orange-inverse::-moz-range-track {
    background: linear-gradient(to left, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  /* Inverse sliders - red */
  input.slider-red-inverse::-webkit-slider-runnable-track {
    background: linear-gradient(to left, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
  }
  
  input.slider-red-inverse::-moz-range-track {
    background: linear-gradient(to left, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
  }
`;

/**
 * Get performance status color based on percentage
 * @param {number} percent - The percentage value
 * @returns {string} Tailwind CSS class for text color
 */
export const getPerformanceStatusColor = (percent) => {
  if (percent === 100) return 'text-green-600';
  if (percent >= 75) return 'text-green-500';
  if (percent >= 50) return 'text-yellow-600';
  if (percent >= 25) return 'text-orange-500';
  return 'text-red-500';
};