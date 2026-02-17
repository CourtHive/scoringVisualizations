/**
 * Development Tools for Debugging UMO v4 Data
 *
 * Follows the pattern from src/services/helpers/setDev.ts
 * Sets window['dev'] with data for browser console inspection
 */

export interface StandaloneDevData {
  umo: any; // Raw UMO v4 MatchUp from PointsEngine
  data: any; // Adapted data (episodes, points, etc.)
  points: any[]; // Raw points array from UMO
  episodes?: any[]; // Episodes after adapter conversion
  vizPoints?: any[]; // VizPoints after helper conversion
  match?: any; // v3Adapter match object (if available)
}

let devData: StandaloneDevData = {
  umo: null,
  data: null,
  points: [],
  episodes: undefined,
  vizPoints: undefined,
};

/**
 * Set window.dev following the pattern from main app
 * Call this in story render functions
 */

// Extend the Window interface to include 'dev'
declare global {
  interface Window {
    dev?: StandaloneDevData;
  }
}

export function setDev(data?: Partial<StandaloneDevData>) {
  if (data) {
    devData = {
      ...devData,
      ...data,
    };
  }

  window.dev = devData;
  console.log('Dev data set');
}

/**
 * Update specific dev data properties
 */
export function updateDevData(data: Partial<StandaloneDevData>) {
  devData = {
    ...devData,
    ...data,
  };
  setDev();
}
