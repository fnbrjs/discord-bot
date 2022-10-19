import { CommandInteraction } from 'discord.js';
import { version } from 'discord.js/package.json';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData } from '../../resources/structs';

class InfoCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Shows info about the bot',
    });
  }

  public async exec(i: CommandInteraction) {
    await i.reply(this.client.embedify({
      title: 'Bot Info',
      fields: [{
        name: 'Created by',
        value: 'This Nils',
      }, {
        name: 'Discord Library',
        value: `[discord.js@${version}](https://discord.js.org/#/docs/main/${version}/general/welcome)`,
      }, {
        name: 'Commands',
        value: this.client.commands.size.toString(),
      }, {
        name: 'Websocket Latency',
        value: `${this.client.ws.ping}ms`,
      }],
    }));
  }
}

export default InfoCommand;
