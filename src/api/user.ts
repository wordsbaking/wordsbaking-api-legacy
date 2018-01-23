import {Request} from 'express';
import {isEmail} from 'validator';

import {InvalidParametersError, UserExistsError} from '../error';
import {isPassword} from '../util/validator';

import {
  AvailableDataSourceVersion,
  MigrationRecordModel,
  MigrationStatus,
  UserModel,
} from '../model';

import {upload} from '../core/files';
import {SignInInfo, SignUpInfo, signIn, signUp, upgrade} from '../core/user';

export async function routeSignUp(req: Request): Promise<SignUpInfo> {
  let {
    email,
    password,
  }: {
    email: EmailString;
    password: PasswordString;
  } = req.body;

  if (!isEmail(email || '') || !isPassword(password || '')) {
    throw new InvalidParametersError();
  }

  return signUp({email, password});
}

export async function routeSignIn(req: Request): Promise<SignInInfo> {
  let {
    email,
    password,
  }: {
    email: EmailString;
    password: PasswordString;
  } = req.body;

  if (!isEmail(email || '') || !isPassword(password || '')) {
    throw new InvalidParametersError();
  }

  return signIn({email, password});
}

export async function routeMigrateUserData(req: Request): Promise<void> {
  let {
    email,
    password,
    dataSourceVersion,
  }: {
    email: EmailString;
    password: PasswordString;
    dataSourceVersion: AvailableDataSourceVersion | undefined;
  } = req.body;

  if (!isEmail(email || '') || !isPassword(password || '')) {
    throw new InvalidParametersError();
  }

  return upgrade({email, password, dataSourceVersion});
}

export async function routeUploadAvatar(req: Request): Promise<OSSObjectUID> {
  let userId = req.user.id;

  let doc = await UserModel.findById(userId);

  if (!doc) {
    throw new UserExistsError();
  }

  return upload(
    req,
    Number(req.header('Content-Length')),
    'image/jpeg',
    `${userId}.jpg`,
    'avatars',
  );
}

export async function routeUserDataMigrationStatus(
  req: Request,
): Promise<MigrationStatus | undefined> {
  let email = req.body.email as EmailString;

  if (!isEmail(email || '')) {
    throw new InvalidParametersError();
  }

  let migrationRecord = await MigrationRecordModel.findOne({target: email});

  return migrationRecord ? migrationRecord.status : undefined;
}
