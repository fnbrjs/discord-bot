import {
  ActionRowBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, ModalBuilder,
  TextInputBuilder, TextInputStyle,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData } from '../../resources/structs';
import { Channels, colors, Guilds } from '../../resources/constants';

class MentionEveryoneCommand extends Command {
  public lastUsed: Record<string, number>;
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      guilds: [Guilds.APPDEV],
      type: ApplicationCommandType.Message,
    });

    this.lastUsed = {};
  }

  public async exec(i: MessageContextMenuCommandInteraction) {
    if (!i.channel!.isThread() || i.channel.parentId !== Channels.PROJECTS_PRESENTATIONS) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot mention everyone on this message',
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
          title: 'Cannot mention everyone on this message',
          description: 'Only the owner of the post can use this command',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    if (Date.now() - this.lastUsed[i.user.id] < 15 * 60 * 1000) {
      await i.reply({
        ...this.client.embedify({
          title: 'Cannot mention everyone on this message',
          description: 'You can only use this command once every 15 minutes',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    const modalId = `mem-${i.user.id}-${Date.now()}`;

    await i.showModal(new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Confirm mentioning everyone')
      .addComponents(new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
          .setCustomId('confirm')
          .setLabel('Type "confirm" here')
          .setPlaceholder('confirm')
          .setRequired(true)
          .setStyle(TextInputStyle.Short))));

    const modalSubmit = await i.awaitModalSubmit({
      time: 1 * 60 * 60 * 1000,
      filter: (si) => si.customId === modalId,
    }).catch(() => undefined);

    if (!modalSubmit) return;

    if (modalSubmit.fields.getTextInputValue('confirm') !== 'confirm') {
      await modalSubmit.reply({
        ...this.client.embedify({
          title: 'Cannot mention everyone on this message',
          description: 'You did not type "confirm" in the modal',
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    this.lastUsed[i.user.id] = Date.now();

    await i.targetMessage.reply({
      content: '@everyone',
    });

    await modalSubmit.reply({
      content: '📣 Mentioned everyone!',
      ephemeral: true,
    });
  }
}

export default MentionEveryoneCommand;
