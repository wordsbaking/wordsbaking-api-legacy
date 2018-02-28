import * as BodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import * as API from '../api';
import {ExpectedError} from '../error';
import * as logger from '../logger';

import {
  rootValue as graphqlRootValue,
  schema as graphqlSchema,
} from '../core/graphql';

import {passport} from './passport';
import {sessionMiddleware} from './session-middleware';

import {UserRequest} from '../core/user';

import Request = express.Request;
import Response = express.Response;
import NextFunction = express.NextFunction;
import RequestHandler = express.RequestHandler;

export const app = express();

app.use((req, _res, next) => {
  req.timestamp = Date.now();
  next();
});

app.use('*', cors());

app.use(sessionMiddleware);
app.use(BodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(
  '/graphql',
  passport.authenticate('localapikey', {session: false}),
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlRootValue,
    graphiql: true,
  }),
);

app.post('/sign-up', route(API.routeSignUp));
app.post('/sign-in', route(API.routeSignIn));

app.post('/migrate-user-data', route(API.routeMigrateUserData));

app.post(
  '/user-data-migration-status',
  route(API.routeUserDataMigrationStatus),
);

app.post('/sync', passportAuthenticate(), route(API.routeSync));
app.post(
  '/get-words-data',
  passportAuthenticate(),
  route(API.routeGetWordsData),
);

app.post(
  '/update-profile',
  passportAuthenticate(),
  route(API.routeUploadAvatar),
);

app.post('/latest-app-version', route(API.routeLatestAppVersionInfo));
app.post('/upgrade-app-version', route(API.routeUpgradeAppVersion));
app.post('/developer-verify', route(API.routeDeveloperVerify));

app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ExpectedError) {
    logger.info(error.name, req.url, req.body);

    res.json({
      error: {
        code: error.name,
        message: error.message,
      },
    });
  } else {
    logger.error((error && error.stack) || error);
    logger.error(req.url, req.body);

    res.json({
      error: {
        code: 'UnknownError',
        message: 'An unknown error occurred',
      },
    });
  }
});

type RouteHandler = (req: UserRequest, res: Response) => any;

function route(handler: RouteHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let ret = await handler(req as UserRequest, res);

      if (!res.headersSent) {
        res.json({data: ret});
      }
    } catch (error) {
      next(error);
    }
  };
}

function passportAuthenticate() {
  return passport.authenticate('localapikey', {
    session: false,
    failWithError: true,
  });
}
