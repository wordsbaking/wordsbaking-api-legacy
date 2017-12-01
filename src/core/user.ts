import * as Bcrypt from 'bcrypt';
import * as Crypto from 'crypto';
import {Request} from 'express';

import {
  InvalidAPIKeyError,
  PasswordMismatchError,
  UserExistsError,
  UserNotExistsError,
} from '../error';

import {
  APIKey,
  APIKeyModel,
  UserDocument,
  UserID,
  UserModel,
  UserOID,
  UserProfile,
} from '../model';

const API_KEY_EXPIRATION = 30 * 24 * 3600 * 1000;

export class UserContext {
  constructor(private doc: UserDocument) {}

  get id(): UserID {
    return this.doc.id;
  }

  get oid(): UserOID {
    return this.doc._id;
  }
}

export interface UserRequest extends Request {
  user: UserContext;
}

export async function getUserByAPIKey(
  key: APIKey,
  renew = true,
): Promise<UserContext> {
  let now = new Date();

  let query = {
    key,
    expires: {$gt: now},
  };

  let apiKeyDoc = renew
    ? await APIKeyModel.findOneAndUpdate(
        query,
        {
          $set: {
            expires: new Date(now.getTime() + API_KEY_EXPIRATION),
          },
        },
        {new: true},
      )
    : await APIKeyModel.findOne(query);

  let userDoc: UserDocument | Nullable;

  if (apiKeyDoc) {
    userDoc = await UserModel.findById(apiKeyDoc.user);
  }

  if (!userDoc) {
    throw new InvalidAPIKeyError();
  }

  return new UserContext(userDoc);
}

export interface SignUpOptions {
  email: EmailString;
  password: PasswordString;
}

export interface SignUpInfo {
  userId: UserID;
  account: EmailString;
  apiKey: APIKey;
}

export async function signUp({
  email,
  password,
}: SignUpOptions): Promise<SignUpInfo> {
  let encryptedPassword = await Bcrypt.hash(password, 10);

  let {upserted} = await UserModel.update(
    {email},
    {
      $setOnInsert: {
        email,
        password: encryptedPassword,
      },
    },
    {upsert: true},
  );

  let entry = upserted && upserted[0];

  if (!entry) {
    throw new UserExistsError();
  }

  return {
    userId: entry._id,
    apiKey: await generateAPIKey(entry._id),
    account: email,
  };
}

export interface SignInOptions {
  email: EmailString;
  password: PasswordString;
}

export interface SignInInfo {
  userId: UserID;
  account: string;
  apiKey: APIKey;
}

export async function signIn({
  email,
  password,
}: SignInOptions): Promise<SignInInfo> {
  let doc = await UserModel.findOne({email});

  if (!doc) {
    throw new UserNotExistsError();
  }

  if (!await Bcrypt.compare(password, doc.password)) {
    throw new PasswordMismatchError();
  }

  return {
    userId: doc.id,
    account: email,
    apiKey: await generateAPIKey(doc._id),
  };
}

export async function generateAPIKey(oid: UserOID): Promise<APIKey> {
  let key = Crypto.randomBytes(32).toString('base64') as APIKey;

  await APIKeyModel.create({
    key,
    user: oid,
    expires: new Date(Date.now() + API_KEY_EXPIRATION),
  });

  return key;
}

export async function updateProfile(
  userId: UserID,
  avatar: string | undefined,
  displayName: string,
  tagline: string,
): Promise<UserProfile> {
  let doc = await UserModel.findById(userId);

  if (!doc) {
    throw new UserNotExistsError();
  }

  if (avatar) {
    doc.profile.avatar = avatar;
  }

  doc.profile.displayName = displayName;
  doc.profile.tagline = tagline;

  await doc.save();

  return doc.profile;
}
