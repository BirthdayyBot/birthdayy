/* eslint-disable no-case-declarations */
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { inlineCodeBlock } from '@sapphire/utilities';
import { channelMention, inlineCode, roleMention } from 'discord.js';
import generateBirthdayList from '../../helpers/generate/birthdayList';
import generateConfigListEmbed from '../../helpers/generate/configListEmbed';
import generateEmbed from '../../helpers/generate/embed';
import { isValidBirthdayMessage, setDefaultConfig } from '../../helpers/provide/config';
import { ARROW_RIGHT, FAIL, PLUS, PREMIUM_URL, SUCCESS } from '../../helpers/provide/environment';
import { hasChannelPermissions, hasGuildPermissions } from '../../helpers/provide/permission';
import replyToInteraction from '../../helpers/send/response';
import findOption from '../../helpers/utils/findOption';
import { getCommandGuilds } from '../../helpers/utils/guilds';
import { ConfigCMD } from '../../lib/commands/config';
import { ConfigName, configNameExtended } from '../../lib/database';
import { sendMessage } from '../../lib/discord/message';
import thinking from '../../lib/discord/thinking';

@ApplyOptions<Subcommand.Options>({
	description: 'Config Command',
	requiredUserPermissions: ['Administrator', ['ManageGuild', 'ManageRoles']],
	subcommands: [
		{
			name: 'list',
			chatInputRun: 'configList',
		},
		{
			name: 'announcement-channel',
			chatInputRun: 'configAnnouncementChannel',
		},
		{
			name: 'overview-channel',
			chatInputRun: 'configOverviewChannel',
		},
		{
			name: 'birthday-role',
			chatInputRun: 'configBirthdayRole',
		},
		{
			name: 'ping-role',
			chatInputRun: 'configPingRole',
		},
		{
			name: 'timezone',
			chatInputRun: 'configTimezone',
		},
		{
			name: 'announcement-message',
			chatInputRun: 'configAnnouncementMessage',
		},
		{
			name: 'reset',
			chatInputRun: 'configReset',
		},
	],
})
export class ConfigCommand extends Subcommand {
	public constructor(context: Subcommand.Context, options: Subcommand.Options) {
		super(context, {
			...options,
		});
	}

