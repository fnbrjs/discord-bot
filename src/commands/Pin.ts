import { ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData } from '../../resources/structs';
import { Channels, colors, Guilds } from '../../resources/constants';

class PinCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      guilds: [Guilds.APPDEV],
      type: ApplicationCommandType.Message,
    });
  }

  public async exec(i: MessageContextMenuCommandInteraction) {
    if (!i.channel!.isThread() || i.channel.parentId !== Channels.PROJECTS_PRESENTATIONS) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot pin this message',
          description: `This command can only be used in <#${Channels.PROJECTS_PRESENTATIONS}>`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    if (i.user.id !== i.channel.ownerId) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot pin this message',
          description: 'Only the owner of the post can pin messages',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    if (i.targetMessage.pinned) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot pin this message',
          description: 'This message is already pinned',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    await i.targetMessage.pin(`Requested by ${i.user.tag}`);

    await i.reply({
      content: '📍 Pinned!',
      ephemeral: true,
    });
  }
}

export default PinCommand;
