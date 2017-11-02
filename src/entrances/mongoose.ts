// tslint:disable-next-line:no-var-requires
require('mongoose').Promise = Promise;

import * as Mongoose from 'mongoose';

Mongoose.connect('mongodb://localhost/wordsbaking', {
  useMongoClient: true,
});
