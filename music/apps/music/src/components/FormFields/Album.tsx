'use client';

import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { InputField } from '../InputField';
import { Album, Artist, Variation } from '../../types';
import { Rating } from '../Select';
import { Search } from '../Search';

export const AlbumFormFields = ({
  formValues,
  setFormValues,
}: {
  formValues: Partial<Album>;
  setFormValues: Dispatch<SetStateAction<Partial<Album>>>;
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const handleSetArtists = (newArtist: Artist) => {
    const newArtists = [...artists, newArtist];
    setArtists(newArtists);
    setFormValues((prevValues) => ({
      ...prevValues,
      artists: newArtists.map((artist) => artist.id),
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
      />
      <InputField
        id="year"
        value={formValues['year']}
        setFormValues={setFormValues}
      />
      <Search
        id="artists"
        variation={Variation.ARTIST}
        setSearchResult={handleSetArtists}
      />
      {artists.length > 0 && (
        <div>
          <ul className="flex flex-col gap-2 p-2">
            {artists.map((artist) => (
              <li key={artist.id} className="border-2 p-1">
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
      />
      <Rating
        id="rating"
        value={formValues['rating']}
        setFormValues={setFormValues}
      />
    </div>
  );
};
