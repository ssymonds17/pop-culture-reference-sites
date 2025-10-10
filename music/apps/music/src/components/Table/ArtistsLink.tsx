'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MultipleArtistsModal } from './MultipleArtistsModal';

export const ArtistLink = ({
  artists,
  artistDisplayName,
}: {
  artists: string[];
  artistDisplayName: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (artistDisplayName === 'Various Artists') {
    return <span>{artistDisplayName}</span>;
  }

  if (artists.length === 1) {
    return (
      <Link
        href={`/artist?id=${artists[0]}`}
        className="btn-link-sm"
      >
        {artistDisplayName}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="btn-link-sm"
      >
        {artistDisplayName}
      </button>
      <MultipleArtistsModal
        artistIds={artists}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};
