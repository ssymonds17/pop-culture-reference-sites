import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import userEvent from "@testing-library/user-event"
import axios from "axios"
import PersonFilmsModal from "./PersonFilmsModal"
import { API_ENDPOINTS } from "@/lib/api"
import { Person, TmdbPersonFilm } from "@/types"

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock("axios", () => ({
  __esModule: true,
  default: { get: jest.fn(), create: jest.fn() },
}))
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: jest.fn() }),
}))

const mockAxiosGet = axios.get as jest.Mock
const mockAxiosCreate = axios.create as jest.Mock

const person: Person = {
  _id: "person1",
  tmdbPersonId: "123",
  name: "sigourney weaver",
  displayName: "Sigourney Weaver",
  totalFilms: 2,
  seenFilms: 1,
  averageRating: 9,
  totalScore: 9,
  ratingCounts: {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 0,
    rating9: 1,
    rating10: 0,
  },
  totalPoints: 10,
}

const films = [
  { _id: "film1", title: "Alien", year: 1979, rating: 9, owned: true },
  { _id: "film2", title: "Galaxy Quest", year: 1999 },
]

const otherPerson: Person = {
  ...person,
  _id: "person2",
  tmdbPersonId: "456",
  displayName: "Bill Paxton",
}

const filmsResponse = (titles: string[]) => ({
  data: {
    data: {
      films: titles.map((title, i) => ({
        _id: `${title}-${i}`,
        title,
        year: 2000,
      })),
    },
  },
})

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const renderModal = (
  current: Person,
  isOpen = true,
  kind: "director" | "actor" = "actor",
) => (
  <PersonFilmsModal
    person={current}
    kind={kind}
    isOpen={isOpen}
    onClose={jest.fn()}
  />
)

