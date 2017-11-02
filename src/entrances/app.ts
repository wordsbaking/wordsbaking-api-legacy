import * as BodyParser from 'body-parser';
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

import Request = express.Request;
import Response = express.Response;
import RequestHandler = express.RequestHandler;

export const app = express();

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

type RouteHandler = (req: Request, res: Response) => Promise<any>;

function route(handler: RouteHandler): RequestHandler {
  return async (req: Request, res: Response) => {
    try {
      let ret = await handler(req, res);

      if (!res.headersSent) {
        res.json({data: ret});
      }
    } catch (error) {
      if (error instanceof ExpectedError) {
        logger.info(error.name, req.url, req.body);

        res.json({
          error: {
            name: error.name,
            message: error.message,
          },
        });
      } else {
        logger.error((error && error.stack) || error);
        logger.error(req.url, req.body);

        res.json({
          error: {
            name: 'UnknownError',
            message: 'An unknown error occurred',
          },
        });
      }
    }
  };
}