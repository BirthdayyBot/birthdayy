import type { Birthday, Blacklist, Guild, User } from '#root/utilities/db/index';
import type { PrismaClient } from '@prisma/client';
import type { ArrayString, BooleanString, IntegerString, NumberString } from '@skyra/env-utilities';
import type { WebhookClient } from 'discord.js';
import type { Events } from './Enums.js';
import type { WritePrecisionType } from '@influxdata/influxdb-client';
import { BotList } from '@devtomio/plugin-botlist';

declare module '@skyra/env-utilities' {
	interface Env {
		// Environment
		APP_ENV: 'dev' | 'tst' | 'prd';
		DEBUG: BooleanString;

		// API
		API_ENABLED: BooleanString;
		API_ORIGIN: string;
		API_PORT: IntegerString;
		API_PREFIX: string;
		API_SECRET: string;

		OAUTH_COOKIE: string;
		OAUTH_DOMAIN_OVERWRITE: string;
		OAUTH_REDIRECT_URI: string;
		OAUTH_SCOPE: ArrayString;
		OAUTH_SECRET: string;

		// Discord
		DISCORD_TOKEN: string;
		CLIENT_ID: string;
		BOT_OWNER: ArrayString;
		BOT_NAME: string;
		BOT_AVATAR: string;
		BOT_COLOR: IntegerString;
		MAX_BIRTHDAYS_PER_SITE: NumberString;
		MAIN_DISCORD: string;

		// Voting
		TOPGG_TOKEN?: string;
		DISCORDLIST_TOKEN?: string;
		DISCORDBOTLIST_TOKEN?: string;
		TOPGG_WEBHOOK_SECRET: string;

		// Database
		DB_NAME: string;
		DB_USERNAME: string;
		DB_PASSWORD: string;
		DB_HOST: string;
		DB_PORT: NumberString;
		DB_URL: string;

		// REDIS
		REDIS_PORT: NumberString;
		REDIS_HOST: string;
		REDIS_PASSWORD: string;
		REDIS_DB: NumberString;
		REDIS_USERNAME: string;

		// Other
		SENTRY_DSN: string;
		CUSTOM_BOT: BooleanString;

		// Logging
		LOG_CHANNEL_ADMIN: string;
		LOG_CHANNEL_SERVER: string;

		// Webhooks
		DISCORD_ERROR_WEBHOOK_ID?: string;
		DISCORD_ERROR_WEBHOOK_TOKEN?: string;

		// Influx
		INFLUX_ENABLED: BooleanString;
		INFLUX_OPTIONS_STRING?: string;
		INFLUX_URL: string;
		INFLUX_HEADERS: string;
		INFLUX_PROXY_URL: string;
		INFLUX_TIMEOUT: `${number}`;
		INFLUX_TOKEN: string;
		INFLUX_ORG: string;
		INFLUX_WRITE_BUCKET: string;
		INFLUX_WRITE_PRECISION: WritePrecisionType;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		prisma: PrismaClient;
		webhook: WebhookClient | null;
		botList: BotList;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		Administrator: never;
		BotOwner: never;
		Everyone: never;
		GuildPremium: never;
		Moderator: never;
		NotBlacklisted: never;
		ServerOwner: never;
		RoleHigher: never;
	}

	interface SapphireClient {
		emit(event: Events.PostStatsSuccess): boolean;
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		BirthdayReminderTask: { message: string; role: string } | undefined;
		BirthdayRoleRemoverTask: never;
		VoteReminderTask: never;
		CleanDatabaseTask: never;
		DisplayStats: never;
		PostStats: never;
	}
}

declare module '@sapphire/plugin-utilities-store' {
	export interface Utilities {
		guild: Guild;
		birthday: Birthday;
		user: User;
		blacklist: Blacklist;
	}
}
