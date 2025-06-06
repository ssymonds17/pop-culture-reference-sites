'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Song } from '../../types';

const SongsPage = () => {
  const [songs, setSongs] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Song>>({});

  const handleSearchSongsByName = async () => {
    try {
      const searchSongsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=song`
      );
      setFormValues({});
      setSongs(searchSongsResponse.data.result);
    } catch (error) {
      setSongs([]);
      setFormValues({});
      console.log('error', error);
    }
  };

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Songs Page
      </h1>
      <div className="flex mt-4">
        <div className="flex">
          <InputField
            id="title"
            setFormValues={setFormValues}
            value={formValues['title']}
            showLabel={false}
          />
          <button
            onClick={handleSearchSongsByName}
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
          >
            Search
          </button>
        </div>
      </div>
      <ul>
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
                <tr key={song.id}>
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
      </ul>
    </div>
  );
};

export default SongsPage;
