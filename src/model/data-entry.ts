import * as Mongoose from 'mongoose';

import {connection} from '../entrances/mongoose';

import {UserOID} from './user';

const dataEntrySchema = new Mongoose.Schema(
  {
    name: {type: String, index: true},
    category: {type: String},
    type: {type: String},
    owner: {type: Mongoose.Schema.Types.ObjectId, index: true},
    syncAt: {type: Number, index: true},
    updateAt: {type: Number, index: true},
    data: {type: Mongoose.Schema.Types.Mixed},
    removed: {type: Boolean},
  },
  {collection: 'data-entries'},
);

export type DataEntryCategory = TypedString<'data-entry-category'>;
export type DataEntryName = TypedString<'data-entry-name'>;
export type DataEntryType = 'value' | 'accumulation';

export interface DataEntry {
  name: DataEntryName;
  category: DataEntryCategory;
  type?: DataEntryType;
  owner: UserOID;
  syncAt: TimeNumber;
  updateAt: TimeNumber;
  data: any;
  removed?: true;
}

export interface DataEntrySchema extends DataEntry {}

export type DataEntryOID = Mongoose.Types.ObjectId & {__model: 'data-entry'};
export type DataEntryID = TypedString<'data-entry-id'>;

export interface DataEntryDocument extends DataEntrySchema, Mongoose.Document {
  _id: DataEntryOID;
  id: DataEntryID;
}

export const DataEntryModel = connection.model<DataEntryDocument>(
  'DataEntry',
  dataEntrySchema,
);
