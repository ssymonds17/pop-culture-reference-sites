'use client';

import Link from 'next/link';
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs';
import { Variation } from '../../types';
import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

export const Navbar = () => {
  const { isSignedIn, user } = useUser();
  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
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
            <Link href="/artists" className="nav-link">
              Artists
            </Link>
            <Link href="/albums" className="nav-link">
              Albums
            </Link>
            <Link href="/songs" className="nav-link">
              Songs
            </Link>
            <Link href="/years" className="nav-link">
              Years
            </Link>
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

          {/* Mobile Menu Toggle (placeholder for future mobile menu) */}
          <div className="md:hidden">
            <button className="nav-mobile-toggle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
