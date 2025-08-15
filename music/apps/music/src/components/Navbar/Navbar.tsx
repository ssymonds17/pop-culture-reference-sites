import { Variation } from '../../types';
import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

export const Navbar = () => {
  return (
    <nav>
      <ul className="flex justify-center">
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
        <NavItemWrapper
          label="View Artists"
          action={{ type: 'navigation', url: 'artists' }}
        />
        <NavItemWrapper
          label="View Albums"
          action={{ type: 'navigation', url: 'albums' }}
        />
        <NavItemWrapper
          label="View Songs"
          action={{ type: 'navigation', url: 'songs' }}
        />
        <NavItemWrapper
          label="View Years"
          action={{ type: 'navigation', url: 'years' }}
        />
      </ul>
    </nav>
  );
};
