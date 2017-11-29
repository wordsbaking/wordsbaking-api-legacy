import {Readable} from 'stream';

import * as uuid from 'uuid';

import * as contentDisposition from 'content-disposition';

import {userContentOSS} from '../entrances/oss';

export async function upload(
  stream: Readable,
  contentLength: number,
  mime: string,
  filename: string,
  dirname: string,
): Promise<OSSObjectUID> {
  let uid = uuid() as OSSObjectUID;
  let name = `${dirname}/${uid}`;

  await userContentOSS.putStream(name, stream, {
    mime,
    contentLength,
    headers: {
      'Content-Disposition': contentDisposition(filename, {
        type: 'inline',
      }),
    },
  });

  return uid;
}
