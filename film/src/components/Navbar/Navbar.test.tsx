import { render, screen } from '@testing-library/react'
import Navbar from './Navbar'

jest.mock('next/navigation', () => ({
  usePathname: () => '/actors',
}))
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignOutButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Navbar', () => {
  it('should link to the actors page next to the directors page', () => {
    render(<Navbar />)

    const labels = screen.getAllByRole('link').map((link) => link.textContent)
    expect(labels).toContain('Directors')
    const directorsIndex = labels.indexOf('Directors')
    expect(labels[directorsIndex + 1]).toBe('Actors')
    expect(screen.getAllByRole('link', { name: 'Actors' })[0]).toHaveAttribute('href', '/actors')
  })

  it('should highlight the current page', () => {
    render(<Navbar />)

    expect(screen.getAllByRole('link', { name: 'Actors' })[0]).toHaveClass('bg-film-700')
  })
})
