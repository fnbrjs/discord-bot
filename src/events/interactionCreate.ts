import {
  CacheType, Interaction,
} from 'discord.js';
import Event from '../structs/Event';
import Client from '../Client';
import { EventData } from '../../resources/structs';

class InteractionEvent extends Event {
  constructor(client: Client, data: EventData) {
    super(client, {
      ...data,
    });
  }

  async run(i: Interaction<CacheType>) {
    if (i.isCommand() || i.isContextMenuCommand()) {
      const command = this.client.commands.get(i.commandName);
      if (!command) return;

      if (i.channel?.partial) await i.channel.fetch();

      await command._exec(i, i.options as any);
    } else if (i.isAutocomplete()) {
      const command = this.client.commands.get(i.commandName);
      if (!command) return;

      await command.execAutocomplete(i);
    }
  }
}

export default InteractionEvent;
