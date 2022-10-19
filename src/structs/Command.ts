import {
  ApplicationCommandDataResolvable,
  ApplicationCommandType,
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  GuildBasedChannel,
  PermissionsString,
} from 'discord.js';
import Client from '../Client';
import { LogEvents, colors } from '../../resources/constants';
import { CommandData, CommandDataOptions, CommandOptions } from '../../resources/structs';

abstract class Command {
  public client: Client;
  public name: string;
  public description: string;
  public guilds?: string[];
  public options: CommandDataOptions[];
  public requiredChannelPerms?: PermissionsString[];
  public type: ApplicationCommandType;
  constructor(client: Client, data: CommandData) {
    this.client = client;

    this.name = data.name;
    this.description = data.description;
    this.guilds = data.guilds;
    this.options = data.options || [];
    this.requiredChannelPerms = data.requiredChannelPerms;
    this.type = data.type || ApplicationCommandType.ChatInput;
  }

  // eslint-disable-next-line no-underscore-dangle
  public async _exec(i: CommandInteraction, options: CommandOptions) {
    try {
      if (!await this.checkPerms(i)) return;

      this.client.logger.info({
        event: LogEvents.COMMAND_USED,
        command: this.name,
        user: i.user.id,
        guild: i.guildId || 'DMs',
      }, `/${this.name} was used by ${i.user.tag} in ${i.guild?.name || 'DMs'}`);
      await this.exec(i, options);
    } catch (err: any) {
      this.client.logger.error({
        event: LogEvents.COMMAND_ERROR,
        command: this.name,
        user: i.user.id,
        guild: i.guildId || 'DMs',
        error: err,
      }, `/${this.name} threw an error: ${err.name} - ${err.message}`);

      await this.sendCommandError(i, err);
    }
  }

  // eslint-disable-next-line no-unused-vars
  public async exec(i: CommandInteraction, options: CommandOptions) {
    // implemented by child class
  }

  // eslint-disable-next-line no-unused-vars
  public async execAutocomplete(i: AutocompleteInteraction) {
    // implemented by child class
  }

  public async checkPerms(i: CommandInteraction, interact = true) {
    const botGuildMember = i.guild && (i.guild.members.me || await i.guild.members.fetch(this.client.user!.id));
    if (i.guild && !botGuildMember) return false;

    if (i.channel) {
      if (i.channel.type !== ChannelType.DM && i.guild && !botGuildMember!.permissionsIn(i.channel).has('EmbedLinks')) {
        if (interact) {
          await i.reply({ content: `❌ The bot needs the permission **EmbedLinks** for /${this.name}. Please contact a server admin!` });
        }

        return false;
      }
    }

    if (i.guild && i.channel && this.requiredChannelPerms) {
      for (const permission of this.requiredChannelPerms) {
        if (!botGuildMember!.permissionsIn(<GuildBasedChannel>i.channel).has(permission)) {
          if (interact) {
            // eslint-disable-next-line no-await-in-loop
            await i.reply(this.client.embedify({
              description: `❌ The bot needs the permission **${permission}** for /${this.name}. Please contact a server admin!`,
              color: colors.ERROR_RED,
            }));
          }
          return false;
        }
      }
    }

    return true;
  }

  public async sendCommandError(i: CommandInteraction, err: Error) {
    const errorEmbed = this.client.embedify({
      title: `❌ Unexpected Error: ${err.name || 'Unknown Error'}`,
      description: `There was an unexpected error while executing /${this.name}\n\`${err.message || 'No description'}\``,
      color: colors.ERROR_RED,
    });

    try {
      if (i.isRepliable()) {
        await i.reply(errorEmbed);
      } else {
        await i.followUp(errorEmbed);
      }
    } catch (e) {
      // ignore
    }
  }

  public toObject(): ApplicationCommandDataResolvable {
    return {
      name: this.name,
      description: this.description,
      options: this.options as any[],
      type: this.type,
    };
  }
}

export default Command;
