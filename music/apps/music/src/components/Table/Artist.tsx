import Link from 'next/link';
import { Artist } from '../../types';
import { SkeletonTable } from './Skeleton';

export const ArtistsTable = ({
  artists,
  isLoading,
}: {
  artists: Artist[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <SkeletonTable cols={5} />;
  }

  return (
    <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          <th className="border border-gray-300">Name</th>
          <th className="border border-gray-300 text-center">Gold Albums</th>
          <th className="border border-gray-300 text-center">Silver Albums</th>
          <th className="border border-gray-300 text-center">Total Songs</th>
          <th className="border border-gray-300 text-center">Total Score</th>
        </tr>
      </thead>

      <tbody>
        {artists.length ? (
          artists.map((artist: Artist) => (
            <tr key={artist._id}>
              <td className="border border-gray-300 text-center">
                <Link
                  href={`/artist?id=${artist._id}`}
                  className="text-blue-500 hover:underline"
                >
                  {artist.displayName}
                </Link>
              </td>
              <td className="border border-gray-300 text-center">
                {artist.goldAlbums}
              </td>
              <td className="border border-gray-300 text-center">
                {artist.silverAlbums}
              </td>
              <td className="border border-gray-300 text-center">
                {artist.totalSongs}
              </td>
              <td className="border border-gray-300 text-center">
                {artist.totalScore}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="border border-gray-300 text-center">
              No artists found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
