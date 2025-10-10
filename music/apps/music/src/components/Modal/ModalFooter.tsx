'use client';

import axios from 'axios';
import { useMusicContext } from '@music/shared-state';
import { API_URL } from '../../constants';
import { Album, Artist, Song, Variation } from '../../types';
import { Dispatch, SetStateAction, useState } from 'react';

export const ModalFooter = ({
  formValues,
  setFormValues,
  variation,
  isDisabled,
  defaultValues,
}: {
  formValues: Partial<Artist | Album | Song>;
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>;
  variation: Variation;
  isDisabled: boolean;
  defaultValues?: Partial<Artist | Album | Song>;
}) => {
  const { dispatch } = useMusicContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleOnSubmit = async () => {
    try {
      setShowErrorMessage(false);
      setIsSubmitting(true);
      await axios.post(`${API_URL}/${variation}`, formValues);

      setIsSubmitting(false);
      setFormValues(defaultValues || {});
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      dispatch({ type: 'SET_DATA_REFRESH_REQUIRED', payload: true });
    } catch (error) {
      setIsSubmitting(false);
      setShowSuccessMessage(false);
      setShowErrorMessage(true);
      console.error('error', error);
    }
  };
  return (
    <div className="modal-footer">
      <div className="flex flex-col items-center w-full">
        {isSubmitting ? (
          <div className="flex items-center gap-2 text-music-600">
            <div className="modal-spinner"></div>
            <span>Submitting...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOnSubmit}
            disabled={isDisabled}
            className="btn-primary-md w-full max-w-xs"
          >
            Submit
          </button>
        )}

        {showSuccessMessage && (
          <div className="mt-3 text-success-600 text-sm font-medium">
            ✓ Successfully submitted!
          </div>
        )}

        {showErrorMessage && (
          <div className="mt-3 text-error-600 text-sm font-medium">
            ✕ Error submitting data. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};
