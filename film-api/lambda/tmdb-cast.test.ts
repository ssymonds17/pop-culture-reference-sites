import { creditedCast, MAX_CAST, TmdbCastMember } from "./tmdb-cast"

const castMember = (order: number, overrides: Partial<TmdbCastMember> = {}): TmdbCastMember => ({
  id: 1000 + order,
  name: `Actor ${order}`,
  character: `Character ${order}`,
  order,
  ...overrides,
})

describe("creditedCast", () => {
  it("should return the cast sorted by billing order", () => {
    const result = creditedCast([castMember(2), castMember(0), castMember(1)])

    expect(result.map((member) => member.order)).toEqual([0, 1, 2])
  })

  it("should drop uncredited roles", () => {
    const result = creditedCast([
      castMember(0),
      castMember(1, { character: "Waiter (uncredited)" }),
      castMember(2),
    ])

    expect(result.map((member) => member.order)).toEqual([0, 2])
  })

  it("should keep members with no character", () => {
    const result = creditedCast([castMember(0, { character: undefined })])

    expect(result).toHaveLength(1)
  })

  it("should keep only the top-billed members", () => {
    const cast = Array.from({ length: MAX_CAST + 5 }, (_, order) => castMember(order))

    const result = creditedCast(cast)

    expect(result).toHaveLength(MAX_CAST)
    expect(result[MAX_CAST - 1].order).toBe(MAX_CAST - 1)
  })

  it("should return an empty list when there is no cast", () => {
    expect(creditedCast(undefined)).toEqual([])
    expect(creditedCast([])).toEqual([])
  })
})
