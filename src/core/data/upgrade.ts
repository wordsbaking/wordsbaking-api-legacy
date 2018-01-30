import * as Stream from 'stream';

import * as uuid from 'uuid';

import * as File from '../files';

import {
  AvailableDataSourceVersion,
  DataEntryModel,
  DataEntryType,
  MigrationRecordModel,
  MigrationStatus,
  UserDocument,
  UserModel,
} from '../../model';

import {
  DataModel as OldDataModel,
  UserDocument as OldUserDocument,
  UserModel as OldUserModel,
  UserWordModel as OldUserWordModel,
  WordRecordModel as OldWordRecordModel,
} from '../../model/old-app';

// categories
const USER = 'user';
const SETTINGS = 'settings';
const COLLECTIONS = 'collections';
const RECORDS = 'records';
const STATISTICS = 'statistics';

// names
const DISPLAY_NAME = 'displayName';
const COLLECTION_IDS = 'collectionIDs';
const CLOCK_IN_STATS = 'clock-in-stats';
const TAG_LINE = 'tagline';
const AVATAR = 'avatar';

const AUDIO_MODES = ['off', 'on', 'auto'];

export async function getAvailableDataSourceVersions(
  email: string,
): Promise<AvailableDataSourceVersion[]> {
  let versions: AvailableDataSourceVersion[] = [];

  let userDoc = await OldUserModel.findOne({em: email});

  if (!userDoc) {
    return versions;
  }

  let userIDHex = userDoc._id.toHexString();

  if (await OldWordRecordModel.count({u: userIDHex}).limit(1)) {
    versions.push('v0.5');
  }

  if (await OldDataModel.count({u: userDoc._id.toHexString()}).limit(1)) {
    versions.push('v1.0');
  }

  return versions;
}

export async function upgradeUserData(
  email: string,
  dataSourceVersion: AvailableDataSourceVersion | undefined,
): Promise<void> {
  let migrationRecordDoc = await MigrationRecordModel.findOne({
    target: email,
    dataSourceVersion,
  });

  if (
    migrationRecordDoc &&
    migrationRecordDoc.status === MigrationStatus.finished
  ) {
    return;
  }

  let uid = migrationRecordDoc ? migrationRecordDoc.uid : uuid();

  if (!migrationRecordDoc) {
    migrationRecordDoc = await MigrationRecordModel.create({
      target: email,
      uid,
      status: MigrationStatus.migrating,
      startTimestamp: Date.now(),
      dataSourceVersion,
    });
  }

  let sourceUserDoc = await OldUserModel.findOne({
    em: email,
  });

  if (!sourceUserDoc) {
    throw new Error('User not exists.');
  }

  await UserModel.update(
    {
      email,
    },
    {
      email,
      password: sourceUserDoc.ph,
      emailActivated: sourceUserDoc.ea,
    },
    {
      upsert: true,
    },
  );

  let userDoc = await UserModel.findOne({email});

  if (!userDoc) {
    throw new Error('Migration failed');
  }

  try {
    switch (dataSourceVersion) {
      case 'v0.5':
        await migrateUserDataFrom$V_0_5(sourceUserDoc, userDoc);
        break;
      case 'v1.0':
        await migrateUserDataFrom$V_1_0(sourceUserDoc, userDoc);
        break;
      default:
        // throw new Error('Unavailable data source');
        break;
    }
  } catch (e) {
    migrationRecordDoc.status = MigrationStatus.failed;
    migrationRecordDoc.endTimestamp = Date.now();
    await migrationRecordDoc.save();

    throw e;
  }

  migrationRecordDoc.status = MigrationStatus.finished;
  migrationRecordDoc.endTimestamp = Date.now();
  await migrationRecordDoc.save();
}

async function migrateUserDataFrom$V_0_5(
  sourceUserDoc: OldUserDocument,
  userDoc: UserDocument,
): Promise<void> {
  let userID = userDoc._id;
  let sourceUserIDHex = sourceUserDoc._id.toHexString();
  let promises: Promise<any>[] = [];

  if (sourceUserDoc.nn) {
    upsertRecord(USER, DISPLAY_NAME, sourceUserDoc.nn);
  }

  if (sourceUserDoc.pr) {
    upsertRecord(SETTINGS, 'pronunciation', sourceUserDoc.pr);
  }

  if (sourceUserDoc.sr) {
    upsertRecord(SETTINGS, 'sentenceTtsSpeed', sourceUserDoc.sr);
  }

  if (sourceUserDoc.sr) {
    upsertRecord(SETTINGS, 'obstinateEnhance', sourceUserDoc.ob);
  }

  if (sourceUserDoc.sr) {
    upsertRecord(
      SETTINGS,
      'studyScopes',
      [[0], [0, 1], [0, 1, 2]][Number(sourceUserDoc.rp) || 1],
    );
  }

  if (sourceUserDoc.cc) {
    upsertRecord(SETTINGS, COLLECTION_IDS, [sourceUserDoc.cc]);
  }

  if (sourceUserDoc.cn && sourceUserDoc.lc) {
    upsertRecord(
      STATISTICS,
      CLOCK_IN_STATS,
      {
        ids: [sourceUserDoc.lc],
        value: sourceUserDoc.cn,
      },
      'accumulation',
    );
  }

  let userWords = await OldUserWordModel.find({
    u: sourceUserIDHex,
    r: {$ne: true},
  });

  let wordsbookSet = new Set<string>(userWords.map(word => word.t));

  let wordRecords = await OldWordRecordModel.find({
    u: sourceUserIDHex,
  });

  for (let wordRecord of wordRecords) {
    let term = wordRecord.t;
    let r = wordRecord.r;

    let data: any = {
      r: r[0].trim(),
      f: r[1],
      l: r[2],
    };

    if (wordsbookSet.has(term)) {
      data.w = true;
      wordsbookSet.delete(term);
    }

    upsertRecord(RECORDS, term, data);
  }

  for (let word of wordsbookSet) {
    upsertRecord(RECORDS, word, {
      r: '',
      f: 0,
      l: 0,
      w: true,
    });
  }

  await Promise.all(promises);

  return;

  function upsertRecord(
    category: string,
    name: string,
    data: any,
    type?: DataEntryType,
  ): void {
    let now = Date.now();

    let promise = DataEntryModel.update(
      {
        category,
        name,
        owner: userID,
      },
      {
        category,
        name,
        owner: userID,
        data,
        type,
        syncAt: now,
        updateAt: now,
      },
      {
        upsert: true,
      },
    ).exec();

    promises.push(promise);
  }
}

