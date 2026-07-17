CREATE TABLE "admin_access_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text NOT NULL,
	"reviewed_by" text,
	"reviewed_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"changes_json" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boats" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sail_number" text NOT NULL,
	"model" text NOT NULL,
	"color" text NOT NULL,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_marks" (
	"id" text PRIMARY KEY NOT NULL,
	"course_version_id" text NOT NULL,
	"sequence" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"rounding" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"secondary_lat" double precision,
	"secondary_lng" double precision
);
--> statement-breakpoint
CREATE TABLE "course_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"race_id" text NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"geojson" text NOT NULL,
	"laps" integer DEFAULT 1 NOT NULL,
	"distance_nm" double precision DEFAULT 0 NOT NULL,
	"published_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crew_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"location_name" text NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"starts_on" text NOT NULL,
	"ends_on" text NOT NULL,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "individual_awards" (
	"id" text PRIMARY KEY NOT NULL,
	"result_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"points" double precision NOT NULL,
	"mode" text NOT NULL,
	"snapshot_json" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"nationality" text DEFAULT 'FR' NOT NULL,
	"public_visible" integer DEFAULT 1 NOT NULL,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "race_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"race_id" text NOT NULL,
	"boat_id" text NOT NULL,
	"start_number" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"scheduled_at" text NOT NULL,
	"status" text NOT NULL,
	"course_version_id" text,
	"scoring_rule_version_id" text,
	"published_at" text,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"position" integer,
	"elapsed_seconds" integer,
	"status" text NOT NULL,
	"penalty_points" double precision DEFAULT 0 NOT NULL,
	"penalty_note" text,
	"boat_points" double precision NOT NULL,
	"scoring_snapshot_json" text NOT NULL,
	"finalized_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_rule_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"config_json" text NOT NULL,
	"published_at" text,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"year" integer NOT NULL,
	"status" text NOT NULL,
	"starts_on" text NOT NULL,
	"ends_on" text NOT NULL,
	"archived_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_marks" ADD CONSTRAINT "course_marks_course_version_id_course_versions_id_fk" FOREIGN KEY ("course_version_id") REFERENCES "public"."course_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_entry_id_race_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."race_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_awards" ADD CONSTRAINT "individual_awards_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_awards" ADD CONSTRAINT "individual_awards_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_entries" ADD CONSTRAINT "race_entries_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_scoring_rule_version_id_scoring_rule_versions_id_fk" FOREIGN KEY ("scoring_rule_version_id") REFERENCES "public"."scoring_rule_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_entry_id_race_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."race_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_requests_status_idx" ON "admin_access_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_uq" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "boats_slug_uq" ON "boats" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "course_marks_version_idx" ON "course_marks" USING btree ("course_version_id","sequence");--> statement-breakpoint
CREATE INDEX "course_versions_race_idx" ON "course_versions" USING btree ("race_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crew_entry_participant_uq" ON "crew_assignments" USING btree ("entry_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_uq" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_season_idx" ON "events" USING btree ("season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "awards_result_participant_uq" ON "individual_awards" USING btree ("result_id","participant_id");--> statement-breakpoint
CREATE INDEX "awards_participant_idx" ON "individual_awards" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_slug_uq" ON "participants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "entries_race_boat_uq" ON "race_entries" USING btree ("race_id","boat_id");--> statement-breakpoint
CREATE INDEX "entries_race_idx" ON "race_entries" USING btree ("race_id");--> statement-breakpoint
CREATE UNIQUE INDEX "races_slug_uq" ON "races" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "races_event_idx" ON "races" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "results_entry_uq" ON "results" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "results_position_idx" ON "results" USING btree ("position");--> statement-breakpoint
CREATE INDEX "scoring_rules_status_idx" ON "scoring_rule_versions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_slug_uq" ON "seasons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "seasons_status_idx" ON "seasons" USING btree ("status");