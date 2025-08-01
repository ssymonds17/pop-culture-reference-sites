'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '../../constants';
import { AlbumsTable, SongsTable } from '../../components';
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

  return (
    <div className="m-4">
      <h1 className="text-2xl font-semibold text-center mt-4">
        {artist ? artist.displayName : 'Loading...'}
      </h1>
      <p className="text-center mt-2">
        Total Score: {artist ? artist.totalScore : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Total Songs: {artist ? artist.totalSongs : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Gold Albums: {artist ? artist.goldAlbums : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Silver Albums: {artist ? artist.silverAlbums : 'Loading...'}
      </p>
      <h2 className="text-2xl font-semibold mt-6">Albums</h2>
      <AlbumsTable
        albums={artist ? artist.albums.toSorted((a, b) => a.year - b.year) : []}
      />

      <h2 className="text-2xl font-semibold mt-6">Songs</h2>
      <SongsTable
        songs={
          artist
            ? artist.songs
                .toSorted((a, b) => a.title.localeCompare(b.title))
                .toSorted((a, b) => a.year - b.year)
            : []
        }
      />
    </div>
  );
};

export default ArtistPage;
