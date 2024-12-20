'use client';
import { AddElementItem } from '../AddElementItem';
import { NavigationItem } from '../NavigationItem';

type NavigationAction = {
  type: 'navigation';
  url: string;
};

type AddElementAction = {
  type: 'add element';
  actionType: 'artist' | 'album' | 'song';
};

type NavItemProps = {
  label: string;
  action: NavigationAction | AddElementAction;
};

export const NavItemWrapper = ({ label, action }: NavItemProps) => (
  <li className="p-2 m-2 border-2">
    {action.type === 'navigation' && (
      <NavigationItem label={label} url={action.url} />
    )}
    {action.type === 'add element' && (
      <AddElementItem label={label} actionType={action.actionType} />
    )}
  </li>
);
