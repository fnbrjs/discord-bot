import {
  ApplicationCommandOptionType, CommandInteraction,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { colors, emojiRegex, Guilds } from '../../resources/constants';

class AddReactionRoleCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Creates a reaction role',
      options: [{
        name: 'emoji',
        description: 'A reaction emoji',
        type: ApplicationCommandOptionType.String,
        required: true,
      }, {
        name: 'role',
        description: 'A role',
        type: ApplicationCommandOptionType.Role,
        required: true,
      }, {
        name: 'message',
        description: 'A message link (https://discord.com/channels/xxx/xxx/xxx)',
        type: ApplicationCommandOptionType.String,
        required: true,
      }],
      guilds: [Guilds.APPDEV, Guilds.FNBRJS],
    });
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const emoji = options.getString('emoji', true);
    const role = options.getRole('role', true);
    const messageLink = options.getString('message', true);

    if (!/\/channels\/(\d+)\/(\d+)\/(\d+)/.test(messageLink)) {
      await i.reply(this.client.embedify({
        title: 'Cannot create reaction role',
        description: `The message **${messageLink}** couldn't be resolved`,
        color: colors.ERROR_RED,
      }));

      return;
    }

    if (!emojiRegex.test(emoji)) {
      await i.reply(this.client.embedify({
        title: 'Cannot create reaction role',
        description: `**${emoji}** is not a valid emoji`,
        color: colors.ERROR_RED,
      }));

      return;
    }

    const [, guildId, channelId, messageId] = messageLink.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/)!.values();

    const resolvedMessage = await this.resolveMessage(guildId, channelId, messageId);

    if (!resolvedMessage) {
      await i.reply(this.client.embedify({
        title: 'Cannot create reaction role',
        description: `The message **${messageLink}** couldn't be resolved`,
        color: colors.ERROR_RED,
      }));

      return;
    }

    if (await this.client.db.ReactionRoleModel.exists({ message_id: resolvedMessage.message.id, emoji })) {
      await i.reply(this.client.embedify({
        title: 'Cannot create reaction role',
        description: 'A reaction role with the same emoji already exists',
        color: colors.ERROR_RED,
      }));

      return;
    }

    await resolvedMessage.message.react(emoji);

    await this.client.db.ReactionRoleModel.create({
      guild_id: guildId,
      channel_id: resolvedMessage.channel.id,
      message_id: resolvedMessage.message.id,
      emoji: emoji.replace(/(<:|>)/g, ''),
      role_id: role.id,
      created_by: i.user.id,
    });

    await i.reply(this.client.embedify({
      title: 'Successfully created reaction role',
      description: `Reacting with ${emoji} on [this message](${messageLink}) now grants the role <@&${role.id}>`,
      color: colors.SUCCESS_GREEN,
    }));
  }

  private async resolveMessage(guildId: string, channelId: string, messageId: string) {
    try {
      const channel = await this.client.guilds.cache.get(guildId)?.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) return undefined;

      const message = await channel.messages.fetch(messageId);
      return message ? { message, channel } : undefined;
    } catch (err) {
      return undefined;
    }
  }
}

export default AddReactionRoleCommand;
