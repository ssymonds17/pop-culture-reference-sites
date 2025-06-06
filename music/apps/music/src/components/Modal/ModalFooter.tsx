import axios from 'axios';
import { API_URL } from '../../constants';
import { Artist, Variation } from '../../types';
import { Dispatch, SetStateAction } from 'react';

export const ModalFooter = ({
  formValues,
  setFormValues,
  variation,
  isDisabled,
}: {
  formValues: Partial<Artist>;
  setFormValues: Dispatch<SetStateAction<Partial<Artist>>>;
  variation: Variation;
  isDisabled: boolean;
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
    <div className="flex mt-2 w-full justify-center">
      <button
        type="button"
        onClick={handleOnSubmit}
        disabled={isDisabled}
        className="border-2 border-blue-500 text-white bg-blue-500 w-1/2"
      >
        Submit
      </button>
    </div>
  );
};
