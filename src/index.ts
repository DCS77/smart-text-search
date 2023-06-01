export interface SearchOptions {
  // points to apply upon finding an exact match with body
  exactMatchPoints: number;
  // points to apply upon finding an exact match within body
  exactContainingMatchPoints: number;
  // points to apply upon finding a single word within query matching with a word in body
  singleWordMatchPoints: number;
  // makes single word matches more significant if they are longer
  singleWordMatchLengthMultiplier: number;
  // points to apply upon finding a single word within query matching with a word in body, only count unique words
  uniqueSingleWordMatchPoints: number;
  // makes single word matches more significant if they are longer, only count unique words
  uniqueSingleWordMatchLengthMultiplier: number;
  // points to apply when two or more consecutive words in query match
  consecutiveWordMatchPoints: number;
  // makes every consecutive matching word more significant
  consecutiveWordMatchLengthMultiplier: number;
  // points to apply when two or more consecutive characters in query match
  consecutiveWordSequenceMatchPoints: number;
  // makes longer matching sequences more significant
  consecutiveWordSequenceLengthMultiplier: number;
  // make search case sensitive
  isCaseSensitive: boolean;
  // make punctuation not count as a match (removes all punctuation from string)
  shouldMatchPunctuation: boolean;
  // make whitespace sequences and punctuation contribute to score
  shouldMatchWhitespaceAndPunctuation: boolean;
  // replace consecutive whitespace with a single space
  shouldCollapseWhitespace: boolean;
}

export interface SearchInputs {
  query: string; // search query
  body: string; // body of text to search through
  options?: Partial<SearchOptions>; // custom option overrides
}

const defaultSearchOptions: SearchOptions = {
  exactMatchPoints: 70,
  exactContainingMatchPoints: 50,
  singleWordMatchPoints: 1,
  singleWordMatchLengthMultiplier: 1.5,
  uniqueSingleWordMatchPoints: 2,
  uniqueSingleWordMatchLengthMultiplier: 1.5,
  consecutiveWordMatchPoints: 5,
  consecutiveWordMatchLengthMultiplier: 2,
  consecutiveWordSequenceMatchPoints: 1,
  consecutiveWordSequenceLengthMultiplier: 1.5,
  isCaseSensitive: false,
  shouldMatchPunctuation: true,
  shouldMatchWhitespaceAndPunctuation: true,
  shouldCollapseWhitespace: true,
};

function getExactMatchScore(query: string, body: string) {
  return query === body ? 1 : 0;
}

function getExactContainingMatchScore(query: string, body: string) {
  const globalMatch = new RegExp(query, "g");
  return (body.match(globalMatch) || []).length;
}

function getCustomWordMultiplier(word: string) {
  if (word.length === 1) {
    if (word.match(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/)) {
      return 0.1;
    }
  }

  if (
    word === "the" ||
    word === "a" ||
    word === "of" ||
    word === "I" ||
    word === "and"
  ) {
    return 0.5;
  }

  return 1;
}

function getWords(
  text: string,
  shouldMatchWhitespaceAndPunctuation: boolean,
  shouldMatchPunctuation: boolean
) {
  if (shouldMatchWhitespaceAndPunctuation) {
    return text.split(/(\W+)/);
  }

  if (shouldMatchPunctuation) {
    text.match(/\S+/g)?.filter((word) => word.trim().length > 0) || [];
  }

  return text.match(/\S+/g) || [];
}

function getSingleWordMatchScore(
  queryWords: string[],
  bodyWords: string[],
  singleWordMatchLengthMultiplier: number
) {
  const sharedWords = queryWords.filter((queryWord) =>
    bodyWords.includes(queryWord)
  );

  return sharedWords.reduce(
    (score, queryWord) =>
      score +
      bodyWords.filter((bodyWord) => bodyWord === queryWord).length *
        queryWord.length *
        singleWordMatchLengthMultiplier *
        getCustomWordMultiplier(queryWord),
    0
  );
}

function getUniqueSingleWordMatchScore(
  queryWords: string[],
  bodyWords: string[],
  uniqueSingleWordMatchLengthMultiplier: number
) {
  const sharedWords = queryWords.filter((element) =>
    bodyWords.includes(element)
  );

  return sharedWords.reduce(
    (score, word) =>
      score +
      word.length *
        uniqueSingleWordMatchLengthMultiplier *
        getCustomWordMultiplier(word),
    0
  );
}

