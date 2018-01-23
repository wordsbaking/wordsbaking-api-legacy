import * as Mongoose from 'mongoose';

import {connection} from '../entrances/mongoose';

export const enum MigrationStatus {
  migrating,
  finished,
  failed,
}

const migrationRecordSchema = new Mongoose.Schema(
  {
    uid: {type: String, index: true},
    status: {type: Number, index: true},
    startTimestamp: Number,
    endTimestamp: Number,
    target: {type: String, index: true},
    sourceVersion: {type: String, index: true},
  },
  {collection: 'migration-records'},
);

export type AvailableDataSourceVersion = 'v0.5' | 'v1.0';

export interface MigrationRecordSchema {
  uid: string;
  status: MigrationStatus;
  startTimestamp: number;
  endTimestamp: number;
  target: string;
  dataSourceVersion: AvailableDataSourceVersion;
}

export interface MigrationRecordDocument
  extends MigrationRecordSchema,
    Mongoose.Document {}

export const MigrationRecordModel = connection.model<MigrationRecordDocument>(
  'MigrationRecord',
  migrationRecordSchema,
);
