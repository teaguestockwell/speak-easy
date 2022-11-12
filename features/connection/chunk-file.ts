export const chunk = async <T extends { slice: (...args: any[]) => T }>(
  arr: T,
  getLength: (t: T) => number,
  chunkSize: number,
  onChunk: (t: T, isLast: boolean) => unknown,
  wait: number
) => {
  for (let i = 0; i < getLength(arr); i += chunkSize) {
    const nextChunk = arr.slice(i, i + chunkSize);
    onChunk(nextChunk, i + getLength(nextChunk) >= getLength(arr));
    await new Promise((r) => setTimeout(r, wait));
  }
};

export const chunkFile = (
  file: File,
  onChunkRead: (ab: ArrayBuffer, isLast: boolean) => unknown
) => {
  file.arrayBuffer().then((allBytes) => {
    // 10MB / second
    chunk(allBytes, (ab) => ab.byteLength, 1024 * 1024, onChunkRead, 100);
  });
};