describe("PersonFilmsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ["director", API_ENDPOINTS.director("123")],
    ["actor", API_ENDPOINTS.actor("123")],
  ] as const)(
    "should load the films from the %s endpoint",
    async (kind, endpoint) => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: { ...person, films } },
      })

      render(
        <PersonFilmsModal
          person={person}
          kind={kind}
          isOpen
          onClose={jest.fn()}
        />,
      )

      expect(await screen.findByText("Alien")).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenCalledWith(endpoint)
    },
  )

  it("should show the person's name and stats", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, films } } })

    render(
      <PersonFilmsModal
        person={person}
        kind="actor"
        isOpen
        onClose={jest.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Sigourney Weaver" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("2 films · 1 seen · 9.00 avg rating"),
    ).toBeInTheDocument()
    expect(await screen.findByText("Galaxy Quest")).toBeInTheDocument()
  })

  it("should not fetch or render while closed", () => {
    const { container } = render(
      <PersonFilmsModal
        person={person}
        kind="actor"
        isOpen={false}
        onClose={jest.fn()}
      />,
    )

    expect(container).toBeEmptyDOMElement()
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it("should show an error when the films cannot be loaded", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    mockAxiosGet.mockRejectedValueOnce(new Error("network down"))

    render(
      <PersonFilmsModal
        person={person}
        kind="actor"
        isOpen
        onClose={jest.fn()}
      />,
    )

    expect(await screen.findByText("Failed to load films")).toBeInTheDocument()
    consoleError.mockRestore()
  })

  describe("photo", () => {
    const withPhoto = { ...person, profilePath: "/weaver.jpg" }

    it("should show the person's TMDb photo as a decorative image", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

      const { container } = render(renderModal(withPhoto))

      const photo = container.querySelector("img")
      expect(photo).toHaveAttribute(
        "src",
        "https://image.tmdb.org/t/p/w185/weaver.jpg",
      )
      expect(photo).toHaveAttribute("alt", "")
      expect(screen.queryByText("SW")).not.toBeInTheDocument()
      await screen.findByText("No films found")
    })

    it.each([
      ["Sigourney Weaver", "SW"],
      ["Philip Seymour Hoffman", "PH"],
      ["Madonna", "M"],
      ["  Sigourney   Weaver ", "SW"],
      ["Éva Green", "ÉG"],
    ])(
      'should show initials for "%s" when there is no photo',
      async (displayName, initials) => {
        mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

        const { container } = render(renderModal({ ...person, displayName }))

        expect(container.querySelector("img")).not.toBeInTheDocument()
        expect(screen.getByText(initials)).toHaveAttribute(
          "aria-hidden",
          "true",
        )
        await screen.findByText("No films found")
      },
    )

    it("should fall back to initials when the photo fails to load", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))
      const { container } = render(renderModal(withPhoto))

      fireEvent.error(container.querySelector("img")!)

      expect(container.querySelector("img")).not.toBeInTheDocument()
      expect(screen.getByText("SW")).toBeInTheDocument()
      await screen.findByText("No films found")
    })

    it("should still load a different photo after one has failed", async () => {
      mockAxiosGet
        .mockResolvedValueOnce(filmsResponse([]))
        .mockResolvedValueOnce(filmsResponse([]))
      const { container, rerender } = render(renderModal(withPhoto))
      fireEvent.error(container.querySelector("img")!)

      rerender(renderModal({ ...otherPerson, profilePath: "/paxton.jpg" }))

      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "https://image.tmdb.org/t/p/w185/paxton.jpg",
      )
      await screen.findByText("No films found")
    })

    it("should switch from a photo to initials for a person without one", async () => {
      mockAxiosGet
        .mockResolvedValueOnce(filmsResponse([]))
        .mockResolvedValueOnce(filmsResponse([]))
      const { container, rerender } = render(renderModal(withPhoto))

      rerender(renderModal(otherPerson))

      expect(container.querySelector("img")).not.toBeInTheDocument()
      expect(screen.getByText("BP")).toBeInTheDocument()
      await screen.findByText("No films found")
    })
  })

  it("should say no films were found when the response has none", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person } } })

    render(renderModal(person))

    expect(await screen.findByText("No films found")).toBeInTheDocument()
  })

  describe("switching person", () => {
    it("should show loading rather than the previous person's films", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Alien"]))
      const { rerender } = render(renderModal(person))
      await screen.findByText("Alien")
      const pending = deferred()
      mockAxiosGet.mockReturnValueOnce(pending.promise)

      rerender(renderModal(otherPerson))

      expect(screen.queryByText("Alien")).not.toBeInTheDocument()
      expect(screen.getByText("Loading films...")).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.actor("456"))

      await act(async () => pending.resolve(filmsResponse(["Twister"])))

      expect(screen.getByText("Twister")).toBeInTheDocument()
    })

    it("should ignore a response for the previous person that arrives late", async () => {
      const firstPerson = deferred()
      mockAxiosGet.mockReturnValueOnce(firstPerson.promise)
      const { rerender } = render(renderModal(person))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Twister"]))

      rerender(renderModal(otherPerson))
      await screen.findByText("Twister")
      await act(async () => firstPerson.resolve(filmsResponse(["Alien"])))

      expect(screen.getByText("Twister")).toBeInTheDocument()
      expect(screen.queryByText("Alien")).not.toBeInTheDocument()
    })

    it("should ignore a failure for the previous person that arrives late", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      let rejectFirst!: (reason: unknown) => void
      mockAxiosGet.mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectFirst = reject
        }),
      )
      const { rerender } = render(renderModal(person))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Twister"]))

      rerender(renderModal(otherPerson))
      await screen.findByText("Twister")
      await act(async () => rejectFirst(new Error("network down")))

      expect(screen.queryByText("Failed to load films")).not.toBeInTheDocument()
      expect(consoleError).not.toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it("should render and fetch nothing when the person is cleared", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Alien"]))
      const { rerender, container } = render(renderModal(person))
      await screen.findByText("Alien")

      rerender(
        <PersonFilmsModal
          person={null}
          kind="actor"
          isOpen
          onClose={jest.fn()}
        />,
      )

      expect(container).toBeEmptyDOMElement()
      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    })

    it("should refetch when the same person is shown as a different kind", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Alien"]))
      const { rerender } = render(renderModal(person, true, "actor"))
      await screen.findByText("Alien")
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Directed Film"]))

      rerender(renderModal(person, true, "director"))

      expect(screen.queryByText("Alien")).not.toBeInTheDocument()
      expect(screen.getByText("Loading films...")).toBeInTheDocument()
      expect(await screen.findByText("Directed Film")).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenLastCalledWith(
        API_ENDPOINTS.director("123"),
      )
    })
  })

  describe("closing and reopening", () => {
    it("should ignore a response that arrives after the modal closes", async () => {
      const beforeClose = deferred()
      mockAxiosGet.mockReturnValueOnce(beforeClose.promise)
      const { rerender } = render(renderModal(person))

      rerender(renderModal(person, false))
      await act(async () => beforeClose.resolve(filmsResponse(["Alien"])))
      mockAxiosGet.mockReturnValueOnce(deferred().promise)
      rerender(renderModal(person))

      expect(screen.getByText("Loading films...")).toBeInTheDocument()
      expect(screen.queryByText("Alien")).not.toBeInTheDocument()
    })

    it("should show the films already loaded while refreshing them on reopen", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Alien"]))
      const { rerender } = render(renderModal(person))
      await screen.findByText("Alien")
      rerender(renderModal(person, false))
      const refresh = deferred()
      mockAxiosGet.mockReturnValueOnce(refresh.promise)

      rerender(renderModal(person))

      expect(screen.getByText("Alien")).toBeInTheDocument()
      expect(screen.queryByText("Loading films...")).not.toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenCalledTimes(2)

      await act(async () => refresh.resolve(filmsResponse(["Alien", "Aliens"])))

      expect(screen.getByText("Aliens")).toBeInTheDocument()
    })

    it("should retry after an error and show the films once they load", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      mockAxiosGet.mockRejectedValueOnce(new Error("network down"))
      const { rerender } = render(renderModal(person))
      await screen.findByText("Failed to load films")
      rerender(renderModal(person, false))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(["Alien"]))

      rerender(renderModal(person))

      expect(screen.queryByText("Failed to load films")).not.toBeInTheDocument()
      expect(await screen.findByText("Alien")).toBeInTheDocument()
      consoleError.mockRestore()
    })
  })

  describe("links", () => {
    it("should link to the person's TMDb page", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

      render(renderModal(person))

      expect(screen.getByRole("link", { name: "TMDB" })).toHaveAttribute(
        "href",
        "https://www.themoviedb.org/person/123",
      )
      await screen.findByText("No films found")
    })

    it("should link to IMDb once the person loads with an IMDb ID", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: { ...person, imdbPersonId: "nm0000244", films: [] } },
      })

      render(renderModal(person))

      expect(await screen.findByRole("link", { name: "IMDB" })).toHaveAttribute(
        "href",
        "https://www.imdb.com/name/nm0000244",
      )
      expect(screen.getByRole("link", { name: "IMDB" })).toHaveAttribute(
        "target",
        "_blank",
      )
    })

    it.each([null, undefined])(
      "should not link to IMDb when the ID is %p",
      async (imdbPersonId) => {
        mockAxiosGet.mockResolvedValueOnce({
          data: { data: { ...person, imdbPersonId, films: [] } },
        })

        render(renderModal(person))

        await screen.findByText("No films found")
        expect(
          screen.queryByRole("link", { name: "IMDB" }),
        ).not.toBeInTheDocument()
      },
    )
  })

  describe("header", () => {
    it("should show the stats from the loaded person, which are fresher than those passed in", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          data: {
            ...person,
            totalFilms: 3,
            seenFilms: 2,
            averageRating: 8.5,
            films,
          },
        },
      })

      render(renderModal(person))

      expect(
        await screen.findByText("3 films · 2 seen · 8.50 avg rating"),
      ).toBeInTheDocument()
    })

    it("should link to IMDb from the person passed in before the films load", () => {
      mockAxiosGet.mockReturnValueOnce(deferred().promise)

      render(renderModal({ ...person, imdbPersonId: "nm0000244" }))

      expect(screen.getByRole("link", { name: "IMDB" })).toHaveAttribute(
        "href",
        "https://www.imdb.com/name/nm0000244",
      )
    })
  })

  describe("role column", () => {
    const roleFilms = [
      { _id: "film1", title: "Alien", year: 1979, lead: true },
      { _id: "film2", title: "Galaxy Quest", year: 1999, lead: false },
    ]

    it("should show whether an actor is a lead or support in each film", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: { ...person, films: roleFilms } },
      })

      render(renderModal(person, true, "actor"))

      const alienRow = (await screen.findByText("Alien")).closest("tr")!
      expect(
        screen.getByRole("columnheader", { name: "Role" }),
      ).toBeInTheDocument()
      expect(within(alienRow).getByText("Lead")).toBeInTheDocument()
      expect(
        within(screen.getByText("Galaxy Quest").closest("tr")!).getByText(
          "Support",
        ),
      ).toBeInTheDocument()
    })

    it("should not show a role column for a director", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: { ...person, films: roleFilms } },
      })

      render(renderModal(person, true, "director"))

      await screen.findByText("Alien")
      expect(
        screen.queryByRole("columnheader", { name: "Role" }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText("Support")).not.toBeInTheDocument()
    })
  })

  describe("other films", () => {
    const LOAD_OTHER_FILMS = "Load other films and IMDb ratings"

    const otherFilm = (
      overrides: Partial<TmdbPersonFilm> = {},
    ): TmdbPersonFilm => ({
      tmdbId: "679",
      title: "Aliens",
      year: 1986,
      character: "Ellen Ripley",
      imdbId: "tt0090605",
      imdbRating: 8.4,
      imdbVotes: 950000,
      ...overrides,
    })

    const otherFilmsResponse = (
      otherFilms: TmdbPersonFilm[],
      hiddenCount = 0,
    ) => ({ data: { data: { films: otherFilms, hiddenCount } } })

    // The signed-in client, which requests the filmography and adds films
    const mockClientGet = jest.fn()
    const mockPost = jest.fn()

    const mockApi = (
      otherFilms: TmdbPersonFilm[] | Error,
      { hiddenCount = 0, yourFilms = () => films } = {},
    ) => {
      mockAxiosGet.mockImplementation(async () => ({
        data: { data: { ...person, films: yourFilms() } },
      }))
      mockClientGet.mockImplementation(async () => {
        if (otherFilms instanceof Error) throw otherFilms
        return otherFilmsResponse(otherFilms, hiddenCount)
      })
    }

    const requestsFor = (tmdbPersonId: string) =>
      mockClientGet.mock.calls.filter(
        ([url]) => url === API_ENDPOINTS.tmdbPersonFilms(tmdbPersonId),
      )

    const yourFilmsSection = () =>
      screen.getByRole("region", { name: "Your films" })
    const otherFilmsSection = () =>
      screen.getByRole("region", { name: "Other films" })

    beforeEach(() => {
      mockAxiosGet.mockReset()
      mockClientGet.mockReset()
      mockPost.mockReset()
      mockPost.mockResolvedValue({})
      mockAxiosCreate.mockReturnValue({ get: mockClientGet, post: mockPost })
    })

    const loadOtherFilms = async (kind: "actor" | "director" = "actor") => {
      const user = userEvent.setup()
      const utils = render(renderModal(person, true, kind))
      await screen.findByText("Galaxy Quest")
      await user.click(screen.getByRole("button", { name: LOAD_OTHER_FILMS }))
      return { user, ...utils }
    }

    it("should show your films first, with your rating and no IMDb figures, without requesting other films", async () => {
      mockApi([otherFilm()])

      render(renderModal(person))

      const alienRow = (
        await within(yourFilmsSection()).findByText("Alien")
      ).closest("tr")!
      expect(
        within(yourFilmsSection()).getByRole("columnheader", {
          name: "Your rating",
        }),
      ).toBeInTheDocument()
      expect(within(alienRow).getByText("9")).toBeInTheDocument()
      expect(
        screen.queryByRole("columnheader", { name: "IMDb" }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: LOAD_OTHER_FILMS }),
      ).toBeInTheDocument()
      expect(mockClientGet).not.toHaveBeenCalled()
    })

    it("should request the person's filmography for their kind through the signed-in client", async () => {
      mockApi([otherFilm()])

      await loadOtherFilms("director")

      await within(otherFilmsSection()).findByRole("link", { name: "Aliens" })
      expect(mockClientGet).toHaveBeenCalledWith(
        API_ENDPOINTS.tmdbPersonFilms("123"),
        { params: { kind: "director" }, timeout: 35000 },
      )
      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    })

    it("should list other films below your films, with each film's character, year, TMDb link and IMDb figures", async () => {
      mockApi([otherFilm()])

      await loadOtherFilms()

      const link = await within(otherFilmsSection()).findByRole("link", {
        name: "Aliens",
      })
      expect(link).toHaveAttribute(
        "href",
        "https://www.themoviedb.org/movie/679",
      )
      const row = link.closest("tr")!
      expect(within(row).getByText("as Ellen Ripley")).toBeInTheDocument()
      expect(within(row).getByText("1986")).toBeInTheDocument()
      const imdbLink = within(row).getByRole("link", {
        name: "8.4 on IMDb for Aliens (1986)",
      })
      expect(imdbLink).toHaveAttribute(
        "href",
        "https://www.imdb.com/title/tt0090605",
      )
      expect(imdbLink).toHaveAttribute("target", "_blank")
      expect(within(row).getByText("950K votes")).toBeInTheDocument()
      expect(
        within(yourFilmsSection()).getByText("Galaxy Quest"),
      ).toBeInTheDocument()
      expect(
        screen
          .getAllByRole("heading", { level: 3 })
          .map((heading) => heading.textContent),
      ).toEqual(["Your films", "Other films"])
    })

    it("should leave out the character when there is none, and never show a Role column", async () => {
      mockApi([otherFilm({ character: null })])

      await loadOtherFilms()

      const row = (
        await within(otherFilmsSection()).findByRole("link", {
          name: "Aliens",
        })
      ).closest("tr")!
      expect(within(row).queryByText(/^as /)).not.toBeInTheDocument()
      expect(
        within(otherFilmsSection()).queryByRole("columnheader", {
          name: "Role",
        }),
      ).not.toBeInTheDocument()
    })

    it.each([
      [1, "1 film hidden: "],
      [23, "23 films hidden: "],
    ])(
      "should say how many films were hidden and why, for %p",
      async (hiddenCount, prefix) => {
        mockApi([otherFilm()], { hiddenCount })

        await loadOtherFilms()

        expect(
          await within(otherFilmsSection()).findByText(
            `${prefix}unreleased, no IMDb data, fewer than 1,000 IMDb votes or couldn't be checked`,
          ),
        ).toBeInTheDocument()
      },
    )

    it("should not mention hidden films when there are none", async () => {
      mockApi([otherFilm()])

      await loadOtherFilms()

      await within(otherFilmsSection()).findByRole("link", { name: "Aliens" })
      expect(screen.queryByText(/hidden:/)).not.toBeInTheDocument()
    })

    it("should say when there are no other films to show", async () => {
      mockApi([], { hiddenCount: 4 })

      await loadOtherFilms()

      expect(
        await within(otherFilmsSection()).findByText("No other films to show"),
      ).toBeInTheDocument()
      expect(
        within(otherFilmsSection()).getByText(/^4 films hidden: /),
      ).toBeInTheDocument()
      expect(
        within(otherFilmsSection()).queryByRole("table"),
      ).not.toBeInTheDocument()
    })

    it("should keep the button focused and inert while loading", async () => {
      mockApi([otherFilm()])
      const pending = deferred()
      mockClientGet.mockReturnValueOnce(pending.promise)

      const { user } = await loadOtherFilms()

      const loadingButton = screen.getByRole("button", {
        name: "Loading other films...",
      })
      expect(loadingButton).toHaveAttribute("aria-disabled", "true")
      expect(loadingButton).toHaveFocus()

      await user.click(loadingButton)
      expect(mockClientGet).toHaveBeenCalledTimes(1)
      await act(async () => pending.resolve(otherFilmsResponse([otherFilm()])))
    })

    it("should move focus to the other films once they load from the focused button", async () => {
      mockApi([otherFilm()])

      await loadOtherFilms()

      await within(otherFilmsSection()).findByRole("link", { name: "Aliens" })
      expect(
        screen.getByRole("heading", { name: "Other films" }),
      ).toHaveFocus()
    })

    it("should leave focus alone when the user has moved on before the films load", async () => {
      mockApi([otherFilm()])
      const pending = deferred()
      mockClientGet.mockReturnValueOnce(pending.promise)
      await loadOtherFilms()

      const close = screen.getByRole("button", { name: "Close" })
      close.focus()
      await act(async () => pending.resolve(otherFilmsResponse([otherFilm()])))

      expect(close).toHaveFocus()
    })

    it("should offer to try again, keeping focus on the button, when the request fails", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      mockApi(new Error("502"))
      const { user } = await loadOtherFilms()

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't load other films",
      )
      const tryAgain = screen.getByRole("button", { name: "Try again" })
      expect(tryAgain).toHaveFocus()

      mockApi([otherFilm()])
      await user.click(tryAgain)

      expect(
        await within(otherFilmsSection()).findByRole("link", {
          name: "Aliens",
        }),
      ).toBeInTheDocument()
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(mockClientGet).toHaveBeenCalledTimes(2)
      consoleError.mockRestore()
    })

    it("should not request again when reopened for the same person", async () => {
      mockApi([otherFilm()])
      const { rerender } = await loadOtherFilms()
      await within(otherFilmsSection()).findByRole("link", { name: "Aliens" })

      rerender(renderModal(person, false))
      rerender(renderModal(person))

      expect(
        within(otherFilmsSection()).getByRole("link", { name: "Aliens" }),
      ).toBeInTheDocument()
      expect(mockClientGet).toHaveBeenCalledTimes(1)
    })

    it("should keep a late response with its own person after switching", async () => {
      const firstPerson = deferred()
      mockApi([otherFilm()])
      mockClientGet.mockImplementation((url: string) =>
        url === API_ENDPOINTS.tmdbPersonFilms("456")
          ? Promise.resolve(
              otherFilmsResponse([
                otherFilm({ tmdbId: "11", title: "Twister", year: 1996 }),
              ]),
            )
          : firstPerson.promise,
      )
      const { user, rerender } = await loadOtherFilms()

      rerender(renderModal(otherPerson))
      await act(async () =>
        firstPerson.resolve(otherFilmsResponse([otherFilm()])),
      )

      const loadButton = screen.getByRole("button", { name: LOAD_OTHER_FILMS })
      expect(loadButton).not.toHaveAttribute("aria-disabled", "true")
      await user.click(loadButton)
      expect(
        await within(otherFilmsSection()).findByRole("link", {
          name: "Twister",
        }),
      ).toBeInTheDocument()
      expect(
        within(otherFilmsSection()).queryByRole("link", { name: "Aliens" }),
      ).not.toBeInTheDocument()

      rerender(renderModal(person))
      expect(
        within(otherFilmsSection()).getByRole("link", { name: "Aliens" }),
      ).toBeInTheDocument()
      expect(requestsFor("123")).toHaveLength(1)
    })

    it('should add a film, mark it as in the collection and refresh "Your films"', async () => {
      let yourFilms = films
      mockApi([otherFilm()], { yourFilms: () => yourFilms })
      const { user } = await loadOtherFilms()
      yourFilms = [...films, { _id: "film3", title: "Aliens", year: 1986 }]

      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )

      expect(mockPost).toHaveBeenCalledWith(API_ENDPOINTS.createFilm, {
        tmdbId: "679",
      })
      expect(await screen.findByText("In collection")).toBeInTheDocument()
      expect(
        await within(yourFilmsSection()).findByText("Aliens"),
      ).toBeInTheDocument()
      expect(
        within(otherFilmsSection()).getByRole("link", { name: "Aliens" }),
      ).toBeInTheDocument()
    })

    it('should refresh "Your films" when the film already exists', async () => {
      let yourFilms = films
      mockApi([otherFilm()], { yourFilms: () => yourFilms })
      mockPost.mockRejectedValueOnce({ response: { status: 409 } })
      const { user } = await loadOtherFilms()
      yourFilms = [...films, { _id: "film3", title: "Aliens", year: 1986 }]

      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )

      expect(await screen.findByText("In collection")).toBeInTheDocument()
      expect(screen.queryByText("Could not add")).not.toBeInTheDocument()
      expect(
        await within(yourFilmsSection()).findByText("Aliens"),
      ).toBeInTheDocument()
    })

    it("should show an error on the row and keep Add when adding fails", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {})
      mockApi([otherFilm()])
      mockPost.mockRejectedValueOnce({ response: { status: 502 } })
      const { user } = await loadOtherFilms()

      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Could not add",
      )
      expect(
        screen.getByRole("button", { name: "Add Aliens (1986)" }),
      ).toBeEnabled()
      consoleError.mockRestore()
    })

    it("should disable Add while the film is being added", async () => {
      mockApi([otherFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const { user } = await loadOtherFilms()

      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )

      expect(
        screen.getByRole("button", { name: "Adding... Aliens (1986)" }),
      ).toBeDisabled()
      await act(async () => pending.resolve({}))
    })

    it("should mark a film added for one person as in the collection after switching", async () => {
      mockApi([otherFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const { user, rerender } = await loadOtherFilms()
      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )

      rerender(renderModal(otherPerson))
      await act(async () => pending.resolve({}))
      rerender(renderModal(person))

      expect(await screen.findByText("In collection")).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /^Add / }),
      ).not.toBeInTheDocument()
    })

    // Stands in for the parent page, which owns `isOpen` and closes the modal from `onClose`
    const ModalOnPage = ({ onFilmsAdded }: { onFilmsAdded: () => void }) => {
      const [isOpen, setIsOpen] = useState(true)
      return (
        <>
          <button onClick={() => setIsOpen(true)}>Open person</button>
          <PersonFilmsModal
            person={person}
            kind="actor"
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onFilmsAdded={onFilmsAdded}
          />
        </>
      )
    }

    const addAliensOnPage = async (onFilmsAdded: () => void) => {
      const user = userEvent.setup()
      const utils = render(<ModalOnPage onFilmsAdded={onFilmsAdded} />)
      await screen.findByText("Galaxy Quest")
      await user.click(screen.getByRole("button", { name: LOAD_OTHER_FILMS }))
      await user.click(
        await screen.findByRole("button", { name: "Add Aliens (1986)" }),
      )
      return { user, ...utils }
    }

    it("should tell the page behind that films were added once it closes, and only once", async () => {
      mockApi([otherFilm()])
      const onFilmsAdded = jest.fn()
      const { user } = await addAliensOnPage(onFilmsAdded)
      await screen.findByText("In collection")

      expect(onFilmsAdded).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Close" }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)

      await user.click(screen.getByRole("button", { name: "Open person" }))
      await user.click(await screen.findByRole("button", { name: "Close" }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it("should tell the page behind when closed by clicking the backdrop", async () => {
      mockApi([otherFilm()])
      const onFilmsAdded = jest.fn()
      const { user, container } = await addAliensOnPage(onFilmsAdded)
      await screen.findByText("In collection")

      await user.click(container.querySelector(".fixed.inset-0")!)

      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it("should tell the page behind when an add finishes after the modal closed", async () => {
      mockApi([otherFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const onFilmsAdded = jest.fn()
      const { user } = await addAliensOnPage(onFilmsAdded)

      await user.click(screen.getByRole("button", { name: "Close" }))
      expect(onFilmsAdded).not.toHaveBeenCalled()
      await act(async () => pending.resolve({}))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)

      await user.click(screen.getByRole("button", { name: "Open person" }))
      await user.click(await screen.findByRole("button", { name: "Close" }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it("should not tell the page behind about a film that already existed", async () => {
      mockApi([otherFilm()])
      mockPost.mockRejectedValueOnce({ response: { status: 409 } })
      const onFilmsAdded = jest.fn()
      const { user } = await addAliensOnPage(onFilmsAdded)
      await screen.findByText("In collection")

      await user.click(screen.getByRole("button", { name: "Close" }))

      expect(onFilmsAdded).not.toHaveBeenCalled()
    })
  })
})
