import * as Crypto from 'crypto';

import * as Bcrypt from 'bcrypt';
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
    apiKey: await generateAPIKey(entry._id),
  };
}

export interface SignInOptions {
  email: EmailString;
  password: PasswordString;
}

export interface SignInInfo {
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

  if (!Bcrypt.compare(password, doc.password)) {
    throw new PasswordMismatchError();
  }

  return {
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
