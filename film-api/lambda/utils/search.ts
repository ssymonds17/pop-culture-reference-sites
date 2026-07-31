/**
 * Folds a string into an accent-insensitive form for searching.
 *
 * Uses Unicode NFD normalisation to split accented characters into their base
 * letter plus a separate combining mark, then strips those marks. So "Amelie",
 * "Amelie" and "AMELIE" all fold to "amelie" and match each other, regardless
 * of accents on the stored value or the query.
 *
 * Note: this only removes diacritics from decomposable (mostly Latin)
 * characters. It does not transliterate non-Latin scripts (Cyrillic, Greek,
 * CJK, etc.); those are left as-is, so they still match themselves.
 */
export const normalizeForSearch = (value: string): string =>
  value
    .normalize("NFD") // decompose base letter + combining accent
    .replace(/\p{M}/gu, "") // strip all combining marks (the accents)
    .toLowerCase()
    .trim()
