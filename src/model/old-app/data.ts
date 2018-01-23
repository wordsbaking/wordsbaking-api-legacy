import * as Mongoose from 'mongoose';

import {oldAppDBConnection} from '../../entrances/mongoose';

let dataSchema = new Mongoose.Schema(
  {
    u: String,
    s: Number,
    l: Number,
    c: String,
    i: String,
    t: Mongoose.Schema.Types.Mixed, // for better compatibility with value like undefined
    d: Mongoose.Schema.Types.Mixed,
    r: Mongoose.Schema.Types.Mixed,
  },
  {
    collection: 'data',
  },
);

export interface Data {
  /** user uid */
  u: string;
  /** sync stamp */
  s: number;
  /** last update stamp */
  l: number;
  /** category */
  c: string;
  /** data id */
  i: string;
  /** data type */
  t: any;
  /** data */
  d: any;
  /** removed */
  r: boolean;
}

export interface DataDocument extends Data, Mongoose.Document {}

export const DataModel = oldAppDBConnection.model<DataDocument>(
  'Data',
  dataSchema,
);
