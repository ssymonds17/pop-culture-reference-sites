import { Dispatch, SetStateAction } from 'react';
import { Artist, Album, Song, Variation } from '../../types';
import { InputField } from '../InputField';
import { albumFormFields } from '../FormFields';

export const renderFormFields = (
  variation: Variation,
  formValues: Partial<Artist | Album | Song>,
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>
) => {
  switch (variation) {
    case 'artists':
      return (
        <div>
          <InputField
            id="name"
            value={(formValues as Artist)['name']}
            setFormValues={setFormValues}
          />
        </div>
      );
    case 'albums':
      return albumFormFields(formValues as Album, setFormValues);
    case 'songs':
      return false;
    default:
      return false;
  }
};
