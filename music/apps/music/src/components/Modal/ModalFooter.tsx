import axios from 'axios';
import { API_URL } from '../../constants';
import { Album, Artist, Song, Variation } from '../../types';
import { Dispatch, SetStateAction, useState } from 'react';

export const ModalFooter = ({
  formValues,
  setFormValues,
  variation,
  isDisabled,
}: {
  formValues: Partial<Artist | Album | Song>;
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>;
  variation: Variation;
  isDisabled: boolean;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleOnSubmit = async () => {
    try {
      setShowErrorMessage(false);
      setIsSubmitting(true);
      await axios.post(`${API_URL}/${variation}`, formValues);

      setIsSubmitting(false);
      setFormValues({});
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
      setShowSuccessMessage(false);
      setShowErrorMessage(true);
      console.error('error', error);
    }
  };
  return (
    <>
      <div className="flex mt-2 w-full justify-center">
        {isSubmitting ? (
          <span className="text-blue-500">Submitting...</span>
        ) : (
          <button
            type="button"
            onClick={handleOnSubmit}
            disabled={isDisabled}
            className="border-2 border-blue-500 text-white bg-blue-500 w-1/2 disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 hover:border-blue-600 transition-colors duration-200 p-2 rounded"
          >
            Submit
          </button>
        )}
      </div>
      {showSuccessMessage && (
        <span className="flex mt-2 w-full justify-center text-green-500 ml-2 ">
          Successfully submitted!
        </span>
      )}
      {showErrorMessage && (
        <span className="flex mt-2 w-full justify-center text-red-500 ml-2">
          Error submitting data. Please try again.
        </span>
      )}
    </>
  );
};
