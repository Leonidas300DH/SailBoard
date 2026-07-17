import { integer, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["owner", "admin"] }).notNull(),
  status: text("status", { enum: ["active", "suspended", "revoked"] }).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("admins_email_uq").on(table.email)]);

export const adminAccessRequests = sqliteTable("admin_access_requests", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  status: text("status", { enum: ["pending", "approved", "denied"] }).notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("access_requests_status_idx").on(table.status)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changesJson: text("changes_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId)]);

export const seasons = sqliteTable("seasons", {
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

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  seasonId: text("season_id").notNull().references(() => seasons.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  locationName: text("location_name").notNull(),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("events_slug_uq").on(table.slug), index("events_season_idx").on(table.seasonId)]);

export const scoringRuleVersions = sqliteTable("scoring_rule_versions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: integer("version").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
  configJson: text("config_json").notNull(),
  publishedAt: text("published_at"),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [index("scoring_rules_status_idx").on(table.status)]);

export const races = sqliteTable("races", {
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

export const courseVersions = sqliteTable("course_versions", {
  id: text("id").primaryKey(),
  raceId: text("race_id").notNull().references(() => races.id),
  version: integer("version").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull(),
  geojson: text("geojson").notNull(),
  laps: integer("laps").notNull().default(1),
  distanceNm: real("distance_nm").notNull().default(0),
  publishedAt: text("published_at"),
  ...timestamps,
}, (table) => [index("course_versions_race_idx").on(table.raceId)]);

export const courseMarks = sqliteTable("course_marks", {
  id: text("id").primaryKey(),
  courseVersionId: text("course_version_id").notNull().references(() => courseVersions.id),
  sequence: integer("sequence").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["start", "mark", "gate", "finish"] }).notNull(),
  rounding: text("rounding", { enum: ["port", "starboard", "either", "none"] }).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  secondaryLat: real("secondary_lat"),
  secondaryLng: real("secondary_lng"),
}, (table) => [index("course_marks_version_idx").on(table.courseVersionId, table.sequence)]);

export const boats = sqliteTable("boats", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sailNumber: text("sail_number").notNull(),
  model: text("model").notNull(),
  color: text("color").notNull(),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("boats_slug_uq").on(table.slug)]);

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  nationality: text("nationality").notNull().default("FR"),
  publicVisible: integer("public_visible", { mode: "boolean" }).notNull().default(true),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [uniqueIndex("participants_slug_uq").on(table.slug)]);

export const raceEntries = sqliteTable("race_entries", {
  id: text("id").primaryKey(),
  raceId: text("race_id").notNull().references(() => races.id),
  boatId: text("boat_id").notNull().references(() => boats.id),
  startNumber: integer("start_number").notNull(),
  status: text("status", { enum: ["registered", "confirmed", "withdrawn"] }).notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("entries_race_boat_uq").on(table.raceId, table.boatId), index("entries_race_idx").on(table.raceId)]);

export const crewAssignments = sqliteTable("crew_assignments", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => raceEntries.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  role: text("role").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("crew_entry_participant_uq").on(table.entryId, table.participantId)]);

export const results = sqliteTable("results", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => raceEntries.id),
  position: integer("position"),
  elapsedSeconds: integer("elapsed_seconds"),
  status: text("status", { enum: ["classified", "dnf", "dns", "dsq"] }).notNull(),
  penaltyPoints: real("penalty_points").notNull().default(0),
  penaltyNote: text("penalty_note"),
  boatPoints: real("boat_points").notNull(),
  scoringSnapshotJson: text("scoring_snapshot_json").notNull(),
  finalizedAt: text("finalized_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("results_entry_uq").on(table.entryId), index("results_position_idx").on(table.position)]);

export const individualAwards = sqliteTable("individual_awards", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => results.id),
  participantId: text("participant_id").notNull().references(() => participants.id),
  points: real("points").notNull(),
  mode: text("mode").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("awards_result_participant_uq").on(table.resultId, table.participantId), index("awards_participant_idx").on(table.participantId)]);
