'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '../../constants';
import { SongsTable } from '../../components';
import { AlbumFull } from '../../types';

const AlbumPage = () => {
  const [album, setAlbum] = useState<AlbumFull | null>(null);
  const params = useSearchParams();
  const albumId = params.get('id');
  const router = useRouter();

  if (!albumId) {
    router.replace('/albums');
  }

  const fetchAlbum = async (albumId: string) => {
    try {
      const response = await axios.get(`${API_URL}/album/${albumId}`);
      setAlbum(response.data.album);
    } catch (error) {
      console.error('Error fetching album:', error);
    }
  };

  useEffect(() => {
    if (albumId) {
      fetchAlbum(albumId);
    }
  }, [albumId]);

  return (
    <div className="m-4">
      <h1 className="text-2xl font-semibold text-center mt-4">
        {album ? album.displayTitle : 'Loading...'}
      </h1>
      <p className="text-center mt-2">
        Year: {album ? album.year : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Artist: {album ? album.artistDisplayName : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Total Songs: {album ? album.songs.length : 'Loading...'}
      </p>
      <p className="text-center mt-2">
        Rating: {album ? album.rating : 'Loading...'}
      </p>
      <h2 className="text-2xl font-semibold mt-6">Songs</h2>
      <SongsTable
        songs={
          album
            ? album.songs
                .toSorted((a, b) => a.title.localeCompare(b.title))
                .toSorted((a, b) => a.year - b.year)
            : []
        }
      />
    </div>
  );
};

export default AlbumPage;
