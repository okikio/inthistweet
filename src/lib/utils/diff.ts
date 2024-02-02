/**
 * Returns the difference between two arrays (unique elements in array1 that are not present in array2).
 *
 * @template T - The type of the elements in the input arrays.
 * @param {T[]} arr1 - The first input array.
 * @param {T[]} arr2 - The second input array.
 * @returns {T[]} - An array containing the unique elements of array1 not present in array2.
 */
export function diff<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
  const a = new Set(arr1);
  const b = new Set(arr2);

  return Array.from([...a].filter(x => !b.has(x)));
}
