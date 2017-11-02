import 'source-map-support/register';

import {app} from './entrances';

import * as logger from './logger';

const {PORT} = process.env;

const server = app.listen(PORT || 1337, () => {
  logger.info(`Listening on port ${server.address().port}...`);
});
