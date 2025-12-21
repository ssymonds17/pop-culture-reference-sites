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
      <Link href={`/artist?id=${artists[0]}`} className="btn-link-sm">
        {artistDisplayName}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 text-left text-music-600 hover:text-music-700 hover:underline cursor-pointer"
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
