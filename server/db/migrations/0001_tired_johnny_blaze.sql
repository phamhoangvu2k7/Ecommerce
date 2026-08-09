CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`account_id` text,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`isRevoked` integer DEFAULT 0,
	`createdAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_token_unique` ON `refresh_tokens` (`token`);