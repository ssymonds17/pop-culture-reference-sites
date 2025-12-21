'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useMusicContext } from '@music/shared-state';
import { API_URL } from '../../constants';
import { SongBlock } from '../../components';
import { RatingSelector, RatingBadge } from '../../components/Rating';
import { AlbumFull, Rating } from '../../types';
import { ArtistLink } from '../../components/Table/ArtistsLink';
import { useScrollToTop } from '../../utils';

const AlbumPage = () => {
  const { state, dispatch } = useMusicContext();
  const [album, setAlbum] = useState<AlbumFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedalLoading, setIsMedalLoading] = useState(false);
  const params = useSearchParams();
  const albumId = params.get('id');
  const router = useRouter();
  useScrollToTop();

  useEffect(() => {
    if (state.dataRefreshRequired && albumId) {
      fetchAlbum(albumId, false);
      dispatch({ type: 'SET_DATA_REFRESH_REQUIRED', payload: false });
    }
  }, [state.dataRefreshRequired, albumId, dispatch]);

  if (!albumId) {
    router.replace('/albums');
  }

  const fetchAlbum = async (albumId: string, isHardLoad = true) => {
    try {
      if (isHardLoad) setIsLoading(true);

      const response = await axios.get(`${API_URL}/album/${albumId}`);
      setAlbum(response.data.album);
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlbumRating = async (albumId: string, newRating: Rating) => {
    try {
      setIsMedalLoading(true);
      await axios.put(`${API_URL}/album/${albumId}/rating`, {
        rating: newRating,
      });
      fetchAlbum(albumId);
    } catch (error) {
      console.error('Error updating album rating:', error);
    } finally {
      setIsMedalLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) {
      fetchAlbum(albumId);
    }
  }, [albumId]);

  if (!isLoading && !album) {
    return <div>Album not found</div>;
  }

  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">
            {isLoading ? <Skeleton width={300} /> : album?.displayTitle}
          </h1>
          <div className="component-spacing-sm space-y-1">
            <p className="text-sm text-neutral-500">
              {isLoading ? <Skeleton width={200} /> : `Year: ${album?.year}`}
            </p>
            <p className="text-sm text-neutral-500">
              {isLoading ? (
                <Skeleton width={200} />
              ) : (
                <span>
                  Artist:{' '}
                  <ArtistLink
                    artists={album?.artists ?? []}
                    artistDisplayName={album?.artistDisplayName ?? ''}
                  />
                </span>
              )}
            </p>
            <p className="text-sm text-neutral-500">
              {isLoading ? (
                <Skeleton width={200} />
              ) : (
                `Total Songs: ${album?.songs.length}`
              )}
            </p>
          </div>
          <div className="layout-flex-center mt-component-md">
            {isLoading ? (
              <Skeleton width={200} height={50} />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-600">
                    Album Rating:
                  </span>
                  <RatingBadge
                    rating={album?.rating ?? Rating.NONE}
                    size="lg"
                  />
                </div>
                {isMedalLoading ? (
                  <div className="flex justify-center">
                    <div className="modal-spinner"></div>
                  </div>
                ) : (
                  <RatingSelector
                    currentRating={album?.rating ?? Rating.NONE}
                    onChange={(newRating) =>
                      updateAlbumRating(album?._id ?? '', newRating)
                    }
                    size="lg"
                    disabled={isMedalLoading}
                    showLabels={true}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="layout-content">
          <SongBlock
            defaultValues={{
              album: album?._id,
              artists: album?.artists,
              artistDisplayName: album?.artistDisplayName,
              albumDisplayTitle: album?.displayTitle,
              year: album?.year,
            }}
            songs={
              album
                ? album.songs
                    .toSorted((a, b) => a.title.localeCompare(b.title))
                    .toSorted((a, b) => a.year - b.year)
                : []
            }
            isLoading={isLoading}
          />
        </div>
      </section>
    </div>
  );
};

export default AlbumPage;
