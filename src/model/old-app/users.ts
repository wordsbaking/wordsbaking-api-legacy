import * as Mongoose from 'mongoose';

import {oldAppDBConnection} from '../../entrances/mongoose';

let userSchema = new Mongoose.Schema(
  {
    ss: Number,
    nn: String, // nickname
    em: {type: String, index: true}, // email
    ea: Boolean, // email activated
    oe: [String], // old emails
    ph: String, // password hash
    at: Object, // access tokens

    cn: Number, // clock-in number
    lc: Number, // last clock-in, YYYYMMDD
    st: Array, // study times

    cp: String, // clock in profile
    pt: Object, // power token
    cc: String, // current words collection
    fc: Object, // finished collections
    rp: Number, // review plan
    dd: Number, // due date
    sd: Number, // start date
    pr: String, // pronunciation
    as: Boolean, // auto slideout
    nc: String, // night mode color
    ob: Boolean, // obstinate enhance
    sr: Number, // sentence reading speed
    ls: Number, // last sync
  },
  {collection: 'users'},
);

export type UserOID = Mongoose.Types.ObjectId & {__model: 'user-oid'};

export interface UserDocument extends Mongoose.Document {
  _id: UserOID;
  ss: number;
  nn: string; // nickname
  em: string; // email
  ea: boolean; // email activated
  oe: [string]; // old emails
  ph: string; // password hash
  at: any; // access tokens

  cn: number; // clock-innumber
  lc: number; // last clock-in, YYYYMMDD
  st: any[]; // study times

  cp: string; // clock in profile
  pt: any; // power token
  cc: string; // current words collection
  fc: any; // finished collections
  rp: number; // review plan
  dd: number; // due date
  sd: number; // start date
  pr: string; // pronunciation
  as: boolean; // auto slideout
  nc: string; // night mode color
  ob: boolean; // obstinate enhance
  sr: number; // sentence reading speed
  ls: number; // last sync
}

export const UserModel = oldAppDBConnection.model<UserDocument>(
  'User',
  userSchema,
);
