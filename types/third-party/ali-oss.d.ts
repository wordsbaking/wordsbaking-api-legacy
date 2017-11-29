declare module 'ali-oss' {
  import {Readable} from 'stream';

  interface ClientOptions {
    accessKeyId: string;
    accessKeySecret: string;
    bucket?: string;
    endpoint?: string;
    region?: string;
    internal?: boolean;
    secure?: boolean;
    timeout?: string | number;
  }

  interface SignatureUrlOptions {
    expires?: number;
    method?: string;
    process?: string;
    'content-type'?: string;
    response?: {
      'content-type'?: string;
      'content-disposition'?: string;
      'cache-control'?: string;
    };
  }

  interface ObjectMeta {
    name: string;
    lastModified: string;
    etag: string;
    type: string;
    size: number;
    storageClass: string;
    owner: {
      id: string;
      displayName: string;
    };
  }

  interface ListQuery {
    prefix?: string;
    marker?: string;
    delimiter?: string;
    'max-keys'?: string | number;
  }

  interface ListOptions {
    timeout?: number;
  }

  interface ListResult {
    objects: ObjectMeta[] | undefined;
    prefixes: string[] | undefined;
    isTruncated: boolean;
    nextMarker: string;
    res: {
      status: number;
      headers: Dict<string | undefined>;
      size: number;
      rt: number;
    };
  }

  class Client {
    constructor(options: ClientOptions);
  }

  namespace Client {
    class Wrapper {
      constructor(options: ClientOptions);

      signatureUrl(name: string, options?: SignatureUrlOptions): string;
      getObjectUrl(name: string, baseUrl?: string): string;

      list(query: ListQuery, options?: ListOptions): Promise<ListResult>;

      put(
        name: string,
        file: string | Buffer | Readable,
        options?: any,
      ): Promise<any>;
      putStream(
        name: string,
        file: string | Buffer | Readable,
        options?: any,
      ): Promise<any>;

      delete(name: string, options?: any): Promise<any>;
      deleteMulti(names: string[], options?: any): Promise<any>;
    }
  }

  export = Client;
}
