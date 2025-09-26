import Link from 'next/link';
import { Album, Rating } from '../../types';
import { SkeletonTable } from './Skeleton';
import { Medal } from '../Rating';

const displayRating = (rating: Rating) => {
  switch (rating) {
    case Rating.GOLD:
      return <Medal albumId="" medalRating={Rating.GOLD} active />;
    case Rating.SILVER:
      return <Medal albumId="" medalRating={Rating.SILVER} active />;
    default:
      return <Medal albumId="" medalRating={Rating.NONE} active={false} />;
  }
};

export const AlbumsTable = ({
  albums,
  isLoading,
}: {
  albums: Album[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <SkeletonTable cols={4} />;
  }

  return (
    <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          <th className="border border-gray-300">Rating</th>
          <th className="border border-gray-300">Year</th>
          <th className="border border-gray-300">Title</th>
          <th className="border border-gray-300 text-center">Artist</th>
        </tr>
      </thead>

      <tbody>
        {albums.length ? (
          albums.map((album: Album) => (
            <tr key={album._id}>
              <td className="border border-gray-300 text-center">
                {displayRating(album.rating)}
              </td>
              <td className="border border-gray-300 text-center">
                {album.year}
              </td>
              <td className="border border-gray-300 text-center">
                <Link
                  href={`/album?id=${album._id}`}
                  className="text-blue-500 hover:underline"
                >
                  {album.displayTitle}
                </Link>
              </td>
              <td className="border border-gray-300 text-center">
                {album.artistDisplayName === 'Various Artists' ? (
                  album.artistDisplayName
                ) : (
                  <Link
                    href={`/artist?id=${album.artists[0]}`}
                    className="text-blue-500 hover:underline"
                  >
                    {album.artistDisplayName}
                  </Link>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="border border-gray-300 text-center">
              No albums found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
