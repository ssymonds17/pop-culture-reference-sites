'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { API_URL } from '../../constants';
import { AlbumsTable, SongsTable } from '../../components';
import { ArtistFull } from '../../types';

const ArtistPage = () => {
  const [artist, setArtist] = useState<ArtistFull | null>(null);
  const [isFetchingArtist, setIsFetchingArtist] = useState(true);
  const params = useSearchParams();
  const artistId = params.get('id');
  const router = useRouter();

  if (!artistId) {
    router.replace('/artists');
  }

  const fetchArtist = async (artistId: string) => {
    try {
      setIsFetchingArtist(true);
      const response = await axios.get(`${API_URL}/artist/${artistId}`);
      setArtist(response.data.artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
    } finally {
      setIsFetchingArtist(false);
    }
  };

  useEffect(() => {
    if (artistId) {
      fetchArtist(artistId);
    }
  }, [artistId]);

  if (!isFetchingArtist && !artist) {
    return <div>Artist not found</div>;
  }

  return (
    <div className="m-4">
      <h1 className="text-2xl font-semibold text-center mt-4">
        {isFetchingArtist ? <Skeleton width={300} /> : artist?.displayName}
      </h1>
      <p className="text-center mt-2">
        {isFetchingArtist ? (
          <Skeleton width={200} />
        ) : (
          `Total Score: ${artist?.totalScore}`
        )}
      </p>
      <p className="text-center mt-2">
        {isFetchingArtist ? (
          <Skeleton width={150} />
        ) : (
          `Total Songs: ${artist?.totalSongs}`
        )}
      </p>
      <p className="text-center mt-2">
        {isFetchingArtist ? (
          <Skeleton width={150} />
        ) : (
          `Gold Albums: ${artist?.goldAlbums}`
        )}
      </p>
      <p className="text-center mt-2">
        {isFetchingArtist ? (
          <Skeleton width={150} />
        ) : (
          `Silver Albums: ${artist?.silverAlbums}`
        )}
      </p>
      <div className="flex">
        <h2 className="text-2xl font-semibold mt-6">Albums</h2>
        <div className="flex-col marginitems-center justify-center mt-6 ml-2">
          <button
            className="flex flex-col marginitems-center justify-center border-2 w-7 h-7 rounded-full bg-blue-500 text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors duration-200 ml-2 hover:pointer"
            type="button"
          >
            +
          </button>
        </div>
      </div>
      <AlbumsTable
        albums={artist ? artist.albums : []}
        isLoading={isFetchingArtist}
      />
      <h2 className="text-2xl font-semibold mt-6">Songs</h2>
      <SongsTable
        songs={artist ? artist.songs : []}
        isLoading={isFetchingArtist}
      />
    </div>
  );
};

export default ArtistPage;
