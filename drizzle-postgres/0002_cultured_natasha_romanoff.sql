CREATE TABLE "stage_crew_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"boat_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"role" text NOT NULL,
	"source_mode" text NOT NULL,
	"source_json" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_individual_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"boat_id" text,
	"championship_points" double precision,
	"status" text NOT NULL,
	"source_mode" text NOT NULL,
	"source_json" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_team_results" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"boat_id" text NOT NULL,
	"final_position" integer,
	"championship_points" double precision,
	"status" text NOT NULL,
	"source_mode" text NOT NULL,
	"source_json" text NOT NULL,
	"finalized_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stage_crew_assignments" ADD CONSTRAINT "stage_crew_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_crew_assignments" ADD CONSTRAINT "stage_crew_assignments_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_crew_assignments" ADD CONSTRAINT "stage_crew_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_individual_scores" ADD CONSTRAINT "stage_individual_scores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_individual_scores" ADD CONSTRAINT "stage_individual_scores_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_individual_scores" ADD CONSTRAINT "stage_individual_scores_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_team_results" ADD CONSTRAINT "stage_team_results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_team_results" ADD CONSTRAINT "stage_team_results_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stage_crew_event_boat_participant_uq" ON "stage_crew_assignments" USING btree ("event_id","boat_id","participant_id");--> statement-breakpoint
CREATE INDEX "stage_crew_event_idx" ON "stage_crew_assignments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stage_crew_boat_idx" ON "stage_crew_assignments" USING btree ("boat_id");--> statement-breakpoint
CREATE INDEX "stage_crew_participant_idx" ON "stage_crew_assignments" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stage_individual_scores_event_participant_uq" ON "stage_individual_scores" USING btree ("event_id","participant_id");--> statement-breakpoint
CREATE INDEX "stage_individual_scores_event_idx" ON "stage_individual_scores" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stage_individual_scores_participant_idx" ON "stage_individual_scores" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "stage_individual_scores_boat_idx" ON "stage_individual_scores" USING btree ("boat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stage_team_results_event_boat_uq" ON "stage_team_results" USING btree ("event_id","boat_id");--> statement-breakpoint
CREATE INDEX "stage_team_results_event_idx" ON "stage_team_results" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stage_team_results_boat_idx" ON "stage_team_results" USING btree ("boat_id");