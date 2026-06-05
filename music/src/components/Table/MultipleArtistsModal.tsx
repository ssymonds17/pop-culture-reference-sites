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
    <div className="popover -top-2 w-full min-w-48">
      <div className="popover-content">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
            Artists
          </span>
          <button
            className="modal-close text-neutral-400 hover:text-neutral-600"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {isFetchingArtists ? (
          <div className="modal-loading py-4">
            <div className="modal-spinner"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {artists.map((artist) => (
              <Link
                key={artist._id}
                href={`/artist?id=${artist._id}`}
                className="popover-item"
                onClick={onClose}
              >
                {artist.displayName}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
