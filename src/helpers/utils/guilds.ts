import type { Guild } from '@prisma/client';
import { container } from '@sapphire/framework';
import { isCustom, isDevelopment, isNotCustom } from '../../lib/utils/env';
import { MAIN_DISCORD } from '../provide';
import { GuildIDEnum } from '../../lib/types/Enums';

export async function getCommandGuilds(
	commandLevel: 'global' | 'testing' | 'premium' | 'admin',
): Promise<string[] | undefined> {
	const testingGuilds = [GuildIDEnum.ChilliHQ, GuildIDEnum.ChilliAttackV2, GuildIDEnum.BirthdayyTesting];
	const adminGuilds = [GuildIDEnum.Birthdayy, GuildIDEnum.BirthdayyTesting];
	const customGuild = [MAIN_DISCORD];
	if (isNotCustom) adminGuilds.push(GuildIDEnum.ChilliHQ);
	if (isDevelopment) return testingGuilds;
	switch (commandLevel) {
		case 'global':
			if (isCustom) return customGuild;
			return undefined;
		case 'testing':
			return testingGuilds;
		case 'premium': {
			if (isCustom) return customGuild;
			const guilds: Guild[] = await container.utilities.guild.get.PremiumGuilds();
			const guildIds: string[] = guilds.map((guild) => guild.guildId);
			return guildIds;
		}
		case 'admin':
			return adminGuilds;
		default:
			return undefined;
	}
}
