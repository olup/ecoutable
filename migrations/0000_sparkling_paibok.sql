CREATE TABLE `article` (
	`uuid` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer DEFAULT (current_timestamp) NOT NULL,
	`summary` text,
	`full_length_audio_url` text,
	`summary_audio_url` text,
	`podcast_audio_url` text,
	`status` text DEFAULT 'processing' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
