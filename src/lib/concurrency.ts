export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function processNext(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      try {
        results[index] = await processor(item);
      } catch {
        results[index] = undefined as unknown as R;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => processNext());
  await Promise.all(workers);

  return results.filter((r): r is R => r !== undefined);
}

export async function batchProcessWithIndex<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: (R | undefined)[] = new Array(items.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const index = i;
    const item = items[i];

    const promise = processor(item, index).then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const completedIndex = executing.findIndex(
        (p) => p === promise || (p as any).completed
      );
      if (completedIndex >= 0) {
        executing.splice(completedIndex, 1);
      }
    }
  }

  await Promise.all(executing);
  return results.filter((r): r is R => r !== undefined);
}
