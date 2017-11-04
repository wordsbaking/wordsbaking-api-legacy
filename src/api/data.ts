import {SyncResult, sync} from '../core/data';
import {UserRequest} from '../core/user';
import {InvalidParametersError} from '../error';

export async function routeSync(req: UserRequest): Promise<SyncResult> {
  let {syncAt, time, updates} = req.body;

  if (
    typeof syncAt !== 'number' ||
    typeof time !== 'number' ||
    !updates ||
    typeof updates !== 'object'
  ) {
    throw new InvalidParametersError();
  }

  return sync({
    owner: req.user.oid,
    now: req.timestamp,
    clientSyncAt: syncAt as TimeNumber,
    clientTime: time as TimeNumber,
    clientUpdates: updates,
  });
}
