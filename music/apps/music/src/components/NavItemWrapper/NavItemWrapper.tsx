'use client';
import { NavigationItem } from '../NavigationItem';

type NavigationAction = {
  type: 'navigation';
  url: string;
};

type AddItemAction = {
  type: 'add item';
  actionType: 'artist' | 'album' | 'song';
};

type Action = NavigationAction | AddItemAction;

type NavItemProps = {
  label: string;
  action: Action;
};

export const NavItemWrapper = ({ label, action }: NavItemProps) => {
  const handleClick = () => {
    if (action.type === 'add item') {
      console.log('actionType', action.actionType);
    }
  };

  return (
    <li className="p-2 m-2 border-2">
      {action.type === 'navigation' && (
        <NavigationItem label={label} url={action.url} />
      )}
      {action.type === 'add item' && (
        <button type="button" onClick={handleClick}>
          {label}
        </button>
      )}
    </li>
  );
};
