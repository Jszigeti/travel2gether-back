export const extractFormatFromFile = (originalFileName: string): string => {
  return originalFileName
    .split('')
    .reverse()
    .join('')
    .split('.')[0]
    .split('')
    .reverse()
    .join('');
};
