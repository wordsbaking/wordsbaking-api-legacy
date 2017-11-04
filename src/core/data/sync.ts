// tslint:disable:no-null-keyword

import * as logger from '../../logger';
import {pushToArrayInMap} from '../../util/object';

import {
  DataEntryCategory,
  DataEntryModel,
  DataEntryName,
  DataEntryType,
  UserOID,
} from '../../model';

import {TimeMachine} from './time';

import {
  AccumulationDataEntryTypeDefinition,
  DataEntryTypeManager,
} from './types';

const PASSIVE_CATEGORIES = (['collections'] as any) as DataEntryCategory[];

const READONLY_CATEGORIES = ([
  'collections',
  'user-readonly',
  'app',
] as any) as DataEntryCategory[];

const READONLY_CATEGORY_SET = new Set(READONLY_CATEGORIES);

const typeManager = DataEntryTypeManager.default;

export interface SyncResult {
  syncAt: TimeNumber;
  /**
   * category -> entry Name -> entry
   */
  updates: Dict<Dict<SyncDownUpdate>>;
}

export interface SyncDownUpdate {
  value?: any;
  removed?: true;
}

export interface SyncUpUpdate {
  type?: DataEntryType;
  updateAt: TimeNumber;
  data: any;
  removed?: true;
}

export interface SyncOptions {
  owner: UserOID;
  now: TimeNumber;
  clientSyncAt: TimeNumber;
  clientTime: TimeNumber;
  clientUpdates: Dict<Dict<SyncUpUpdate>>;
}

