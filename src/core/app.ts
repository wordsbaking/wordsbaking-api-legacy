import * as Bcrypt from 'bcrypt';
import {AppVersionInvalidError, PermissionDeniedError} from '../error';
import {AppVersionEntry, AppVersionModel} from '../model';

const DEVELOPER_SECRET_SIGNAL: string = process.env.DEVELOPER_SECRET_SIGNAL!;

export function developerVerify(secretSignal: string) {
  return Bcrypt.compare(secretSignal, DEVELOPER_SECRET_SIGNAL);
}

export async function getLatestAppVersionInfo(
  platform: string,
): Promise<AppVersionEntry | undefined> {
  let appVersionDoc = await AppVersionModel.findOne({platform}).sort({
    timestamp: -1,
  });

  if (appVersionDoc) {
    return {
      version: appVersionDoc.version,
      platform: appVersionDoc.platform,
      publisher: appVersionDoc.publisher,
      timestamp: appVersionDoc.timestamp,
      beta: appVersionDoc.beta,
      downloadUrl: appVersionDoc.downloadUrl,
      description: appVersionDoc.description,
    };
  } else {
    return undefined;
  }
}

export async function upgradeAppVersion(
  platform: string,
  beta: boolean,
  version: string,
  description: string,
  downloadUrl: string,
  publisher: string,
  secretSignal: string,
): Promise<void> {
  let appVersionDoc = await AppVersionModel.findOne({platform, version});

  if (!await developerVerify(secretSignal)) {
    throw new PermissionDeniedError();
  }

  if (appVersionDoc) {
    throw new AppVersionInvalidError();
  }

  await AppVersionModel.create({
    platform,
    publisher,
    version,
    beta,
    description,
    downloadUrl,
    timestamp: Date.now(),
  });
}
