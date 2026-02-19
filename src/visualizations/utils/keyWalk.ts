export function keyWalk(valuesObject: any, optionsObject: any) {
  if (!valuesObject || !optionsObject) return;
  const vKeys = Object.keys(valuesObject);
  const oKeys = Object.keys(optionsObject);
  for (const key of vKeys) {
    if (oKeys.includes(key)) {
      const oo = optionsObject[key];
      const vo = valuesObject[key];
      if (typeof oo === 'object' && typeof vo !== 'function' && oo && oo.constructor !== Array) {
        keyWalk(valuesObject[key], optionsObject[key]);
      } else {
        optionsObject[key] = valuesObject[key];
      }
    }
  }
}
