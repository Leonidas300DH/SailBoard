export type AdminRole = "owner" | "admin";
export type AdminStatus = "active" | "suspended" | "revoked";
export type RaceStatus = "draft" | "scheduled" | "in_progress" | "completed";
export type ResultStatus = "classified" | "dnf" | "dns" | "dsq";
export type CourseMarkType = "start" | "mark" | "gate" | "finish";
export type RoundingSide = "port" | "starboard" | "either" | "none";

export type ScoringConfig = {
  direction: "high" | "low";
  positionPoints: Record<string, number>;
  participationPoints: number;
  statusPoints: Record<"dnf" | "dns" | "dsq", number>;
  individualMode: "same_as_boat" | "split_evenly" | "weighted_roles" | "manual";
  roleWeights: Record<string, number>;
  tieBreakers: Array<"wins" | "best_recent" | "best_result">;
};

export type CourseMark = {
  id: string;
  name: string;
  type: CourseMarkType;
  rounding: RoundingSide;
  coordinates: [number, number][];
};

export type CrewMember = {
  id: string;
  name: string;
  slug: string;
  role: string;
  points?: number;
};

export type LeaderboardRow = {
  entryId: string;
  position: number | null;
  boatId: string;
  boatName: string;
  boatSlug: string;
  sailNumber: string;
  color: string;
  status: ResultStatus;
  elapsedSeconds: number | null;
  points: number;
  crew: CrewMember[];
};

export type RaceView = {
  id: string;
  name: string;
  slug: string;
  status: RaceStatus;
  scheduledAt: string;
  eventName: string;
  eventSlug: string;
  seasonName: string;
  seasonSlug: string;
  locationName: string;
  center: [number, number];
  distanceNm: number;
  laps: number;
  courseGeoJson: GeoJSON.FeatureCollection;
  leaderboard: LeaderboardRow[];
};
