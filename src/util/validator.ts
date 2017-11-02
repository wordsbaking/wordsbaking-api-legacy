import {isLength} from 'validator';

export function isPassword(str: string): boolean {
  return isLength(str, {min: 6});
}
