'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '../../constants';
import { AlbumsTable } from '../../components';
import { ArtistFull } from '../../types';

const ArtistPage = () => {
  const [artist, setArtist] = useState<ArtistFull | null>(null);
  const params = useSearchParams();
  const artistId = params.get('id');
  const router = useRouter();

  if (!artistId) {
    router.replace('/artists');
  }

  const fetchArtist = async (artistId: string) => {
    try {
      const response = await axios.get(`${API_URL}/artist/${artistId}`);
      setArtist(response.data.artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
    }
  };

  useEffect(() => {
    if (artistId) {
      fetchArtist(artistId);
    }
  }, [artistId]);

  console.log('Artist:', artist);

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Artist Page
      </h1>

      <AlbumsTable
        albums={artist ? artist.albums.toSorted((a, b) => a.year - b.year) : []}
      />
    </div>
  );
};

export default ArtistPage;
