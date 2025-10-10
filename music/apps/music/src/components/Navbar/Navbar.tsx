import Link from 'next/link';
import { Variation } from '../../types';
import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

export const Navbar = () => {
  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="layout-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="nav-brand">
              Music DB
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

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
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
