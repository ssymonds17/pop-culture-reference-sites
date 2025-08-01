import { Song } from '../../types';

export const SongsTable = ({ songs }: { songs: Song[] }) => {
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
                {song.artistDisplayName}
              </td>
              <td className="border border-gray-300 text-center">
                {song.albumDisplayTitle ?? 'Non-Album Release'}
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
