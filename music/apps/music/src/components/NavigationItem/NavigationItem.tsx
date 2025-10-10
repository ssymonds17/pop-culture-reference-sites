import Link from 'next/link';

type NavigationItemProps = {
  label: string;
  url: string;
};

export const NavigationItem = ({ label, url }: NavigationItemProps) => {
  return (
    <Link
      href={`/${url}`}
      className="nav-link"
    >
      {label}
    </Link>
  );
};
