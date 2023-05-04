import type { BotList } from '@devtomio/plugin-botlist';
import type { PluginSubcommandOptions } from '@kaname-png/plugin-subcommands-advanced';
import { container, LogLevel, type ClientLoggerOptions } from '@sapphire/framework';
import type { ServerOptions } from '@sapphire/plugin-api';
import type { InternationalizationOptions } from '@sapphire/plugin-i18next';
import type { ScheduledTasksOptions } from '@sapphire/plugin-scheduled-tasks';
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis';
import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import { envIsDefined, envParseNumber, envParseString } from '@skyra/env-utilities';
import type { QueueOptions } from 'bullmq';
import {
	ActivityType,
	GatewayIntentBits,
	PresenceUpdateStatus,
	type ClientOptions,
	type PresenceData,
	type WebhookClientData,
} from 'discord.js';
import { getGuildLanguage } from './helpers/provide/config';
import { DEBUG, ROOT_DIR } from './helpers/provide/environment';
import { UserIDEnum } from './lib/enum/UserID.enum';
import { isProduction } from './lib/utils/env';

function parseApi(): ServerOptions {
	return {
		prefix: envParseString('API_EXTENSION', ''),
		origin: '*',
		listenOptions: { port: envParseNumber('API_PORT', 4000) },
		automaticallyConnect: false,
	};
}

function parseBotListOptions(): BotList.Options {
	return {
		clientId: UserIDEnum.BIRTHDAYY,
		debug: DEBUG,
		shard: true,
		autoPost: {
			enabled: isProduction,
		},
		keys: {
			topGG: envParseString('TOPGG_TOKEN', ''),
			discordListGG: envParseString('DISCORDLIST_TOKEN', ''),
			discordBotList: envParseString('DISCORDBOTLIST_TOKEN', ''),
		},
	};
}

function parseInternationalizationOptions(): InternationalizationOptions {
	return {
		defaultMissingKey: 'generic:key_not_found',
		fetchLanguage: async (context) => {
			if (!context.guild) {
				return 'en-US';
			}

			const guildLanguage: string = await getGuildLanguage(context.guild.id);
			container.logger.info(guildLanguage);
			return guildLanguage || 'en-US';
		},
	};
}

function parseBullOptions(): QueueOptions {
	return {
		connection: {
			port: envParseNumber('REDIS_PORT'),
			password: envParseString('REDIS_PASSWORD'),
			host: envParseString('REDIS_HOST'),
			db: envParseNumber('REDIS_DB'),
			username: envParseString('REDIS_USERNAME'),
		},
	};
}

function parseScheduledTasksOptions(): ScheduledTasksOptions {
	return {
		strategy: new ScheduledTaskRedisStrategy({
			bull: parseBullOptions(),
		}),
	};
}

function parsePresenceOptions(): PresenceData {
	return {
		status: PresenceUpdateStatus.Online,
		activities: [
			{
				name: '/birthday register 🎂',
				type: ActivityType.Watching,
			},
		],
	};
}

function parseLoggerOptions(): ClientLoggerOptions {
	return {
		level: DEBUG ? LogLevel.Debug : LogLevel.Info,
		instance: container.logger,
	};
}

function parseSubcommandsAdvancedOptions(): PluginSubcommandOptions {
	return {
		nameCommandsAutogenerated: true,
	};
}

export const SENTRY_OPTIONS: Sentry.NodeOptions = {
	dsn: envParseString('SENTRY_DSN'),
	debug: DEBUG,
	integrations: [
		new Sentry.Integrations.Modules(),
		new Sentry.Integrations.FunctionToString(),
		new Sentry.Integrations.LinkedErrors(),
		new Sentry.Integrations.Console(),
		new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
		new RewriteFrames({ root: ROOT_DIR }),
	],
};

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
	loadDefaultErrorListeners: true,
	logger: parseLoggerOptions(),
	shards: 'auto',
	api: parseApi(),
	botList: parseBotListOptions(),
	i18n: parseInternationalizationOptions(),
	tasks: parseScheduledTasksOptions(),
	presence: parsePresenceOptions(),
	subcommandsAdvanced: parseSubcommandsAdvancedOptions(),
};

function parseWebhookError(): WebhookClientData | null {
	if (!envIsDefined('DISCORD_ERROR_WEBHOOK_ID', 'DISCORD_ERROR_WEBHOOK_TOKEN')) return null;

	return {
		id: envParseString('DISCORD_ERROR_WEBHOOK_ID'),
		token: envParseString('DISCORD_ERROR_WEBHOOK_TOKEN'),
	};
}

export const WEBHOOK_ERROR = parseWebhookError();
