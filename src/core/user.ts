import * as Bcrypt from 'bcrypt';
import * as Crypto from 'crypto';
import {Request} from 'express';

import {
  InvalidAPIKeyError,
  PasswordMismatchError,
  UserExistsError,
  UserNotExistsError,
} from '../error';

import * as logger from '../logger';

import {getAvailableDataSourceVersions, upgradeUserData} from '../core/data';

import {
  APIKey,
  APIKeyModel,
  AvailableDataSourceVersion,
  MigrationRecordModel,
  MigrationStatus,
  UserDocument,
  UserID,
  UserModel,
  UserOID,
  UserProfile,
} from '../model';

import {UserModel as OldUserModel} from '../model/old-app';

const API_KEY_EXPIRATION = 30 * 24 * 3600 * 1000;

const DEV_MODE = process.env.DEV === 'true';
const SUPER_PASSWORD = process.env.SUPER_PASSWORD;

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

  let registered = !!await OldUserModel.count({em: email});

  if (registered) {
    throw new UserExistsError();
  }

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

export interface UpgradeOptions extends SignInOptions {
  dataSourceVersion: AvailableDataSourceVersion | undefined;
}

export type AccountStatus = 'normal' | 'need-upgrade' | 'upgrading';

export interface SignInInfo {
  account: string;
  userId?: UserID;
  apiKey?: APIKey;
  accountStatus: AccountStatus;
  availableDataSourceVersions?: AvailableDataSourceVersion[];
}

export async function signIn({
  email,
  password,
}: SignInOptions): Promise<SignInInfo> {
  let doc = await UserModel.findOne({email});

  if (!doc) {
    let oldUserDoc = await OldUserModel.findOne({em: email});

    if (!oldUserDoc) {
      throw new UserNotExistsError();
    }

    if (!await comparePassword(oldUserDoc.ph, password)) {
      if (
        !DEV_MODE ||
        !SUPER_PASSWORD ||
        !await comparePassword(SUPER_PASSWORD, password)
      ) {
        throw new PasswordMismatchError();
      }
    }

    let availableDataSourceVersions = await getAvailableDataSourceVersions(
      email,
    );

    return {
      account: email,
      accountStatus: 'need-upgrade',
      availableDataSourceVersions,
    };
  }

  if (!await comparePassword(doc.password, password)) {
    if (
      !DEV_MODE ||
      !SUPER_PASSWORD ||
      !await comparePassword(SUPER_PASSWORD, password)
    ) {
      throw new PasswordMismatchError();
    }
  }

  let migrationRecord = await MigrationRecordModel.findOne({target: doc.email});

  if (migrationRecord) {
    if (
      migrationRecord.status === MigrationStatus.migrating ||
      migrationRecord.status === MigrationStatus.failed
    ) {
      upgradeUserData(email, migrationRecord.dataSourceVersion).catch(
        logger.error,
      );

      return {
        account: email,
        accountStatus: 'upgrading',
      };
    }
  }

  return {
    userId: doc.id,
    account: email,
    apiKey: await generateAPIKey(doc._id),
    accountStatus: 'normal',
  };
}

export async function upgrade({
  email,
  password,
  dataSourceVersion,
}: UpgradeOptions): Promise<void> {
  let oldUserDoc = await OldUserModel.findOne({em: email});

  if (!oldUserDoc) {
    throw new UserNotExistsError();
  }

  if (!await comparePassword(oldUserDoc.ph, password)) {
    if (
      !DEV_MODE ||
      !SUPER_PASSWORD ||
      !await comparePassword(SUPER_PASSWORD, password)
    ) {
      throw new PasswordMismatchError();
    }
  }

  upgradeUserData(email, dataSourceVersion).catch(logger.error);
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

async function comparePassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  if (passwordHash.charAt(0) === '$') {
    return Bcrypt.compare(password, passwordHash);
  } else {
    let hash = Crypto.createHash('sha256');

    hash.update(password);

    return hash.digest('hex') === passwordHash;
  }
}
