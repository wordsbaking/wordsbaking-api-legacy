import {Request} from 'express';
import {isEmail} from 'validator';

import {InvalidParametersError} from '../error';

import {SignInInfo, SignUpInfo, signIn, signUp} from '../core/user';
import {isPassword} from '../util/validator';

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
