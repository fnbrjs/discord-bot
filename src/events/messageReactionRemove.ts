/* eslint-disable no-underscore-dangle */
import { MessageReaction, User } from 'discord.js';
import Event from '../structs/Event';
import Client from '../Client';
import { EventData } from '../../resources/structs';
import { LogEvents } from '../../resources/constants';

class MessageReactionRemoveEvent extends Event {
  constructor(client: Client, data: EventData) {
    super(client, {
      ...data,
    });
  }

  async run(reaction: MessageReaction, user: User) {
    const dbReactionRole = await this.client.db.ReactionRoleModel.findOne({ emoji: decodeURIComponent(reaction.emoji.identifier), message_id: reaction.message.id });

    if (dbReactionRole) {
      const guildMember = await reaction.message.guild?.members.fetch(user.id);
      if (!guildMember) return;

      if (guildMember.roles.cache.has(dbReactionRole.role_id)) {
        try {
          await guildMember.roles.remove(dbReactionRole.role_id);
        } catch (err: any) {
          this.client.logger.error({
            event: LogEvents.REACTION_ROLE_ERROR,
            message: reaction.message.id,
            channel: dbReactionRole.channel_id,
            user: user.id,
            guild: reaction.message.guildId || 'DMs',
            emoji: decodeURIComponent(reaction.emoji.identifier),
            error: err,
          }, `Removing a reaction role threw an error: ${err.name} - ${err.message}`);
        }
      }
    }
  }
}

export default MessageReactionRemoveEvent;
