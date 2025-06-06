import { Dispatch, SetStateAction } from 'react';
import { Artist, Album, Song, Variation } from '../../types';
import { InputField } from '../InputField';
import { AlbumFormFields } from '../FormFields';

export const renderFormFields = (
  variation: Variation,
  formValues: Partial<Artist | Album | Song>,
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>
) => {
  switch (variation) {
    case Variation.ARTIST:
      return (
        <div>
          <InputField
            id="name"
            value={(formValues as Artist)['name']}
            setFormValues={setFormValues}
          />
        </div>
      );
    case Variation.ALBUM:
      return (
        <AlbumFormFields
          formValues={formValues as Album}
          setFormValues={setFormValues}
        />
      );
    case Variation.SONG:
      return false;
    default:
      return false;
  }
};
