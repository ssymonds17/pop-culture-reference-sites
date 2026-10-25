// Stops handing out items once one rejects, so no new work starts after the caller has failed.
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapItem: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let next = 0
  let stopped = false
  const worker = async () => {
    while (!stopped && next < items.length) {
      const index = next++
      try {
        results[index] = await mapItem(items[index])
      } catch (error) {
        stopped = true
        throw error
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