export async function sync({
  owner,
  now,
  clientSyncAt,
  clientTime,
  clientUpdates: categoryToNameToUpUpdateDictDict,
}: SyncOptions): Promise<SyncResult> {
  let timeMachine = new TimeMachine({now, clientSyncAt, clientTime});

  let categoryToNameToDownUpdateDictDict: Dict<
    Dict<SyncDownUpdate>
  > = Object.create(null);

  let upUpdateCategorySet = new Set(Object.keys(
    categoryToNameToUpUpdateDictDict,
  ) as DataEntryCategory[]);

  let conditions: object[] = [
    {
      owner: {$in: [owner, null]},
      syncAt: {$gt: clientSyncAt},
      category: {$nin: PASSIVE_CATEGORIES},
    },
  ];

  // Passive Categories
  {
    let headDocs = await DataEntryModel.find({
      owner,
      category: {$in: PASSIVE_CATEGORIES},
    });

    let headSet = new Set<string>();

    let categoryToOutOfDateHeadNamesMap = new Map<
      DataEntryCategory,
      DataEntryName[]
    >();
    let categoryToUpToDateHeadNamesMap = new Map<
      DataEntryCategory,
      DataEntryName[]
    >();

    for (let {category, name, syncAt} of headDocs) {
      headSet.add(`${category}\t${name}`);

      if (syncAt > clientSyncAt) {
        pushToArrayInMap(categoryToOutOfDateHeadNamesMap, category, name);
      } else {
        pushToArrayInMap(categoryToUpToDateHeadNamesMap, category, name);
      }
    }

    await Promise.all(
      PASSIVE_CATEGORIES.reduce(
        (promises, category) => {
          if (!upUpdateCategorySet.has(category)) {
            return promises;
          }

          let upUpdateDict = categoryToNameToUpUpdateDictDict[category];
          let names = Object.keys(upUpdateDict);

          pushToArrayInMap(categoryToOutOfDateHeadNamesMap, category, ...names);

          return promises.concat(
            names.map(async name => {
              if (headSet.has(`${category}\t${name}`)) {
                return;
              }

              await DataEntryModel.update(
                {owner, category, name},
                {
                  name,
                  category,
                  owner,
                  syncAt: now,
                  updateAt: 0,
                },
                {upsert: true},
              );
            }),
          );
        },
        [] as Promise<void>[],
      ),
    );

    // Head changed, update all related?
    let passiveConditions: object[] = Array.from(
      categoryToOutOfDateHeadNamesMap,
    ).map(([category, names]) => {
      return {
        category,
        name: {$in: names},
      };
    });

    // Head up-to-date, update out-dated only?
    if (categoryToUpToDateHeadNamesMap.size) {
      passiveConditions.push({
        syncAt: {$gt: clientSyncAt},
        $or: Array.from(
          categoryToUpToDateHeadNamesMap,
        ).map(([category, names]) => {
          return {
            category,
            name: {$in: names},
          };
        }),
      });
    }

    if (passiveConditions.length) {
      conditions.push({
        owner: null,
        $or: passiveConditions,
      });
    }
  }

  {
    let dataEntryDocs = await DataEntryModel.find({$or: conditions});

    for (let {category, type, name, data, removed} of dataEntryDocs) {
      let updateDict: Dict<SyncDownUpdate>;

      if (category in categoryToNameToDownUpdateDictDict) {
        updateDict = categoryToNameToDownUpdateDictDict[category];
      } else {
        updateDict = categoryToNameToDownUpdateDictDict[
          category
        ] = Object.create(null);
      }

      if (removed) {
        updateDict[name] = {removed: true};
      } else {
        let typeDef = typeManager.get(type);

        if (!typeDef) {
          logger.error(`Invalid data entry type "${type}"`);
          continue;
        }

        updateDict[name] = {
          value: typeDef.resolve(data),
        };
      }
    }
  }

  await Promise.all(
    (Object.keys(
      categoryToNameToUpUpdateDictDict,
    ) as DataEntryCategory[]).map(async category => {
      if (READONLY_CATEGORY_SET.has(category)) {
        return;
      }

      let updateDict = categoryToNameToUpUpdateDictDict[category];

      let names = Object.keys(updateDict);

      let dataEntryDocs = await DataEntryModel.find({
        owner,
        category,
        name: {$in: names},
      });

      let absentNameSet = new Set(names);

      await Promise.all(
        dataEntryDocs.map(async doc => {
          let {name, updateAt: serverUpdateAt, syncAt: serverSyncAt} = doc;

          absentNameSet.delete(name);

          let update = updateDict[name];

          let updateAt = timeMachine.calibrate(update.updateAt);

          let typeDef = typeManager.get(update.type);

          if (!typeDef) {
            logger.error(`Invalid data entry type "${update.type}"`);
            return;
          }

          if (
            !(
              typeDef instanceof AccumulationDataEntryTypeDefinition ||
              updateAt > serverUpdateAt
            )
          ) {
            // If it's neither accumulation type nor has a later update at time,
            // then we don't need to update the value stored on server.
            return;
          }

          if (update.removed) {
            doc.data = undefined;
            doc.removed = true;
          } else {
            doc.data = typeDef.merge(doc.data, update.data);
            doc.removed = undefined;
          }

          doc.markModified('data');

          if (
            typeDef instanceof AccumulationDataEntryTypeDefinition &&
            clientSyncAt < serverSyncAt
          ) {
            // If it's an accumulation type and has the client sync at time is
            // earlier than server, then we need to sync down the most recent
            // value.

            let downUpdateDict: Dict<SyncDownUpdate>;

            if (category in categoryToNameToDownUpdateDictDict) {
              downUpdateDict = categoryToNameToDownUpdateDictDict[category];
            } else {
              downUpdateDict = categoryToNameToDownUpdateDictDict[
                category
              ] = Object.create(null);
            }

            downUpdateDict[name] = doc.removed
              ? {removed: true}
              : {value: typeDef.resolve(doc.data)};
          }

          doc.updateAt = updateAt;
          doc.syncAt = now;

          if (update.type && update.type !== doc.type) {
            doc.type = update.type;
          }

          await doc.save();
        }),
      );

      await Promise.all(
        Array.from(absentNameSet).map(async name => {
          let {type, updateAt, removed, data} = updateDict[name];

          let typeDef = typeManager.get(type);

          if (!typeDef) {
            logger.error(`Invalid data entry type "${type}"`);
            return;
          }

          await DataEntryModel.update(
            {
              name,
              owner,
              category,
            },
            {
              name,
              owner,
              category,
              type,
              syncAt: now,
              updateAt: timeMachine.calibrate(updateAt),
              ...removed
                ? {removed: true}
                : {data: typeDef.merge(undefined, data)},
            },
            {upsert: true},
          );
        }),
      );
    }),
  );

  return {
    syncAt: now,
    updates: categoryToNameToDownUpdateDictDict,
  };
}
