export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

export function pickOne<T>(items: T[], rng: Rng = defaultRng): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list.');
  }

  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
}

export function createId(prefix: string, now = new Date()) {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${now.getTime()}-${randomPart}`;
}
