'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/films', label: 'Films' },
    { href: '/directors', label: 'Directors' },
    { href: '/years', label: 'Years' },
    { href: '/random', label: 'Random' },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-film-500">
              Film Ratings
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-film-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <span className="text-sm text-gray-400">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <SignOutButton>
                  <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors">
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded text-sm font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-film-700 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-800 flex flex-col space-y-2">
                {isSignedIn ? (
                  <>
                    <span className="px-3 text-sm text-gray-400">
                      {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                    </span>
                    <SignOutButton>
                      <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors text-left">
                        Sign Out
                      </button>
                    </SignOutButton>
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded text-sm font-medium transition-colors text-left">
                      Sign In
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
