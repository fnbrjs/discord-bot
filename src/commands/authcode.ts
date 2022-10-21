import {
  ApplicationCommandOptionType, AutocompleteInteraction, CacheType, CommandInteraction,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';

class AuthCodeCommand extends Command {
  private clientsCache: { cachedAt: number, clients: { name: string, id: string, secret: string }[] };
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Sends the authorization code link for a specific client',
      options: [{
        name: 'client',
        type: ApplicationCommandOptionType.String,
        description: 'The auth client name',
        autocomplete: true,
        required: true,
      }, {
        name: 'logout',
        type: ApplicationCommandOptionType.Boolean,
        description: 'Whether to include a logout ("true" or "false")',
        required: false,
      }],
    });

    this.clientsCache = { cachedAt: 0, clients: [] };
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const client = options.getString('client', true);
    const logout = options.getBoolean('logout', false) || false;

    let url = `https://www.epicgames.com/id/api/redirect?clientId=${client}&responseType=code`;
    if (logout) {
      url = 'https://www.epicgames.com/id/logout?redirectUrl=https%3A//www.epicgames.com/id/login%3FredirectUrl'
        + `%3Dhttps%253A%252F%252Fwww.epicgames.com%252Fid%252Fapi%252Fredirect%253FclientId%253D${client}%2526responseType%253Dcode`;
    }

    await i.reply({
      ...this.client.embedify({
        title: 'Successfully Generated Authorization Code URL',
        description: `${url}\n\nRemember: Authorization codes expire after 5 minutes and can only be used once!`,
      }),
      ephemeral: true,
    });
  }

  public async execAutocomplete(i: AutocompleteInteraction<CacheType>) {
    const input = i.options.getFocused();
    const clients = await this.getClients();

    await i.respond(clients
      .filter((c) => c.name.toLowerCase().startsWith(input.toLowerCase()))
      .map((c) => ({ name: c.name, value: c.id }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c, idx) => idx < 25));
  }

  private async getClients() {
    if (Date.now() - this.clientsCache.cachedAt > 1000 * 60 * 60) {
      const clients = await this.fetchClients();
      this.clientsCache = { cachedAt: Date.now(), clients };
    }

    return this.clientsCache.clients;
  }

  private async fetchClients() {
    const { data: rawClients } = await this.client.http({
      method: 'GET',
      url: 'https://raw.githubusercontent.com/MixV2/EpicResearch/master/docs/auth/auth_clients.md',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN!}`,
      },
    });

    return [...rawClients.matchAll(/\| (\[(.+?)\]\(.+?\)|(.+)) \| (.{32}) \| (.+) \|/gm)]
      .map((m) => {
        const [,, name1, name2, id, secret] = m;
        return { name: name2 || name1, id, secret };
      });
  }
}

export default AuthCodeCommand;