async function migrateUserDataFrom$V_1_0(
  sourceUserDoc: OldUserDocument,
  userDoc: UserDocument,
): Promise<void> {
  let userID = userDoc._id;
  let sourceUserIDHex = sourceUserDoc._id.toHexString();
  let dataRecords = await OldDataModel.find({u: sourceUserIDHex});
  let promises: Promise<any>[] = [];

  let userWords = await OldUserWordModel.find({
    u: sourceUserIDHex,
    r: {$ne: true},
  });

  let wordsbookSet = new Set<string>(userWords.map(word => word.t));

  for (let dataRecord of dataRecords) {
    let {
      c: category,
      i: name,
      s: syncAt,
      l: updateAt,
      t: type,
      d: data,
    } = dataRecord;

    if (type === 'd') {
      type = 'value';
    } else if (type === 'a') {
      type = 'accumulation';
    } else {
      type = undefined;
    }

    switch (category) {
      case 'user':
        if (name === 'nickname') {
          upsertRecord(USER, DISPLAY_NAME, data, syncAt, updateAt, type);
        } else if (name === 'tagline') {
          upsertRecord(USER, TAG_LINE, data, syncAt, updateAt, type);
        } else if (name === 'profilePictureData') {
          let pictureBuffer = new Buffer(data, 'base64');
          let pictureBufferStream = new Stream.PassThrough();
          pictureBufferStream.end(pictureBuffer);

          let ouid = await File.upload(
            pictureBufferStream,
            pictureBuffer.byteLength,
            'image/jpeg',
            `${sourceUserIDHex}.jpg`,
            'avatars',
          );

          upsertRecord(USER, AVATAR, ouid, syncAt, updateAt, type);
        }
        break;
      case 'coolections':
        upsertRecord(COLLECTIONS, name, data, syncAt, updateAt, type);
        break;
      case 'settings':
        if (name === 'selectedCollections') {
          name = 'collectionIDs';
        }

        if (name === 'audioMode') {
          data = AUDIO_MODES[data] || AUDIO_MODES[0];
        }

        upsertRecord(SETTINGS, name, data, syncAt, updateAt, type);
        break;
      case 'records':
        if (wordsbookSet.has(name)) {
          data.w = true;
          wordsbookSet.delete(name);
        }

        upsertRecord(RECORDS, name, data, syncAt, updateAt, type);
        break;
      case 'statistics':
        if (name.startsWith('study-stats')) {
          upsertRecord(
            STATISTICS,
            name,
            {
              wordsbookFamiliar: 0,
              wordsbookTodayNew: 0,
              wordsbookTotal: 0,
              collectionFamiliar: 0,
              collectionStudied: 0,
              collectionTodayNew: 0,
              collectionTotal: 0,
              todayReviewedUnknown: 0,
              todayReviewed: data.reviewed,
              todayMinimumReviewGoal: 0,
              todayReviewGoal: 0,
              todayNewUnknown: 0,
              todayNew: data.new,
              clockIn: data.clockIn,
            },
            syncAt,
            updateAt,
            type,
          );
        } else {
          upsertRecord(STATISTICS, name, data, syncAt, updateAt, type);
        }

        break;
    }
  }

  for (let word of wordsbookSet) {
    let now = Date.now();
    upsertRecord(
      RECORDS,
      word,
      {
        r: '',
        f: 0,
        l: 0,
        w: true,
      },
      now,
      now,
    );
  }

  await Promise.all(promises);

  return;

  function upsertRecord(
    category: string,
    name: string,
    data: any,
    syncAt: number,
    updateAt: number,
    type?: DataEntryType,
  ): void {
    let promise = DataEntryModel.update(
      {
        category,
        name,
        owner: userID,
      },
      {
        category,
        name,
        owner: userID,
        data,
        type,
        syncAt,
        updateAt,
      },
      {
        upsert: true,
      },
    ).exec();

    promises.push(promise);
  }
}
