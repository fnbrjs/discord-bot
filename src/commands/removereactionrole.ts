import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { colors, emojiRegex, Guilds } from '../../resources/constants';

class RemoveReactionRoleCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Removes a reaction role',
      options: [{
        name: 'emoji',
        description: 'A reaction emoji',
        type: ApplicationCommandOptionType.String,
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
    const messageLink = options.getString('message', true);

    if (!/\/channels\/(\d+)\/(\d+)\/(\d+)/.test(messageLink)) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot remove reaction role',
          description: `The message **${messageLink}** couldn't be resolved`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    if (!emojiRegex.test(emoji)) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot remove reaction role',
          description: `**${emoji}** is not a valid emoji`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    const [, guildId, channelId, messageId] = messageLink.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/)!.values();

    const resolvedMessage = await this.resolveMessage(guildId, channelId, messageId);

    if (!resolvedMessage) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot remove reaction role',
          description: `The message **${messageLink}** couldn't be resolved`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    if (!await this.client.db.ReactionRoleModel.exists({ message_id: resolvedMessage.message.id, emoji })) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot remove reaction role',
          description: 'This reaction role does not exists',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    const existingReaction = resolvedMessage.message.reactions.cache.find((r) => decodeURIComponent(r.emoji.identifier) === emoji && r.me);
    if (existingReaction) {
      await existingReaction.remove();
    }

    await this.client.db.ReactionRoleModel.deleteOne({ message_id: resolvedMessage.message.id, emoji });

    await i.reply(this.client.embedify({
      title: 'Successfully removed reaction role',
      description: `Reacting with ${emoji} on [this message](${messageLink}) no longer grants a role`,
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

export default RemoveReactionRoleCommand;
