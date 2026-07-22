CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role_id` text,
	`phone` text DEFAULT '',
	`avatar` text DEFAULT '',
	`status` text DEFAULT 'active',
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`products` text DEFAULT '[]',
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`cart_id` text NOT NULL,
	`userInfo` text NOT NULL,
	`products` text DEFAULT '[]',
	`status` text DEFAULT 'pending',
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`parent_id` text,
	`slug` text NOT NULL,
	`description` text DEFAULT '',
	`status` text DEFAULT 'active',
	`position` integer DEFAULT 0,
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`product_category_id` text,
	`description` text DEFAULT '',
	`price` real DEFAULT 0,
	`discountPercentage` real DEFAULT 0,
	`stock` integer DEFAULT 0,
	`thumbnail` text DEFAULT '',
	`status` text DEFAULT 'active',
	`position` integer DEFAULT 0,
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '',
	`permissions` text DEFAULT '[]',
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`phone` text DEFAULT '',
	`avatar` text DEFAULT '',
	`status` text DEFAULT 'active',
	`deleted` integer DEFAULT 0,
	`deletedAt` text,
	`deletedBy` text,
	`createdBy` text,
	`updatedBy` text,
	`createdAt` text DEFAULT (datetime('now', 'localtime')),
	`updatedAt` text DEFAULT (datetime('now', 'localtime'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);