/* tslint:disable:no-implicit-dependencies */

declare module 'passport-localapikey-update' {
  import express = require('express');
  import {Strategy as PassportStrategy} from 'passport-strategy';

  interface StrategyOptions {
    apiKeyField?: string;
    apiKeyHeader?: string;
    passReqToCallback?: false;
  }

  interface StrategyOptionsWithRequest {
    apiKeyField?: string;
    apiKeyHeader?: string;
    passReqToCallback: true;
  }

  interface VerifyOptions {
    message: string;
  }

  type VerifyFunctionWithRequest = (
    req: express.Request,
    apiKey: string,
    done: (error: any, user?: any, options?: VerifyOptions) => void,
  ) => void;

  type VerifyFunction = (
    apiKey: string,
    done: (error: any, user?: any, options?: VerifyOptions) => void,
  ) => void;

  class Strategy extends PassportStrategy {
    name: string;
    constructor(
      options: StrategyOptionsWithRequest,
      verify: VerifyFunctionWithRequest,
    );
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(verify: VerifyFunction);
  }
}
