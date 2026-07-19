export type MapDisplaySettings = {
  defaultMode: "natural" | "tactical";
  showAircraft: boolean;
  showVessels: boolean;
  showCityLights: boolean;
  showClouds: boolean;
};

export const DEFAULT_MAP_DISPLAY_SETTINGS: MapDisplaySettings = {
  defaultMode: "tactical",
  showAircraft: true,
  showVessels: true,
  showCityLights: true,
  showClouds: true,
};

export function normalizeMapDisplaySettings(value: unknown): MapDisplaySettings {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    defaultMode: candidate.defaultMode === "natural" ? "natural" : "tactical",
    showAircraft: typeof candidate.showAircraft === "boolean" ? candidate.showAircraft : true,
    showVessels: typeof candidate.showVessels === "boolean" ? candidate.showVessels : true,
    showCityLights: typeof candidate.showCityLights === "boolean" ? candidate.showCityLights : true,
    showClouds: typeof candidate.showClouds === "boolean" ? candidate.showClouds : true,
  };
}

export function parseMapDisplaySettings(value: string | null | undefined): MapDisplaySettings {
  if (!value) return DEFAULT_MAP_DISPLAY_SETTINGS;
  try {
    return normalizeMapDisplaySettings(JSON.parse(value));
  } catch {
    return DEFAULT_MAP_DISPLAY_SETTINGS;
  }
}
