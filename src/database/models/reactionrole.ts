/* eslint-disable camelcase */
import mongoose, { Schema } from 'mongoose';
import { BaseModel } from '../../../resources/structs';

export interface ReactionRoleModel extends BaseModel {
  guild_id: string;
  channel_id: string;
  message_id: string;
  emoji: string;
  role_id: string;
  created_by: string;
}

const ReactionRoleSchema = new Schema({
  guild_id: { type: String, required: true },
  channel_id: { type: String, required: true },
  message_id: { type: String, required: true },
  emoji: { type: String, required: true },
  role_id: { type: String, required: true },
  created_by: { type: String, required: true },
});

export default mongoose.model<ReactionRoleModel>('reactionrole', ReactionRoleSchema, 'reactionroles');
