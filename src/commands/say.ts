import {
  ApplicationCommandOptionType, ChannelType, CommandInteraction, TextChannel,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { colors, Guilds } from '../../resources/constants';

class SayCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Sends a message to a specific channel as an embed',
      options: [{
        name: 'channel',
        description: 'Which channel to send the message to',
        type: ApplicationCommandOptionType.Channel,
        required: true,
      }, {
        name: 'text',
        description: 'The text to send',
        type: ApplicationCommandOptionType.String,
        required: true,
      }],
      guilds: [Guilds.APPDEV, Guilds.FNBRJS],
    });
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const channel = options.getChannel('channel', true);
    const text = options.getString('text', true);

    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildVoice) {
      await i.reply(this.client.embedify({
        title: 'Cannot send message',
        description: 'Please select a channel that can receive messages',
        color: colors.ERROR_RED,
      }));

      return;
    }

    const [embed] = this.client.embedify({
      description: text,
    }).embeds;

    await (channel as TextChannel).send({ embeds: [embed] });

    await i.reply({
      ...this.client.embedify({
        title: 'Message sent',
        description: `The message was successfully sent to **#${channel.name}**`,
        color: colors.SUCCESS_GREEN,
      }),
      ephemeral: true,
    });
  }
}

export default SayCommand;
