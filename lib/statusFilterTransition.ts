/** Follow a locally edited lead without replacing an unrelated or all-status filter. */
export function statusFilterAfterChange(filter: string, previous?: string, next?: string): string {
  if (!filter || !previous || !next || previous === next) return filter;
  const statuses = filter.split("|");
  return statuses.includes(previous) && !statuses.includes(next) ? next : filter;
}
