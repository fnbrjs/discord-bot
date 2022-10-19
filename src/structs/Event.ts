import Client from '../Client';
import { EventData } from '../../resources/structs';

abstract class Event {
  public client: Client;
  public name: string;
  public unregisterPreviousEvents: boolean;
  constructor(client: Client, options: EventData) {
    this.client = client;

    this.name = options.name;
    this.unregisterPreviousEvents = options.unregisterPreviousEvents || true;
  }

  public register() {
    if (this.unregisterPreviousEvents) this.unregister();
    this.client.on(this.name, this.run.bind(this));
  }

  public unregister() {
    this.client.removeAllListeners(this.name);
  }

  // eslint-disable-next-line no-unused-vars
  public run(...data: any) {
    throw new Error('Run method not implemented');
  }
}

export default Event;
