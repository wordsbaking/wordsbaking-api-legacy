import * as Mongoose from 'mongoose';

import {oldAppDBConnection} from '../../entrances/mongoose';

let wordRecordSchema = new Mongoose.Schema(
  {
    u: String,
    t: String,
    s: Number,
    r: Array,
  },
  {collection: 'wordrecords'},
);

export interface WordRecordDocument extends Mongoose.Document {
  u: string;
  t: string;
  s: number;
  r: any[];
}

export const WordRecordModel = oldAppDBConnection.model<WordRecordDocument>(
  'WordRecord',
  wordRecordSchema,
);
