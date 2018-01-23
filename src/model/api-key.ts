import * as Mongoose from 'mongoose';

import {connection} from '../entrances/mongoose';

import {UserOID} from './user';

const apiKeySchema = new Mongoose.Schema(
  {
    key: {type: String, index: true, unique: true},
    user: {type: Mongoose.Schema.Types.ObjectId, index: true},
    expires: {type: Date, index: true},
  },
  {collection: 'api-keys'},
);

export type APIKey = TypedString<'api-key'>;

export interface APIKeySchema {
  key: APIKey;
  user: UserOID;
  expires: Date;
}

export type APIKeyOID = Mongoose.Types.ObjectId & {__model: 'api-key'};
export type APIKeyID = TypedString<'api-key-id'>;

export interface APIKeyDocument extends APIKeySchema, Mongoose.Document {
  _id: APIKeyOID;
  id: APIKeyID;
}

export const APIKeyModel = connection.model<APIKeyDocument>(
  'APIKey',
  apiKeySchema,
);
