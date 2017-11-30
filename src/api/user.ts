import {Request} from 'express';
import {isEmail} from 'validator';

import {InvalidParametersError, UserExistsError} from '../error';

import {SignInInfo, SignUpInfo, signIn, signUp} from '../core/user';
import {isPassword} from '../util/validator';
import {UserModel} from '../model';

import {upload} from '../core/files';

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