function getConsecutiveWordSequenceMatchScore(
  queryWords: string[],
  bodyWords: string[],
  consecutiveWordMatchLengthMultiplier: number,
  consecutiveWordSequenceLengthMultiplier: number
) {
  let mostConsecutiveWords = 0,
    longestConsecutiveWordSequence = 0;

  for (
    let firstQueryWord = 0;
    firstQueryWord < queryWords.length;
    firstQueryWord++
  ) {
    const matchIndexes = bodyWords
      .map((bodyWord, index) =>
        bodyWord === queryWords[firstQueryWord] ? index : ""
      )
      .filter(String);

    let currentConsecutiveWords = 0,
      currentConsecutiveWordSequence = 0;
    for (
      let firstBodyWord = 0;
      firstBodyWord < matchIndexes.length;
      firstBodyWord++
    ) {
      if (
        queryWords[firstQueryWord + currentConsecutiveWords] !==
        bodyWords[firstBodyWord + currentConsecutiveWords]
      ) {
        mostConsecutiveWords = Math.max(
          mostConsecutiveWords,
          currentConsecutiveWords
        );
        longestConsecutiveWordSequence = Math.max(
          longestConsecutiveWordSequence,
          currentConsecutiveWordSequence
        );
        break;
      }

      currentConsecutiveWordSequence +=
        bodyWords[firstBodyWord + currentConsecutiveWords].length;
      currentConsecutiveWords++;
    }
  }

  return {
    consecutiveWordScore:
      mostConsecutiveWords * consecutiveWordMatchLengthMultiplier,
    consecutiveWordSequenceScore:
      longestConsecutiveWordSequence * consecutiveWordSequenceLengthMultiplier,
  };
}

function getConfiguredText(
  text: string,
  isCaseSensitive: boolean,
  shouldMatchPunctuation: boolean,
  shouldCollapseWhitespace: boolean
) {
  if (!isCaseSensitive) {
    text = text.toLocaleLowerCase();
  }

  if (!shouldMatchPunctuation) {
    text = text.replace(/[/#%&=-]/g, " ");
    text = text.replace(/[.,'!$^*;:{}`~()]/g, "");
  }

  if (shouldCollapseWhitespace) {
    text = text.replace(/\s\s+/g, " ");
  }

  return text;
}

export function search({ query, body, options }: SearchInputs): number {
  const {
    exactMatchPoints,
    exactContainingMatchPoints,
    singleWordMatchPoints,
    singleWordMatchLengthMultiplier,
    uniqueSingleWordMatchPoints,
    uniqueSingleWordMatchLengthMultiplier,
    consecutiveWordMatchPoints,
    consecutiveWordMatchLengthMultiplier,
    consecutiveWordSequenceMatchPoints,
    consecutiveWordSequenceLengthMultiplier,
    isCaseSensitive,
    shouldMatchPunctuation,
    shouldMatchWhitespaceAndPunctuation,
    shouldCollapseWhitespace,
  } = {
    ...defaultSearchOptions,
    ...options,
  };

  let score = 0;

  const formattedQuery = getConfiguredText(
    query,
    isCaseSensitive,
    shouldMatchPunctuation,
    shouldCollapseWhitespace
  );

  const formattedBody = getConfiguredText(
    body,
    isCaseSensitive,
    shouldMatchPunctuation,
    shouldCollapseWhitespace
  );

  if (exactMatchPoints !== 0) {
    score +=
      exactMatchPoints * getExactMatchScore(formattedQuery, formattedBody);
  }

  if (exactContainingMatchPoints !== 0) {
    score +=
      exactContainingMatchPoints *
      getExactContainingMatchScore(formattedQuery, formattedBody);
  }

  const queryWords = getWords(
    formattedQuery,
    shouldMatchWhitespaceAndPunctuation,
    shouldMatchPunctuation
  );
  const bodyWords = getWords(
    formattedBody,
    shouldMatchWhitespaceAndPunctuation,
    shouldMatchPunctuation
  );

  if (singleWordMatchPoints !== 0 && singleWordMatchLengthMultiplier !== 0) {
    score +=
      singleWordMatchPoints *
      getSingleWordMatchScore(
        queryWords,
        bodyWords,
        singleWordMatchLengthMultiplier
      );
  }

  if (
    uniqueSingleWordMatchPoints !== 0 &&
    uniqueSingleWordMatchLengthMultiplier !== 0
  ) {
    score +=
      uniqueSingleWordMatchPoints *
      getUniqueSingleWordMatchScore(
        queryWords,
        bodyWords,
        uniqueSingleWordMatchLengthMultiplier
      );
  }

  if (
    (consecutiveWordMatchPoints !== 0 &&
      consecutiveWordMatchLengthMultiplier !== 0) ||
    (consecutiveWordSequenceMatchPoints !== 0 &&
      consecutiveWordSequenceLengthMultiplier !== 0)
  ) {
    const { consecutiveWordScore, consecutiveWordSequenceScore } =
      getConsecutiveWordSequenceMatchScore(
        queryWords,
        bodyWords,
        consecutiveWordMatchLengthMultiplier,
        consecutiveWordSequenceLengthMultiplier
      );

    score += consecutiveWordMatchPoints * consecutiveWordScore;
    score += consecutiveWordSequenceMatchPoints * consecutiveWordSequenceScore;
  }

  return score;
}
