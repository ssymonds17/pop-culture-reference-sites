import { NavItem } from '../NavItem/NavItem';

export const Navbar = () => {
  return (
    <nav>
      <ul className="flex justify-center">
        <li className="p-2 m-2 border-2">Add Artist</li>
        <li className="p-2 m-2 border-2">Add Album</li>
        <li className="p-2 m-2 border-2">Add Song</li>
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
