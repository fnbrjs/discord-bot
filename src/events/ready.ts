import Event from '../structs/Event';
import Client from '../Client';
import { EventData } from '../../resources/structs';

class ReadyEvent extends Event {
  constructor(client: Client, data: EventData) {
    super(client, {
      ...data,
    });
  }

  async run() {
    this.client.logger.info(`Discord client ready as ${this.client.user?.tag}`);
  }
}

export default ReadyEvent;
