'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { API_URL } from '../../constants';
import { MedalRating, SongsTable } from '../../components';
import { AlbumFull, Rating } from '../../types';

const AlbumPage = () => {
  const [album, setAlbum] = useState<AlbumFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedalLoading, setIsMedalLoading] = useState(false);
  const params = useSearchParams();
  const albumId = params.get('id');
  const router = useRouter();

  if (!albumId) {
    router.replace('/albums');
  }

  const fetchAlbum = async (albumId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/album/${albumId}`);
      setAlbum(response.data.album);
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlbumRating = async (albumId: string, newRating: Rating) => {
    console.log('updating album rating to:', newRating);
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
    <div className="m-4">
      <h1 className="text-2xl font-semibold text-center mt-4">
        {isLoading ? <Skeleton width={300} /> : album?.displayTitle}
      </h1>
      <p className="text-center mt-2">
        {isLoading ? <Skeleton width={200} /> : `Year: ${album?.year}`}
      </p>
      <p className="text-center mt-2">
        {isLoading ? (
          <Skeleton width={200} />
        ) : (
          `Artist: ${album?.artistDisplayName}`
        )}
      </p>
      <p className="text-center mt-2">
        {isLoading ? (
          <Skeleton width={200} />
        ) : (
          `Total Songs: ${album?.songs.length}`
        )}
      </p>
      <p className="flex justify-center text-center mt-2">
        {isLoading ? (
          <Skeleton width={200} />
        ) : (
          <div className="flex">
            {isMedalLoading ? (
              <div className="flex justify-between w-12">
                <Skeleton width={18} height={18} circle />
                <Skeleton width={18} height={18} circle />
              </div>
            ) : (
              <>
                <MedalRating
                  albumId={album?._id ?? ''}
                  albumRating={album?.rating ?? Rating.NONE}
                  medalRating={Rating.GOLD}
                  handleOnClick={updateAlbumRating}
                />
                <MedalRating
                  albumId={album?._id ?? ''}
                  albumRating={album?.rating ?? Rating.NONE}
                  medalRating={Rating.SILVER}
                  handleOnClick={
                    album?.rating === Rating.SILVER && album?.songs?.length >= 6
                      ? undefined
                      : updateAlbumRating
                  }
                />
              </>
            )}
          </div>
        )}
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
        isLoading={isLoading}
      />
    </div>
  );
};

export default AlbumPage;
