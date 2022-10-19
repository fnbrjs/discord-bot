import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { Guilds, colors } from '../../resources/constants';

class ReloadCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Reloads bot modules',
      options: [{
        name: 'type',
        description: 'Which modules to reload',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [{
          name: 'commands',
          value: 'commands',
        }, {
          name: 'events',
          value: 'events',
        }, {
          name: 'config',
          value: 'config',
        }, {
          name: 'client',
          value: 'client',
        }, {
          name: 'interactions',
          value: 'interactions',
        }],
      }],
      guilds: [Guilds.FNBRJS],
    });
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const reloadType = options.getString('type', true);

    const start = Date.now();
    const [embed] = this.client.embedify({
      title: '🔁 Reload Successful',
      color: colors.SUCCESS_GREEN,
    }).embeds;

    if (reloadType === 'commands') {
      await this.client.loadCommands();
      embed.setDescription(`${this.client.commands.size} commands were reloaded (${Date.now() - start}ms)`);
    } else if (reloadType === 'events') {
      await this.client.loadEvents();
      embed.setDescription(`${this.client.events.size} events were reloaded (${Date.now() - start}ms)`);
    } else if (reloadType === 'config') {
      await this.client.loadConfig();
      embed.setDescription(`Config was reloaded (${Date.now() - start}ms)`);
    } else if (reloadType === 'client') {
      await this.client.loadCommands();
      await this.client.loadEvents();
      await this.client.loadConfig();
      embed.setDescription(`Commands, events and config were reloaded (${Date.now() - start}ms)`);
    } else if (reloadType === 'interactions') {
      await this.client.registerApplicationCommands();
      embed.setDescription(`Interactions were reloaded (${Date.now() - start}ms)`);
    }

    await i.reply({ embeds: [embed] });
  }
}

export default ReloadCommand;
