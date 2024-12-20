import Link from 'next/link';

type NavigationAction = {
  type: 'navigation';
  url: string;
};

type AddItemAction = {
  type: 'add item';
  actionType: 'artist' | 'album' | 'song';
};

export type Action = NavigationAction | AddItemAction;

type NavItemProps = {
  label: string;
  action: Action;
};

export const NavItem = ({ label, action }: NavItemProps) => {
  const handleClick = () => {
    console.log('actionType');
  };

  if (action.type === 'navigation') {
    return (
      <li className="p-2 m-2 border-2">
        <Link href={`/${action.url}`} className="underline">
          {label}
        </Link>
      </li>
    );
  }

  return (
    <li className="p-2 m-2 border-2">
      <button type="button" onClick={handleClick}>
        {label}
      </button>
      {label}
    </li>
  );
};
