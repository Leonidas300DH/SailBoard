CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value_json" text NOT NULL,
	"updated_by" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
