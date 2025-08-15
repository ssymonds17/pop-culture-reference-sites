import Link from 'next/link';
import { Song } from '../../types';
import { SkeletonTable } from './Skeleton';

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
    <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
      <thead>
        <tr>
          <th className="border border-gray-300">Year</th>
          <th className="border border-gray-300">Title</th>
          <th className="border border-gray-300 text-center">Artist</th>
          <th className="border border-gray-300">Album</th>
        </tr>
      </thead>

      <tbody>
        {songs.length ? (
          songs.map((song: Song) => (
            <tr key={song._id}>
              <td className="border border-gray-300 text-center">
                {song.year}
              </td>
              <td className="border border-gray-300 text-center">
                {song.displayTitle}
              </td>
              <td className="border border-gray-300 text-center">
                <Link
                  href={`/artist?id=${song.artists[0]}`}
                  className="text-blue-500 hover:underline"
                >
                  {song.artistDisplayName}
                </Link>
              </td>
              <td className="border border-gray-300 text-center">
                {song.albumDisplayTitle ? (
                  <Link
                    href={`/album?id=${song.album}`}
                    className="text-blue-500 hover:underline"
                  >
                    {song.albumDisplayTitle}
                  </Link>
                ) : (
                  <span className="text-gray-500">Non-Album Release</span>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="border border-gray-300 text-center">
              No songs found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
