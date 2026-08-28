'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs';
import { Variation } from '../../types';
import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

const NAV_LINKS = [
  { href: '/artists', label: 'Artists' },
  { href: '/albums', label: 'Albums' },
  { href: '/top-albums', label: 'Top Albums' },
  { href: '/songs', label: 'Songs' },
  { href: '/years', label: 'Years' },
];

export const Navbar = () => {
  const { isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Publish the navbar's height so sticky table headers can sit below it.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const publishHeight = () => {
      document.documentElement.style.setProperty(
        '--app-nav-height',
        `${nav.offsetHeight}px`
      );
    };

    publishHeight();
    const observer = new ResizeObserver(publishHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu if the viewport grows to desktop width.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <nav
      ref={navRef}
      className="bg-white border-b border-neutral-200 sticky top-0 z-50"
    >
      <div className="layout-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="nav-brand flex items-center gap-2">
              {/* Music Note Icon */}
              <div className="relative">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-music-600"
                >
                  <path
                    d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    fill="currentColor"
                  />
                  <circle cx="10" cy="17" r="2" fill="currentColor" opacity="0.7" />
                </svg>
                {/* Animated sound wave */}
                <div className="absolute -right-1 -top-1 sound-wave opacity-60">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <span className="font-bold">Music DB</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="nav-link">
                {label}
              </Link>
            ))}
          </div>

          {/* Action Buttons & Auth */}
          <div className="hidden md:flex items-center space-x-2">
            {isSignedIn && (
              <>
                <NavItemWrapper
                  label="Add Artist"
                  action={{ type: 'add element', actionType: Variation.ARTIST }}
                />
                <NavItemWrapper
                  label="Add Album"
                  action={{ type: 'add element', actionType: Variation.ALBUM }}
                />
                <NavItemWrapper
                  label="Add Song"
                  action={{ type: 'add element', actionType: Variation.SONG }}
                />
              </>
            )}

            {/* Auth Buttons */}
            {isSignedIn ? (
              <div className="flex items-center gap-3 ml-2 pl-2 border-l border-neutral-200">
                <span className="text-sm text-neutral-600">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <SignOutButton>
                  <button className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-sm font-medium transition-colors">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 bg-music-600 hover:bg-music-700 text-white rounded text-sm font-medium transition-colors ml-2">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-neutral-200 py-3 space-y-1"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block w-full px-3 py-3 text-base font-medium text-neutral-700 rounded-md hover:text-music-600 hover:bg-neutral-50 transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-neutral-200">
              {isSignedIn ? (
                <div className="flex items-center justify-between gap-3 px-3">
                  <span className="text-sm text-neutral-600 truncate">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <SignOutButton>
                    <button className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-sm font-medium transition-colors shrink-0">
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              ) : (
                <div className="px-3">
                  <SignInButton mode="modal">
                    <button className="w-full px-3 py-2 bg-music-600 hover:bg-music-700 text-white rounded text-sm font-medium transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
