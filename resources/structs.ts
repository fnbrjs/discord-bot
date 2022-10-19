import {
  ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, ColorResolvable,
  PermissionsString,
} from 'discord.js';
import { Types } from 'mongoose';

export interface EventData {
  name: string;
  unregisterPreviousEvents?: boolean;
}

export interface CommandDataOptions {
  name: string;
  description: string;
  type: ApplicationCommandOptionType,
  autocomplete?: boolean;
  choices?: {
    name: string;
    value: string;
  }[];
  required: boolean;
}

export interface CommandData {
  name: string;
  description: string;
  requiredChannelPerms?: PermissionsString[];
  guilds?: string[];
  options?: CommandDataOptions[];
  type?: ApplicationCommandType;
}

export interface Config {
  embedColor: string;
  mods: string[];
}

export interface EmbedData {
  title?: string;
  description?: string;
  thumbnail?: Buffer | string;
  image?: Buffer | string;
  color?: ColorResolvable;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: string;
  replaceFooter?: boolean;
}

export type CommandOptions = ChatInputCommandInteraction['options'];

export interface BaseModel {
  _id: Types.ObjectId;
}
