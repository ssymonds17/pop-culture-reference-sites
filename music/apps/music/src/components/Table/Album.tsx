import { Album } from '../../types';

export const AlbumsTable = ({ albums }: { albums: Album[] }) => {
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
                {album.rating}
              </td>
              <td className="border border-gray-300 text-center">
                {album.year}
              </td>
              <td className="border border-gray-300 text-center">
                {album.displayTitle}
              </td>
              <td className="border border-gray-300 text-center">
                {album.artistDisplayName}
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
