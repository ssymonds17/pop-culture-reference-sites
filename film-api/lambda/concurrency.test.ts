import { mapWithConcurrency } from "./concurrency"

const resolveAfter = (ms: number) => new Promise<number>((resolve) => setTimeout(() => resolve(ms), ms))

describe("mapWithConcurrency", () => {
  it("should keep results in input order when items finish out of order", async () => {
    const result = await mapWithConcurrency([30, 10, 20, 0], 2, resolveAfter)

    expect(result).toEqual([30, 10, 20, 0])
  })

  it("should never run more than the limit at once", async () => {
    let inFlight = 0
    let mostInFlight = 0

    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      inFlight++
      mostInFlight = Math.max(mostInFlight, inFlight)
      await resolveAfter(1)
      inFlight--
      return item
    })

    expect(mostInFlight).toBe(2)
  })

  it("should reject with the first error and start no more items", async () => {
    const started: number[] = []

    const result = mapWithConcurrency([1, 2, 3, 4], 1, async (item) => {
      started.push(item)
      if (item === 2) {
        throw new Error("Lookup failed")
      }
      return item
    })

    await expect(result).rejects.toThrow("Lookup failed")
    expect(started).toEqual([1, 2])
  })

  it("should return an empty list for no items", async () => {
    expect(await mapWithConcurrency([], 10, resolveAfter)).toEqual([])
  })
})
