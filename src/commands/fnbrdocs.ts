import {
  ApplicationCommandOptionType, AutocompleteInteraction, CacheType, CommandInteraction,
} from 'discord.js';
import Client from '../Client';
import Command from '../structs/Command';
import { CommandData, CommandOptions } from '../../resources/structs';
import { ClassPropOrMethod } from '../../resources/httpResponses';
import { colors } from '../../resources/constants';
import {
  findClassLike, getDocsLink, parseType, searchClassLike,
} from '../util';
import builtInTypes from '../../resources/builtInTypes';

class DocsCommand extends Command {
  constructor(client: Client, data: CommandData) {
    super(client, {
      ...data,
      description: 'Sends info about a documentation entry (eg Client#setStatus)',
      options: [{
        name: 'link',
        description: 'The documentation link',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      }, {
        name: 'version',
        type: ApplicationCommandOptionType.String,
        description: 'Documentation version (eg. 2.0.0, master), defaults to stable',
        required: false,
      }],
    });
  }

  public async exec(i: CommandInteraction, options: CommandOptions) {
    const link = options.getString('link', true);
    const version = options.getString('version', false) || 'stable';

    const docs = await this.client.fnbrjsDocs.fetch(version);
    if (!docs) {
      await i.reply({
        ...this.client.embedify({
          title: 'Couldn\'t resolve documentation version',
          description: `The version \`${version}\` wasn't found! Try \`master\`, \`stable\` or \`2.0.0\``,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    const [className,, propertyName] = link.split(/(#|\.)/g);

    const resolvedClassLike = findClassLike(docs, className);

    if (!resolvedClassLike) {
      await i.reply({
        ...this.client.embedify({
          title: 'Couldn\'t resolve documentation link',
          description: `A class / typedef / interface with the name \`${className}\` wasn't found!`,
          color: colors.ERROR_RED,
        }),
        ephemeral: true,
      });

      return;
    }

    let resolvedProperty: ClassPropOrMethod | undefined;
    let resolvedPropertyType = 'method';
    if (propertyName) {
      if (propertyName.endsWith('()')) {
        resolvedProperty = resolvedClassLike.classLike.methods?.find((m) => m.name.toLowerCase() === propertyName.replace('()', '').toLowerCase());
      } else {
        resolvedProperty = resolvedClassLike.classLike.props?.find((m) => m.name.toLowerCase() === propertyName.toLowerCase());
        resolvedPropertyType = 'property';
      }

      if (!resolvedProperty) {
        await i.reply({
          ...this.client.embedify({
            title: 'Couldn\'t resolve documentation link',
            description: `A property / method with the name \`${propertyName}\` wasn't found!`,
            color: colors.ERROR_RED,
          }),
          ephemeral: true,
        });

        return;
      }
    }

    const [embed] = this.client.embedify({
      title: link,
      footer: `Docs built on ${new Date(docs.meta.date).toLocaleDateString('en-US')}`,
      replaceFooter: true,
    }).embeds;

    embed.setURL(getDocsLink(version, resolvedClassLike.matchType, resolvedClassLike.classLike.name, resolvedProperty?.name));

    if (resolvedProperty) {
      embed.setDescription(resolvedProperty.description || 'No description available');

      if (resolvedPropertyType === 'method') {
        if (resolvedProperty.params) {
          embed.addFields({
            name: 'Parameters',
            value: resolvedProperty.params
              .map((p) => `${p.name}: ${p.nullable ? '?' : ''}${parseType(p.type, docs, version).replace(/(<|>)/g, '\\$&')} - ${p.description || '*no description*'}`)
              .join('\n'),
          });
        }

        if (resolvedProperty.returns) {
          embed.addFields({
            name: 'Returns',
            value: `${resolvedProperty.nullable ? '?' : ''}`
              + `${parseType('description' in resolvedProperty.returns ? resolvedProperty.returns.types : resolvedProperty.returns, docs, version).replace(/(<|>)/g, '\\$&')}`
              + ` ${'description' in resolvedProperty.returns ? resolvedProperty.returns.description : ''}`,
          });
        } else {
          embed.addFields({
            name: 'Returns',
            value: `[void](${builtInTypes.void})`,
          });
        }
      } else {
        embed.addFields({
          name: 'Type',
          value: `${resolvedProperty.nullable ? '?' : ''}${parseType(resolvedProperty.type, docs, version).replace(/(<|>)/g, '\\$&')}`,
        });
      }

      const flags = [];
      if (resolvedProperty.access) flags.push(resolvedProperty.access.toUpperCase());
      if (resolvedProperty.readonly) flags.push('readonly');
      if (resolvedProperty.scope) flags.push(resolvedProperty.scope);

      if (flags.length > 0) embed.addFields({ name: 'Flags', value: flags.map((f) => `\`${f.toUpperCase()}\``).join('\n') });
    } else {
      embed.setDescription(resolvedClassLike.classLike.description || 'No description available');

      if (resolvedClassLike.classLike.construct?.params) {
        embed.addFields({
          name: 'Constructor Args',
          value: resolvedClassLike.classLike.construct.params
            .map((p) => `${p.name}: ${p.nullable ? '?' : ''}${parseType(p.type, docs, version).replace(/(<|>)/g, '\\$&')} - ${p.description || '*no description*'}`)
            .join('\n'),
        });
      }

      embed.addFields({ name: 'Properties', value: (resolvedClassLike.classLike.props?.length || 0).toString() });
      embed.addFields({ name: 'Methods', value: (resolvedClassLike.classLike.methods?.length || 0).toString() });

      const flags = [];
      if (resolvedClassLike.classLike.access) flags.push(resolvedClassLike.classLike.access.toUpperCase());
      if (resolvedClassLike.classLike.abstract) flags.push('abstract');

      if (flags.length > 0) embed.addFields({ name: 'Flags', value: flags.map((f) => `\`${f.toUpperCase()}\``).join('\n') });
    }

    await i.reply({ embeds: [embed] });
  }

  public async execAutocomplete(i: AutocompleteInteraction<CacheType>): Promise<void> {
    const args = [...i.options.data];
    const link = args.shift()!.value as string;
    const version = args.shift()?.value as string | undefined || 'stable';

    const docs = await this.client.fnbrjsDocs.fetch(version);
    if (!docs) {
      await i.respond([]);
      return;
    }

    const [className,, propertyName] = link.split(/(#|\.)/g);

    if (!link.includes('#')) {
      const resolvedClassLikes = searchClassLike(docs, className);

      await i.respond(resolvedClassLikes.sort((a, b) => a.classLike.name.localeCompare(b.classLike.name)).filter((c, idx) => idx < 25).map((c) => ({
        name: `${c.classLike.name} (${c.matchType[0]})`,
        value: c.classLike.name,
      })));

      return;
    }

    const resolvedClassLike = findClassLike(docs, className);

    if (!resolvedClassLike) {
      await i.respond([]);
      return;
    }

    await i.respond([...resolvedClassLike.classLike.props || [], ...resolvedClassLike.classLike.methods || []]
      .filter((p) => p.name.toLowerCase().startsWith(propertyName.toLowerCase()))
      .filter((p, idx) => idx < 25)
      .map((p) => {
        const name = `${resolvedClassLike?.classLike.name}#`
        + `${p.name}${resolvedClassLike.classLike.props?.some((pr) => pr.name === p.name && pr.description === p.description) ? '' : '()'}`;

        return {
          name,
          value: name,
        };
      }));
  }
}

export default DocsCommand;
