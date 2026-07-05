/**
 * Research-provenance flags ("Snippet-sourced; verify physically.") are
 * internal editor language that must never render to a reader, least of all
 * inside authentication copy at her highest-anxiety moment. This translates
 * them to a plain-language hedge WITHOUT dropping the softness (the
 * calibrated-hedge rule: the uncertainty survives, the jargon doesn't).
 * Pure, shared by every bag-page section that prints researched fields.
 */

const READER_HEDGE = "(widely repeated detail; confirm on the bag in hand)";
const HEDGE_RX = /\(widely repeated detail; confirm on the bag in hand\)/;

export function translateProvenance(text: string): string {
  return text
    .replace(/Snippet-sourced[^.]*\.?/gi, READER_HEDGE)
    .replace(/\bneeds (browser\/physical |physical )?verification\.?/gi, READER_HEDGE)
    .replace(/\bverify physically\.?/gi, READER_HEDGE)
    .replace(/Do not present it as universal\.?/gi, "It does not apply to every era.")
    .replace(new RegExp(`${HEDGE_RX.source}(\\s*${HEDGE_RX.source})+`, "g"), READER_HEDGE)
    .replace(/\s{2,}/g, " ")
    .trim();
}
