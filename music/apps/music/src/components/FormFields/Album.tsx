'use client';

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { InputField } from '../InputField';
import { Album, Artist, Variation } from '../../types';
import { Rating } from '../Select';
import { Search } from '../Search';

export const AlbumFormFields = ({
  formValues,
  setFormValues,
  isQuickAdd = false,
}: {
  formValues: Partial<Album>;
  setFormValues: Dispatch<SetStateAction<Partial<Album>>>;
  isQuickAdd?: boolean;
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const handleSetArtists = (newArtist: Artist) => {
    const newArtists = [...artists, newArtist];
    setArtists(newArtists);
    setFormValues((prevValues) => ({
      ...prevValues,
      artists: newArtists.map((artist) => artist._id),
    }));
  };

  useEffect(() => {
    if (Object.keys(formValues).length === 0) {
      setArtists([]);
    }
  }, [formValues]);

  return (
    <div>
      <InputField
        id="title"
        value={formValues['title']}
        setFormValues={setFormValues}
        placeholder="Enter album title..."
        required={true}
      />
      <InputField
        id="year"
        value={formValues['year']}
        setFormValues={setFormValues}
        type="number"
        placeholder="Enter release year..."
        required={true}
      />
      {!isQuickAdd && (
        <>
          <Search
            id="artists"
            variation={Variation.ARTIST}
            setSearchResult={handleSetArtists}
          />
          {artists.length > 0 && (
            <div>
              <ul className="flex flex-col gap-2 p-2">
                {artists.map((artist) => (
                  <li key={artist._id} className="border-2 p-1">
                    {artist.displayName}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <InputField
            id="artistDisplayName"
            value={formValues['artistDisplayName']}
            setFormValues={setFormValues}
            placeholder="Display name for artist(s)..."
          />
          <Rating
            id="rating"
            value={formValues['rating']}
            setFormValues={setFormValues}
          />
        </>
      )}
    </div>
  );
};
