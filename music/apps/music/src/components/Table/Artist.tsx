import Link from 'next/link';
import { Artist } from '../../types';
import { SkeletonTable } from './Skeleton';

export const ArtistsTable = ({
  artists,
  isLoading,
  isRanked = false,
}: {
  artists: Artist[];
  isLoading: boolean;
  isRanked?: boolean;
}) => {
  if (isLoading) {
    return <SkeletonTable cols={5} />;
  }

  return (
    <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          {isRanked && <th className="border border-gray-300">Rank</th>}
          <th className="border border-gray-300">Name</th>
          <th className="border border-gray-300 text-center">Gold Albums</th>
          <th className="border border-gray-300 text-center">Silver Albums</th>
          <th className="border border-gray-300 text-center">Total Songs</th>
          <th className="border border-gray-300 text-center">Total Score</th>
        </tr>
      </thead>

      <tbody>
        {artists.length ? (
          artists.map((artist: Artist, index: number) => (
            <tr key={artist._id}>
              {isRanked && (
                <td className="border border-gray-300 text-center">
                  {index + 1}
                </td>
              )}
              <td className="border border-gray-300 text-center">
                <Link
                  href={`/artist?id=${artist._id}`}
                  className="btn-link-sm"
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
