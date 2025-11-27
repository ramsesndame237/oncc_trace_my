import { LocationResponse } from "./location.types";

export const getLocationHierarchy = (
  code: string,
  allLocations: LocationResponse[]
): {
  code: string;
  name: string;
}[] => {
  if (!allLocations || allLocations.length === 0) {
    return [];
  }

  const locationMap = new Map(allLocations.map((loc) => [loc.code, loc.name]));
  const path: {
    code: string;
    name: string;
  }[] = [];
  let currentCode = code;

  while (currentCode && currentCode.length >= 2) {
    if (locationMap.has(currentCode)) {
      path.unshift({
        code: currentCode,
        name: locationMap.get(currentCode)!,
      });
    }
    // CE0501 -> CE05 -> CE
    if (currentCode.length <= 2) {
      break;
    }
    currentCode = currentCode.slice(0, -2);
  }

  return path;
};
