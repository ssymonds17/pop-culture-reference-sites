'use client';
import axios from 'axios';
import { useState } from 'react';
import { API_URL } from '../../constants';
import { InputField } from '../../components/InputField';
import { Album } from '../../types';

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [formValues, setFormValues] = useState<Partial<Album>>({});

  const handleGetAlbums = async () => {
    try {
      const getAlbumsResponse = await axios.get(`${API_URL}/albums`);
      setAlbums(getAlbumsResponse.data.albums);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    }
  };

  const handleSearchAlbumsByName = async () => {
    try {
      const searchAlbumsResponse = await axios.get(
        `${API_URL}/search?searchString=${formValues.title}&itemType=album`
      );
      setFormValues({});
      setAlbums(searchAlbumsResponse.data.result);
    } catch (error) {
      setAlbums([]);
      setFormValues({});
      console.log('error', error);
    }
  };

  return (
    <div className="m-4">
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Albums Page
      </h1>
      <div className="flex mt-4">
        <button
          onClick={handleGetAlbums}
          className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
        >
          Get All Albums
        </button>
        <div className="flex">
          <InputField
            id="title"
            setFormValues={setFormValues}
            value={formValues['title']}
            showLabel={false}
          />
          <button
            onClick={handleSearchAlbumsByName}
            className="mx-4 px-4 py-2 text-white bg-blue-500 rounded-md"
          >
            Search
          </button>
        </div>
      </div>
      <ul>
        <table className="w-full mt-4 table-auto border-collapse border border-gray-400">
          <tr>
            <th className="border border-gray-300">Rating</th>
            <th className="border border-gray-300">Year</th>
            <th className="border border-gray-300">Title</th>
            <th className="border border-gray-300 text-center">Artist</th>
          </tr>

          {albums.length ? (
            albums.map((album: Album) => (
              <tr key={album.id}>
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
        </table>
      </ul>
    </div>
  );
};

export default AlbumsPage;
