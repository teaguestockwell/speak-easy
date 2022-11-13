export const chunk = <T extends { slice: (...args: any[]) => T }>(
  arr: T,
  getLength: (t: T) => number,
  chunkSize: number,
  onChunk?: (t: T, isLast: boolean, chunkIndex: number) => unknown
) => {
  const res: T[] = [];
  for (let i = 0; i < getLength(arr); i += chunkSize) {
    const nextChunk = arr.slice(i, i + chunkSize);
    res.push(nextChunk);
    onChunk?.(
      nextChunk,
      i + getLength(nextChunk) >= getLength(arr),
      res.length - 1
    );
  }
  return res;
};

export const chunkFile = async (
  file: File,
  onChunk?: (ab: ArrayBuffer, isLast: boolean, chunkIndex: number) => unknown
) => {
  const allBytes = await file.arrayBuffer();
  return chunk(allBytes, (ab) => ab.byteLength, 1024 * 64, onChunk);
};