	public override async registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(await ConfigCMD(), {
			guildIds: getCommandGuilds('global'),
		});
	}

	content = '';
	embed = {
		title: `${FAIL} Failure`,
		description: 'Something went wrong',
		fields: [],
		thumbnail_url: '',
	};
	components = [];

	public async configList(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		// TODO: Implement configList Command
		await thinking(interaction);
		container.logger.info('Run configList Command');
		const guild_id = interaction.guildId;
		const configListEmbed = await generateConfigListEmbed(guild_id);
		await replyToInteraction(interaction, { embeds: [configListEmbed] });
		return;
	}

	public async configAnnouncementChannel(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configAnnouncementChannel Command');
		const announcement_channel = findOption(interaction, 'channel');
		if (await this.hasWritingPermissionsInChannel(interaction, announcement_channel)) {
			await this.setConfig(interaction, 'announcement_channel');
			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
		}
	}

	public async configOverviewChannel(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configOverviewChannel Command');
		const overview_channel = findOption(interaction, 'channel');
		if (await this.hasWritingPermissionsInChannel(interaction, overview_channel)) {
			await this.setConfig(interaction, 'overview_channel');

			const birthdayList = await generateBirthdayList(1, interaction.guildId);
			const birthdayListEmbed = await generateEmbed(birthdayList.embed);
			const birthdayListComponents = birthdayList.components as any;
			const newBirthdayList = await sendMessage(overview_channel, { embeds: [birthdayListEmbed], components: birthdayListComponents });
			await container.utilities.guild.set.OverviewMessage(interaction.guildId, newBirthdayList.id);

			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
		}
	}

	public async configBirthdayRole(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configBirthdayRole Command');
		if (await this.botHasManageRolesPermissions(interaction)) {
			await this.setConfig(interaction, 'birthday_role');
			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
		}
	}

	public async configPingRole(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configPingRole Command');
		if (await this.botHasManageRolesPermissions(interaction)) {
			await this.setConfig(interaction, 'ping_role');
			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
		}
	}

	public async configTimezone(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configTimezone Command');
		await this.setConfig(interaction, 'timezone');
		const embed = await generateEmbed(this.embed);
		await replyToInteraction(interaction, { embeds: [embed] });
	}

	public async configAnnouncementMessage(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		container.logger.info('Run configAnnouncementMessage Command');
		await this.setConfig(interaction, 'announcement_message');
		const embed = await generateEmbed(this.embed);
		await replyToInteraction(interaction, { embeds: [embed] });
	}

	public async configReset(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
		await thinking(interaction);
		const config = interaction.options.getString('config', true) as ConfigName;
		const configName = configNameExtended[config];
		const result = await setDefaultConfig(config, interaction.guildId);
		container.logger.info('config reset result', result);
		this.embed.title = `${SUCCESS} Success`;
		this.embed.description = `${ARROW_RIGHT} You have reset the \`${configName}\` config.`;
		const embed = await generateEmbed(this.embed);
		await replyToInteraction(interaction, { embeds: [embed] });
	}

	public async setConfig(interaction: Subcommand.ChatInputCommandInteraction<'cached'>, config: string): Promise<void> {
		const guild_id = interaction.guildId;
		try {
			switch (config) {
			case 'announcement_channel':
				const announcement_channel = findOption(interaction, 'channel');
				await container.utilities.guild.set.AnnouncementChannel(guild_id, announcement_channel);
				this.embed.description = `${ARROW_RIGHT} You set the **Announcement Channel** to ${channelMention(announcement_channel)}`;
				break;
			case 'overview_channel':
				const overview_channel = findOption(interaction, 'channel');
				await container.utilities.guild.set.OverviewChannel(guild_id, overview_channel);
				this.embed.description = `${ARROW_RIGHT} You set the **Overview Channel** to ${channelMention(overview_channel)}`;
				break;
			case 'birthday_role':
				const birthday_role = findOption(interaction, 'role');
				await container.utilities.guild.set.BirthdayRole(guild_id, birthday_role);
				this.embed.description = `${ARROW_RIGHT} You set the **Birthday Role** to ${roleMention(birthday_role)}`;
				break;
			case 'ping_role':
				const ping_role = findOption(interaction, 'role');
				await container.utilities.guild.set.BirthdayPingRole(guild_id, ping_role);
				this.embed.description = `${ARROW_RIGHT} You set the **Birthday Ping Role** to ${roleMention(ping_role)}`;
				break;
			case 'timezone':
				const timezone = findOption(interaction, 'timezone');
				const timezoneString = timezone < 0 ? `UTC${timezone}` : `UTC+${timezone}`;
				await container.utilities.guild.set.Timezone(guild_id, timezone);
				this.embed.description = `${ARROW_RIGHT} You set the **Timezone** to ${inlineCode(timezoneString)}`;
				break;
				// * PREMIUM ONLY
			case 'announcement_message':
				const announcement_message = findOption(interaction, 'message');
				const isPremium = await this.container.utilities.guild.check.isGuildPremium(guild_id);
				container.logger.info('isPremium: ', isPremium);
				const isBirthdayMessageValid = await isValidBirthdayMessage(announcement_message);
				if (!isPremium) {
					this.embed.title = `${PLUS} Early access only`;
					this.embed.description = `${ARROW_RIGHT} This feature is currently in __Beta Stage__ and **Birthdayy Premium Only**.
                        If you are interested in using this and future features now already, you can support the Development on [Patreon](${PREMIUM_URL}).`;
					break;
				}
				if (!isBirthdayMessageValid || isBirthdayMessageValid.error) {
					this.embed.title = `${FAIL} Failure`;
					switch (isBirthdayMessageValid.error) {
					case 'MESSAGE_TOO_LONG':
						this.embed.description = `${ARROW_RIGHT} The **Announcement Message** is too long. The maximum allowed length is **3500** characters.`;
						break;
					case 'NO_CUSTOM_EMOJIS':
						this.embed.description = `${ARROW_RIGHT} The **Announcement Message** contains custom emojis, which are a **Premium Feature**. [Patreon](${PREMIUM_URL})`;
						break;
					default:
						this.embed.description = `${ARROW_RIGHT} The **Announcement Message** is invalid. Please try again.`;
						break;
					}
				}
				await container.utilities.guild.set.AnnouncementMessage(guild_id, announcement_message);
				container.logger.debug('announcement_message', announcement_message);
				this.embed.description = `${ARROW_RIGHT} You set the **Announcement Message** to \n${inlineCode(announcement_message)}`;
				break;
			}
			this.embed.title = `${SUCCESS} Success`;
		} catch (error) {
			this.embed.title = `${FAIL} Failure`;
			this.embed.description = `${inlineCodeBlock(`${JSON.stringify(error, null, 2)}`)}`;
		}
	}

	private async hasWritingPermissionsInChannel(
		interaction: Subcommand.ChatInputCommandInteraction<'cached'>,
		channel_id: string,
	): Promise<boolean> {
		const hasCorrectPermissions = await hasChannelPermissions(interaction, ['ViewChannel', 'SendMessages'], channel_id);
		if (!hasCorrectPermissions) {
			this.embed.title = `${FAIL} Failure`;
			this.embed.description = `${ARROW_RIGHT} I don't have the permission to see & send messages in ${channelMention(channel_id)}.`;
			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
			return false;
		}
		return true;
	}

	private async botHasManageRolesPermissions(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<boolean> {
		const hasPermissions = await hasGuildPermissions(interaction, ['ManageRoles']);
		if (!hasPermissions) {
			this.embed.title = `${FAIL} Failure`;
			this.embed.description = `${ARROW_RIGHT} I don't have the permission to manage roles in this server.`;
			const embed = await generateEmbed(this.embed);
			await replyToInteraction(interaction, { embeds: [embed] });
			return false;
		}
		return true;
	}
}
