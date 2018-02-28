// tslint:disable-next-line:no-var-requires
require('mongoose').Promise = Promise;

import * as Mongoose from 'mongoose';

const {MONGO_HOST, MONGO_DB} = process.env;

export const connection = Mongoose.createConnection(
  `mongodb://${MONGO_HOST}/${MONGO_DB}`,
  {
    useMongoClient: true,
  },
);

const {
  OLD_MONGO_HOST,
  OLD_MONGO_DB,
  OLD_MONGO_USER,
  OLD_MONGO_PASS,
} = process.env;

export const oldAppDBConnection = Mongoose.createConnection(
  `mongodb://${OLD_MONGO_HOST}/${OLD_MONGO_DB}`,
  {
    user: OLD_MONGO_USER,
    pass: OLD_MONGO_PASS,
    useMongoClient: true,
  },
);
