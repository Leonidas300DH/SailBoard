"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Flag, LocateFixed, MapPin, Navigation, Save, Search, ShieldCheck, Trash2 } from "lucide-react";
import type { CourseMark, CourseMarkType, RaceView, RoundingSide } from "@/lib/domain";
import { buildIgnStyle } from "@/lib/map/style";
import { installBackgroundRafShim } from "./map/useMapLibre";

type MapLibre = typeof import("maplibre-gl");
type Tool = CourseMarkType | null;

function extractMarks(geojson: GeoJSON.FeatureCollection): CourseMark[] {
  return geojson.features
    .filter((feature) => feature.properties?.kind && feature.properties.kind !== "route")
    .map((feature, index) => {
      const geometry = feature.geometry;
      const coordinates = geometry.type === "Point"
        ? [geometry.coordinates as [number, number]]
        : geometry.type === "LineString"
          ? geometry.coordinates as [number, number][]
          : [];
      return {
        id: String(feature.properties?.id ?? `mark-${index}`),
        name: String(feature.properties?.name ?? `Marque ${index + 1}`),
        type: feature.properties?.kind as CourseMarkType,
        rounding: (feature.properties?.rounding ?? "either") as RoundingSide,
        coordinates,
      };
    });
}

function toGeoJson(marks: CourseMark[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { kind: "route" }, geometry: { type: "LineString", coordinates: marks.map((mark) => mark.coordinates[0]) } },
      ...marks.map((mark) => ({
        type: "Feature" as const,
        properties: { id: mark.id, kind: mark.type, name: mark.name, rounding: mark.rounding },
        geometry: mark.coordinates.length > 1
          ? { type: "LineString" as const, coordinates: mark.coordinates }
          : { type: "Point" as const, coordinates: mark.coordinates[0] },
      })),
      ...marks.flatMap((mark) => mark.coordinates.map((coordinate, endpoint) => ({
        type: "Feature" as const,
        properties: { id: mark.id, kind: "handle", endpoint, markType: mark.type },
        geometry: { type: "Point" as const, coordinates: coordinate },
      }))),
    ],
  };
}

const toolLabels: Array<{ type: CourseMarkType; label: string; icon: typeof MapPin }> = [
  { type: "start", label: "Départ", icon: Flag },
  { type: "mark", label: "Bouée", icon: MapPin },
  { type: "gate", label: "Porte", icon: Navigation },
  { type: "finish", label: "Arrivée", icon: LocateFixed },
];

