"use client";

import { useMemo, useSyncExternalStore } from "react";
import { normalizeMapDisplaySettings, parseMapDisplaySettings, type MapDisplaySettings } from "./map-settings";

const STORAGE_KEY = "sailboard:map-display:v1";
const CHANGE_EVENT = "sailboard:map-display-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useMapDisplaySettings(defaults: MapDisplaySettings) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(
    () => stored ? parseMapDisplaySettings(stored) : defaults,
    [defaults, stored],
  );
}

export function saveMapDisplaySettings(settings: MapDisplaySettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeMapDisplaySettings(settings)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearMapDisplaySettings() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
