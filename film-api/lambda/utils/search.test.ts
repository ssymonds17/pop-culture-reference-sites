import { escapeRegex } from "./search"

describe("escapeRegex", () => {
  it("should escape every regex metacharacter", () => {
    const special = ".*+?^${}()|[]\\"

    expect(new RegExp(escapeRegex(special)).test(special)).toBe(true)
  })

  it("should leave ordinary text unchanged", () => {
    expect(escapeRegex("the godfather")).toBe("the godfather")
  })

  it("should stop a dot matching any character", () => {
    const pattern = new RegExp(escapeRegex("a.b"))

    expect(pattern.test("a.b")).toBe(true)
    expect(pattern.test("axb")).toBe(false)
  })
})
