import { Dispatch, SetStateAction } from 'react';
import { InputField } from '../InputField';
import { Album } from '../../types';

export const albumFormFields = (
  formValues: Partial<Album>,
  setFormValues: Dispatch<SetStateAction<Partial<Album>>>
) => {
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
      <InputField
        id="artistDisplayName"
        value={formValues['artistDisplayName']}
        setFormValues={setFormValues}
      />
      {/* NEED TO CREATE A NEW INPUT FIELD TYPE TO MAKE API CALL AND ALLOW SELECTION FROM RESULTS */}
      <InputField
        id="artists"
        value={formValues['artists']?.[0]}
        setFormValues={setFormValues}
      />
      {/* NEED TO CREATE A NEW INPUT FIELD TYPE TO AUTOMATICALLY PRESENT A DROPDOWN OF RATINGS */}
      <InputField
        id="rating"
        value={formValues['rating']}
        setFormValues={setFormValues}
      />
    </div>
  );
};
