/**
 * Remove OCR-artifact spaces between consecutive CJK characters.
 * Tesseract.js Japanese OCR often inserts spaces between CJK characters
 * (e.g. "藤 門 千 明" instead of "藤門千明").
 *
 * Rules:
 * - CJK↔CJK spaces → removed (OCR artifact)
 * - CJK↔Latin spaces → preserved (natural boundary, e.g. "グループCIO")
 * - Latin↔Latin spaces → preserved (word separator)
 */
const CJK_SPACE_ARTIFACT =
  /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3001-\u303F\uFF01-\uFF60])\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3001-\u303F\uFF01-\uFF60])/gu;

export function normalizeCjkSpaces(text: string): string {
  return text.replace(CJK_SPACE_ARTIFACT, "$1");
}
