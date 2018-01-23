// tslint:disable-next-line:no-var-requires
require('mongoose').Promise = Promise;

import * as Mongoose from 'mongoose';

export const connection = Mongoose.createConnection(
  'mongodb://localhost/wordsbaking-migration-test',
  {
    useMongoClient: true,
  },
);

export const oldAppDBConnection = Mongoose.createConnection(
  'mongodb://118.190.174.227/wordsbaking',
  {
    user: 'root',
    pass: '7qm2TwqdpQY*2cQY',
    useMongoClient: true,
  },
);
