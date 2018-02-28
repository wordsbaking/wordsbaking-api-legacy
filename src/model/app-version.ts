import * as Mongoose from 'mongoose';

import {connection} from '../entrances/mongoose';

const appVersionSchema = new Mongoose.Schema(
  {
    platform: {type: String, index: true},
    version: {type: String},
    publisher: {type: String, index: true},
    beta: {type: Boolean, index: true},
    description: {type: String},
    downloadUrl: {type: String},
    timestamp: {type: Number},
  },
  {collection: 'app-versions'},
);

export interface AppVersionEntry {
  platform: string;
  version: string;
  beta: boolean;
  publisher: string;
  description: string;
  downloadUrl: string;
  timestamp: number;
}

export interface AppVersionSchema extends AppVersionEntry {}

export type AppVersionOID = Mongoose.Types.ObjectId & {__model: 'app-version'};
export type AppVersionID = TypedString<'app-version-id'>;

export interface AppVersionDocument
  extends AppVersionSchema,
    Mongoose.Document {
  _id: AppVersionOID;
  id: AppVersionID;
}

export const AppVersionModel = connection.model<AppVersionDocument>(
  'app-version',
  appVersionSchema,
);
