import * as connectRedis from 'connect-redis';
import * as session from 'express-session';

const {
  SESSION_REDIS_HOST,
  SESSION_REDIS_PORT,
  SESSION_REDIS_DB,
  SESSION_SECRET,
} = process.env;

const SessionRedisStore = connectRedis(session);

export const sessionMiddleware = session({
  saveUninitialized: false,
  resave: false,
  store: new SessionRedisStore({
    host: SESSION_REDIS_HOST || 'localhost',
    port: Number(SESSION_REDIS_PORT) || 6379,
    db: Number(SESSION_REDIS_DB) || 0,
  }),
  secret: SESSION_SECRET || 'wordsbaking',
});
