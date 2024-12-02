export function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getAgeRange(age: number): string {
  if (age <= 25) return 'FIRST_AGE_RANGE';
  if (age <= 35) return 'SECOND_AGE_RANGE';
  if (age <= 50) return 'THIRD_AGE_RANGE';
  return 'FOURTH_AGE_RANGE';
}