export function CourseEditor({ race, onSaved }: { race: RaceView; onSaved: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreRef = useRef<MapLibre | null>(null);
  const [marks, setMarks] = useState(() => extractMarks(race.courseGeoJson));
  const [tool, setTool] = useState<Tool>(null);
  const [lineStart, setLineStart] = useState<[number, number] | null>(null);
  const [laps, setLaps] = useState(race.laps);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const geojson = useMemo(() => toGeoJson(marks), [marks]);

  useEffect(() => {
    let cancelled = false;
    installBackgroundRafShim();
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      maplibreRef.current = maplibre;
      const map = new maplibre.Map({
        container: containerRef.current,
        center: race.center,
        zoom: 11.4,
        attributionControl: false,
        style: buildIgnStyle("editor"),
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        map.addSource("draft", { type: "geojson", data: toGeoJson(marks) });
        map.addLayer({ id: "draft-route", type: "line", source: "draft", filter: ["==", ["get", "kind"], "route"], paint: { "line-color": "#e8ff29", "line-width": 3, "line-dasharray": [2, 1] } });
        map.addLayer({ id: "draft-lines", type: "line", source: "draft", filter: ["match", ["get", "kind"], ["start", "gate", "finish"], true, false], paint: { "line-color": "#f3f7f8", "line-width": 4 } });
        map.addLayer({ id: "draft-points", type: "circle", source: "draft", filter: ["==", ["get", "kind"], "handle"], paint: { "circle-radius": 8, "circle-color": ["match", ["get", "markType"], "start", "#ffffff", "finish", "#ff1e1e", "#e8ff29"], "circle-stroke-color": "#00101a", "circle-stroke-width": 3 } });
        map.on("mouseenter", "draft-points", () => { map.getCanvas().style.cursor = "grab"; });
        map.on("mouseleave", "draft-points", () => { map.getCanvas().style.cursor = tool ? "crosshair" : ""; });
        map.on("mousedown", "draft-points", (event) => {
          event.preventDefault();
          const feature = event.features?.[0];
          const id = String(feature?.properties?.id ?? "");
          const endpoint = Number(feature?.properties?.endpoint ?? 0);
          if (!id) return;
          map.dragPan.disable();
          const move = (moveEvent: import("maplibre-gl").MapMouseEvent) => {
            setMarks((current) => current.map((mark) => mark.id === id
              ? { ...mark, coordinates: mark.coordinates.map((coordinate, index) => index === endpoint ? [moveEvent.lngLat.lng, moveEvent.lngLat.lat] : coordinate) }
              : mark));
          };
          const end = () => { map.off("mousemove", move); map.off("mouseup", end); map.dragPan.enable(); };
          map.on("mousemove", move); map.on("mouseup", end);
        });
      });
      map.on("click", (event) => {
        if (!tool) return;
        const coordinate: [number, number] = [event.lngLat.lng, event.lngLat.lat];
        const needsLine = tool === "start" || tool === "gate" || tool === "finish";
        if (needsLine && !lineStart) { setLineStart(coordinate); setMessage("Placez le second point de la ligne."); return; }
        const coordinates = needsLine && lineStart ? [lineStart, coordinate] : [coordinate];
        const ordinal = marks.filter((mark) => mark.type === tool).length + 1;
        setMarks((current) => [...current, {
          id: crypto.randomUUID(),
          name: tool === "start" ? "Ligne de départ" : tool === "finish" ? "Ligne d’arrivée" : tool === "gate" ? `Porte ${ordinal}` : `Marque ${current.length}`,
          type: tool,
          rounding: tool === "mark" ? "port" : tool === "gate" ? "either" : "none",
          coordinates,
        }]);
        setLineStart(null); setTool(null); setMessage("");
      });
      mapRef.current = map;
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  // The map is intentionally created once; source updates are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("draft") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [geojson]);

  useEffect(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = tool ? "crosshair" : "";
  }, [tool]);

  async function searchLocation(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    const response = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(query)}&limit=1`);
    const result = await response.json() as { features?: Array<{ geometry: { coordinates: [number, number] }; properties: { label?: string } }> };
    const place = result.features?.[0];
    if (!place) { setMessage("Lieu introuvable."); return; }
    mapRef.current?.flyTo({ center: place.geometry.coordinates, zoom: 13, essential: true });
    setMessage(place.properties.label ?? query);
  }

  async function persist(status: "draft" | "published") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/course", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ raceId: race.id, marks, laps, status }) });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Enregistrement impossible");
      setMessage(data.message ?? "Parcours enregistré"); onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible"); }
    finally { setBusy(false); }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= marks.length) return;
    setMarks((current) => { const copy = [...current]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; });
  }

  return <div className="course-editor">
    <div className="course-map-panel"><div ref={containerRef} className="course-map" /><div className="course-search"><form onSubmit={(event) => void searchLocation(event)}><input aria-label="Rechercher un lieu" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Golfe du Morbihan, Quiberon…" /><button type="submit" aria-label="Rechercher"><Search /></button></form></div><div className="course-tools">{toolLabels.map(({ type, label, icon: Icon }) => <button type="button" key={type} className={tool === type ? "active" : ""} onClick={() => { setTool(tool === type ? null : type); setLineStart(null); }}><Icon /><span>{label}</span></button>)}</div></div>
    <aside className="course-panel"><div className="admin-panel-head"><h2>Ordre du parcours</h2><span>{race.distanceNm.toFixed(1)} NM</span></div><div className="course-options"><label>Nombre de tours<input type="number" min="1" max="20" value={laps} onChange={(event) => setLaps(Number(event.target.value))} /></label><small>Les poignées sont déplaçables directement sur la carte.</small></div><div className="mark-list">{marks.map((mark, index) => <div className="mark-row" key={mark.id}><div className={`mark-index ${mark.type}`}>{index + 1}</div><div><input aria-label={`Nom ${index + 1}`} value={mark.name} onChange={(event) => setMarks((current) => current.map((item) => item.id === mark.id ? { ...item, name: event.target.value } : item))} /><select aria-label={`Contournement ${mark.name}`} value={mark.rounding} onChange={(event) => setMarks((current) => current.map((item) => item.id === mark.id ? { ...item, rounding: event.target.value as RoundingSide } : item))}><option value="none">Sans contournement</option><option value="port">Bâbord</option><option value="starboard">Tribord</option><option value="either">Libre</option></select></div><div className="mark-actions"><button type="button" aria-label="Monter" onClick={() => move(index, -1)}><ArrowUp /></button><button type="button" aria-label="Descendre" onClick={() => move(index, 1)}><ArrowDown /></button><button type="button" aria-label="Supprimer" onClick={() => setMarks((current) => current.filter((item) => item.id !== mark.id))}><Trash2 /></button></div></div>)}</div>{message ? <div className="notice">{message}</div> : null}<div className="course-save"><button className="button" type="button" disabled={busy} onClick={() => void persist("draft")}><Save />Brouillon</button><button className="button primary" type="button" disabled={busy} onClick={() => void persist("published")}><ShieldCheck />Publier</button></div></aside>
  </div>;
}
