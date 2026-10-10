/** Move the complete item to the target position without changing its fields. */
export function reorderItems<T>(items: T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const ordered = [...items];
  const [item] = ordered.splice(from, 1);
  ordered.splice(to, 0, item);
  return ordered;
}
