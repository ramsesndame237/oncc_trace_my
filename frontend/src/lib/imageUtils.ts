export const bytesToMB = (bytes: number) =>
  Number(Number(bytes / (1024 * 1024)).toFixed(2));
