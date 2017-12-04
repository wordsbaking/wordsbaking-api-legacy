import {UserRequest} from '../core/user';
import {WordDataItem, getWordsData} from '../core/word-data';
import {InvalidParametersError} from '../error';

export function routeGetWordsData(req: UserRequest): WordDataItem[] {
  let terms = req.body.terms as string[];

  if (!Array.isArray(terms) || terms.some(term => typeof term !== 'string')) {
    throw new InvalidParametersError();
  }

  return getWordsData(terms);
}
