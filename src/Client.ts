/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import {
  Client as DiscordClient, HexColorString, Collection, IntentsBitField, EmbedBuilder, AttachmentBuilder, Partials,
} from 'discord.js';
import dotenv from 'dotenv';
import pino from 'pino';
import { promises as fs } from 'fs';
import { Config, EmbedData } from '../resources/structs';
import Command from './structs/Command';
import Event from './structs/Event';
import Database from './database/Database';
import FNBRJSDocsManager from './docs/FNBRJSDocsManager';

dotenv.config();

class Client extends DiscordClient {
  public commands: Collection<string, Command>;
  public events: Collection<string, Event>;
  public db: Database;
  public config!: Config;
  public logger: pino.Logger;
  public fnbrjsDocs: FNBRJSDocsManager;
  constructor() {
    super({
      intents: [
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildEmojisAndStickers,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
        Partials.ThreadMember,
      ],
    });

    this.logger = pino({
      timestamp: pino.stdTimeFunctions.isoTime,
      level: 'trace',
      serializers: {
        error: pino.stdSerializers.err,
      },
    }, pino.transport({
      targets: [{
        level: 'trace',
        target: 'pino/file',
        options: {
          destination: './logs/discord-bot.log',
        },
      }, ...(process.env.NODE_ENV !== 'test' ? [{
        target: 'pino-pretty',
        options: {
          destination: 1,
          colorize: true,
          messageFormat: '\x1b[35m[{module}]\x1b[36m {msg}',
          hideObject: true,
          ignore: 'hostname,pid,time',
        } as any,
        level: 'info',
      }, {
        target: 'pino-pretty',
        options: {
          destination: 2,
          colorize: true,
          messageFormat: '\x1b[35m[{module}]\x1b[36m {msg}',
          hideObject: true,
          ignore: 'hostname,pid,time',
        } as any,
        level: 'error',
      }] : [])],
    })).child({ module: 'MAIN' });

    this.db = new Database(this);
    this.commands = new Collection();
    this.events = new Collection();

    this.fnbrjsDocs = new FNBRJSDocsManager(this);
  }

  public async start() {
    await this.db.start();
    this.logger.info('Connected to MongoDB');

    await this.loadConfig();
    this.logger.info('Loaded config');

    await Promise.all([this.loadCommands(), this.loadEvents()]);
    this.logger.info(`Loaded ${this.commands.size} commands and ${this.events.size} events`);

    await this.login(process.env.DISCORD_TOKEN);
  }

  public async loadConfig() {
    const configValues = await this.db.ConfigValueModel.find().lean().exec();

    if (!this.config) (this.config as any) = {};

    for (const configValue of configValues) {
      this.config![configValue.key] = configValue.value;
    }
  }

  public async loadCommands() {
    const commandFileNames = await fs.readdir('./dist/src/commands/');

    for (const commandFileName of commandFileNames) {
      const commandName = commandFileName.replace(/\..+$/, '');
      delete require.cache[require.resolve(`./commands/${commandName}`)];
      // eslint-disable-next-line global-require
      const { default: CommandFile } = require(`./commands/${commandName}`);
      this.commands.set(commandName, new CommandFile(this, { name: commandName }));
    }

    for (const commandName of this.commands.keys()) {
      if (!commandFileNames.map((cfn) => cfn.replace(/\..+$/, '')).includes(commandName)) {
        this.commands.delete(commandName);
      }
    }
  }

  public async loadEvents() {
    const eventFileNames = await fs.readdir('./dist/src/events/');

    for (const [eventName, event] of this.events) {
      event.unregister();
      this.events.delete(eventName);
    }

    for (const eventFileName of eventFileNames) {
      const eventName = eventFileName.replace(/\..+$/, '');
      delete require.cache[require.resolve(`./events/${eventName}`)];
      // eslint-disable-next-line global-require
      const { default: EventFile } = require(`./events/${eventName}`);
      const event: Event = new EventFile(this, { name: eventName });
      this.events.set(eventName, event);
    }

    for (const [, event] of this.events) {
      event.register();
    }
  }

  public async registerApplicationCommands() {
    const currentGlobalCommands = await this.application!.commands.fetch();

    const globalCommands = this.commands.filter((c) => !c.guilds || c.guilds.length === 0);

    await this.application?.commands.set(globalCommands.map((c) => {
      const currentGlobalCommand = currentGlobalCommands.find((cgc) => cgc.name === c.name);

      return {
        id: currentGlobalCommand?.id,
        ...c.toObject(),
      };
    }));

    for (const guild of this.guilds.cache.values()) {
      const guildCommands = this.commands.filter((c) => c.guilds?.includes(guild.id));

      // eslint-disable-next-line no-await-in-loop
      await guild.commands.set(guildCommands.map((c) => c.toObject()));
    }
  }

  public embedify(data: EmbedData) {
    const files = [];

    let { image, thumbnail } = data;
    if (image && Buffer.isBuffer(image)) {
      const name = `image-${Date.now()}.png`;
      files.push(new AttachmentBuilder(image, { name }));
      image = `attachment://${name}`;
    }

    if (thumbnail && Buffer.isBuffer(thumbnail)) {
      const name = `thumbnail-${Date.now()}.png`;
      files.push(new AttachmentBuilder(thumbnail, { name }));
      thumbnail = `attachment://${name}`;
    }

    const embed = new EmbedBuilder()
      .setColor(data.color || this.config?.embedColor as HexColorString);

    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.fields) embed.addFields(data.fields);
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (data.footer) embed.setFooter({ text: data.footer });

    return { embeds: [embed], files };
  }
}

export default Client;
