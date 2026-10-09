import { render, screen } from '@testing-library/react'
import ActorsPage from './actors/page'
import DirectorsPage from './directors/page'

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

describe.each([
  ['DirectorsPage', DirectorsPage, 'Directors', 'Search directors'],
  ['ActorsPage', ActorsPage, 'Actors', 'Search actors'],
] as const)('%s', (_name, Page, title, placeholder) => {
  it(`should show the ${title.toLowerCase()} rankings when signed in`, () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true })

    render(<Page />)

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
  })

  it('should ask for sign-in when signed out', () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false })

    render(<Page />)

    expect(screen.getByRole('heading', { name: 'Sign In Required' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: title })).not.toBeInTheDocument()
  })
})
