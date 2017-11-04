import * as passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-localapikey-update';

import {getUserByAPIKey} from '../core/user';
import {APIKey} from '../model';

passport.use(
  'localapikey',
  new LocalStrategy(
    {
      apiKeyField: 'apiKey',
      apiKeyHeader: 'x-api-key',
    },
    (key, done) => {
      getUserByAPIKey(key as APIKey).then(
        user => done(undefined, user),
        error => done(error),
      );
    },
  ),
);

export {passport};
