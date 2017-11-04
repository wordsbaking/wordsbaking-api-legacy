export function pushToArrayInMap<K, T>(
  map: Map<K, T[]>,
  key: K,
  ...values: T[]
): void {
  let array = map.get(key);

  if (array) {
    array.push(...values);
  } else {
    map.set(key, [...values]);
  }
}
