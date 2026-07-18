CREATE TABLE "data_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_hash" text NOT NULL,
	"status" text NOT NULL,
	"summary_json" text NOT NULL,
	"imported_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "individual_stage_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"race_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"boat_id" text,
	"points" double precision NOT NULL,
	"source_mode" text NOT NULL,
	"source_json" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_stage_scores" ADD CONSTRAINT "individual_stage_scores_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_stage_scores" ADD CONSTRAINT "individual_stage_scores_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_stage_scores" ADD CONSTRAINT "individual_stage_scores_boat_id_boats_id_fk" FOREIGN KEY ("boat_id") REFERENCES "public"."boats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "data_imports_source_hash_uq" ON "data_imports" USING btree ("source_hash");--> statement-breakpoint
CREATE INDEX "data_imports_season_idx" ON "data_imports" USING btree ("season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "individual_stage_scores_race_participant_uq" ON "individual_stage_scores" USING btree ("race_id","participant_id");--> statement-breakpoint
CREATE INDEX "individual_stage_scores_race_idx" ON "individual_stage_scores" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "individual_stage_scores_participant_idx" ON "individual_stage_scores" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "individual_stage_scores_boat_idx" ON "individual_stage_scores" USING btree ("boat_id");