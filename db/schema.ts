import { doublePrecision, integer, pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["owner", "admin"] }).notNull(),
  status: text("status", { enum: ["active", "suspended", "revoked"] }).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("admins_email_uq").on(table.email)]);

export const adminAccessRequests = pgTable("admin_access_requests", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  status: text("status", { enum: ["pending", "approved", "denied"] }).notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("access_requests_status_idx").on(table.status)]);

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changesJson: text("changes_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId)]);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedBy: text("updated_by"),
  ...timestamps,
});

export const seasons = pgTable("seasons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  year: integer("year").notNull(),
  status: text("status", { enum: ["draft", "active", "completed"] }).notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("seasons_slug_uq").on(table.slug), index("seasons_status_idx").on(table.status)]);

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  seasonId: text("season_id").notNull().references(() => seasons.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  locationName: text("location_name").notNull(),
  centerLat: doublePrecision("center_lat").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("events_slug_uq").on(table.slug), index("events_season_idx").on(table.seasonId)]);

export const scoringRuleVersions = pgTable("scoring_rule_versions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: integer("version").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
  configJson: text("config_json").notNull(),
  publishedAt: text("published_at"),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [index("scoring_rules_status_idx").on(table.status)]);

export const races = pgTable("races", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "in_progress", "completed"] }).notNull(),
  courseVersionId: text("course_version_id"),
  scoringRuleVersionId: text("scoring_rule_version_id").references(() => scoringRuleVersions.id),
  publishedAt: text("published_at"),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("races_slug_uq").on(table.slug), index("races_event_idx").on(table.eventId)]);

export const courseVersions = pgTable("course_versions", {
  id: text("id").primaryKey(),
  raceId: text("race_id").notNull().references(() => races.id),
  version: integer("version").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
  geojson: text("geojson").notNull(),
  laps: integer("laps").notNull().default(1),
  distanceNm: doublePrecision("distance_nm").notNull().default(0),
  publishedAt: text("published_at"),
  ...timestamps,
}, (table) => [index("course_versions_race_idx").on(table.raceId)]);

export const courseMarks = pgTable("course_marks", {
  id: text("id").primaryKey(),
  courseVersionId: text("course_version_id").notNull().references(() => courseVersions.id),
  sequence: integer("sequence").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["start", "mark", "gate", "finish"] }).notNull(),
  rounding: text("rounding", { enum: ["port", "starboard", "either", "none"] }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  secondaryLat: doublePrecision("secondary_lat"),
  secondaryLng: doublePrecision("secondary_lng"),
}, (table) => [index("course_marks_version_idx").on(table.courseVersionId, table.sequence)]);

export const boats = pgTable("boats", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sailNumber: text("sail_number").notNull(),
  model: text("model").notNull(),
  color: text("color").notNull(),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("boats_slug_uq").on(table.slug)]);

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  nationality: text("nationality").notNull().default("FR"),
  publicVisible: integer("public_visible").notNull().default(1),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("participants_slug_uq").on(table.slug)]);

export const raceEntries = pgTable("race_entries", {
  id: text("id").primaryKey(),
  raceId: text("race_id").notNull().references(() => races.id),
  boatId: text("boat_id").notNull().references(() => boats.id),
  startNumber: integer("start_number").notNull(),
  status: text("status", { enum: ["registered", "confirmed", "withdrawn"] }).notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("entries_race_boat_uq").on(table.raceId, table.boatId), index("entries_race_idx").on(table.raceId)]);

export const crewAssignments = pgTable("crew_assignments", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => raceEntries.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  role: text("role").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("crew_entry_participant_uq").on(table.entryId, table.participantId)]);

export const results = pgTable("results", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => raceEntries.id),
  position: integer("position"),
  elapsedSeconds: integer("elapsed_seconds"),
  status: text("status", { enum: ["classified", "dnf", "dns", "dsq"] }).notNull(),
  penaltyPoints: doublePrecision("penalty_points").notNull().default(0),
  penaltyNote: text("penalty_note"),
  boatPoints: doublePrecision("boat_points").notNull(),
  scoringSnapshotJson: text("scoring_snapshot_json").notNull(),
  finalizedAt: text("finalized_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("results_entry_uq").on(table.entryId), index("results_position_idx").on(table.position)]);

export const individualAwards = pgTable("individual_awards", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => results.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  points: doublePrecision("points").notNull(),
  mode: text("mode").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("awards_result_participant_uq").on(table.resultId, table.participantId), index("awards_participant_idx").on(table.participantId)]);

export const dataImports = pgTable("data_imports", {
  id: text("id").primaryKey(),
  seasonId: text("season_id").notNull().references(() => seasons.id),
  sourceName: text("source_name").notNull(),
  sourceHash: text("source_hash").notNull(),
  status: text("status", { enum: ["completed", "failed"] }).notNull(),
  summaryJson: text("summary_json").notNull(),
  importedAt: text("imported_at").notNull(),
}, (table) => [
  uniqueIndex("data_imports_source_hash_uq").on(table.sourceHash),
  index("data_imports_season_idx").on(table.seasonId),
]);

export const individualStageScores = pgTable("individual_stage_scores", {
  id: text("id").primaryKey(),
  raceId: text("race_id").notNull().references(() => races.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  boatId: text("boat_id").references(() => boats.id),
  points: doublePrecision("points").notNull(),
  sourceMode: text("source_mode").notNull(),
  sourceJson: text("source_json").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("individual_stage_scores_race_participant_uq").on(table.raceId, table.participantId),
  index("individual_stage_scores_race_idx").on(table.raceId),
  index("individual_stage_scores_participant_idx").on(table.participantId),
  index("individual_stage_scores_boat_idx").on(table.boatId),
]);

export const stageTeamResults = pgTable("stage_team_results", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  boatId: text("boat_id").notNull().references(() => boats.id),
  finalPosition: integer("final_position"),
  championshipPoints: doublePrecision("championship_points"),
  status: text("status", { enum: ["pending", "provisional", "published"] }).notNull(),
  sourceMode: text("source_mode").notNull(),
  sourceJson: text("source_json").notNull(),
  finalizedAt: text("finalized_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("stage_team_results_event_boat_uq").on(table.eventId, table.boatId),
  index("stage_team_results_event_idx").on(table.eventId),
  index("stage_team_results_boat_idx").on(table.boatId),
]);

export const stageCrewAssignments = pgTable("stage_crew_assignments", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  boatId: text("boat_id").notNull().references(() => boats.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  role: text("role").notNull(),
  sourceMode: text("source_mode").notNull(),
  sourceJson: text("source_json").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("stage_crew_event_boat_participant_uq").on(table.eventId, table.boatId, table.participantId),
  index("stage_crew_event_idx").on(table.eventId),
  index("stage_crew_boat_idx").on(table.boatId),
  index("stage_crew_participant_idx").on(table.participantId),
]);

export const stageIndividualScores = pgTable("stage_individual_scores", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  boatId: text("boat_id").references(() => boats.id),
  championshipPoints: doublePrecision("championship_points"),
  status: text("status", { enum: ["pending", "provisional", "published"] }).notNull(),
  sourceMode: text("source_mode").notNull(),
  sourceJson: text("source_json").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("stage_individual_scores_event_participant_uq").on(table.eventId, table.participantId),
  index("stage_individual_scores_event_idx").on(table.eventId),
  index("stage_individual_scores_participant_idx").on(table.participantId),
  index("stage_individual_scores_boat_idx").on(table.boatId),
]);
