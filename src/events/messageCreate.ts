import {
  ChannelType,
  Message,
} from 'discord.js';
import Event from '../structs/Event';
import Client from '../Client';
import { EventData } from '../../resources/structs';
import { Channels, Guilds } from '../../resources/constants';

class MessageEvent extends Event {
  constructor(client: Client, data: EventData) {
    super(client, {
      ...data,
    });
  }

  async run(m: Message) {
    if (m.guild?.id === Guilds.APPDEV && m.channel.type === ChannelType.PublicThread && m.channel.parentId === Channels.PROJECTS_PRESENTATIONS) {
      if (this.client.config.mods.includes(m.author.id)) return;

      if (m.author.id !== this.client.user!.id && m.author.id !== m.channel.ownerId) {
        await m.delete();
        const warningMessage = await m.channel.send(`Sorry <@${m.author.id}>, only the original poster can send messages in here.`);
        await new Promise((res) => setTimeout(res, 7000));
        await warningMessage.delete();
      }
    }
  }
}

export default MessageEvent;
