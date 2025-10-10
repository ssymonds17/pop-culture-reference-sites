'use client';

import { useEffect, useState } from 'react';
import { Artist } from '../../types';
import axios from 'axios';
import { API_URL } from '../../constants';
import Link from 'next/link';

type MultipleArtistsModalProps = {
  artistIds: string[];
  isOpen: boolean;
  onClose: () => void;
};

export const MultipleArtistsModal = ({
  artistIds,
  isOpen,
  onClose,
}: MultipleArtistsModalProps) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);

  const fetchArtist = async (artistId: string): Promise<Artist | undefined> => {
    try {
      const response = await axios.get(`${API_URL}/artist/${artistId}`);
      return response.data.artist;
    } catch (error) {
      console.error('Error fetching artist:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || artists.length) return;

    const fetchArtists = async () => {
      setIsFetchingArtists(true);

      for (const id of artistIds) {
        const fetchedArtist = await fetchArtist(id);
        if (fetchedArtist) {
          setArtists((prevArtists) => [...prevArtists, fetchedArtist]);
        }
      }

      setIsFetchingArtists(false);
    };

    fetchArtists();
  }, [isOpen, artists, artistIds]);

  if (!isOpen) return false;

  return (
    <div
      id="#multiple-artist-modal"
      className="absolute -top-10 w-full color-blue-500 p-2 bg-white border-2 z-10 rounded-sm"
    >
      <button
        className="btn-icon-sm btn-ghost mb-1"
        onClick={onClose}
      >
        ×
      </button>
      <div className=" w-full flex flex-col">
        {isFetchingArtists ? (
          <div>Loading...</div>
        ) : (
          <>
            {artists.map((artist) => (
              <Link
                key={artist._id}
                href={`/artist?id=${artist._id}`}
                className="btn-link-sm"
                onClick={onClose}
              >
                {artist.displayName}
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
