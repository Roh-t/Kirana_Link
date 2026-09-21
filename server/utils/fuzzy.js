/**
 * Bounded Levenshtein (edit) distance.
 * This is the same core algorithm used by spell-checkers/autocorrect to
 * measure "how many single-character edits (insert/delete/substitute)
 * turn word A into word B". We cap it at maxDist and bail out early the
 * moment we know we can't beat it - this keeps a full-catalog fuzzy scan
 * fast even for thousands of products.
 */
function boundedLevenshtein(a, b, maxDist) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;

  let prevRow = new Array(n + 1);
  for (let j = 0; j <= n; j++) prevRow[j] = j;

  for (let i = 1; i <= m; i++) {
    const curRow = new Array(n + 1);
    curRow[0] = i;
    let rowMin = curRow[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        curRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
      if (curRow[j] < rowMin) rowMin = curRow[j];
    }
    if (rowMin > maxDist) return maxDist + 1; // can't possibly recover
    prevRow = curRow;
  }
  return prevRow[n];
}

// How many typo "edits" we tolerate, scaled to word length -
// short words need a tighter leash or everything fuzzy-matches everything.
function maxEditsFor(len) {
  if (len <= 3) return 1;
  if (len <= 7) return 2;
  return 3;
}

function normalize(str) {
  return (str || "").toString().toLowerCase().trim();
}

function tokenize(str) {
  return normalize(str)
    .split(/[^a-z0-9\u0900-\u097F]+/i)
    .filter(Boolean);
}

/**
 * Score how well a single query token matches one field's value.
 * Priority (highest to lowest): exact > prefix > substring > fuzzy typo.
 */
function scoreTokenAgainstField(token, fieldValueLower, fieldWords) {
  if (!fieldValueLower) return 0;

  if (fieldValueLower === token) return 12;
  if (fieldValueLower.startsWith(token)) return 6;
  if (fieldValueLower.includes(token)) return 2.5;

  const maxAllowed = maxEditsFor(token.length);
  let bestDist = Infinity;
  for (const w of fieldWords) {
    if (Math.abs(w.length - token.length) > maxAllowed) continue;
    const d = boundedLevenshtein(token, w, maxAllowed);
    if (d < bestDist) bestDist = d;
    if (bestDist === 0) break;
  }
  if (bestDist <= maxAllowed) {
    return (maxAllowed - bestDist + 1) * 1.8; // closer match = higher score
  }
  return 0;
}

module.exports = { boundedLevenshtein, maxEditsFor, normalize, tokenize, scoreTokenAgainstField };
