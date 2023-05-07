# Smart Text Search

Search some text and receive a search score using configurable parameters.

## Usage

```js
import { search, SearchOptions } from "@pdfnav/smart-text-search";
const query = "quick fox";
const body = "The quick brown fox jumps over the lazy dog";

// Receive a score
const searchScore = search({ query, body });

// Provide custom search options tailored to your usecase
const options: SearchOptions = {
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
const customisedSearchScore = search({ query, body, options });
```

## Search options

- **exactMatchPoints** (number): points to apply upon finding an exact match with body
- **exactContainingMatchPoints** (number): points to apply upon finding an exact match within body
- **singleWordMatchPoints** (number): points to apply upon finding a single word within query matching with a word in body
- **singleWordMatchLengthMultiplier** (number): makes single word matches more significant if they are longer
- **uniqueSingleWordMatchPoints** (number): points to apply upon finding a single word within query matching with a word in body, only count unique words
- **uniqueSingleWordMatchLengthMultiplier** (number): makes single word matches more significant if they are longer, only count unique words
- **consecutiveWordMatchPoints** (number): points to apply when two or more consecutive words in query match
- **consecutiveWordMatchLengthMultiplier** (number): makes every consecutive matching word more significant
- **consecutiveWordSequenceMatchPoints** (number): points to apply when two or more consecutive characters in query match
- **consecutiveWordSequenceLengthMultiplier** (number): makes longer matching sequences more significant
- **isCaseSensitive** (boolean): make search case sensitive
- **shouldMatchPunctuation** (boolean): make punctuation not count as a match (removes all punctuation from string)
- **shouldMatchWhitespaceAndPunctuation** (boolean): make whitespace sequences and punctuation contribute to score
- **shouldCollapseWhitespace** (boolean): replace consecutive whitespace with a single space
