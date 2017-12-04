export interface WordDataMeaning {
  poss: string[];
  text: string;
}

export interface WordDataSentence {
  s: string;
  t: string;
}

export type PronunciationType = 'us' | 'gb';

export interface WordDataItem {
  term: string;
  prons?: {[pronunciation in PronunciationType]?: string[]};
  briefs: WordDataMeaning[];
  meanings: WordDataMeaning[];
  sentences?: WordDataSentence[];
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

// tslint:disable-next-line:no-var-requires
const wordDataDict = require('../../data/words-data-v2') as Dict<WordDataItem>;

export function getWordsData(terms: string[]): WordDataItem[] {
  return terms.map(
    term =>
      hasOwnProperty.call(wordDataDict, term)
        ? wordDataDict[term]
        : createEmptyWordData(term),
  );
}

function createEmptyWordData(term: string): WordDataItem {
  return {
    term,
    briefs: [{poss: [], text: term}],
    meanings: [{poss: [], text: term}],
  };
}
