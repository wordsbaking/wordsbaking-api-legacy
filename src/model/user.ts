import * as Mongoose from 'mongoose';

import {connection} from '../entrances/mongoose';

const userSchema = new Mongoose.Schema(
  {
    email: {type: String, index: true},
    mobile: {type: String, index: true},
    emailActivated: {type: String, index: true},
    password: String,
    profile: {
      displayName: String,
      avatar: String,
      tagline: String,
    },
    data: {
      activeCollection: String,
      finishedCollections: [String],
    },
  },
  {collection: 'users'},
);

export interface UserProfile {
  displayName: string;
  avatar: string;
  tagline: string;
}

export interface UserData {
  activeCollection: string;
  finishedCollections: string[];
}

export interface User {
  email: string;
  mobile?: string;
  emailActivated?: boolean;
  profile: UserProfile;
  data: UserData;
}

export interface UserSchema extends User {
  /** Encrypted password */
  password: EncryptedPasswordString;
}

export type UserOID = Mongoose.Types.ObjectId & {__model: 'user'};
export type UserID = TypedString<'user-id'>;

export interface UserDocument extends UserSchema, Mongoose.Document {
  _id: UserOID;
  id: UserID;
}

export const UserModel = connection.model<UserDocument>('User', userSchema);

export const UserGraphQLSchema = `
  type UserProfile {
    displayName: String
    avatar: String
    tagline: String
  }

  type UserData {
    activeCollection: String
    finishedCollections: [String]!
  }

  type User {
    email: String
    mobile: String
    profile: UserProfile
    data: UserData
  }
`;
