import * as Mongoose from 'mongoose';

import {oldAppDBConnection} from '../../entrances/mongoose';

let userWordSchema = new Mongoose.Schema(
  {
    u: String,
    t: String,
    s: Number,
    r: Boolean, // r stands for removed
  },
  {
    collection: 'wbuserwords',
  },
);

export interface UserWord {
  u: string;
  t: string;
  s: number;
  r: any[];
}

export interface UserWordDocument extends UserWord, Mongoose.Document {}

export const UserWordModel = oldAppDBConnection.model<UserWordDocument>(
  'WBUserWord',
  userWordSchema,
);
