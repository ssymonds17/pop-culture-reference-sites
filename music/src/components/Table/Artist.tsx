import Link from 'next/link';
import { Artist } from '../../types';
import { SkeletonTable } from './Skeleton';
import { ScoreBadge } from '../Rating';

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
    <div className="table-modern mt-6">
      <table>
        <thead>
          <tr>
            {isRanked && <th className="text-center">Rank</th>}
            <th>Name</th>
            <th className="text-center">Gold Albums</th>
            <th className="text-center">Silver Albums</th>
            <th className="text-center">Total Songs</th>
            <th className="text-center">Total Score</th>
          </tr>
        </thead>

        <tbody>
          {artists.length ? (
            artists.map((artist: Artist, index: number) => (
              <tr key={artist._id}>
                {isRanked && (
                  <td className="text-center table-rank">
                    {index + 1}
                  </td>
                )}
                <td className="font-medium">
                  <Link
                    href={`/artist?id=${artist._id}`}
                    className="table-link"
                  >
                    {artist.displayName}
                  </Link>
                </td>
                <td className="text-center table-number">
                  {artist.goldAlbums}
                </td>
                <td className="text-center table-number">
                  {artist.silverAlbums}
                </td>
                <td className="text-center table-number">
                  {artist.totalSongs}
                </td>
                <td className="text-center">
                  <ScoreBadge score={artist.totalScore} size="sm" />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isRanked ? 6 : 5} className="table-empty">
                No artists found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
