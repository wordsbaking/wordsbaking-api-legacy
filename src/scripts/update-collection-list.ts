// tslint:disable:no-implicit-dependencies

/*
 * Script: update-collection-list
 *
 * This script generates `/data/app/collection-list.json` of collections inside
 * `/data/collections`.
 */

import * as FS from 'fs';
import * as Path from 'path';

import * as glob from 'glob';

const DATA_DIR = Path.join(__dirname, '../../data');

const APP_DATA_DIR = Path.join(DATA_DIR, 'app');
const COLLECTIONS_DATA_DIR = Path.join(DATA_DIR, 'collections');

const COLLECTION_LIST_PATH = Path.join(APP_DATA_DIR, 'collection-list.json');

let items = glob
  .sync('*.json', {
    cwd: COLLECTIONS_DATA_DIR,
    absolute: true,
  })
  .map(path => {
    let id = Path.basename(path, '.json');
    let {name, order}: {name: string; order: number} = require(path);

    return {id, name, order};
  })
  .sort((a, b) => {
    return (a.order || 0) - (b.order || 0) || (a.id > b.id ? 1 : -1);
  })
  .map(({order: _order, ...item}) => item);

FS.writeFileSync(COLLECTION_LIST_PATH, JSON.stringify(items, undefined, 2));
