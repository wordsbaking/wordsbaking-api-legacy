// tslint:disable:no-implicit-dependencies
// tslint:disable:no-console

import * as FS from 'fs';
import * as Path from 'path';

import * as glob from 'glob';
import * as _ from 'lodash';

import '../entrances/mongoose';

import {DataEntryModel} from '../model/data-entry';

const DATA_DIR = Path.join(__dirname, '../../data/sync');

let categoryToNamesMap = new Map(
  FS.readdirSync(DATA_DIR)
    .filter(category =>
      FS.statSync(Path.join(DATA_DIR, category)).isDirectory(),
    )
    .map<[string, string[]]>(category => {
      let names = glob
        .sync('*.json', {cwd: Path.join(DATA_DIR, category)})
        .map(fileName => Path.basename(fileName, '.json'));

      return [category, names];
    })
    .filter(([, names]) => !!names.length),
);

if (!categoryToNamesMap.size) {
  console.log('No data item found.');
  process.exit();
}

console.log('Items found:');

for (let [category, names] of categoryToNamesMap) {
  console.log(`  ${category}`);
  console.log(`    ${names.join('\n    ')}`);
}

(async () => {
  for (let [category, names] of categoryToNamesMap) {
    console.log(`Updating category "${category}"...`);

    let pendingNameSet = new Set(names);

    // tslint:disable-next-line:no-null-keyword
    let dataEntryDocs = await DataEntryModel.find({owner: null, category});

    for (let doc of dataEntryDocs) {
      let name = doc.name;

      if (pendingNameSet.has(name)) {
        pendingNameSet.delete(name);

        let fileData = require(Path.join(DATA_DIR, category, `${name}.json`));

        if (!_.isEqual(doc.data, fileData)) {
          doc.data = fileData;
          doc.removed = undefined;
          doc.markModified('data');
        }
      } else {
        doc.data = undefined;
        doc.markModified('data');
        doc.removed = true;
      }

      if (doc.isModified()) {
        let now = Date.now();

        doc.updateAt = now;
        doc.syncAt = (now + 60 * 1000) as TimeNumber;

        console.log(`Updating data entry "${name}"...`);

        await doc.save();
      }
    }

    for (let name of pendingNameSet) {
      let fileData = require(Path.join(DATA_DIR, category, `${name}.json`));

      let now = Date.now();

      console.log(`Creating data entry "${name}"...`);

      await DataEntryModel.create({
        category,
        name,
        data: fileData,
        syncAt: now + 60 * 1000,
        updateAt: now,
      });
    }
  }
})().then(
  () => process.exit(),
  error => {
    console.error(error);
    process.exit(1);
  },
);
