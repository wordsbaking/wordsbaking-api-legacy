import {Request} from 'express';

import {
  developerVerify,
  getLatestAppVersionInfo,
  upgradeAppVersion,
} from '../core/app';
import {InvalidParametersError, PermissionDeniedError} from '../error';

import {AppVersionEntry} from '../model';

export async function routeDeveloperVerify(req: Request): Promise<void> {
  let {secretSignal} = req.body;

  if (!secretSignal) {
    throw new InvalidParametersError();
  }

  if (!await developerVerify(secretSignal)) {
    throw new PermissionDeniedError();
  }
}

export function routeLatestAppVersionInfo(
  req: Request,
): Promise<AppVersionEntry | undefined> {
  let {platform} = req.body;

  if (!platform) {
    throw new InvalidParametersError();
  }

  return getLatestAppVersionInfo(platform);
}

export async function routeUpgradeAppVersion(req: Request): Promise<void> {
  let {
    platform,
    publisher,
    version,
    beta,
    description = '',
    downloadUrl,
    secretSignal,
  } = req.body;

  if (
    !platform ||
    !publisher ||
    !/^\d+\.\d+\.\d+$/.test(version) ||
    !downloadUrl ||
    !secretSignal
  ) {
    throw new InvalidParametersError();
  }

  return upgradeAppVersion(
    platform,
    !!beta,
    version,
    description,
    downloadUrl,
    publisher,
    secretSignal,
  );
}
