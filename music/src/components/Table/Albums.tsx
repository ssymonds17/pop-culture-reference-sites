'use client';

import Link from 'next/link';
import { Album, Rating } from '../../types';
import { SkeletonTable } from './Skeleton';
import { RatingIcon, SongProgressBadge } from '../Rating';
import { ArtistLink } from './ArtistsLink';

const displayRating = (rating: Rating) => {
  return <RatingIcon rating={rating} size="md" />;
};

export const AlbumsTable = ({
  albums,
  isLoading,
}: {
  albums: Album[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <SkeletonTable cols={5} />;
  }

  return (
    <div className="table-modern mt-6">
      <table>
        <thead>
          <tr>
            <th className="text-center">Rating</th>
            <th className="text-center">Year</th>
            <th className="text-center">Songs</th>
            <th>Title</th>
            <th>Artist</th>
          </tr>
        </thead>

        <tbody>
          {albums.length ? (
            albums.map((album: Album) => (
              <tr key={album._id}>
                <td className="text-center">
                  {displayRating(album.rating)}
                </td>
                <td className="text-center table-number">
                  {album.year}
                </td>
                <td className="text-center">
                  <SongProgressBadge
                    currentSongs={album.songs.length}
                    totalSongs={album.totalSongs}
                    size="sm"
                  />
                </td>
                <td className="font-medium">
                  <Link
                    href={`/album?id=${album._id}`}
                    className="table-link"
                  >
                    {album.displayTitle}
                  </Link>
                </td>
                <td>
                  <ArtistLink
                    artists={album.artists}
                    artistDisplayName={album.artistDisplayName}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="table-empty">
                No albums found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
