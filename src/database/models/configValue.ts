import mongoose, { Schema } from 'mongoose';
import { BaseModel, Config } from '../../../resources/structs';

export interface ConfigValueModel extends BaseModel {
  key: keyof Config;
  value: any;
}

const ConfigSchema = new Schema({
  key: { type: Schema.Types.String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
});

export default mongoose.model<ConfigValueModel>('configValue', ConfigSchema, 'config');
