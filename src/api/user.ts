import {Duplex} from 'stream';
import {Request} from 'express';
import {isEmail} from 'validator';

import {InvalidParametersError} from '../error';

import {
  SignInInfo,
  SignUpInfo,
  signIn,
  signUp,
  updateProfile,
} from '../core/user';
import {isPassword} from '../util/validator';

import {upload} from '../core/files';
import {UserProfile} from '../model/index';

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

export async function routeUpdateProfile(req: Request): Promise<UserProfile> {
  let userId = req.user.id;
  let {nickname, tagline} = req.body;

  if (!nickname || nickname.length > 10 || (tagline && tagline.length > 20)) {
    throw new InvalidParametersError();
  }

  let avatar: string | undefined;

  if (req.file) {
    let buffer = req.file.buffer;
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    avatar = await upload(
      stream,
      buffer.byteLength,
      'image/jpeg',
      `${userId}.jpg`,
      'avatars',
    );
  }

  return await updateProfile(userId, avatar, nickname, tagline);
}
