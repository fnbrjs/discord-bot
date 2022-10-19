/* eslint-disable class-methods-use-this */
import mongoose from 'mongoose';
import Client from '../Client';
import TagModel from './models/tag';
import ReactionRoleModel from './models/reactionrole';
import ConfigValueModel from './models/configValue';

class Database {
  private client: Client;
  public TagModel: typeof TagModel;
  public ReactionRoleModel: typeof ReactionRoleModel;
  public ConfigValueModel: typeof ConfigValueModel;
  constructor(client: Client) {
    this.client = client;

    this.TagModel = TagModel;
    this.ReactionRoleModel = ReactionRoleModel;
    this.ConfigValueModel = ConfigValueModel;
  }

  public async start() {
    await mongoose.connect(process.env.DB_URL!);
  }
}

export default Database;
