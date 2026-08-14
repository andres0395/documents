/**
 * Lightweight className combiner.
 * Falsy values (false, null, undefined, "") are filtered out.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
