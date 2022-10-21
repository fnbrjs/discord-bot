import {
  ApplicationCommandOptionType, AutocompleteInteraction, CacheType, CommandInteraction,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { colors } from '../../resources/constants';

class MCPCommand extends Command {
  private cachedMCPCommands: { cachedAt: number, commands: string[] };
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Sends info about an MCP command (eg. QueryProfile)',
      options: [{
        name: 'command',
        description: 'The MCP command',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      }],
    });

    this.cachedMCPCommands = { cachedAt: 0, commands: [] };
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const commandName = options.getString('command', true);

    const command = await this.fetchCommand(commandName);

    if (!command) {
      await i.reply({
        ...this.client.embedify({
          title: 'Couldn\'t resolve command',
          description: `The command \`${commandName}\` wasn't found!`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    const commandParts = command.split('\n\n');

    const description = commandParts.shift()!.replace(/^.+\n/, '');

    const [embed] = this.client.embedify({
      title: commandName,
      description,
      fields: commandParts.map((p) => ({
        name: p.match(/## (.+)\n((.|\n)+$)/)?.[1] || '-',
        value: p.match(/## (.+)\n((.|\n)+$)/)?.[2] || '-',
      })),
    }).embeds;

    embed.setURL(`https://github.com/MixV2/EpicResearch/blob/master/docs/mcp/profile/operations/${commandName}.md`);

    await i.reply({ embeds: [embed] });
  }

  public async execAutocomplete(i: AutocompleteInteraction<CacheType>): Promise<void> {
    const commandName = i.options.getString('command', true);

    const commands = await this.fetchCommands();

    await i.respond(commands
      .filter((c) => c.toLowerCase().startsWith(commandName.toLowerCase()))
      .filter((c, idx) => idx < 25)
      .map((c) => ({
        name: c,
        value: c,
      })));
  }

  private async fetchCommands() {
    if (Date.now() - this.cachedMCPCommands.cachedAt < 1000 * 60 * 60) {
      return this.cachedMCPCommands.commands;
    }

    try {
      const commandsData = await this.client.http({
        method: 'GET',
        url: 'https://api.github.com/repos/MixV2/EpicResearch/git/trees/86abfa0592880d420c97c8edb57168e6bbfadc20',
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN!}`,
        },
      });

      this.cachedMCPCommands = {
        cachedAt: Date.now(),
        commands: commandsData.data.tree.map((f: any) => f.path.replace('.md', '')),
      };

      return this.cachedMCPCommands.commands;
    } catch (err) {
      return [];
    }
  }

  private async fetchCommand(command: string): Promise<string | undefined> {
    try {
      const docsData = await this.client.http({
        method: 'GET',
        url: `https://raw.githubusercontent.com/MixV2/EpicResearch/master/docs/mcp/profile/operations/${command}.md`,
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN!}`,
        },
      });

      return docsData.data;
    } catch (err) {
      return undefined;
    }
  }
}

export default MCPCommand;
