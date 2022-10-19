import {
  ThreadChannel,
} from 'discord.js';
import Event from '../structs/Event';
import Client from '../Client';
import { EventData } from '../../resources/structs';
import { Channels } from '../../resources/constants';

class ThreadCreateEvent extends Event {
  constructor(client: Client, data: EventData) {
    super(client, {
      ...data,
    });
  }

  async run(thread: ThreadChannel) {
    if (thread.parent?.id === Channels.PROJECTS_PRESENTATIONS && !thread.joined) {
      await thread.join();
    }
  }
}

export default ThreadCreateEvent;
