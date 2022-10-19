/* eslint-disable camelcase */
import mongoose, { Schema } from 'mongoose';

export interface TagModel {
  name: string;
  title: string;
  description?: string;
  image?: string;
  created_by: string;
}

const TagSchema = new Schema({
  name: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  image: { type: String, required: false },
  created_by: { type: String, required: true },
});

export default mongoose.model<TagModel>('tag', TagSchema, 'tags');
