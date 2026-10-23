import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import YearsPage from './years/page'
import { API_ENDPOINTS } from '@/lib/api'
import { YearStats } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
const mockUseUser = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
// Each year becomes a button that clicks the chart at that year, as a real chart click would
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({
    data,
    onClick,
  }: {
    data: Array<{ year: number }>
    onClick: (state: { activeLabel: number }) => void
  }) => (
    <div>
      {data.map((entry) => (
        <button key={entry.year} onClick={() => onClick({ activeLabel: entry.year })}>
          Chart {entry.year}
        </button>
      ))}
    </div>
  ),
  Bar: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))
jest.mock('@/components/Years/YearDetails', () => ({
  __esModule: true,
  default: ({ yearStats, onFilmUpdated }: { yearStats: YearStats; onFilmUpdated?: () => void }) => (
    <div>
      <p>
        {yearStats.year} score {yearStats.yearScore}
      </p>
      <button onClick={onFilmUpdated}>Edit a film</button>
    </div>
  ),
}))

const mockAxiosGet = axios.get as jest.Mock

const year = (yearNumber: number, yearScore: number) => ({ _id: `year${yearNumber}`, year: yearNumber, yearScore })

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('YearsPage', () => {
  const scrollIntoView = jest.fn()

  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosGet.mockReset()
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true })
  })

  it('should ask visitors to sign in without loading anything', () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false })

    render(<YearsPage />)

    expect(screen.getByRole('heading', { name: 'Sign In Required' })).toBeInTheDocument()
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it("should refresh the open year's stats after a film is edited, without scrolling again", async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce({ data: { data: [year(1979, 6), year(1986, 7)] } })
    render(<YearsPage />)
    await user.click(await screen.findByRole('button', { name: 'Chart 1979' }))
    expect(screen.getByText('1979 score 6')).toBeInTheDocument()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    mockAxiosGet.mockResolvedValueOnce({ data: { data: [year(1979, 8), year(1986, 7)] } })

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(await screen.findByText('1979 score 8')).toBeInTheDocument()
    expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.years)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('should keep the latest stats when an earlier refresh lands late', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce({ data: { data: [year(1979, 6)] } })
    render(<YearsPage />)
    await user.click(await screen.findByRole('button', { name: 'Chart 1979' }))
    const first = deferred()
    const second = deferred()
    mockAxiosGet.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    await act(async () => second.resolve({ data: { data: [year(1979, 9)] } }))
    await act(async () => first.resolve({ data: { data: [year(1979, 8)] } }))

    expect(screen.getByText('1979 score 9')).toBeInTheDocument()
  })
})
