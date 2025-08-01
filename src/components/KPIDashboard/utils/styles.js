// src/components/KPIDashboard/utils/styles.js

/**
 * Get tab background color based on position key
 * @param {string} tabKey - The position key
 * @returns {string} Tailwind CSS class for background color
 */
export const getTabColor = (tabKey) => {
  switch(tabKey) {
    case 'general-manager':
      return 'bg-blue-50';
    case 'branch-manager':
      return 'bg-green-50';
    case 'client-specialist':
      return 'bg-purple-50';
    case 'field-supervisor':
      return 'bg-amber-50';
    case 'specialist':
      return 'bg-cyan-50';
    case 'asset-risk-manager':
      return 'bg-red-50';
    case 'headcount':
      return 'bg-gray-50';
    default:
      return 'bg-white';
  }
};

/**
 * Get header background color (more pronounced) based on position key
 * @param {string} tabKey - The position key
 * @returns {string} Tailwind CSS class for header background color
 */
export const getHeaderColor = (tabKey) => {
  switch(tabKey) {
    case 'general-manager':
      return 'bg-blue-100';
    case 'branch-manager':
      return 'bg-green-100';
    case 'client-specialist':
      return 'bg-purple-100';
    case 'field-supervisor':
      return 'bg-amber-100';
    case 'specialist':
      return 'bg-cyan-100';
    case 'asset-risk-manager':
      return 'bg-red-100';
    case 'headcount':
      return 'bg-gray-100';
    default:
      return 'bg-white';
  }
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