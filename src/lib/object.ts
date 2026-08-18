export function omitId<T extends { id: string }>(item: T): Omit<T, 'id'> {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => key !== 'id'),
  ) as Omit<T, 'id'>;
}
