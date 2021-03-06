interface Dict<T> {
  [key: string]: T;
}

type TypedString<T extends string> = string & T;

type EmailString = TypedString<'__email'>;
type MobileString = TypedString<'__mobile'>;
type PasswordString = TypedString<'__password'>;
type EncryptedPasswordString = TypedString<'__encrypted-password'>;

type TypedNumber<T extends string> = number & {__type: T};

type TimeNumber = TypedNumber<'__time'>;

type OSSObjectUID = TypedString<'__oss-object-uid'>;

type Primitive = string | number | boolean;
type Nullable = undefined | null;

interface Constructor<T> {
  new (...args: any[]): T;
}

interface DateConstructor {
  now(): TimeNumber;
}

interface Date {
  getTime(): TimeNumber;
}
