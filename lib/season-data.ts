export type SeasonRaceStatus = "completed" | "selected" | "upcoming";

export type SeasonRace = {
  id: string;
  name: string;
  shortName: string;
  date: string;
  dateLabel: string;
  monthLabel: string;
  locationName: string;
  coordinates: [number, number];
  status: SeasonRaceStatus;
  winner?: string;
  result?: string;
  distanceNm: number;
  windKnots: number;
  windDirection: number;
  windLabel: string;
  gustKnots: number;
  waveHeight: number;
  seaTemperature: number;
  tideLabel: string;
  href?: string;
  route: GeoJSON.Feature<GeoJSON.LineString>;
};

function routeAround(
  id: string,
  center: [number, number],
  scale: number,
): GeoJSON.Feature<GeoJSON.LineString> {
  const [lng, lat] = center;
  return {
    type: "Feature",
    properties: { id, kind: "season-route" },
    geometry: {
      type: "LineString",
      coordinates: [
        [lng - scale * 0.65, lat - scale * 0.16],
        [lng + scale * 0.18, lat + scale * 0.52],
        [lng + scale * 0.76, lat - scale * 0.08],
        [lng + scale * 0.1, lat - scale * 0.58],
        [lng - scale * 0.65, lat - scale * 0.16],
      ],
    },
  };
}

export const SEASON_RACES: SeasonRace[] = [
  {
    id: "spi-ouest",
    name: "Spi Ouest-France",
    shortName: "Spi Ouest",
    date: "2026-04-05",
    dateLabel: "05 AVR.",
    monthLabel: "AVR",
    locationName: "La Trinité-sur-Mer",
    coordinates: [-3.008, 47.586],
    status: "completed",
    winner: "Kaz a Barh",
    result: "1er · 18 pts",
    distanceNm: 12.6,
    windKnots: 14.2,
    windDirection: 268,
    windLabel: "O",
    gustKnots: 19,
    waveHeight: 0.8,
    seaTemperature: 12,
    tideLabel: "PM 14:18",
    route: routeAround("spi-ouest", [-3.008, 47.586], 0.075),
  },
  {
    id: "douarnenez",
    name: "Grand Prix de Douarnenez",
    shortName: "Douarnenez",
    date: "2026-05-23",
    dateLabel: "23 MAI",
    monthLabel: "MAI",
    locationName: "Baie de Douarnenez",
    coordinates: [-4.324, 48.094],
    status: "completed",
    winner: "Bleuenn",
    result: "1er · 18 pts",
    distanceNm: 10.2,
    windKnots: 21.4,
    windDirection: 244,
    windLabel: "OSO",
    gustKnots: 28,
    waveHeight: 1.4,
    seaTemperature: 14,
    tideLabel: "BM 11:32",
    route: routeAround("douarnenez", [-4.324, 48.094], 0.09),
  },
  {
    id: "trophee-golfe",
    name: "Trophée du Golfe",
    shortName: "Trophée du Golfe",
    date: "2026-07-17",
    dateLabel: "17 JUIL.",
    monthLabel: "JUIL",
    locationName: "Golfe du Morbihan",
    coordinates: [-2.835, 47.559],
    status: "selected",
    winner: "Kaz a Barh",
    result: "Résultats validés",
    distanceNm: 8.4,
    windKnots: 18.4,
    windDirection: 230,
    windLabel: "SO",
    gustKnots: 24,
    waveHeight: 0.7,
    seaTemperature: 18,
    tideLabel: "BM 12:46",
    href: "/courses/trophee-du-golfe-manche-6",
    route: {
      type: "Feature",
      properties: { id: "trophee-golfe", kind: "season-route" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-2.915, 47.56],
          [-2.827, 47.603],
          [-2.764, 47.548],
          [-2.878, 47.514],
          [-2.944, 47.548],
        ],
      },
    },
  },
  {
    id: "glenan",
    name: "Tour des Glénan",
    shortName: "Les Glénan",
    date: "2026-08-15",
    dateLabel: "15 AOÛT",
    monthLabel: "AOÛT",
    locationName: "Archipel des Glénan",
    coordinates: [-3.998, 47.72],
    status: "upcoming",
    result: "Inscriptions ouvertes",
    distanceNm: 18.8,
    windKnots: 16.2,
    windDirection: 252,
    windLabel: "OSO",
    gustKnots: 22,
    waveHeight: 1.1,
    seaTemperature: 19,
    tideLabel: "PM 10:54",
    route: routeAround("glenan", [-3.998, 47.72], 0.105),
  },
  {
    id: "classic-channel",
    name: "Classic Channel",
    shortName: "Classic Channel",
    date: "2026-09-12",
    dateLabel: "12 SEPT.",
    monthLabel: "SEPT",
    locationName: "Perros-Guirec",
    coordinates: [-3.445, 48.82],
    status: "upcoming",
    result: "À venir",
    distanceNm: 22.4,
    windKnots: 19.6,
    windDirection: 286,
    windLabel: "ONO",
    gustKnots: 27,
    waveHeight: 1.7,
    seaTemperature: 17,
    tideLabel: "BM 09:21",
    route: routeAround("classic-channel", [-3.445, 48.82], 0.12),
  },
  {
    id: "saint-malo",
    name: "Finale de Saint-Malo",
    shortName: "Saint-Malo",
    date: "2026-10-03",
    dateLabel: "03 OCT.",
    monthLabel: "OCT",
    locationName: "Baie de Saint-Malo",
    coordinates: [-2.035, 48.69],
    status: "upcoming",
    result: "Finale · double points",
    distanceNm: 14.1,
    windKnots: 17.8,
    windDirection: 302,
    windLabel: "NO",
    gustKnots: 25,
    waveHeight: 1.3,
    seaTemperature: 16,
    tideLabel: "PM 16:08",
    route: routeAround("saint-malo", [-2.035, 48.69], 0.095),
  },
];

