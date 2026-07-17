CREATE TABLE `admin_access_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `access_requests_status_idx` ON `admin_access_requests` (`status`);--> statement-breakpoint
CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_uq` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`changes_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `boats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sail_number` text NOT NULL,
	`model` text NOT NULL,
	`color` text NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boats_slug_uq` ON `boats` (`slug`);--> statement-breakpoint
CREATE TABLE `course_marks` (
	`id` text PRIMARY KEY NOT NULL,
	`course_version_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`rounding` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`secondary_lat` real,
	`secondary_lng` real,
	FOREIGN KEY (`course_version_id`) REFERENCES `course_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `course_marks_version_idx` ON `course_marks` (`course_version_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `course_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`geojson` text NOT NULL,
	`laps` integer DEFAULT 1 NOT NULL,
	`distance_nm` real DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `course_versions_race_idx` ON `course_versions` (`race_id`);--> statement-breakpoint
CREATE TABLE `crew_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `race_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `crew_entry_participant_uq` ON `crew_assignments` (`entry_id`,`participant_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`location_name` text NOT NULL,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_uq` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `events_season_idx` ON `events` (`season_id`);--> statement-breakpoint
CREATE TABLE `individual_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`result_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`points` real NOT NULL,
	`mode` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`result_id`) REFERENCES `results`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `awards_result_participant_uq` ON `individual_awards` (`result_id`,`participant_id`);--> statement-breakpoint
CREATE INDEX `awards_participant_idx` ON `individual_awards` (`participant_id`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`nationality` text DEFAULT 'FR' NOT NULL,
	`public_visible` integer DEFAULT true NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_slug_uq` ON `participants` (`slug`);--> statement-breakpoint
CREATE TABLE `race_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`race_id` text NOT NULL,
	`boat_id` text NOT NULL,
	`start_number` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boat_id`) REFERENCES `boats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_race_boat_uq` ON `race_entries` (`race_id`,`boat_id`);--> statement-breakpoint
CREATE INDEX `entries_race_idx` ON `race_entries` (`race_id`);--> statement-breakpoint
CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`status` text NOT NULL,
	`course_version_id` text,
	`scoring_rule_version_id` text,
	`published_at` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scoring_rule_version_id`) REFERENCES `scoring_rule_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `races_slug_uq` ON `races` (`slug`);--> statement-breakpoint
CREATE INDEX `races_event_idx` ON `races` (`event_id`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`position` integer,
	`elapsed_seconds` integer,
	`status` text NOT NULL,
	`penalty_points` real DEFAULT 0 NOT NULL,
	`penalty_note` text,
	`boat_points` real NOT NULL,
	`scoring_snapshot_json` text NOT NULL,
	`finalized_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `race_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `results_entry_uq` ON `results` (`entry_id`);--> statement-breakpoint
CREATE INDEX `results_position_idx` ON `results` (`position`);--> statement-breakpoint
CREATE TABLE `scoring_rule_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` integer NOT NULL,
	`status` text NOT NULL,
	`config_json` text NOT NULL,
	`published_at` text,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scoring_rules_status_idx` ON `scoring_rule_versions` (`status`);--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`year` integer NOT NULL,
	`status` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`archived_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seasons_slug_uq` ON `seasons` (`slug`);--> statement-breakpoint
CREATE INDEX `seasons_status_idx` ON `seasons` (`status`);