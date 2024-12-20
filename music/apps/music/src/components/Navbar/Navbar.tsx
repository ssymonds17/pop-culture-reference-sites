import { NavItem } from '../NavItem/NavItem';

export const Navbar = () => {
  return (
    <nav>
      <ul className="flex justify-center">
        <NavItem
          label="Add Artists"
          action={{ type: 'add item', actionType: 'artist' }}
        />
        <NavItem
          label="Add Albums"
          action={{ type: 'add item', actionType: 'album' }}
        />
        <NavItem
          label="Add Songs"
          action={{ type: 'add item', actionType: 'song' }}
        />
        <NavItem
          label="View Artists"
          action={{ type: 'navigation', url: 'artists' }}
        />
        <NavItem
          label="View Albums"
          action={{ type: 'navigation', url: 'albums' }}
        />
        <NavItem
          label="View Songs"
          action={{ type: 'navigation', url: 'songs' }}
        />
      </ul>
    </nav>
  );
};
