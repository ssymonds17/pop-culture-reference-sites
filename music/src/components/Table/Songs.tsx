import Link from 'next/link';
import { Song } from '../../types';
import { SkeletonTable } from './Skeleton';
import { ArtistLink } from './ArtistsLink';

export const SongsTable = ({
  songs,
  isLoading,
}: {
  songs: Song[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <SkeletonTable cols={4} />;
  }

  return (
    <div className="table-modern mt-6">
      <table>
        <thead>
          <tr>
            <th className="text-center">Year</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Album</th>
          </tr>
        </thead>

        <tbody>
          {songs.length ? (
            songs.map((song: Song) => (
              <tr key={song._id}>
                <td className="text-center table-number">
                  {song.year}
                </td>
                <td className="font-medium">
                  {song.displayTitle}
                </td>
                <td>
                  <ArtistLink
                    artists={song.artists}
                    artistDisplayName={song.artistDisplayName}
                  />
                </td>
                <td>
                  {song.albumDisplayTitle ? (
                    <Link
                      href={`/album?id=${song.album}`}
                      className="table-link"
                    >
                      {song.albumDisplayTitle}
                    </Link>
                  ) : (
                    <span className="table-muted">Non-Album Release</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="table-empty">
                No songs found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
