export const matchCount = (list1: string[], list2: string[]): number =>
  list1.filter((value) => list2.includes(value)).length;
