import axios from 'axios';
import { API_URL } from '../../constants';
import { Artist, Variation } from '../../types';
import { Dispatch, SetStateAction } from 'react';

export const ModalFooter = ({
  formValues,
  setFormValues,
  variation,
}: {
  formValues: Partial<Artist>;
  setFormValues: Dispatch<SetStateAction<Partial<Artist>>>;
  variation: Variation;
}) => {
  const handleOnSubmit = async () => {
    try {
      await axios.post(`${API_URL}/${variation}`, formValues);

      setFormValues({});
    } catch (error) {
      console.error('error', error);
    }
  };
  return (
    <button
      type="button"
      onClick={handleOnSubmit}
      className="absolute bottom-0 border-2 border-blue-500 text-white bg-blue-500 w-1/2 self-center"
    >
      Submit
    </button>
  );
};
