'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useMusicContext } from '@music/shared-state';

import { useSearchParams, useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { API_URL } from '../../constants';
import { AlbumBlock, SongBlock } from '../../components';
import { ArtistFull } from '../../types';

const ArtistPage = () => {
  const { state, dispatch } = useMusicContext();
  const [artist, setArtist] = useState<ArtistFull | null>(null);
  const [isFetchingArtist, setIsFetchingArtist] = useState(true);
  const params = useSearchParams();
  const artistId = params.get('id');
  const router = useRouter();

  useEffect(() => {
    if (state.dataRefreshRequired && artistId) {
      fetchArtist(artistId);
      dispatch({ type: 'SET_DATA_REFRESH_REQUIRED', payload: false });
    }
  }, [state.dataRefreshRequired, artistId, dispatch]);

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
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">
            {isFetchingArtist ? <Skeleton width={300} /> : artist?.displayName}
          </h1>
          <div className="component-spacing-sm space-y-1">
            <p className="text-sm text-neutral-500 font-medium">
              {isFetchingArtist ? (
                <Skeleton width={200} />
              ) : (
                `Total Score: ${artist?.totalScore}`
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {isFetchingArtist ? (
                <Skeleton width={150} />
              ) : (
                `Total Songs: ${artist?.totalSongs}`
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {isFetchingArtist ? (
                <Skeleton width={150} />
              ) : (
                `Gold Albums: ${artist?.goldAlbums}`
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {isFetchingArtist ? (
                <Skeleton width={150} />
              ) : (
                `Silver Albums: ${artist?.silverAlbums}`
              )}
            </p>
          </div>
        </div>

        <div className="layout-content">
          <AlbumBlock
            artist={artist}
            albums={artist ? artist.albums : []}
            isLoading={isFetchingArtist}
          />
          <SongBlock
            defaultValues={
              artist
                ? {
                    artists: [artist._id],
                    artistDisplayName: artist.displayName,
                    album: undefined,
                  }
                : {}
            }
            songs={artist ? artist.songs : []}
            isLoading={isFetchingArtist}
          />
        </div>
      </section>
    </div>
  );
};

export default ArtistPage;
