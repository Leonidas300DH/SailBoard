"use client";

import { Cloud, Map, Plane, RotateCcw, Ship, Sparkles } from "lucide-react";
import type { MapDisplaySettings } from "@/lib/map-settings";
import { clearMapDisplaySettings, saveMapDisplaySettings, useMapDisplaySettings } from "@/lib/map-settings-client";
import { AppShell } from "@/components/shell/AppShell";

const layers: Array<{
  key: keyof Omit<MapDisplaySettings, "defaultMode">;
  title: string;
  description: string;
  icon: typeof Plane;
}> = [
  { key: "showAircraft", title: "Avions", description: "Trafic aérien ADS-B — densité réduite de moitié", icon: Plane },
  { key: "showVessels", title: "Navires", description: "Positions AIS ancrées sur la carte", icon: Ship },
  { key: "showCityLights", title: "Lumières urbaines", description: "Scintillement tactique des villes", icon: Sparkles },
  { key: "showClouds", title: "Nuages volumétriques", description: "Couche atmosphérique animée", icon: Cloud },
];

export function SettingsRoom({ defaults }: { defaults: MapDisplaySettings }) {
  const settings = useMapDisplaySettings(defaults);
  const update = (patch: Partial<MapDisplaySettings>) => saveMapDisplaySettings({ ...settings, ...patch });

  return <AppShell active="settings" showPersistentTimeline={false}>
    <section className="settings-room">
      <header className="settings-room-header">
        <div><span>Affichage de cet appareil</span><h1>Settings</h1><p>Les changements sont enregistrés automatiquement dans ce navigateur.</p></div>
        <div className="settings-state"><i aria-hidden /><span>Préférences locales</span></div>
      </header>

      <div className="settings-room-grid">
        <article className="settings-surface settings-surface--mode">
          <div className="settings-surface-head"><div><Map aria-hidden /><span><strong>Carte par défaut</strong><small>Choisissez l’apparence utilisée à l’ouverture.</small></span></div></div>
          <fieldset className="map-mode-settings">
            <legend className="sr-only">Apparence par défaut de la carte</legend>
            <label className={settings.defaultMode === "tactical" ? "active" : undefined}>
              <input type="radio" name="default-map-mode" value="tactical" checked={settings.defaultMode === "tactical"} onChange={() => update({ defaultMode: "tactical" })} />
              <span><strong>Carte tactique</strong><small>Terre monochrome, mer bleu nuit, courbes de niveau et surcouches opérationnelles.</small></span>
            </label>
            <label className={settings.defaultMode === "natural" ? "active" : undefined}>
              <input type="radio" name="default-map-mode" value="natural" checked={settings.defaultMode === "natural"} onChange={() => update({ defaultMode: "natural" })} />
              <span><strong>Carte naturelle</strong><small>Relief, littoral et couleurs cartographiques classiques.</small></span>
            </label>
          </fieldset>
        </article>

        <article className="settings-surface settings-surface--layers">
          <div className="settings-surface-head"><div><Sparkles aria-hidden /><span><strong>Éléments affichés</strong><small>Activez uniquement les informations utiles.</small></span></div></div>
          <div className="settings-public-list">
            {layers.map(({ key, title, description, icon: Icon }) => <label className="settings-toggle" key={key}>
              <Icon aria-hidden />
              <span><strong>{title}</strong><small>{description}</small></span>
              <input type="checkbox" checked={settings[key]} onChange={(event) => update({ [key]: event.target.checked })} />
              <i aria-hidden="true" />
            </label>)}
          </div>
        </article>
      </div>

      <footer className="settings-room-footer">
        <span>TACTICAL DISPLAY · LOCAL PROFILE</span>
        <button className="button" type="button" onClick={clearMapDisplaySettings}><RotateCcw aria-hidden />Réinitialiser</button>
      </footer>
    </section>
  </AppShell>;
}
