import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

export const Navbar = () => {
  return (
    <nav>
      <ul className="flex justify-center">
        <NavItemWrapper
          label="Add Artists"
          action={{ type: 'add item', actionType: 'artist' }}
        />
        <NavItemWrapper
          label="Add Albums"
          action={{ type: 'add item', actionType: 'album' }}
        />
        <NavItemWrapper
          label="Add Songs"
          action={{ type: 'add item', actionType: 'song' }}
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
      </ul>
    </nav>
  );
};
