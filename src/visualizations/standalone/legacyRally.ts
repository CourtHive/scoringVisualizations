import { isNumeric, isString } from './typeOf';

export function legacyRally(rally) {
  if (Array.isArray(rally)) return rally;
  if (isString(rally)) return new Array(rally);
  return [];
}

export function rallyCount(rally) {
  // Direct number (from point.rallyLength)
  if (isNumeric(rally)) return rally;
  // UMO v4 format: { notation: string, length: number }
  if (rally && typeof rally === 'object' && 'length' in rally) {
    return rally.length;
  }
  // Legacy formats
  if (Array.isArray(rally)) return rally.length;
  if (isString(rally)) return parseInt(rally);
  return 0;
}
