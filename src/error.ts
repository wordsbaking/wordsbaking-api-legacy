import {ExtendableError} from 'extendable-error';

export abstract class ExpectedError extends ExtendableError {}

export class InvalidParametersError extends ExpectedError {}

export class InvalidAPIKeyError extends ExpectedError {}

export class UserExistsError extends ExpectedError {}
export class UserNotExistsError extends ExpectedError {}
export class PasswordMismatchError extends ExpectedError {}
