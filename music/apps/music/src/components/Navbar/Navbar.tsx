import { NavItemWrapper } from '../NavItemWrapper/NavItemWrapper';

export const Navbar = () => {
  return (
    <nav>
      <ul className="flex justify-center">
        <NavItemWrapper
          label="Add Artists"
          action={{ type: 'add element', actionType: 'artists' }}
        />
        <NavItemWrapper
          label="Add Albums"
          action={{ type: 'add element', actionType: 'albums' }}
        />
        <NavItemWrapper
          label="Add Songs"
          action={{ type: 'add element', actionType: 'songs' }}
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
